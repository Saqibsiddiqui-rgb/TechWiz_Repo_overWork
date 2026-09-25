import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, ChartColumn, Minus, PiggyBank, Plus, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useStore } from '../../lib/store';
import { CURRENT_MONTH, daysLeftInMonth, greeting, monthLabel, rs } from '../../lib/format';
import { navigate } from '../../lib/router';
import { categoryBreakdown, lastNDays, sixMonths, weeksOfMonth } from '../../lib/analytics';
import { useQuickAdd } from '../../layouts/StudentLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Field';
import { EmptyState, ProgressBar, Skeleton } from '../../components/ui/Feedback';
import { BarChart, DonutChart, Legend } from '../../components/charts/Charts';
import { BudgetLine, InsightCard, Money, StatCard, TipCard, TransactionRow } from '../../components/Finance';
import { CategoryIcon } from '../../components/Brand';
import { Button } from '../../components/ui/Button';

const change = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

export default function Dashboard() {
  const s = useStore();
  const { profile, totals, last, transactions, budgets, spent, categories, insights, tips, cat } = s;
  const openAdd = useQuickAdd();
  const [range, setRange] = useState<'week' | 'month' | '6m'>('month');
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);

  const overview = useMemo(() => (range === 'week' ? lastNDays(transactions) : range === 'month' ? weeksOfMonth(transactions) : sixMonths(transactions)), [range, transactions]);
  const breakdown = useMemo(() => categoryBreakdown(transactions, categories), [transactions, categories]);
  const top = breakdown[0];
  const topCat = top && cat(top.id);
  const monthBudgets = budgets.filter((b) => b.month === CURRENT_MONTH).sort((a, b) => (spent[b.categoryId] || 0) / b.limit - (spent[a.categoryId] || 0) / a.limit);
  const recent = transactions.slice(0, 6);
  const activeTips = tips.filter((t) => !t.dismissed).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.impact - a.impact);
  const savedPct = totals.income ? Math.round((totals.balance / totals.income) * 100) : 0;
  const firstName = profile.name.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight sm:text-[2.4rem]">{greeting()}, {firstName} <span aria-hidden>👋</span></h1>
          <p className="mt-1 text-muted">Here&rsquo;s how your money is looking this month.</p>
        </div>
        <p className="hidden rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted sm:block">{monthLabel(CURRENT_MONTH, true)} · {daysLeftInMonth()} {daysLeftInMonth() === 1 ? 'day' : 'days'} left</p>
      </section>

      <div className="grid grid-cols-12 gap-5">
        {/* Mobile balance hero */}
        <section className="order-1 col-span-12 md:hidden" aria-label="Balance">
          <div className="relative overflow-hidden rounded-card bg-ink p-5 text-cream">
            <CoinArc />
            <p className="text-sm font-semibold text-cream/70">Balance this month</p>
            <Money value={totals.balance} className="mt-2 text-[2.6rem] text-cream" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-cream/[.07] p-3"><p className="text-cream/60">Income</p><p className="money font-bold text-mint">+ {rs(totals.income)}</p></div>
              <div className="rounded-2xl bg-cream/[.07] p-3"><p className="text-cream/60">Spent</p><p className="money font-bold text-coral">− {rs(totals.expense)}</p></div>
            </div>
            <p className="mt-3 text-xs text-cream/60">You&rsquo;ve kept {savedPct}% of what came in. Goal: {rs(profile.savingsGoal)}</p>
          </div>
        </section>

        {/* Summary cards (tablet/desktop) */}
        <section className="col-span-12 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4" aria-label="Monthly summary">
          <StatCard label="Balance" value={totals.balance} delta={change(totals.balance, last.balance)} deltaGood={totals.balance >= last.balance} icon={<Wallet className="h-[18px] w-[18px]" />} accent="#A99BFF" />
          <StatCard label="Income" value={totals.income} delta={change(totals.income, last.income)} deltaGood={totals.income >= last.income} icon={<TrendingUp className="h-[18px] w-[18px]" />} accent="#72E6B0" />
          <StatCard label="Expenses" value={totals.expense} delta={change(totals.expense, last.expense)} deltaGood={totals.expense <= last.expense} icon={<TrendingDown className="h-[18px] w-[18px]" />} accent="#FF8B73" />
          <Card interactive className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">Savings</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2C14E]/30 text-warn"><PiggyBank className="h-[18px] w-[18px]" /></span>
            </div>
            <Money value={totals.balance} className="mt-3 text-[1.9rem]" />
            <div className="mt-3"><ProgressBar value={Math.min(totals.balance, profile.savingsGoal)} max={profile.savingsGoal} size="sm" label="Savings goal" /></div>
            <p className="mt-2 text-xs text-muted">{totals.balance >= profile.savingsGoal ? <><b className="text-pos">Goal reached.</b> Keep what&rsquo;s left safe till month-end.</> : <>{rs(profile.savingsGoal - totals.balance)} to your {rs(profile.savingsGoal)} goal</>}</p>
          </Card>
        </section>

        {/* Quick actions */}
        <section className="order-2 col-span-12 lg:order-none" aria-label="Quick actions">
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
            <QuickAction onClick={() => openAdd('expense')} icon={<Minus className="h-5 w-5" />} tone="bg-coral text-ink" label="Add Expense" hint="Chai, rides, books" />
            <QuickAction onClick={() => openAdd('income')} icon={<Plus className="h-5 w-5" />} tone="bg-mint text-ink" label="Add Income" hint="Allowance, tutoring" />
            <QuickAction onClick={() => navigate('/app/budgets')} icon={<Target className="h-5 w-5" />} tone="bg-lavender text-ink" label="Set Budget" hint="Cap a category" />
            <QuickAction onClick={() => navigate('/app/reports')} icon={<ChartColumn className="h-5 w-5" />} tone="bg-ink text-cream dark:bg-cream dark:text-ink" label="View Report" hint="Monthly breakdown" />
          </div>
        </section>

        {/* Spending overview */}
        <Card className="order-7 col-span-12 p-5 sm:p-6 lg:order-none lg:col-span-8">
          <CardHeader title="Spending Overview" subtitle="Income vs expenses"
            action={<Segmented size="sm" label="Time range" value={range} onChange={setRange} options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: '6m', label: '6 Months' }]} />} />
          <Legend className="mt-4" items={[{ label: 'Income', color: '#72E6B0' }, { label: 'Expenses', color: '#FF8B73' }]} />
          <div className="mt-3">
            {loading ? <Skeleton className="h-[240px]" /> : (
              <BarChart key={range} data={overview} series={[{ key: 'income', name: 'Income', color: '#72E6B0' }, { key: 'expense', name: 'Expenses', color: '#FF8B73' }]} />
            )}
          </div>
        </Card>

        {/* Where your money goes */}
        <Card className="order-8 col-span-12 p-5 sm:p-6 lg:order-none lg:col-span-4">
          <CardHeader title="Where Your Money Goes" subtitle="Hover a slice for details" />
          {loading ? <Skeleton className="mx-auto mt-6 h-[190px] w-[190px] rounded-full" /> : breakdown.length ? (
            <>
              <div className="mt-5"><DonutChart data={breakdown} size={196} center={<><span className="text-xs font-semibold text-muted">Spent</span><span className="money text-xl font-extrabold">{rs(totals.expense)}</span></>} /></div>
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {breakdown.map((b) => (
                  <li key={b.id} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} /><span className="truncate text-muted">{b.label}</span><span className="money ml-auto font-bold">{Math.round((b.value / totals.expense) * 100)}%</span></li>
                ))}
              </ul>
            </>
          ) : <EmptyState title="No spending yet" body="Nothing here yet. Add your first transaction to start seeing your spending patterns." />}
        </Card>

        {/* Budget check */}
        <Card className="order-3 col-span-12 p-5 sm:p-6 lg:order-none lg:col-span-5">
          <CardHeader title="Budget Check" subtitle="Budget vs actual this month" action={<a href="#/app/budgets" className="text-sm font-bold text-muted hover:text-fg">Manage</a>} />
          <div className="mt-5 space-y-5">
            {monthBudgets.slice(0, 4).map((b) => <BudgetLine key={b.id} budget={b} spent={spent[b.categoryId] || 0} />)}
            {!monthBudgets.length && <EmptyState title="No budgets yet" body="Set a monthly limit for a category and we'll warn you before you cross it." action={<Button size="sm" onClick={() => navigate('/app/budgets')}>Set a budget</Button>} />}
          </div>
        </Card>

        {/* AI: Your month, explained */}
        <section className="order-5 col-span-12 lg:order-none lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.05rem] font-bold tracking-tight">Your month, explained.</h2>
            <a href="#/app/insights" className="text-sm font-bold text-ai">All insights</a>
          </div>
          {loading ? <Skeleton className="h-[260px] rounded-card" /> : insights[0] ? <InsightCard insight={insights[0]} featured onView={() => navigate('/app/insights')} />
            : <Card><EmptyState title="Your first insight is on its way" body="Log at least three expenses this month and Campus Coin AI will explain your month in plain words." action={<Button size="sm" variant="ai" onClick={() => navigate('/app/insights')}>Go to insights</Button>} /></Card>}
          
        </section>

        {/* Top category */}
        <section className="order-6 col-span-12 lg:order-none lg:col-span-3">
          {topCat && top && (
            <Card className="relative h-full overflow-hidden p-5 sm:p-6">
              <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full opacity-25" style={{ background: topCat.color }} aria-hidden />
              <p className="text-sm font-semibold text-muted">This Month&rsquo;s Top Category</p>
              <div className="mt-4 flex items-center gap-3">
                <CategoryIcon icon={topCat.icon} color={topCat.color} size="lg" />
                <p className="text-2xl font-extrabold tracking-tight">{topCat.name}</p>
              </div>
              <Money value={top.value} className="mt-5 text-[2.2rem]" />
              <p className="mt-2 text-sm text-muted">Your biggest spending area this month.</p>
              <p className="relative mt-4 text-xs font-semibold text-muted">{Math.round((top.value / totals.expense) * 100)}% of everything you spent</p>
            </Card>
          )}
        </section>

        {/* Recent transactions */}
        <Card className="order-4 col-span-12 p-5 sm:p-6 lg:order-none lg:col-span-8">
          <CardHeader title="Recent Transactions" action={<a href="#/app/transactions" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-fg">See all <ArrowRight className="h-4 w-4" /></a>} />
          <ul className="-mx-2 mt-3 divide-y divide-line/60">
            {recent.map((t) => <TransactionRow key={t.id} tx={t} compact />)}
          </ul>
          {!recent.length && <EmptyState title="Nothing here yet" body="Add your first transaction to start seeing your spending patterns." action={<Button onClick={() => openAdd('expense')}>Add your first expense</Button>} />}
        </Card>

        {/* Smart tips */}
        <section className="order-9 col-span-12 lg:order-none lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.05rem] font-bold tracking-tight">Smart Tips</h2>
            <a href="#/app/tips" className="text-sm font-bold text-muted hover:text-fg">All tips</a>
          </div>
          <div className="space-y-3">
            {activeTips.slice(0, 2).map((t) => <TipCard key={t.id} tip={t} compact />)}
            {!activeTips.length && <Card><EmptyState title="You're all caught up" body="New tips appear as your spending changes." /></Card>}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, hint, tone, onClick }: { icon: ReactNode; label: string; hint: string; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group flex min-w-[150px] items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-soft transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift active:scale-[.98]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone} transition-transform group-hover:rotate-[-6deg]`}>{icon}</span>
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );
}

/** Decorative coin rings used on ink surfaces */
export function CoinArc() {
  return (
    <svg className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-40" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#72E6B0" strokeWidth="6" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#A99BFF" strokeWidth="2" strokeDasharray="3 5" />
    </svg>
  );
}
