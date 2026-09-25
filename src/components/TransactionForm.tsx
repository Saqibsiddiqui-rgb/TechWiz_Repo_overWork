import { useEffect, useMemo, useRef, useState } from 'react';
import { Repeat, Sparkles, TriangleAlert, Wand2 } from 'lucide-react';
import type { Transaction, TxType } from '../lib/types';
import { cx, rs, TODAY } from '../lib/format';
import { errorMessage, fieldErrors } from '../lib/api';
import { useStore } from '../lib/store';
import { suggestCategory } from '../lib/ai';
import { CategoryIcon } from './Brand';
import { Button } from './ui/Button';
import { Input, Segmented, Toggle } from './ui/Field';
import { Modal } from './ui/Feedback';

interface Props {
  initialType?: TxType;
  editing?: Transaction | null;
  onDone: () => void;
}

/** Quick add / edit form for income and expenses, with AI category suggestions. */
export function TransactionForm({ initialType = 'expense', editing, onDone }: Props) {
  const { categories, corrections, keywords, transactions, addTransaction, updateTransaction, toast } = useStore();
  const [type, setType] = useState<TxType>(editing?.type ?? initialType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
  const [touchedCategory, setTouchedCategory] = useState(!!editing);
  const [date, setDate] = useState(editing?.date ?? TODAY);
  const [recurring, setRecurring] = useState(editing?.recurring ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [thinking, setThinking] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const cats = categories.filter((c) => c.type === type);
  const validIds = cats.map((c) => c.id);

  // AI suggestion updates as the student types (debounced, so it runs when they pause)
  const [suggestion, setSuggestion] = useState<ReturnType<typeof suggestCategory>>(null);
  useEffect(() => {
    if (description.trim().length < 3) { setSuggestion(null); return; }
    setThinking(true);
    const t = setTimeout(() => {
      const s = suggestCategory(description, type, corrections, validIds, keywords);
      setSuggestion(s);
      setThinking(false);
      if (s && !touchedCategory) setCategoryId(s.categoryId);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, type]);

  useEffect(() => { if (!touchedCategory) setCategoryId(''); }, [type, touchedCategory]);

  // "System intelligence": flag unusually large or duplicate entries before saving
  const warning = useMemo(() => {
    const amt = Number(amount);
    if (!amt || !categoryId) return null;
    const dup = transactions.find((t) => t.id !== editing?.id && t.date === date && t.amount === amt && t.description.trim().toLowerCase() === description.trim().toLowerCase());
    if (dup) return 'This looks like a duplicate of an entry on the same day. Save anyway if it\u2019s a second purchase.';
    const same = transactions.filter((t) => t.categoryId === categoryId && t.type === 'expense');
    const avg = same.reduce((s, t) => s + t.amount, 0) / (same.length || 1);
    if (type === 'expense' && same.length >= 3 && amt > avg * 3) return `This is much larger than your usual ${cats.find((c) => c.id === categoryId)?.name.toLowerCase()} spend (about ${rs(avg)}). Double-check the amount.`;
    return null;
  }, [amount, categoryId, date, description, transactions, type, editing, cats]);

  const validate = () => {
    const e: Record<string, string> = {};
    const amt = Number(amount);
    if (!amount) e.amount = 'Enter an amount.';
    else if (!(amt > 0)) e.amount = 'Amount must be more than zero.';
    else if (amt > 10_000_000) e.amount = 'That\u2019s a very large amount. Check for an extra zero.';
    if (!description.trim()) e.description = `Add a short description, like \u201c${type === 'expense' ? 'Campus Cafe' : 'Monthly allowance'}\u201d.`;
    if (!categoryId) e.category = 'Pick a category so it shows up in your reports.';
    if (!date) e.date = 'Choose a date.';
    else if (date > TODAY) e.date = 'Future dates aren\u2019t supported yet. Use today or earlier.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) { amountRef.current?.form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    setSaving(true);
    const base = { type, amount: Number(amount), description: description.trim(), categoryId, date, recurring, aiSuggestedCategoryId: suggestion?.categoryId };
    try {
      if (editing) {
        await updateTransaction({ ...editing, ...base });
        toast('Updated. Your reports are already in sync.');
      } else {
        await addTransaction(base);
        toast(type === 'expense' ? 'Nice! Your expense has been added.' : 'Nice! Your income has been added.');
      }
      onDone();
    } catch (err) {
      const f = fieldErrors(err);
      if (Object.keys(f).length) setErrors({ amount: f.amount ?? '', description: f.description ?? '', category: f.categoryId ?? '', date: f.date ?? '' });
      else toast(errorMessage(err), 'error');
      setSaving(false);
    }
  };

  const suggested = suggestion && cats.find((c) => c.id === suggestion.categoryId);
  const overridden = suggested && categoryId && categoryId !== suggestion.categoryId;

  return (
    <form className="space-y-5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {!editing && (
        <Segmented label="Transaction type" value={type} onChange={(v) => { setType(v); setTouchedCategory(false); }}
          options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
      )}

      <div>
        <label htmlFor="amount" className="text-sm font-semibold">Amount</label>
        <div className={cx('mt-1.5 flex items-baseline gap-2 rounded-2xl border bg-raised px-4 py-3 focus-within:ring-4 focus-within:ring-lavender/25', errors.amount ? 'border-neg' : 'border-line')}>
          <span className="text-lg font-bold text-muted">Rs.</span>
          <input
            ref={amountRef} id="amount" inputMode="decimal" autoComplete="off" placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            aria-invalid={!!errors.amount || undefined}
            className={cx('money w-full bg-transparent text-4xl font-extrabold outline-none placeholder:text-muted/40', type === 'income' ? 'text-pos' : 'text-fg')}
          />
        </div>
        {errors.amount && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-neg">{errors.amount}</p>}
        <div className="mt-2 flex gap-1.5">
          {(type === 'expense' ? [250, 500, 1000, 2000] : [5000, 10000, 30000]).map((q) => (
            <button type="button" key={q} onClick={() => setAmount(String(q))} className="rounded-lg bg-fg/[.05] px-2.5 py-1 text-xs font-semibold hover:bg-fg/10">{rs(q)}</button>
          ))}
        </div>
      </div>

      <Input label="Description" placeholder={type === 'expense' ? 'e.g. Campus Cafe, Careem ride, Netflix' : 'e.g. Monthly allowance, Tutoring'}
        value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} maxLength={80} />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span id="cat-label" className="text-sm font-semibold">Category</span>
          <span aria-live="polite" className="min-h-[1.5rem]">
            {thinking ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ai"><Wand2 className="h-3.5 w-3.5 animate-pulse" /> Thinking…</span>
            ) : suggested ? (
              <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', overridden ? 'bg-fg/[.06] text-muted' : 'bg-lavender/20 text-ai')}>
                <Sparkles className="h-3.5 w-3.5" /> AI suggestion · {suggested.name}{suggestion?.learned && ' (learned from you)'}
              </span>
            ) : null}
          </span>
        </div>
        <div role="radiogroup" aria-labelledby="cat-label" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {cats.map((c) => (
            <button type="button" role="radio" aria-checked={categoryId === c.id} key={c.id}
              onClick={() => { setCategoryId(c.id); setTouchedCategory(true); }}
              className={cx('relative flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[0.72rem] font-semibold transition-all',
                categoryId === c.id ? 'border-fg bg-fg/[.04] shadow-soft' : 'border-line hover:border-fg/30')}>
              {suggestion?.categoryId === c.id && <Sparkles className="absolute right-1.5 top-1.5 h-3 w-3 text-ai" aria-label="AI suggested" />}
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className="line-clamp-1">{c.name}</span>
            </button>
          ))}
        </div>
        {errors.category && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-neg">{errors.category}</p>}
        {overridden && <p className="mt-1.5 text-xs text-muted">Changed from the AI suggestion. Campus Coin will remember this for next time.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input type="date" label="Date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} error={errors.date} />
        <div className="rounded-2xl border border-line px-4">
          <Toggle checked={recurring} onChange={setRecurring} label="Repeats monthly"
            description={type === 'income' ? 'Like your allowance' : 'Like Netflix or hostel dues'} />
        </div>
      </div>

      {warning && (
        <p className="flex gap-2 rounded-2xl bg-[#F2C14E]/20 px-4 py-3 text-sm text-fg"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />{warning}</p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={saving} icon={recurring ? <Repeat className="h-4 w-4" /> : undefined}>
          {editing ? 'Save changes' : type === 'expense' ? 'Add expense' : 'Add income'}
        </Button>
      </div>
    </form>
  );
}

export function TransactionModal({ open, onClose, type, editing }: { open: boolean; onClose: () => void; type?: TxType; editing?: Transaction | null }) {
  return (
    <Modal open={open} onClose={onClose}
      title={editing ? 'Edit transaction' : type === 'income' ? 'Add income' : 'Add expense'}
      subtitle={editing ? 'Changes update your budgets and reports right away.' : 'Takes about five seconds. We\u2019ll suggest the category.'}>
      {open && <TransactionForm key={editing?.id ?? type} initialType={type} editing={editing} onDone={onClose} />}
    </Modal>
  );
}
