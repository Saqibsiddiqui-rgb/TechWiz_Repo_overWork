import { useState } from 'react';
import { Pencil, Plus, Target, Trash2 } from 'lucide-react';
import type { Budget } from '../../lib/types';
import { CURRENT_MONTH, cx, daysLeftInMonth, monthLabel, rs, shiftMonth, uid } from '../../lib/format';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useStore } from '../../lib/store';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Badge, EmptyState, Modal, ProgressBar } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../components/Brand';
import { budgetState, Money } from '../../components/Finance';

export default function Budgets() {
  const { budgets, spent, cat, deleteBudget, toast, profile } = useStore();
  const [editing, setEditing] = useState<Budget | null>(null);
  const list = budgets.filter((b) => b.month === CURRENT_MONTH);
  const totalLimit = list.reduce((s, b) => s + b.limit, 0);
  const totalSpent = list.reduce((s, b) => s + (spent[b.categoryId] || 0), 0);
  const over = list.filter((b) => (spent[b.categoryId] || 0) > b.limit);
  const near = list.filter((b) => { const r = (spent[b.categoryId] || 0) / b.limit; return r >= 0.75 && r <= 1; });

  return (
    <div className="space-y-6">
      <PageHeader title="My Budgets" subtitle="Give each category a monthly limit. We'll nudge you at 80% and let you know if you go over."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ id: '', categoryId: '', limit: 0, month: CURRENT_MONTH })}>New budget</Button>} />

      {/* Monthly overview */}
      <Card className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-muted">{monthLabel(CURRENT_MONTH, true)} overview</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3">
            <Money value={totalSpent} className="text-[2.6rem]" />
            <span className="money text-lg font-semibold text-muted">of {rs(totalLimit)} budgeted</span>
          </div>
          <div className="mt-4"><ProgressBar value={totalSpent} max={totalLimit} label="Total budget used" /></div>
          <p className="mt-3 text-sm text-muted">{rs(Math.max(0, totalLimit - totalSpent))} left across all budgets, with {daysLeftInMonth()} {daysLeftInMonth() === 1 ? 'day' : 'days'} to go. Your allowance baseline is {rs(profile.allowance)}.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="On track" value={list.length - over.length - near.length} tone="bg-mint/20 text-pos" />
          <Stat label="Getting close" value={near.length} tone="bg-[#F2C14E]/25 text-warn" />
          <Stat label="Over budget" value={over.length} tone="bg-coral/20 text-neg" />
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><EmptyState title="No budgets yet" body="Start with your biggest category, usually Food. A realistic limit beats a strict one." action={<Button onClick={() => setEditing({ id: '', categoryId: 'food', limit: 8000, month: CURRENT_MONTH })}>Create a food budget</Button>} /></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => {
            const c = cat(b.categoryId);
            const s = spent[b.categoryId] || 0;
            const st = budgetState(s, b.limit);
            return (
              <Card key={b.id} interactive className={cx('p-5', s > b.limit && 'border-coral/60')}>
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={c?.icon ?? 'custom'} color={c?.color ?? '#9AA3B5'} />
                  <div className="flex-1"><p className="font-bold">{c?.name}</p><p className="text-xs text-muted">Monthly limit</p></div>
                  <button onClick={() => setEditing(b)} aria-label={`Edit ${c?.name} budget`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { deleteBudget(b.id); toast(`${c?.name} budget removed.`, 'info'); }} aria-label={`Delete ${c?.name} budget`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-xs text-muted">Budget</dt><dd className="money font-bold">{rs(b.limit)}</dd></div>
                  <div><dt className="text-xs text-muted">Spent</dt><dd className="money font-bold">{rs(s)}</dd></div>
                  <div><dt className="text-xs text-muted">Remaining</dt><dd className={cx('money font-bold', s > b.limit ? 'text-neg' : 'text-pos')}>{rs(b.limit - s)}</dd></div>
                </dl>
                <div className="mt-4"><ProgressBar value={s} max={b.limit} label={`${c?.name} progress`} /></div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone={st.tone}>{Math.round((s / b.limit) * 100)}% used</Badge>
                  <span className="text-xs text-muted">{s > b.limit ? `You\u2019ve crossed your ${c?.name.toLowerCase()} budget this month.` : st.text}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal budget={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cx('flex flex-col justify-between rounded-2xl p-4', tone)}>
      <span className="money text-3xl font-extrabold">{value}</span>
      <span className="mt-2 text-xs font-semibold">{label}</span>
    </div>
  );
}

function BudgetModal({ budget, onClose }: { budget: Budget | null; onClose: () => void }) {
  return (
    <Modal open={!!budget} onClose={onClose} title={budget?.id ? 'Edit budget' : 'New budget'} subtitle="Pick a category and a monthly limit that feels realistic.">
      {budget && <BudgetEditor key={budget.id || 'new'} initial={budget} onClose={onClose} />}
    </Modal>
  );
}

function BudgetEditor({ initial, onClose }: { initial: Budget; onClose: () => void }) {
  const { categories, budgets, saveBudget, spent, toast } = useStore();
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [limit, setLimit] = useState(initial.limit ? String(initial.limit) : '');
  const [month, setMonth] = useState(initial.month);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const taken = budgets.filter((b) => b.month === month && b.id !== initial.id).map((b) => b.categoryId);
  const options = categories.filter((c) => c.type === 'expense' && !taken.includes(c.id));
  const cur = spent[categoryId] || 0;

  const [saving, setSaving] = useState(false);
  const save = async () => {
    const e: Record<string, string> = {};
    if (!categoryId) e.category = 'Choose a category.';
    if (!(Number(limit) > 0)) e.limit = 'Enter a limit above zero.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await saveBudget({ id: initial.id || uid(), categoryId, limit: Number(limit), month });
      toast(initial.id ? 'Budget updated.' : 'Nice! Your budget is set. We\u2019ll keep an eye on it.');
      onClose();
    } catch (err) {
      const f = fieldErrors(err);
      setErrors({ category: f.categoryId ?? '', limit: f.limit ?? '' });
      if (!Object.keys(f).length) toast(errorMessage(err), 'error');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select label="Category" value={categoryId} error={errors.category} onChange={(e) => setCategoryId(e.target.value)}
        options={[{ value: '', label: 'Choose a category' }, ...options.map((c) => ({ value: c.id, label: c.name }))]} />
      <Input label="Monthly limit" prefix="Rs." inputMode="numeric" value={limit} error={errors.limit}
        onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))}
        hint={categoryId ? `You\u2019ve spent ${rs(cur)} on this so far in ${monthLabel(CURRENT_MONTH, true).split(' ')[0]}.` : 'Tip: start near what you spent last month.'} />
      <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}
        options={[0, 1].map((n) => { const m = shiftMonth(CURRENT_MONTH, n); return { value: m, label: monthLabel(m, true) }; })} />
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={saving} icon={<Target className="h-4 w-4" />} onClick={save}>{initial.id ? 'Save budget' : 'Set budget'}</Button>
      </div>
    </div>
  );
}
