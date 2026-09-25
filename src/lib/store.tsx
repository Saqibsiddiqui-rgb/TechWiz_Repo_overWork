import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppNotification, Budget, Category, Insight, Profile, SiteContent, SiteData, Tip, Transaction } from './types';
import { CURRENT_MONTH, PREV_MONTH, uid } from './format';
import { correctionKey } from './ai';
import { api, errorMessage, SESSION_ENDED, token } from './api';

export type FontSize = 'sm' | 'md' | 'lg';
export type Role = 'student' | 'admin' | null;

export interface Settings {
  dark: boolean;
  fontSize: FontSize;
  notify: { budget: boolean; tips: boolean; insights: boolean; imports: boolean };
}

interface Data {
  role: Role;
  profile: Profile;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  insights: Insight[];
  tips: Tip[];
  notifications: AppNotification[];
  bookmarks: { tips: string[]; insights: string[] };
  corrections: Record<string, string>;
  /** AI suggester keywords per category, from the category_keywords table */
  keywords: Record<string, string[]>;
  settings: Settings;
}

/** What GET /bootstrap returns for a student */
type StudentData = Omit<Data, 'role'>;
interface Session { user: Profile & { role: Exclude<Role, null> }; settings: Settings; token?: string }

export interface Toast { id: string; tone: 'success' | 'error' | 'info' | 'warn'; message: string }
export type Status = 'loading' | 'ready' | 'offline';
export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;
export interface RegisterInput { name: string; email: string; password: string; academicYear: string; allowance: number; savingsGoal: number }

const THEME_KEY = 'campuscoin:theme'; // guests' theme choice, before they log in
const guestSettings = (): Settings => {
  const base: Settings = { dark: false, fontSize: 'md', notify: { budget: true, tips: true, insights: true, imports: true } };
  try { return { ...base, ...JSON.parse(localStorage.getItem(THEME_KEY) ?? '{}') }; } catch { return base; }
};
const emptyProfile: Profile = { name: '', email: '', academicYear: '', allowance: 0, savingsGoal: 0 };
const empty = (): Data => ({
  role: null, profile: emptyProfile, categories: [], transactions: [], budgets: [], insights: [], tips: [],
  notifications: [], bookmarks: { tips: [], insights: [] }, corrections: {}, keywords: {}, settings: guestSettings(),
});

const sortTx = (list: Transaction[]) => [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

/** Spent per category for a month */
export const spentByCategory = (txs: Transaction[], month = CURRENT_MONTH) => {
  const out: Record<string, number> = {};
  for (const t of txs) if (t.type === 'expense' && t.date.startsWith(month)) out[t.categoryId] = (out[t.categoryId] || 0) + t.amount;
  return out;
};

export const monthTotals = (txs: Transaction[], month = CURRENT_MONTH) => {
  let income = 0, expense = 0;
  for (const t of txs) if (t.date.startsWith(month)) t.type === 'income' ? (income += t.amount) : (expense += t.amount);
  return { income, expense, balance: income - expense };
};

function useStoreValue() {
  const [data, setData] = useState<Data>(empty);
  const [site, setSite] = useState<SiteData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [bootError, setBootError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const set = setData;
  const roleRef = useRef<Role>(null);
  roleRef.current = data.role;

  // Apply theme + font size to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', data.settings.dark);
    root.style.setProperty('--base-size', { sm: '14px', md: '16px', lg: '18px' }[data.settings.fontSize]);
    try { localStorage.setItem(THEME_KEY, JSON.stringify({ dark: data.settings.dark, fontSize: data.settings.fontSize })); } catch { /* ignore */ }
  }, [data.settings.dark, data.settings.fontSize]);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = uid();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  /* ---------------- Loading data from the server ---------------- */

  const loadFor = useCallback(async (session: Session) => {
    const role = session.user.role;
    const { role: _r, ...profile } = session.user;
    void _r;
    if (role === 'student') {
      const d = await api<StudentData>('/bootstrap');
      setData({ ...d, role, profile: d.profile, corrections: d.corrections ?? {}, keywords: d.keywords ?? {} });
    } else {
      const d = await api<{ categories: Category[]; keywords: Record<string, string[]> }>('/admin/bootstrap');
      setData({ ...empty(), role, profile, settings: session.settings, categories: d.categories, keywords: d.keywords ?? {} });
    }
  }, []);

  /** Website content (landing page, login panel, dropdown options) from the site_content table */
  const loadContent = useCallback(async () => {
    const s = await api<SiteData>('/content');
    setSite({ ...s, content: s.content ?? {} });
  }, []);

  const boot = useCallback(async () => {
    setStatus('loading'); setBootError('');
    try {
      await loadContent();
    } catch (e) {
      setBootError(errorMessage(e));
      setStatus('offline');
      return;
    }
    if (!token.get()) { setStatus('ready'); return; }
    try {
      const me = await api<Session>('/auth/me');
      await loadFor(me);
      setStatus('ready');
    } catch (e) {
      if (!token.get()) { setData(empty()); setStatus('ready'); return; } // session expired: back to login
      setBootError(errorMessage(e));
      setStatus('offline');
    }
  }, [loadFor, loadContent]);

  useEffect(() => { boot(); }, [boot]);

  // Session ended on the server (expired, password reset, or account disabled)
  useEffect(() => {
    const onEnd = () => {
      if (!roleRef.current) return;
      setData((d) => ({ ...empty(), settings: d.settings }));
      toast('Your session has ended. Please log in again.', 'info');
    };
    window.addEventListener(SESSION_ENDED, onEnd);
    return () => window.removeEventListener(SESSION_ENDED, onEnd);
  }, [toast]);

  /** Re-download everything after a failed optimistic update, so the screen matches the database. */
  const resync = useCallback(async () => {
    try {
      const me = await api<Session>('/auth/me');
      await loadFor(me);
    } catch { /* the error was already shown */ }
  }, [loadFor]);

  /** For quick actions (pin, delete, mark read): update the screen now, save in the background. */
  const background = (request: Promise<unknown>, failMessage = 'That change didn\u2019t save.') => {
    request.catch((e) => { toast(`${failMessage} ${errorMessage(e)}`, 'error'); resync(); });
  };

  /** New notifications from the server, plus a toast for budget alerts. */
  const receive = (list: AppNotification[] = []) => {
    if (!list.length) return;
    set((d) => ({ ...d, notifications: [...list, ...d.notifications.filter((n) => !list.some((x) => x.id === n.id))] }));
    for (const n of list) {
      if (n.kind === 'budget-over') toast(`Heads up: ${n.title.charAt(0).toLowerCase()}${n.title.slice(1)}.`, 'warn');
      if (n.kind === 'budget-near') toast(n.title + '.', 'info');
    }
  };

  const cat = (id: string) => data.categories.find((c) => c.id === id);

  const actions = {
    /* ---------- Auth ---------- */
    login: async (email: string, password: string, admin = false) => {
      const s = await api<Session>('/auth/login', 'POST', { email, password, admin });
      token.set(s.token!);
      await loadFor(s);
      return s.user.role;
    },
    register: async (input: RegisterInput) => {
      const s = await api<Session>('/auth/register', 'POST', input);
      token.set(s.token!);
      await loadFor(s);
    },
    logout: () => {
      if (token.get()) api('/auth/logout', 'POST').catch(() => {});
      token.clear();
      setData((d) => ({ ...empty(), settings: d.settings }));
    },

    /* ---------- Profile & settings ---------- */
    updateProfile: async (p: Profile) => {
      const r = await api<{ profile: Profile }>('/profile', 'PUT', p);
      set((d) => ({ ...d, profile: r.profile }));
    },
    updateSettings: (s: Partial<Settings>) => {
      set((d) => ({ ...d, settings: { ...d.settings, ...s } }));
      if (roleRef.current) background(api('/settings', 'PUT', s), 'Your preference didn\u2019t save.');
    },
    resetDemo: async () => {
      const d = await api<StudentData>('/sample-data/reset', 'POST');
      set((cur) => ({ ...d, role: cur.role, corrections: d.corrections ?? {}, keywords: d.keywords ?? {} }));
    },

    /* ---------- Transactions ---------- */
    addTransaction: async (t: NewTransaction) => {
      const r = await api<{ transaction: Transaction; notifications: AppNotification[] }>('/transactions', 'POST', { ...t, id: uid() });
      set((d) => ({
        ...d,
        transactions: sortTx([r.transaction, ...d.transactions]),
        // Learn locally too, so the very next suggestion already uses the correction
        corrections: t.aiSuggestedCategoryId && t.aiSuggestedCategoryId !== t.categoryId
          ? { ...d.corrections, [correctionKey(t.description)]: t.categoryId } : d.corrections,
      }));
      receive(r.notifications);
      return r.transaction;
    },
    updateTransaction: async (tx: Transaction) => {
      const r = await api<{ transaction: Transaction; notifications: AppNotification[] }>(`/transactions/${tx.id}`, 'PUT', tx);
      set((d) => ({ ...d, transactions: sortTx(d.transactions.map((x) => (x.id === tx.id ? r.transaction : x))) }));
      receive(r.notifications);
    },
    deleteTransaction: (id: string) => {
      set((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== id) }));
      background(api(`/transactions/${id}`, 'DELETE'), 'The transaction wasn\u2019t deleted.');
    },
    importTransactions: async (rows: NewTransaction[]) => {
      const withIds = rows.map((r) => ({ ...r, id: uid() }));
      const r = await api<{ count: number; notifications: AppNotification[] }>('/transactions/import', 'POST', { rows: withIds });
      await resync(); // pull the saved rows back with their server timestamps
      return r.count;
    },

    /* ---------- Categories (students: their own; admins: defaults) ---------- */
    /** keywords: admins only, the words the AI suggester looks for in descriptions */
    saveCategory: async (c: Category, keywords?: string[]) => {
      const base = roleRef.current === 'admin' ? '/admin/categories' : '/categories';
      const exists = data.categories.some((x) => x.id === c.id);
      const r = await api<{ category: Category; keywords?: string[] }>(exists ? `${base}/${c.id}` : base, exists ? 'PUT' : 'POST', { ...c, ...(keywords ? { keywords } : {}) });
      set((d) => ({
        ...d,
        categories: d.categories.some((x) => x.id === r.category.id)
          ? d.categories.map((x) => (x.id === r.category.id ? r.category : x)) : [...d.categories, r.category],
        keywords: r.keywords ? { ...d.keywords, [r.category.id]: r.keywords } : d.keywords,
      }));
      return r.category;
    },
    deleteCategory: (id: string) => {
      const base = roleRef.current === 'admin' ? '/admin/categories' : '/categories';
      set((d) => ({
        ...d,
        categories: d.categories.filter((x) => x.id !== id),
        budgets: d.budgets.filter((b) => b.categoryId !== id),
        // Student categories are removed from history too; the server marks them uncategorised
        transactions: roleRef.current === 'student' ? d.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: '' } : t)) : d.transactions,
      }));
      background(api(`${base}/${id}`, 'DELETE'), 'The category wasn\u2019t deleted.');
    },

    /* ---------- Budgets ---------- */
    saveBudget: async (b: Budget) => {
      const exists = data.budgets.some((x) => x.id === b.id);
      const r = await api<{ budget: Budget }>(exists ? `/budgets/${b.id}` : '/budgets', exists ? 'PUT' : 'POST', b);
      set((d) => ({
        ...d,
        budgets: d.budgets.some((x) => x.id === r.budget.id) ? d.budgets.map((x) => (x.id === r.budget.id ? r.budget : x)) : [...d.budgets, r.budget],
      }));
    },
    deleteBudget: (id: string) => {
      set((d) => ({ ...d, budgets: d.budgets.filter((b) => b.id !== id) }));
      background(api(`/budgets/${id}`, 'DELETE'), 'The budget wasn\u2019t removed.');
    },

    /* ---------- Tips, bookmarks, insights ---------- */
    pinTip: (id: string) => {
      const pinned = !data.tips.find((t) => t.id === id)?.pinned;
      set((d) => ({ ...d, tips: d.tips.map((t) => (t.id === id ? { ...t, pinned } : t)) }));
      background(api(`/tips/${id}/pin`, 'POST', { pinned }));
    },
    dismissTip: (id: string) => {
      set((d) => ({ ...d, tips: d.tips.map((t) => (t.id === id ? { ...t, dismissed: true, pinned: false } : t)) }));
      background(api(`/tips/${id}/dismiss`, 'POST'));
    },
    restoreTips: () => {
      set((d) => ({ ...d, tips: d.tips.map((t) => ({ ...t, dismissed: false })) }));
      background(api('/tips/restore', 'POST'));
    },
    toggleBookmark: (kind: 'tips' | 'insights', id: string) => {
      set((d) => {
        const list = d.bookmarks[kind];
        return { ...d, bookmarks: { ...d.bookmarks, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [id, ...list] } };
      });
      background(api('/bookmarks/toggle', 'POST', { kind, id }), 'Your bookmark didn\u2019t save.');
    },
    generateInsight: async () => {
      const r = await api<{ insight: Insight; notifications: AppNotification[] }>('/insights/generate', 'POST');
      set((d) => ({ ...d, insights: [r.insight, ...d.insights.filter((i) => i.month !== r.insight.month)].sort((a, b) => b.month.localeCompare(a.month)) }));
      receive(r.notifications);
      return r.insight;
    },

    /* ---------- Notifications ---------- */
    markRead: (id: string) => {
      if (data.notifications.find((n) => n.id === id)?.read) return;
      set((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      background(api(`/notifications/${id}/read`, 'POST'));
    },
    markAllRead: () => {
      set((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
      background(api('/notifications/read-all', 'POST'));
    },
    clearNotification: (id: string) => {
      set((d) => ({ ...d, notifications: d.notifications.filter((n) => n.id !== id) }));
      background(api(`/notifications/${id}`, 'DELETE'));
    },

    /* ---------- Website content ---------- */
    reloadContent: () => loadContent().catch(() => { /* keep the current content */ }),

    /* ---------- Reports ---------- */
    emailReport: (to: string, from: string, until: string) => api<{ ok: boolean; delivered: boolean }>('/reports/email', 'POST', { to, from, until }),
  };

  const derived = useMemo(() => ({
    totals: monthTotals(data.transactions),
    last: monthTotals(data.transactions, PREV_MONTH),
    spent: spentByCategory(data.transactions),
  }), [data.transactions]);

  return { ...data, ...derived, site, status, bootError, retryBoot: boot, cat, toast, toasts, dismissToast, ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}

/**
 * One section of the website content. Returns null if that row is missing from site_content,
 * so pages can skip the section instead of crashing.
 */
export function useContent<K extends keyof SiteContent>(key: K): SiteContent[K] | null {
  return useStore().site?.content[key] ?? null;
}
