import { useState } from 'react';
import { Database, Gauge, Sparkles, Target } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/Feedback';
import { BarChart, DonutChart, Legend } from '../../components/charts/Charts';
import { CountCard, count, Loadable, type Activity, type Usage } from './AdminShared';

type Range = '3m' | '6m';
interface Stats {
  perUser: number; aiAccepted: number | null; budgetsThisMonth: number; records: number;
  activity: Activity[]; categoryUsage: Usage[];
  byYear: { label: string; value: number }[];
  features: { label: string; value: number }[];
}

export default function AdminStats() {
  const [range, setRange] = useState<Range>('6m');
  const { data, loading, error, reload } = useApi<Stats>(`/admin/stats?range=${range}`);
  const maxYear = Math.max(1, ...(data?.byYear.map((y) => y.value) ?? [1]));

  return (
    <div className="space-y-6">
      <PageHeader title="System statistics" subtitle="Aggregated usage only. No individual student's money data is shown here."
        actions={<Segmented label="Time range" value={range} onChange={setRange} options={[{ value: '3m', label: '3 months' }, { value: '6m', label: '6 months' }]} />} />
      <Loadable loading={loading} error={error} onRetry={reload}>
        {data && (<>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <CountCard label="Entries per active user" value={String(data.perUser)} note="this month" icon={<Gauge className="h-4 w-4" />} accent="#72E6B0" />
            <CountCard label="AI suggestions kept" value={data.aiAccepted == null ? '—' : `${data.aiAccepted}%`} note={data.aiAccepted == null ? 'no real entries yet' : 'students kept the suggested category'} icon={<Sparkles className="h-4 w-4" />} accent="#A99BFF" />
            <CountCard label="Budgets set" value={count(data.budgetsThisMonth)} note="for this month" icon={<Target className="h-4 w-4" />} accent="#FF8B73" />
            <CountCard label="Records stored" value={count(data.records)} note="transactions, all time" icon={<Database className="h-4 w-4" />} accent="#697386" />
          </div>

          <Card className="p-5">
            <CardHeader title="Active users vs transactions" subtitle="Transactions shown in tens so both fit one scale" />
            <div className="mt-4">
              <BarChart height={260} format={count}
                data={data.activity.map((r) => ({ label: r.label, active: r.active, tx: Math.round(r.tx / 10) }))}
                series={[{ key: 'active', name: 'Active users', color: '#72E6B0' }, { key: 'tx', name: 'Transactions (×10)', color: '#A99BFF' }]} />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <CardHeader title="Category usage" subtitle="Share of expense entries, last 90 days" />
              {data.categoryUsage.length ? (
                <div className="mt-4 flex flex-col items-center gap-4">
                  <DonutChart size={180} format={(n) => `${n}%`} data={data.categoryUsage.map((u) => ({ label: u.name, value: u.share, color: u.color }))}
                    center={<><span className="text-xs text-muted">Top</span><span className="text-lg font-extrabold">{data.categoryUsage[0].name}</span></>} />
                  <Legend items={data.categoryUsage.map((u) => ({ label: u.name, color: u.color, value: `${u.share}%` }))} />
                </div>
              ) : <EmptyState title="No expenses yet" body="This fills in once students log spending." />}
            </Card>
            <Card className="p-5">
              <CardHeader title="Students by year" subtitle="Total registered" />
              <ul className="mt-5 space-y-4">
                {data.byYear.map((y) => (
                  <li key={y.label}>
                    <div className="flex justify-between text-sm"><span className="font-semibold">{y.label}</span><span className="money font-bold">{count(y.value)}</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-fg/[.07]"><div className="anim-grow-x h-full rounded-full bg-lavender" style={{ width: `${(y.value / maxYear) * 100}%` }} /></div>
                  </li>
                ))}
                {!data.byYear.length && <li className="text-sm text-muted">No students yet.</li>}
              </ul>
            </Card>
            <Card className="p-5">
              <CardHeader title="Feature adoption" subtitle="% of all students" />
              <ul className="mt-5 space-y-4">
                {data.features.map((f) => (
                  <li key={f.label}>
                    <div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{f.label}</span><span className="money font-bold">{f.value}%</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-fg/[.07]"><div className="anim-grow-x h-full rounded-full bg-mint" style={{ width: `${f.value}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>)}
      </Loadable>
    </div>
  );
}
