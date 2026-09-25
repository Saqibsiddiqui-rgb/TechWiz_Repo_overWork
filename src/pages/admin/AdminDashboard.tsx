import { Activity as ActivityIcon, Receipt, UserPlus, Users, Utensils } from 'lucide-react';
import { navigate } from '../../lib/router';
import { useApi } from '../../lib/useApi';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, EmptyState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { AreaChart, BarChart, ShareBars } from '../../components/charts/Charts';
import { Avatar } from '../../layouts/StudentLayout';
import { CountCard, count, Loadable, type Activity, type Usage } from './AdminShared';

interface Overview {
  activeUsers: number; totalUsers: number; newThisMonth: number; txThisMonth: number;
  txChange: number | null; activeChange: number | null; topCategory: Usage | null;
  activity: Activity[]; categoryUsage: Usage[];
  newest: { id: number; name: string; academicYear: string | null; joined: string }[];
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi<Overview>('/admin/overview');
  const first = data?.activity.find((a) => a.active > 0);
  const last = data?.activity[data.activity.length - 1];
  const growth = first && last && first.active ? Math.round(((last.active - first.active) / first.active) * 100) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Campus Coin at a glance" subtitle="How students are using the platform, straight from the database."
        actions={<Button variant="secondary" onClick={() => navigate('/admin/stats')}>Full statistics</Button>} />
      <Loadable loading={loading} error={error} onRetry={reload}>
        {data && (<>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <CountCard label="Active users" value={count(data.activeUsers)} delta={data.activeChange} note="active in the last 30 days" icon={<ActivityIcon className="h-4 w-4" />} accent="#72E6B0" />
            <CountCard label="Total users" value={count(data.totalUsers)} note={`${data.newThisMonth} joined this month`} icon={<Users className="h-4 w-4" />} accent="#A99BFF" />
            <CountCard label="Transactions logged" value={count(data.txThisMonth)} delta={data.txChange} note="this month" icon={<Receipt className="h-4 w-4" />} accent="#FF8B73" />
            <Card interactive className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted">Most used category</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/20 text-neg"><Utensils className="h-4 w-4" /></span>
              </div>
              <p className="mt-3 truncate text-[1.9rem] font-extrabold leading-none tracking-tight">{data.topCategory?.name ?? '—'}</p>
              <p className="mt-2 text-xs text-muted">{data.topCategory ? `${data.topCategory.share}% of expense entries (90 days)` : 'No expenses logged yet'}</p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <CardHeader title="User activity" subtitle="Students who logged at least one transaction, per month" action={growth != null && <Badge tone={growth >= 0 ? 'pos' : 'neg'}>{growth >= 0 ? '+' : ''}{growth}% in 6 months</Badge>} />
              <div className="mt-4"><AreaChart data={data.activity.map((a) => ({ label: a.label, value: a.active }))} color="#72E6B0" height={220} valueLabel="Active students" format={count} /></div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <CardHeader title="Category usage" subtitle="Share of expense entries, last 90 days" />
              <div className="mt-5">
                {data.categoryUsage.length ? <ShareBars rows={data.categoryUsage.slice(0, 6).map((u) => ({ label: u.name, value: u.share, color: u.color, note: `${u.share}%` }))} />
                  : <EmptyState title="No expenses yet" body="Category usage appears once students start logging." />}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <CardHeader title="Transactions" subtitle="Entries logged per month across all students" />
              <div className="mt-4"><BarChart data={data.activity.map((a) => ({ label: a.label, tx: a.tx }))} series={[{ key: 'tx', name: 'Transactions', color: '#A99BFF' }]} height={220} format={count} /></div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <CardHeader title="Newest students" subtitle="Say hi in an announcement?" action={<a href="#/admin/users" className="text-sm font-semibold text-muted hover:text-fg">All users</a>} />
              <ul className="mt-4 divide-y divide-line">
                {data.newest.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    <Avatar name={u.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{u.name}</span>
                      <span className="block truncate text-xs text-muted">{u.academicYear ?? 'Year not set'} · joined {new Date(u.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </span>
                    <UserPlus className="h-4 w-4 text-muted" />
                  </li>
                ))}
                {!data.newest.length && <li className="py-3 text-sm text-muted">No students yet.</li>}
              </ul>
            </Card>
          </div>
        </>)}
      </Loadable>
    </div>
  );
}
