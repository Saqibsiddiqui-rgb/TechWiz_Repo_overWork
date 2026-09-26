import { useEffect, useMemo, useState } from 'react';
import { FileDown, Image as ImageIcon, Mail, Sparkles } from 'lucide-react';
import { CURRENT_MONTH, monthLabel, rs, shiftMonth, TODAY } from '../../lib/format';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useStore } from '../../lib/store';
import { categoryBreakdown, dailySpending, forecastNextMonth, sixMonths, weeksOfMonth } from '../../lib/analytics';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Badge, EmptyState, Modal, Skeleton } from '../../components/ui/Feedback';
import { AreaChart, BarChart, DonutChart, Legend, ShareBars } from '../../components/charts/Charts';
import { Money } from '../../components/Finance';

export default function Reports() {
  const { transactions, categories, profile, toast } = useStore();
  const [from, setFrom] = useState(`${CURRENT_MONTH}-01`);
  const [to, setTo] = useState(TODAY);
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'img' | null>(null);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const inRange = useMemo(() => transactions.filter((t) => t.date >= from && t.date <= to), [transactions, from, to]);
  const expenses = inRange.filter((t) => t.type === 'expense' && (category === 'all' || t.categoryId === category));
  const incomes = inRange.filter((t) => t.type === 'income' && (source === 'all' || t.categoryId === source));
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const totalInc = incomes.reduce((s, t) => s + t.amount, 0);
  const filtered = [...expenses, ...incomes];
  const breakdown = categoryBreakdown(filtered, categories, { from, to });
  const incomeBreakdown = categoryBreakdown(filtered, categories, { from, to, type: 'income' });
  const six = sixMonths(transactions);
  const daily = dailySpending(expenses.length ? expenses : [], CURRENT_MONTH);
  const weekly = weeksOfMonth(filtered);
  const days = Math.max(1, (Date.parse(to) - Date.parse(from)) / 86400000 + 1);
  const forecast = forecastNextMonth(transactions);
  const dateError = from > to ? 'Start date must be before the end date.' : '';

  const exportPdf = () => { setExporting('pdf'); setTimeout(() => { setExporting(null); window.print(); }, 300); };
  const exportImage = () => {
    setExporting('img');
    setTimeout(() => {
      try {
        const url = drawReportImage({ name: profile.name, from, to, income: totalInc, expense: totalExp, rows: breakdown.slice(0, 7) });
        const a = document.createElement('a');
        a.href = url; a.download = `campus-coin-report-${from}-to-${to}.png`; a.click();
        toast('Your report image is downloading.');
      } catch {
        toast('We couldn\u2019t create the image. Try Export PDF instead.', 'error');
      }
      setExporting(null);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="A clear picture of your month, ready to keep or share."
        actions={<div className="no-print flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Mail className="h-4 w-4" />} onClick={() => setEmailOpen(true)}>Email</Button>
          <Button variant="secondary" loading={exporting === 'img'} icon={<ImageIcon className="h-4 w-4" />} onClick={exportImage}>Export Image</Button>
          <Button loading={exporting === 'pdf'} icon={<FileDown className="h-4 w-4" />} onClick={exportPdf}>Export PDF</Button>
        </div>} />

      <Card className="no-print grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <Input type="date" label="From" value={from} max={to} onChange={(e) => setFrom(e.target.value)} error={dateError} />
        <Input type="date" label="To" value={to} max={TODAY} onChange={(e) => setTo(e.target.value)} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}
          options={[{ value: 'all', label: 'All expense categories' }, ...categories.filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: c.name }))]} />
        <Select label="Income source" value={source} onChange={(e) => setSource(e.target.value)}
          options={[{ value: 'all', label: 'All income sources' }, ...categories.filter((c) => c.type === 'income').map((c) => ({ value: c.id, label: c.name }))]} />
      </Card>

      <div id="print-area" className="space-y-6">
        <div className="hidden print:block"><h1 className="text-2xl font-extrabold">Campus Coin monthly report</h1><p>{profile.name} · {from} to {to}</p></div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5"><p className="text-sm font-semibold text-muted">Income</p><Money value={totalInc} className="mt-2 text-[1.7rem] text-pos" /></Card>
          <Card className="p-5"><p className="text-sm font-semibold text-muted">Expenses</p><Money value={totalExp} className="mt-2 text-[1.7rem]" /></Card>
          <Card className="p-5"><p className="text-sm font-semibold text-muted">Daily average spend</p><Money value={totalExp / days} className="mt-2 text-[1.7rem]" /></Card>
          <Card className="relative overflow-hidden border-lavender/50 bg-lavender-soft/60 p-5 dark:bg-lavender/[.08]">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ai"><Sparkles className="h-4 w-4" /> {monthLabel(shiftMonth(CURRENT_MONTH, 1), true).split(' ')[0]} forecast</p>
            <Money value={forecast} className="mt-2 text-[1.7rem]" />
            <p className="mt-1 text-xs text-muted">Estimate from your recent months</p>
          </Card>
        </div>

        {loading ? <Skeleton className="h-[340px] rounded-card" /> : (
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="p-5 sm:p-6 lg:col-span-3">
              <CardHeader title="Income vs Expense" subtitle="Last six months" action={<Legend items={[{ label: 'Income', color: '#72E6B0' }, { label: 'Expenses', color: '#FF8B73' }]} />} />
              <div className="mt-4"><BarChart data={six} series={[{ key: 'income', name: 'Income', color: '#72E6B0' }, { key: 'expense', name: 'Expenses', color: '#FF8B73' }]} height={260} /></div>
            </Card>
            <Card className="p-5 sm:p-6 lg:col-span-2">
              <CardHeader title="6-month spending trend" subtitle="Are you spending more or less?" />
              <div className="mt-4"><AreaChart data={six.map((m) => ({ label: m.label, value: m.expense }))} color="#A99BFF" height={260} /></div>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 sm:p-6 lg:col-span-3">
            <CardHeader title="Daily spending" subtitle="September, day by day" />
            <div className="mt-4">{loading ? <Skeleton className="h-[220px]" /> : <AreaChart data={daily} color="#FF8B73" height={220} />}</div>
          </Card>
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <CardHeader title="Weekly spending" subtitle="This month, week by week" />
            <div className="mt-4">{loading ? <Skeleton className="h-[220px]" /> : <BarChart data={weekly} series={[{ key: 'expense', name: 'Spent', color: '#FF8B73' }]} height={220} />}</div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 sm:p-6 lg:col-span-3">
            <CardHeader title="Category breakdown" subtitle={`${from.slice(8)} to ${to.slice(8)} Sep`} />
            {breakdown.length ? (
              <div className="mt-6 grid items-center gap-8 md:grid-cols-[auto_1fr]">
                <DonutChart data={breakdown} size={180} center={<><span className="text-xs text-muted">Total</span><span className="money text-lg font-extrabold">{rs(totalExp)}</span></>} />
                <ShareBars rows={breakdown.map((b) => ({ ...b, note: `${rs(b.value)} · ${Math.round((b.value / totalExp) * 100)}%` }))} />
              </div>
            ) : <EmptyState title="No spending in this range" body="Try widening the dates or choosing All categories." />}
          </Card>
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <CardHeader title="Income sources" subtitle="Where your money came from" />
            <ul className="mt-4 space-y-3">
              {incomeBreakdown.map((i) => (
                <li key={i.id} className="flex items-center justify-between rounded-2xl bg-raised px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />{i.label}</span>
                  <span className="money font-bold text-pos">{rs(i.value)}</span>
                </li>
              ))}
              {!incomeBreakdown.length && <p className="text-sm text-muted">No income in this range.</p>}
            </ul>
            <div className="mt-5 rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold">You kept</p>
              <p className="money mt-1 text-2xl font-extrabold">{totalInc ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0}%</p>
              <p className="text-xs text-muted">of your income in this period <Badge tone="pos" className="ml-1">Goal {rs(profile.savingsGoal)}</Badge></p>
            </div>
          </Card>
        </div>
      </div>

      <EmailModal open={emailOpen} onClose={() => setEmailOpen(false)} from={from} until={to} />
    </div>
  );
}

function EmailModal({ open, onClose, from, until }: { open: boolean; onClose: () => void; from: string; until: string }) {
  const { profile, toast, emailReport } = useStore();
  const [email, setEmail] = useState(profile.email);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  return (
    <Modal open={open} onClose={onClose} centered title="Email this report" subtitle="We'll email a summary of income, expenses and categories for the selected dates."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={sending} icon={<Mail className="h-4 w-4" />} onClick={() => {
        if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address, like you@university.edu.pk');
        if (from > until) return setErr('Fix the report dates first: the start date is after the end date.');
        setSending(true);
        emailReport(email, from, until)
          .then((r) => {
            toast(r.delivered ? `Report sent to ${email}.` : `Report saved to the email log for ${email}. Turn on mail in the API's config.php to deliver it.`, r.delivered ? 'success' : 'info');
            onClose();
          })
          .catch((e) => setErr(fieldErrors(e).to ?? errorMessage(e)))
          .finally(() => setSending(false));
      }}>Send report</Button></>}>
      <Input label="Send to" type="email" value={email} error={err} onChange={(e) => { setEmail(e.target.value); setErr(''); }} hint="Parents or a mentor, for example." />
    </Modal>
  );
}

/** Draws a shareable PNG summary with the Canvas API. */
function drawReportImage(d: { name: string; from: string; to: string; income: number; expense: number; rows: { label: string; value: number; color: string }[] }) {
  const c = document.createElement('canvas');
  const W = 1080, H = 1080;
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  if (!x) throw new Error('no canvas');
  x.fillStyle = '#F7F4EC'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#172033'; x.fillRect(0, 0, W, 300);
  x.strokeStyle = '#72E6B0'; x.lineWidth = 18; x.beginPath(); x.arc(960, 70, 120, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#F7F4EC'; x.font = '800 64px "Plus Jakarta Sans", sans-serif'; x.fillText('Campus Coin report', 72, 130);
  x.font = '500 34px "Plus Jakarta Sans", sans-serif'; x.fillStyle = '#A99BFF'; x.fillText(`${d.name} · ${d.from} to ${d.to}`, 72, 200);
  x.fillStyle = '#172033'; x.font = '600 32px "Plus Jakarta Sans", sans-serif';
  x.fillText('Income', 72, 390); x.fillText('Expenses', 560, 390);
  x.font = '800 64px "Plus Jakarta Sans", sans-serif';
  x.fillStyle = '#168056'; x.fillText(rs(d.income), 72, 470);
  x.fillStyle = '#C4482D'; x.fillText(rs(d.expense), 560, 470);
  const max = Math.max(...d.rows.map((r) => r.value), 1);
  d.rows.forEach((r, i) => {
    const y = 580 + i * 64;
    x.fillStyle = '#172033'; x.font = '600 28px "Plus Jakarta Sans", sans-serif'; x.fillText(r.label, 72, y + 22);
    x.fillStyle = '#E8E3D6'; x.fillRect(340, y, 520, 26);
    x.fillStyle = r.color; x.fillRect(340, y, (520 * r.value) / max, 26);
    x.fillStyle = '#172033'; x.fillText(rs(r.value), 880, y + 22);
  });
  x.fillStyle = '#697386'; x.font = '500 24px "Plus Jakarta Sans", sans-serif'; x.fillText('Smart Spending. Student Style.', 72, 1030);
  return c.toDataURL('image/png');
}
