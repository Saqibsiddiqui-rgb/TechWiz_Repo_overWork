import { useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Bookmark, Pencil, Pin, Repeat, Sparkles, Trash2, X } from 'lucide-react';
import type { Budget, Insight, Tip, Transaction } from '../lib/types';
import { cx, monthLabel, relativeDay, rs, signed } from '../lib/format';
import { useStore } from '../lib/store';
import { CategoryIcon } from './Brand';
import { Badge, ProgressBar } from './ui/Feedback';
import { Card } from './ui/Card';

/* ---------------- StatCard ---------------- */
export function StatCard({ label, value, delta, deltaGood, icon, note, accent }: {
  label: string; value: number; delta?: number; deltaGood?: boolean; icon: ReactNode; note?: string; accent: string;
}) {
  return (
    <Card interactive className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}33`, color: `color-mix(in srgb, ${accent} 55%, rgb(var(--fg)))` }}>{icon}</span>
      </div>
      <Money value={value} className="mt-3 text-[1.9rem]" />
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={cx('inline-flex items-center gap-0.5 font-bold', deltaGood ? 'text-pos' : 'text-neg')}>
            {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        <span className="text-muted">{note ?? 'from last month'}</span>
      </div>
    </Card>
  );
}

/** Money typography: small "Rs." with a big, confident number. */
export function Money({ value, className, sign }: { value: number; className?: string; sign?: '+' | '−' }) {
  return (
    <p className={cx('money flex items-baseline font-extrabold leading-none tracking-tight', className)}>
      {sign && <span className="mr-1">{sign}</span>}
      <span className="mr-1 text-[0.5em] font-bold opacity-60">Rs.</span>
      {new Intl.NumberFormat('en-PK').format(Math.round(value))}
    </p>
  );
}

/* ---------------- TransactionRow ---------------- */
export function TransactionRow({ tx, onEdit, onDelete, compact }: { tx: Transaction; onEdit?: () => void; onDelete?: () => void; compact?: boolean }) {
  const { cat } = useStore();
  const c = cat(tx.categoryId);
  return (
    <li className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-fg/[.03]">
      <CategoryIcon icon={c?.icon ?? 'custom'} color={c?.color ?? '#9AA3B5'} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          <span className="truncate">{tx.description}</span>
          {tx.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Recurring" />}
        </p>
        <p className="text-xs text-muted">{c?.name ?? 'Uncategorized'} · {relativeDay(tx.date)}</p>
      </div>
      <p className={cx('money shrink-0 text-right text-[0.95rem] font-bold', tx.type === 'income' ? 'text-pos' : 'text-fg')}>{signed(tx.amount, tx.type)}</p>
      {!compact && (onEdit || onDelete) && (
        <div className="flex shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          {onEdit && <button onClick={onEdit} aria-label={`Edit ${tx.description}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>}
          {onDelete && <button onClick={onDelete} aria-label={`Delete ${tx.description}`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>}
        </div>
      )}
    </li>
  );
}

/* ---------------- BudgetCard / BudgetLine ---------------- */
export function budgetState(spent: number, limit: number) {
  const r = spent / limit;
  if (r > 1) return { tone: 'neg' as const, text: `Over by ${rs(spent - limit)}` };
  if (r >= 0.75) return { tone: 'warn' as const, text: `${rs(limit - spent)} left, getting close` };
  return { tone: 'pos' as const, text: `${rs(limit - spent)} left` };
}

export function BudgetLine({ budget, spent }: { budget: Budget; spent: number }) {
  const { cat } = useStore();
  const c = cat(budget.categoryId);
  const s = budgetState(spent, budget.limit);
  const p = Math.round((spent / budget.limit) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <CategoryIcon icon={c?.icon ?? 'custom'} color={c?.color ?? '#9AA3B5'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{c?.name}</p>
          <p className="money text-xs text-muted"><b className="text-fg">{rs(spent)}</b> / {rs(budget.limit)}</p>
        </div>
        <Badge tone={s.tone}>{p}%</Badge>
      </div>
      <ProgressBar value={spent} max={budget.limit} label={`${c?.name} budget`} />
      {p > 100 && <p className="mt-1.5 text-xs font-medium text-neg">You&rsquo;ve crossed your {c?.name.toLowerCase()} budget this month.</p>}
    </div>
  );
}

// export function AiNote({ className }: { className?: string }) {
//   return (
//     <p className={cx('flex items-center gap-1.5 text-[0.72rem] text-muted', className)}>
//       <Sparkles className="h-3.5 w-3.5 text-ai" aria-hidden />
//       Generated by Campus Coin AI. A suggestion to consider, not financial advice.
//     </p>
//   );
// }

/* ---------------- InsightCard ---------------- */
export function InsightCard({ insight, featured, onView }: { insight: Insight; featured?: boolean; onView?: () => void }) {
  const { bookmarks, toggleBookmark, cat, toast } = useStore();
  const saved = bookmarks.insights.includes(insight.id);
  const c = cat(insight.categoryId);
  return (
    <article className={cx('relative overflow-hidden rounded-card border p-5 sm:p-6',
      featured ? 'border-lavender/50 bg-lavender-soft/70 dark:bg-lavender/[.08]' : 'border-line bg-surface shadow-soft')}>
      <div className="ai-texture pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-70" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender text-ink"><Sparkles className="h-4 w-4" /></span>
          <span className="text-sm font-bold text-ai">{monthLabel(insight.month, true)}</span>
        </div>
        <button
          onClick={() => { toggleBookmark('insights', insight.id); toast(saved ? 'Removed from bookmarks.' : 'Saved to your bookmarks.', 'info'); }}
          aria-pressed={saved}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark insight'}
          className={cx('rounded-lg p-2 transition-colors hover:bg-lavender/20', saved ? 'text-ai' : 'text-muted')}
        >
          <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className={cx('relative mt-3 font-bold leading-snug tracking-tight', featured ? 'text-xl' : 'text-[1.05rem]')}>{insight.pattern}</p>
      {featured && <p className="relative mt-2 text-sm text-muted">{insight.summary}</p>}
      <div className="relative mt-4 rounded-2xl bg-surface/80 p-4 dark:bg-canvas/40">
        <p className="text-xs font-bold text-ai">Suggested action</p>
        <p className="mt-1 text-sm font-medium">{insight.action}</p>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        {c && <Badge tone={insight.change > 0 ? 'neg' : 'pos'}>{c.name} {insight.change > 0 ? '+' : ''}{insight.change}% vs your average</Badge>}
        {onView && <button onClick={onView} className="text-sm font-bold text-ai underline-offset-4 hover:underline">View full summary</button>}
      </div>
    </article>
  );
}

/* ---------------- TipCard ---------------- */
export function TipCard({ tip, compact }: { tip: Tip; compact?: boolean }) {
  const { bookmarks, toggleBookmark, pinTip, dismissTip, cat, toast } = useStore();
  const saved = bookmarks.tips.includes(tip.id);
  const c = cat(tip.categoryId);
  const [leaving, setLeaving] = useState(false);
  return (
    <article className={cx('rounded-card border bg-surface p-5 transition-all duration-200',
      tip.pinned ? 'border-mint/70 shadow-soft' : 'border-line', leaving && 'scale-95 opacity-0')}>
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none" aria-hidden>💡</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {c && <Badge>{c.name}</Badge>}
            {tip.impact > 0 ? <Badge tone="pos">Could save ~{rs(tip.impact)}/mo</Badge> : <Badge tone="ai">From the Campus Coin team</Badge>}
            {tip.pinned && <Badge tone="ink"><Pin className="h-3 w-3" /> Pinned</Badge>}
          </div>
          <h3 className="mt-2 font-bold leading-snug">{tip.title}</h3>
          <p className={cx('mt-1 text-sm text-muted', compact && 'line-clamp-2')}>{tip.body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5 pl-9">
        <TipAction onClick={() => { pinTip(tip.id); toast(tip.pinned ? 'Tip unpinned.' : 'Pinned to the top of your tips.', 'info'); }} active={tip.pinned} icon={<Pin className="h-3.5 w-3.5" />}>{tip.pinned ? 'Unpin' : 'Pin'}</TipAction>
        <TipAction onClick={() => { toggleBookmark('tips', tip.id); toast(saved ? 'Removed from bookmarks.' : 'Saved to your bookmarks.', 'info'); }} active={saved} icon={<Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />}>{saved ? 'Saved' : 'Bookmark'}</TipAction>
        <TipAction onClick={() => { setLeaving(true); setTimeout(() => dismissTip(tip.id), 180); toast('Got it. We\u2019ll show you fewer tips like this.', 'info'); }} icon={<X className="h-3.5 w-3.5" />}>Dismiss</TipAction>
      </div>
    </article>
  );
}
function TipAction({ children, icon, onClick, active }: { children: ReactNode; icon: ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-ink text-cream dark:bg-mint dark:text-ink' : 'bg-fg/[.05] text-fg hover:bg-fg/10')}>
      {icon}{children}
    </button>
  );
}
