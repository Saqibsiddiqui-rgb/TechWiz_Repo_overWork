import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeftRight, Bell, Bookmark, ChartColumn, ChevronRight, House, Lightbulb, LogOut, Menu, Moon, PanelLeftClose,
  PanelLeftOpen, Plus, Search, Settings, Shapes, Sparkles, Sun, Target, User, X, Minus,
} from 'lucide-react';
import type { TxType } from '../lib/types';
import { cx, timeAgo } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { Logo, LogoMark } from '../components/Brand';
import { TransactionModal } from '../components/TransactionForm';
import { useScrollLock } from '../lib/smoothScroll';

export const studentNav = [
  { to: '/app', label: 'Overview', icon: House },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/budgets', label: 'Budgets', icon: Target },
  { to: '/app/reports', label: 'Reports', icon: ChartColumn },
  { to: '/app/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/app/tips', label: 'Saving Tips', icon: Lightbulb },
  { to: '/app/bookmarks', label: 'Bookmarks', icon: Bookmark },
];
const secondaryNav = [
  { to: '/app/categories', label: 'Categories', icon: Shapes },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];
const titles: Record<string, string> = Object.fromEntries(
  [...studentNav, ...secondaryNav, { to: '/app/profile', label: 'Profile' }, { to: '/app/add-expense', label: 'Add expense' }, { to: '/app/add-income', label: 'Add income' }].map((n) => [n.to, n.label]),
);

const QuickAdd = createContext<(t: TxType) => void>(() => {});
export const useQuickAdd = () => useContext(QuickAdd);

export function StudentLayout({ path, children }: { path: string; children: ReactNode }) {
  const [addType, setAddType] = useState<TxType | null>(null);
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [moreOpen, setMoreOpen] = useState(false);
  const route = path.split('?')[0];

  return (
    <QuickAdd.Provider value={setAddType}>
      <div className="min-h-screen bg-canvas" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Sidebar route={route} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className={cx('transition-[padding] duration-200', collapsed ? 'md:pl-[84px]' : 'md:pl-[264px]')}>
          <Topbar route={route} />
          <main key={route === '/app/profile' ? '/app/settings' : route} className="anim-page mx-auto max-w-[1280px] px-4 pb-32 pt-2 sm:px-6 md:pb-12 lg:px-8">{children}</main>
        </div>
        <MobileNav route={route} onAdd={() => setAddType('expense')} onMore={() => setMoreOpen(true)} />
        {moreOpen && <MoreSheet route={route} onClose={() => setMoreOpen(false)} />}
        <TransactionModal open={!!addType} type={addType ?? 'expense'} onClose={() => setAddType(null)} />
      </div>
    </QuickAdd.Provider>
  );
}

function NavLink({ to, label, icon: Icon, active, collapsed, badge }: { to: string; label: string; icon: typeof House; active: boolean; collapsed: boolean; badge?: number }) {
  return (
    <a href={`#${to}`} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined}
      className={cx('group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.92rem] font-semibold transition-colors',
        active ? 'bg-cream/[.08] text-cream' : 'text-cream/60 hover:bg-cream/[.05] hover:text-cream', collapsed && 'justify-center px-0')}>
      {active && <span className="absolute -left-4 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-mint" aria-hidden />}
      <Icon className={cx('h-5 w-5 shrink-0', active && 'text-mint')} strokeWidth={2} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!!badge && (collapsed
        ? <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-coral" />
        : <span className="rounded-full bg-coral px-1.5 text-[0.7rem] font-bold text-ink">{badge}</span>)}
    </a>
  );
}

function Sidebar({ route, collapsed, onToggle }: { route: string; collapsed: boolean; onToggle: () => void }) {
  const { profile, notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <aside className={cx('fixed inset-y-0 left-0 z-30 hidden flex-col bg-nav px-4 py-5 transition-[width] duration-200 md:flex', collapsed ? 'w-[84px]' : 'w-[264px]')}
      aria-label="Main navigation">
      <div className={cx('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
        <a href="#/app" aria-label="Campus Coin home">{collapsed ? <LogoMark size={36} /> : <Logo light />}</a>
      </div>
      <button onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-soft hover:text-fg">
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <nav className="mt-8 flex-1 space-y-1">
        {studentNav.map((n) => <NavLink key={n.to} {...n} active={route === n.to} collapsed={collapsed} />)}
      </nav>

      {!collapsed && (
        <div className="mb-4 overflow-hidden rounded-2xl bg-cream/[.06] p-4">
          <p className="text-sm font-bold text-cream">Log it while it&rsquo;s fresh</p>
          <p className="mt-1 text-xs text-cream/60">Adding a chai takes five seconds.</p>
          <div className="mt-3 flex gap-2">
            <QuickBtn type="expense" />
            <QuickBtn type="income" />
          </div>
        </div>
      )}

      <div className="space-y-1 border-t border-cream/10 pt-4">
        {secondaryNav.map((n) => <NavLink key={n.to} {...n} active={route === n.to} collapsed={collapsed} badge={n.to === '/app/notifications' ? unread : undefined} />)}
        <a href="#/app/profile" className={cx('mt-2 flex items-center gap-3 rounded-xl p-2 hover:bg-cream/[.05]', collapsed && 'justify-center', route === '/app/profile' && 'bg-cream/[.08]')}>
          <Avatar name={profile.name} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-cream">{profile.name}</span>
              <span className="block truncate text-xs text-cream/55">{profile.academicYear}</span>
            </span>
          )}
        </a>
      </div>
    </aside>
  );
}

function QuickBtn({ type }: { type: TxType }) {
  const open = useQuickAdd();
  return (
    <button onClick={() => open(type)}
      className={cx('flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition hover:brightness-105',
        type === 'expense' ? 'bg-coral text-ink' : 'bg-mint text-ink')}>
      {type === 'expense' ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{type === 'expense' ? 'Expense' : 'Income'}
    </button>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-ink" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}

function Topbar({ route }: { route: string }) {
  const { profile, settings, updateSettings, logout } = useStore();
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const title = titles[route] ?? 'Overview';
  return (
    <header className="sticky top-0 z-20 border-b border-transparent bg-canvas/85 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#/app" className="md:hidden" aria-label="Campus Coin home"><LogoMark size={32} /></a>
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
          <a href="#/app" className="font-medium text-muted hover:text-fg">Campus Coin</a>
          {route !== '/app' && (<><ChevronRight className="h-4 w-4 text-muted" /><span className="truncate font-semibold">{title}</span></>)}
        </nav>
        <span className="text-base font-bold md:hidden">{title}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <form role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/app/transactions?q=${encodeURIComponent(q)}`); setSearchOpen(false); }}
            className={cx('items-center gap-2 rounded-xl border border-line bg-surface px-3 lg:flex', searchOpen ? 'absolute inset-x-4 top-3 z-10 flex h-10' : 'hidden h-10 w-64')}>
            <Search className="h-4 w-4 text-muted" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions" aria-label="Search transactions"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
            {searchOpen && <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X className="h-4 w-4 text-muted" /></button>}
          </form>
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-xl p-2.5 text-muted hover:bg-fg/5 hover:text-fg lg:hidden"><Search className="h-5 w-5" /></button>
          <button onClick={() => updateSettings({ dark: !settings.dark })} aria-label={settings.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-xl p-2.5 text-muted hover:bg-fg/5 hover:text-fg">
            {settings.dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
          <Dropdown trigger={<Avatar name={profile.name} size={34} />} label="Account menu">
            <div className="border-b border-line px-3 pb-3 pt-1">
              <p className="font-bold">{profile.name}</p>
              <p className="text-xs text-muted">{profile.email}</p>
            </div>
            <MenuItem icon={User} onClick={() => navigate('/app/profile')}>Profile</MenuItem>
            <MenuItem icon={Settings} onClick={() => navigate('/app/settings')}>Settings</MenuItem>
            <MenuItem icon={LogOut} onClick={() => { logout(); navigate('/login'); }}>Log out</MenuItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

function NotificationBell() {
  const { notifications, markRead, markAllRead } = useStore();
  const unread = notifications.filter((n) => !n.read);
  return (
    <Dropdown label={`Notifications, ${unread.length} unread`} wide trigger={
      <span className="relative flex p-0.5 text-muted hover:text-fg">
        <Bell className="h-5 w-5" />
        {unread.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[0.62rem] font-bold text-ink">{unread.length}</span>}
      </span>}>
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <p className="font-bold">Notifications</p>
        {unread.length > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-muted hover:text-fg">Mark all read</button>}
      </div>
      <ul className="max-h-80 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {notifications.slice(0, 5).map((n) => (
          <li key={n.id}>
            <button onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }} className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-fg/[.04]">
              <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-coral')} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                <span className="block text-xs text-muted">{timeAgo(n.time)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <a href="#/app/notifications" className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-semibold hover:bg-fg/[.04]">See all notifications</a>
    </Dropdown>
  );
}

export function Dropdown({ trigger, children, label, wide }: { trigger: ReactNode; children: ReactNode; label: string; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open} className="flex items-center rounded-xl p-2 hover:bg-fg/5">{trigger}</button>
      {open && (
        <div data-lenis-prevent onClick={(e) => (e.target as HTMLElement).closest('a,button:not([aria-expanded])') && setOpen(false)}
          className={cx('anim-pop absolute right-0 top-12 z-40 rounded-2xl border border-line bg-surface p-2 shadow-lift', wide ? 'w-[min(22rem,calc(100vw-2rem))]' : 'w-60')}>
          {children}
        </div>
      )}
    </div>
  );
}
function MenuItem({ icon: Icon, children, onClick }: { icon: typeof User; children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-fg/[.04]">
      <Icon className="h-4 w-4 text-muted" />{children}
    </button>
  );
}

/* ---------------- Mobile bottom navigation ---------------- */
function MobileNav({ route, onAdd, onMore }: { route: string; onAdd: () => void; onMore: () => void }) {
  const items = [studentNav[0], studentNav[1], null, studentNav[2]];
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
        {items.map((n) => n ? (
          <a key={n.to} href={`#${n.to}`} aria-current={route === n.to ? 'page' : undefined}
            className={cx('flex flex-col items-center gap-0.5 text-[0.68rem] font-semibold', route === n.to ? 'text-fg' : 'text-muted')}>
            <n.icon className={cx('h-5 w-5', route === n.to && 'text-pos')} />{n.label === 'Overview' ? 'Home' : n.label}
          </a>
        ) : (
          <button key="add" onClick={onAdd} aria-label="Add a transaction"
            className="mx-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-mint shadow-lift ring-4 ring-canvas active:scale-95 dark:bg-mint dark:text-ink">
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        ))}
        <button onClick={onMore} className="flex flex-col items-center gap-0.5 text-[0.68rem] font-semibold text-muted">
          <Menu className="h-5 w-5" />More
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ route, onClose }: { route: string; onClose: () => void }) {
  const { logout } = useStore();
  useScrollLock(true); // page behind the sheet stays still while it's open
  const links = [...studentNav.slice(3), ...secondaryNav, { to: '/app/profile', label: 'Profile', icon: User }];
  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="More pages" data-lenis-prevent>
      <div className="anim-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="anim-sheet absolute inset-x-0 bottom-0 rounded-t-[1.75rem] bg-surface p-5 pb-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <div className="grid grid-cols-3 gap-2">
          {links.map((l) => (
            <a key={l.to} href={`#${l.to}`} onClick={onClose}
              className={cx('flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-semibold', route === l.to ? 'border-fg' : 'border-line')}>
              <l.icon className="h-5 w-5" />{l.label}
            </a>
          ))}
        </div>
        <button onClick={() => { logout(); navigate('/login'); onClose(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-neg hover:bg-coral/10">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}
