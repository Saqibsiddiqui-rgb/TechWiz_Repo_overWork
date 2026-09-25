import { useMemo, useState } from 'react';
import { Eye, KeyRound, Search, UserCheck, UserX } from 'lucide-react';
import type { AdminUser } from '../../lib/types';
import { cx, timeAgo } from '../../lib/format';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useStore } from '../../lib/store';
import { Avatar } from '../../layouts/StudentLayout';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button, IconButton } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Field';
import { Badge, EmptyState, Modal } from '../../components/ui/Feedback';
import { count, Loadable } from './AdminShared';

type Filter = 'all' | 'active' | 'disabled';
type Action = { kind: 'view' | 'toggle' | 'reset'; user: AdminUser } | null;

export default function AdminUsers() {
  const { data, setData, loading, error, reload } = useApi<{ users: AdminUser[] }>('/admin/users');
  const users = data?.users ?? [];
  const { toast } = useStore();
  const [devLink, setDevLink] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [action, setAction] = useState<Action>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => users.filter((u) =>
    (filter === 'all' || u.status === filter) &&
    (`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase().trim()))), [users, q, filter]);

  const confirm = () => {
    if (!action) return;
    const { kind, user } = action;
    setBusy(true);
    const done = () => { setBusy(false); setAction(null); };
    if (kind === 'toggle') {
      const next = user.status === 'active' ? 'disabled' : 'active';
      api(`/admin/users/${user.id}/status`, 'PATCH', { status: next })
        .then(() => {
          setData((d) => d && { users: d.users.map((u) => (u.id === user.id ? { ...u, status: next } : u)) });
          toast(next === 'disabled' ? `${user.name}\u2019s account is disabled and signed out. Their data is kept.` : `${user.name} can sign in again.`, next === 'disabled' ? 'info' : 'success');
        })
        .catch((e) => toast(errorMessage(e), 'error'))
        .finally(done);
    } else if (kind === 'reset') {
      api<{ ok: boolean; devLink?: string }>(`/admin/users/${user.id}/reset-link`, 'POST')
        .then((r) => { toast(`Reset link sent to ${user.email}. It expires in 30 minutes.`); if (r.devLink) setDevLink(r.devLink); })
        .catch((e) => toast(errorMessage(e), 'error'))
        .finally(done);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle={`${users.filter((u) => u.status === 'active').length} active, ${users.filter((u) => u.status === 'disabled').length} disabled. Admins can view, disable or reset accounts, but never see individual transactions.`} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 sm:max-w-sm">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search users" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <Segmented label="Status filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'disabled', label: 'Disabled' }]} />
      </div>

      <Loadable loading={loading} error={error} onRetry={reload}>
      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8"><EmptyState art="search" title="No students match that search" body="Try part of a name or the university email domain, like fast.edu.pk." /></div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-3 py-3 font-semibold">Year</th><th className="px-3 py-3 font-semibold">Joined</th>
                    <th className="px-3 py-3 text-right font-semibold">Entries</th><th className="px-3 py-3 font-semibold">Last active</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.map((u) => (
                    <tr key={u.id} className={cx('transition-colors hover:bg-fg/[.02]', u.status === 'disabled' && 'opacity-60')}>
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} size={34} /><div className="min-w-0"><p className="truncate font-bold">{u.name}</p><p className="truncate text-xs text-muted">{u.email}</p></div></div></td>
                      <td className="px-3 py-3">{u.academicYear}</td>
                      <td className="px-3 py-3 text-muted">{new Date(u.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="money px-3 py-3 text-right font-bold">{count(u.transactions)}</td>
                      <td className="px-3 py-3 text-muted">{u.lastActive ? timeAgo(u.lastActive) : 'Never'}</td>
                      <td className="px-3 py-3"><Badge tone={u.status === 'active' ? 'pos' : 'neutral'}>{u.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
                      <td className="px-5 py-3"><RowActions user={u} onAction={setAction} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {list.map((u) => (
                <li key={u.id} className={cx('flex items-center gap-3 p-4', u.status === 'disabled' && 'opacity-60')}>
                  <Avatar name={u.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.academicYear} · {count(u.transactions)} entries</p>
                    <Badge tone={u.status === 'active' ? 'pos' : 'neutral'} className="mt-1">{u.status === 'active' ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <RowActions user={u} onAction={setAction} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      </Loadable>

      <Modal open={action?.kind === 'view'} onClose={() => setAction(null)} title="Student account" subtitle="Profile summary only. Transaction details stay private to the student.">
        {action && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={action.user.name} size={48} /><div><p className="text-lg font-bold">{action.user.name}</p><p className="text-sm text-muted">{action.user.email}</p></div></div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[['Academic year', action.user.academicYear || 'Not set'], ['Joined', action.user.joined], ['Entries logged', count(action.user.transactions)], ['Last active', action.user.lastActive ? timeAgo(action.user.lastActive) : 'Never']].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-raised p-3"><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 font-bold">{v}</dd></div>
              ))}
            </dl>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" icon={<KeyRound className="h-4 w-4" />} onClick={() => setAction({ kind: 'reset', user: action.user })}>Send reset link</Button>
              <Button onClick={() => setAction(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={action?.kind === 'toggle' || action?.kind === 'reset'} onClose={() => setAction(null)}
        title={action?.kind === 'reset' ? 'Send a password reset link?' : action?.user.status === 'active' ? `Disable ${action?.user.name}?` : `Re-enable ${action?.user.name}?`}
        footer={<><Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
          <Button variant={action?.kind === 'toggle' && action.user.status === 'active' ? 'danger' : 'primary'} loading={busy} onClick={confirm}>
            {action?.kind === 'reset' ? 'Send link' : action?.user.status === 'active' ? 'Disable account' : 'Re-enable'}
          </Button></>}>
        <p className="text-sm text-muted">
          {action?.kind === 'reset' ? `We\u2019ll email ${action.user.email} a one-time link. Their current password keeps working until they use it.`
            : action?.user.status === 'active' ? 'They won\u2019t be able to sign in, but nothing is deleted. You can switch it back any time.'
              : 'They\u2019ll be able to sign in again straight away with their existing password.'}
        </p>
      </Modal>
      <Modal open={!!devLink} onClose={() => setDevLink('')} title="Reset link (local development)" subtitle="Email isn't configured on this server, so the link was saved to the email_log table. Share it with the student yourself.">
        <div className="space-y-3">
          <p className="break-all rounded-2xl bg-raised p-3 font-mono text-xs">{devLink}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(devLink).then(() => toast('Link copied.', 'info')).catch(() => {}); }}>Copy link</Button>
            <Button onClick={() => setDevLink('')}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RowActions({ user, onAction }: { user: AdminUser; onAction: (a: Action) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <IconButton label={`View ${user.name}`} onClick={() => onAction({ kind: 'view', user })}><Eye className="h-4 w-4" /></IconButton>
      <IconButton label={`Reset password for ${user.name}`} onClick={() => onAction({ kind: 'reset', user })}><KeyRound className="h-4 w-4" /></IconButton>
      <IconButton label={user.status === 'active' ? `Disable ${user.name}` : `Enable ${user.name}`} onClick={() => onAction({ kind: 'toggle', user })}>
        {user.status === 'active' ? <UserX className="h-4 w-4 text-neg" /> : <UserCheck className="h-4 w-4 text-pos" />}
      </IconButton>
    </div>
  );
}
