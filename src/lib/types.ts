export type TxType = 'income' | 'expense';

export type IconKey =
  | 'allowance' | 'job' | 'scholarship' | 'gift' | 'other-income'
  | 'food' | 'transport' | 'hostel' | 'academics' | 'subscriptions' | 'entertainment' | 'misc'
  | 'groceries' | 'health' | 'music' | 'phone' | 'custom';

export interface Category {
  id: string;
  name: string;
  type: TxType;
  icon: IconKey;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  categoryId: string;
  type: TxType;
  amount: number;
  recurring?: boolean;
  aiSuggestedCategoryId?: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  month: string; // YYYY-MM
}

export interface Insight {
  id: string;
  month: string; // YYYY-MM
  summary: string;
  pattern: string;
  action: string;
  change: number; // % change of the flagged category vs the student's own average
  categoryId: string;
}

export interface Tip {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  impact: number; // estimated monthly saving in Rs.
  pinned: boolean;
  dismissed: boolean;
}

export type NotificationKind = 'budget-near' | 'budget-over' | 'tip' | 'insight' | 'import' | 'announcement';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: number;
  read: boolean;
  link?: string | null;
}

export interface Profile {
  name: string;
  email: string;
  academicYear: string;
  allowance: number;
  savingsGoal: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  academicYear: string;
  joined: string;
  transactions: number;
  status: 'active' | 'disabled';
  lastActive: number; // ms timestamp, 0 = never
}

export interface Announcement {
  id: string;
  kind: 'tip' | 'announcement';
  title: string;
  body: string;
  audience: string;
  status: 'live' | 'draft';
  publishedAt?: number;
}

/* ---------------- Website content (site_content table, GET /content) ---------------- */

export interface ContentLink { label: string; href: string }

export interface SiteContent {
  landing_nav: { links: { label: string; section: string }[]; loginLabel: string; ctaLabel: string };
  landing_hero: { badge: string; title: string; subtitle: string; primaryCta: string; secondaryCta: string; note: string; doodle: string };
  landing_hero_preview: {
    balanceLabel: string; balance: number; income: number; inLabel: string; expenses: number; outLabel: string; bars: number[];
    topCategoryLabel: string; topCategory: { categoryId: string; amount: number };
    budgetLabel: string; budgets: { categoryId: string; percent: number }[];
    insightLabel: string; insightTitle: string; insightAction: string;
  };
  landing_why: { title: string; items: { title: string; body: string }[] };
  landing_categories: { title: string; subtitle: string; examples: { name: string; categoryId: string; amount: number }[] };
  landing_how: { title: string; steps: { icon: 'wallet' | 'upload' | 'sparkles'; title: string; body: string }[] };
  landing_insight: { eyebrow: string; title: string; headline: string; action: string; disclaimer: string };
  landing_budgets: { eyebrow: string; title: string; items: { categoryId: string; spent: number; limit: number }[]; alert: string };
  landing_tips: { title: string; tipIds: string[] };
  landing_mobile: {
    title: string; body: string; bullets: string[];
    phone: { balanceLabel: string; balance: number; expenseLabel: string; incomeLabel: string; budget: { categoryId: string; percent: number }; rows: { categoryId: string; name: string; amount: number }[] };
  };
  landing_cta: { title: string; body: string; primaryCta: string; secondaryCta: string };
  site_footer: { tagline: string; columns: { title: string; links: ContentLink[] }[]; legal: string };
  auth_panel: {
    student: { title: string; body: string; bullets: string[] };
    admin: { eyebrow: string; title: string; body: string };
    legal: string;
  };
  academic_years: { options: string[] };
  category_colors: { options: string[] };
  csv_sample: { rows: { daysAgo: number; description: string; amount: number; type: TxType }[] };
}

export interface PublicTip { id: string; categoryId: string; title: string; body: string; impact: number }
export interface DemoAccount { email: string; password: string }

/** What GET /content returns. Sections can be missing if a row was deleted in phpMyAdmin. */
export interface SiteData {
  content: Partial<SiteContent>;
  categories: Category[];
  tips: PublicTip[];
  demo: { student?: DemoAccount; admin?: DemoAccount } | null;
  /** Only in debug mode: what the database contains, and any setup problems */
  install?: InstallStatus | null;
}

export interface InstallStatus {
  ok: boolean;
  problems: string[];
  counts: Record<string, number>;
  setupUrl: string;
}

/** A section as the admin content editor sees it (GET /admin/content) */
export interface ContentSection {
  key: keyof SiteContent | string;
  title: string;
  description: string;
  content: unknown;
  updatedAt: number;
  updatedBy: string | null;
  hasDefault: boolean;
}
