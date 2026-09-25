import { useMemo, useRef, useState } from 'react';
import { FileText, Pencil, Plus, Repeat, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';
import type { Transaction, TxType } from '../../lib/types';
import { CURRENT_MONTH, cx, isoDate, monthLabel, PREV_MONTH, rs, shortDate, signed, TODAY } from '../../lib/format';
import { errorMessage } from '../../lib/api';
import { useContent, useStore } from '../../lib/store';
import { suggestCategory } from '../../lib/ai';
import { useQuickAdd } from '../../layouts/StudentLayout';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import { Badge, EmptyState, ErrorState, Modal } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../components/Brand';
import { TransactionModal } from '../../components/TransactionForm';
import { TransactionRow } from '../../components/Finance';

export default function Transactions({ query }: { query: URLSearchParams }) {
  const { transactions, categories, cat, deleteTransaction, toast } = useStore();
  const openAdd = useQuickAdd();
  const [q, setQ] = useState(query.get('q') ?? '');
  const [type, setType] = useState<'all' | TxType>('all');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState(CURRENT_MONTH);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirm, setConfirm] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const rows = useMemo(() => transactions.filter((t) =>
    (type === 'all' || t.type === type) &&
    (category === 'all' || t.categoryId === category) &&
    (period === 'all' || t.date.startsWith(period)) &&
    (!q || t.description.toLowerCase().includes(q.toLowerCase()) || (cat(t.categoryId)?.name.toLowerCase().includes(q.toLowerCase()) ?? false)),
  ), [transactions, type, category, period, q, cat]);

  const inc = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const exp = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const filtersOn = q || type !== 'all' || category !== 'all' || period !== CURRENT_MONTH;

  const remove = (t: Transaction) => {
    deleteTransaction(t.id);
    setConfirm(null);
    toast(`Deleted \u201c${t.description}\u201d.`, 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle="Everything you&rsquo;ve logged, in one place. Edits update your budgets instantly."
        actions={<>
          <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openAdd('expense')}>Add transaction</Button>
        </>} />

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by description or category"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-lavender/25" />
          </label>
          <Select aria-label="Date filter" value={period} onChange={(e) => setPeriod(e.target.value)}
            options={[{ value: CURRENT_MONTH, label: monthLabel(CURRENT_MONTH, true) }, { value: PREV_MONTH, label: monthLabel(PREV_MONTH, true) }, { value: 'all', label: 'All time' }]} />
          <Select aria-label="Category filter" value={category} onChange={(e) => setCategory(e.target.value)}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` }))]} />
          <Select aria-label="Type filter" value={type} onChange={(e) => setType(e.target.value as 'all' | TxType)}
            options={[{ value: 'all', label: 'Income & expenses' }, { value: 'income', label: 'Income only' }, { value: 'expense', label: 'Expenses only' }]} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge>{rows.length} transactions</Badge>
          <Badge tone="pos">In {rs(inc)}</Badge>
          <Badge tone="neg">Out {rs(exp)}</Badge>
          {filtersOn && <button onClick={() => { setQ(''); setType('all'); setCategory('all'); setPeriod(CURRENT_MONTH); }} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"><X className="h-4 w-4" /> Clear filters</button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState art="search" title={transactions.length ? 'No matches' : 'Nothing here yet'}
            body={transactions.length ? 'Nothing matches those filters. Try a different month or clear the search.' : 'Add your first transaction to start seeing your spending patterns.'}
            action={<Button variant="secondary" onClick={() => { setQ(''); setType('all'); setCategory('all'); setPeriod('all'); }}>Show everything</Button>} />
        ) : (<>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold text-muted">
                  <th className="px-5 py-3 font-semibold">Date</th><th className="px-3 py-3 font-semibold">Description</th>
                  <th className="px-3 py-3 font-semibold">Category</th><th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const c = cat(t.categoryId);
                  return (
                    <tr key={t.id} className="group border-b border-line/60 last:border-0 hover:bg-fg/[.02]">
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{shortDate(t.date)}</td>
                      <td className="px-3 py-3 font-semibold">
                        <span className="flex items-center gap-1.5">{t.description}{t.recurring && <Repeat className="h-3.5 w-3.5 text-muted" aria-label="Recurring" />}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2"><CategoryIcon icon={c?.icon ?? 'custom'} color={c?.color ?? '#9AA3B5'} size="sm" />{c?.name}</span>
                      </td>
                      <td className="px-3 py-3"><Badge tone={t.type === 'income' ? 'pos' : 'neg'}>{t.type === 'income' ? 'Income' : 'Expense'}</Badge></td>
                      <td className={cx('money whitespace-nowrap px-3 py-3 text-right font-bold', t.type === 'income' && 'text-pos')}>{signed(t.amount, t.type)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button onClick={() => setEditing(t)} aria-label={`Edit ${t.description}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setConfirm(t)} aria-label={`Delete ${t.description}`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile list */}
          <ul className="divide-y divide-line/60 p-2 md:hidden">
            {rows.map((t) => <TransactionRow key={t.id} tx={t} onEdit={() => setEditing(t)} onDelete={() => setConfirm(t)} />)}
          </ul>
        </>)}
      </Card>

      <TransactionModal open={!!editing} editing={editing} onClose={() => setEditing(null)} />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this transaction?"
        subtitle={confirm ? `${confirm.description}, ${rs(confirm.amount)} on ${shortDate(confirm.date)}. Your budgets and reports will update.` : ''}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Keep it</Button><Button variant="danger" onClick={() => confirm && remove(confirm)} icon={<Trash2 className="h-4 w-4" />}>Delete</Button></>}>
        <p className="text-sm text-muted">This can&rsquo;t be undone.</p>
      </Modal>

      <CsvImport open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

/* ---------------- CSV import ---------------- */
/** Builds the sample CSV from the csv_sample content section. daysAgo becomes a real date, so every row is valid today. */
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); };
const sampleCsv = (rows: { daysAgo: number; description: string; amount: number; type: string }[]) =>
  ['date,description,amount,type', ...rows.map((r) => `${daysAgo(r.daysAgo)},${r.description.replace(/,/g, ' ')},${r.amount},${r.type}`)].join('\n');

interface Row { date: string; description: string; amount: number; type: TxType; categoryId: string; ai: boolean; dup: boolean; include: boolean }

function CsvImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories, corrections, keywords, transactions, importTransactions, toast } = useStore();
  const sample = useContent('csv_sample');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = (text: string) => {
    setError('');
    const lines = text.trim().split(/\r?\n/);
    const head = lines.shift()?.toLowerCase().split(',').map((h) => h.trim()) ?? [];
    const idx = (k: string) => head.indexOf(k);
    if (idx('date') < 0 || idx('description') < 0 || idx('amount') < 0) {
      setError('We couldn\u2019t find date, description and amount columns. Check the first row of your file.');
      setRows(null);
      return;
    }
    const out: Row[] = [];
    for (const l of lines) {
      const c = l.split(',').map((x) => x.trim());
      const amount = Math.abs(Number(c[idx('amount')]));
      const date = c[idx('date')];
      if (!amount || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > TODAY) continue;
      const rawType = idx('type') >= 0 ? c[idx('type')]?.toLowerCase() : Number(c[idx('amount')]) > 0 && /allowance|salary|gig|stipend/i.test(l) ? 'income' : 'expense';
      const type: TxType = rawType === 'income' ? 'income' : 'expense';
      const description = c[idx('description')];
      const ids = categories.filter((x) => x.type === type).map((x) => x.id);
      const s = suggestCategory(description, type, corrections, ids, keywords);
      const dup = transactions.some((t) => t.date === date && t.amount === amount && t.description.toLowerCase() === description.toLowerCase());
      const fallback = type === 'income' ? 'other-income' : 'misc';
      out.push({ date, description, amount, type, categoryId: s?.categoryId ?? (ids.includes(fallback) ? fallback : ids[0] ?? ''), ai: !!s, dup, include: !dup });
    }
    if (!out.length) { setError(`No valid rows found. Dates should look like ${TODAY}.`); setRows(null); return; }
    setRows(out);
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) { setError('That file isn\u2019t a CSV. Export your sheet as .csv and try again.'); return; }
    setBusy(true);
    f.text().then(parse).catch(() => setError('We couldn\u2019t read that file. Try saving it again as .csv.')).finally(() => setBusy(false));
  };

  const close = () => { setRows(null); setError(''); onClose(); };
  const chosen = rows?.filter((r) => r.include) ?? [];

  return (
    <Modal open={open} onClose={close} size="lg" title="Import from CSV"
      subtitle="Bring in older transactions from a spreadsheet. Campus Coin AI will suggest a category for each row."
      footer={rows ? <>
        <Button variant="ghost" onClick={() => setRows(null)}>Choose another file</Button>
        <Button disabled={!chosen.length} loading={saving} onClick={async () => {
          setSaving(true);
          try {
            const n = await importTransactions(chosen.map(({ date, description, amount, type, categoryId, ai }) => ({ date, description, amount, type, categoryId, aiSuggestedCategoryId: ai ? categoryId : undefined })));
            toast(`Nice! ${n} transactions imported and saved.`);
            close();
          } catch (e) {
            setError(errorMessage(e));
          }
          setSaving(false);
        }}>Import {chosen.length} transactions</Button>
      </> : undefined}>
      {!rows ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            className={cx('flex flex-col items-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors', drag ? 'border-lavender bg-lavender/10' : 'border-line')}>
            {busy ? (
              <><Sparkles className="h-8 w-8 animate-pulse text-ai" /><p className="mt-3 font-bold">Reading your file and suggesting categories…</p></>
            ) : (<>
              <FileText className="h-9 w-9 text-muted" />
              <p className="mt-3 font-bold">Drop a .csv file here</p>
              <p className="mt-1 text-sm text-muted">Columns: date, description, amount, type (income or expense)</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => fileRef.current?.click()} icon={<Upload className="h-4 w-4" />}>Choose file</Button>
                {sample && sample.rows.length > 0 && <Button variant="ai" onClick={() => parse(sampleCsv(sample.rows))} icon={<Sparkles className="h-4 w-4" />}>Try a sample file</Button>}
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </>)}
          </div>
          {error && <ErrorState message={error} />}
          <p className="text-xs text-muted">Nothing is saved until you confirm. Campus Coin never connects to a bank.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-ai" /> AI categorized {rows.filter((r) => r.ai).length} of {rows.length} rows. Change anything that looks off.</p>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2.5"><span className="sr-only">Include</span></th><th className="px-3 py-2.5">Date</th><th className="px-3 py-2.5">Description</th><th className="px-3 py-2.5">Category</th><th className="px-3 py-2.5 text-right">Amount</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={cx('border-b border-line/60 last:border-0', !r.include && 'opacity-50')}>
                    <td className="px-3 py-2"><input type="checkbox" checked={r.include} aria-label={`Include ${r.description}`} onChange={() => setRows(rows.map((x, j) => (j === i ? { ...x, include: !x.include } : x)))} className="h-4 w-4 accent-[#172033]" /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">{shortDate(r.date)}</td>
                    <td className="px-3 py-2 font-semibold">{r.description}{r.dup && <Badge tone="warn" className="ml-2">Possible duplicate</Badge>}</td>
                    <td className="px-3 py-2">
                      <select value={r.categoryId} aria-label={`Category for ${r.description}`} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, categoryId: e.target.value, ai: false } : x)))}
                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm">
                        {categories.filter((c) => c.type === r.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {r.ai && <Sparkles className="ml-1.5 inline h-3.5 w-3.5 text-ai" aria-label="AI suggested" />}
                    </td>
                    <td className={cx('money whitespace-nowrap px-3 py-2 text-right font-bold', r.type === 'income' && 'text-pos')}>{signed(r.amount, r.type)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <ErrorState message={error} />}
          <p className="text-xs text-muted">Dates after {shortDate(TODAY)} are skipped automatically.</p>
        </div>
      )}
    </Modal>
  );
}
