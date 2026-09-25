import { useState } from 'react';
import { Lightbulb, Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import type { Announcement } from '../../lib/types';
import { cx, uid } from '../../lib/format';
import { Loadable } from './AdminShared';
import { useStore } from '../../lib/store';
import { api, errorMessage, fieldErrors } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Segmented, Select, Textarea } from '../../components/ui/Field';
import { Badge, EmptyState, Modal } from '../../components/ui/Feedback';

type Filter = 'all' | 'announcement' | 'tip';

export default function AdminTips() {
  // Messages and the audience list both come from the API (announcements table + server rules)
  const { data, setData, loading, error, reload } = useApi<{ announcements: Announcement[]; audiences: string[] }>('/admin/announcements');
  const announcements = data?.announcements ?? [];
  const audiences = data?.audiences ?? [];
  const setAnnouncements = (fn: (a: Announcement[]) => Announcement[]) => setData((d) => ({ audiences: d?.audiences ?? [], announcements: fn(d?.announcements ?? []) }));
  const { toast } = useStore();
  const [publishing, setPublishing] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [confirm, setConfirm] = useState<Announcement | null>(null);
  const list = announcements.filter((a) => filter === 'all' || a.kind === filter);

  /** Saves to the database. Throws so the editor can show field errors. */
  const save = async (a: Announcement) => {
    const isNew = !a.id;
    const r = await api<{ announcement: Announcement; reached: number }>(isNew ? '/admin/announcements' : `/admin/announcements/${a.id}`, isNew ? 'POST' : 'PUT', { ...a, id: a.id || uid() });
    setAnnouncements((all) => (isNew ? [r.announcement, ...all] : all.map((x) => (x.id === a.id ? r.announcement : x))));
    toast(a.status === 'live' ? `\u201c${a.title}\u201d is live. ${r.reached} ${r.reached === 1 ? 'student was' : 'students were'} notified.` : 'Saved as a draft. Students won\u2019t see it yet.');
    setEditing(null);
  };
  const publish = (a: Announcement) => {
    setPublishing(a.id);
    api<{ announcement: Announcement; reached: number }>(`/admin/announcements/${a.id}/publish`, 'POST')
      .then((r) => { setAnnouncements((all) => all.map((x) => (x.id === a.id ? r.announcement : x))); toast(`Published. ${r.reached} ${r.reached === 1 ? 'student was' : 'students were'} notified.`); })
      .catch((e) => toast(errorMessage(e), 'error'))
      .finally(() => setPublishing(''));
  };
  const remove = (a: Announcement) => {
    setAnnouncements((all) => all.filter((x) => x.id !== a.id));
    api(`/admin/announcements/${a.id}`, 'DELETE')
      .then(() => toast('Message deleted.', 'info'))
      .catch((e) => { toast(errorMessage(e), 'error'); reload(); });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tips & announcements" subtitle="System-wide messages and tip templates. The tips engine mixes these with each student's personal tips."
        actions={<Button icon={<Plus className="h-4 w-4" />} disabled={!audiences.length} onClick={() => setEditing({ id: '', kind: 'announcement', title: '', body: '', audience: audiences[0], status: 'draft' })}>New message</Button>} />
      <Segmented label="Filter messages" value={filter} onChange={setFilter}
        options={[{ value: 'all', label: `All (${announcements.length})` }, { value: 'announcement', label: 'Announcements' }, { value: 'tip', label: 'Tip templates' }]} />

      <Loadable loading={loading} error={error} onRetry={reload}>
      {list.length === 0 ? (
        <Card className="p-8"><EmptyState art="bell" title="Nothing here yet" body="Write a short, friendly message. Students read these on their dashboard and in notifications." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <Card key={a.id} interactive className={cx('flex flex-col p-5', a.kind === 'tip' && 'ai-texture')}>
              <div className="flex items-center gap-2">
                <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', a.kind === 'tip' ? 'bg-lavender/25 text-ai' : 'bg-mint/25 text-pos')}>
                  {a.kind === 'tip' ? <Lightbulb className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{a.kind === 'tip' ? 'Tip template' : 'Announcement'}</span>
                <Badge tone={a.status === 'live' ? 'pos' : 'neutral'} className="ml-auto">{a.status === 'live' ? 'Live' : 'Draft'}</Badge>
              </div>
              <h2 className="mt-4 text-lg font-bold leading-snug">{a.title}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted">{a.body}</p>
              <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
                <span className="text-xs font-semibold text-muted">{a.audience}</span>
                <span className="ml-auto" />
                {a.status === 'draft' && (
                  <Button size="sm" variant="mint" loading={publishing === a.id} icon={<Send className="h-3.5 w-3.5" />} onClick={() => publish(a)}>Publish</Button>
                )}
                <button onClick={() => setEditing(a)} aria-label={`Edit ${a.title}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirm(a)} aria-label={`Delete ${a.title}`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      </Loadable>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit message' : 'New message'} subtitle="Keep it short and friendly. Two sentences is plenty.">
        {editing && <Editor key={editing.id || 'new'} initial={editing} audiences={audiences} onSave={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Delete \u201c${confirm?.title}\u201d?`}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) remove(confirm); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-sm text-muted">{confirm?.status === 'live' ? 'It will disappear from student dashboards straight away.' : 'This draft was never shown to students.'}</p>
      </Modal>
    </div>
  );
}

function Editor({ initial, audiences, onSave, onCancel }: { initial: Announcement; audiences: string[]; onSave: (a: Announcement) => Promise<void>; onCancel: () => void }) {
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Announcement['status'] | null>(null);
  const submit = (status: Announcement['status']) => {
    const e: Record<string, string> = {};
    if (d.title.trim().length < 4) e.title = 'Add a title of at least 4 characters.';
    if (d.body.trim().length < 20) e.body = 'Say a little more, at least 20 characters, so students know what to do.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(status);
    onSave({ ...d, title: d.title.trim(), body: d.body.trim(), status })
      .catch((err) => { const f = fieldErrors(err); setErrors(Object.keys(f).length ? f : { body: errorMessage(err) }); setSaving(null); });
  };
  return (
    <div className="space-y-4">
      <Segmented label="Message type" value={d.kind} onChange={(kind) => setD({ ...d, kind })} options={[{ value: 'announcement', label: 'Announcement' }, { value: 'tip', label: 'Tip template' }]} />
      <Input label="Title" value={d.title} maxLength={60} error={errors.title} placeholder="e.g. Mid-term week is coming" onChange={(e) => setD({ ...d, title: e.target.value })} />
      <Textarea label="Message" rows={4} value={d.body} maxLength={240} error={errors.body} hint={`${d.body.length}/240`} onChange={(e) => setD({ ...d, body: e.target.value })}
        placeholder="What should students know, and what's one simple thing they can do?" />
      <Select label="Audience" value={d.audience} onChange={(e) => setD({ ...d, audience: e.target.value })} options={audiences.map((a) => ({ value: a, label: a }))} />
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" loading={saving === 'draft'} disabled={!!saving} onClick={() => submit('draft')}>Save draft</Button>
        <Button loading={saving === 'live'} disabled={!!saving} onClick={() => submit('live')}>Publish now</Button>
      </div>
    </div>
  );
}
