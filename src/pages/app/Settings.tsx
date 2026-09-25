import { useEffect, useState } from 'react';
import { Laptop, Lock, Moon, RotateCcw, Smartphone, Sun } from 'lucide-react';
import type { Profile } from '../../lib/types';
import { cx, rs, timeAgo } from '../../lib/format';
import { api, errorMessage, fieldErrors } from '../../lib/api';
import { useContent, useStore, type FontSize } from '../../lib/store';
import { navigate } from '../../lib/router';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Segmented, Select, Toggle } from '../../components/ui/Field';
import { Badge, ErrorState, Modal, Skeleton, Tabs } from '../../components/ui/Feedback';
import { Avatar } from '../../layouts/StudentLayout';

/** Academic year choices from Admin → Site content. The current value stays selectable even if it was removed. */
export function useYearOptions(current = '') {
  const options = useContent('academic_years')?.options ?? [];
  const list = current && !options.includes(current) ? [current, ...options] : options;
  return list.map((y) => ({ value: y, label: y }));
}

export default function Settings({ initialTab }: { initialTab: 'profile' | 'preferences' | 'security' }) {
  const [tab, setTab] = useState(initialTab);
  // Keep the tab in sync when the URL changes (e.g. header menu → Profile)
  useEffect(() => { setTab((t) => (initialTab === 'profile' ? 'profile' : t === 'profile' ? initialTab : t)); }, [initialTab]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile & Settings" subtitle="Your details, how Campus Coin looks, and keeping your account safe." />
      <Tabs value={tab} onChange={(t) => { setTab(t); navigate(t === 'profile' ? '/app/profile' : '/app/settings'); }}
        tabs={[{ value: 'profile', label: 'Profile' }, { value: 'preferences', label: 'Preferences' }, { value: 'security', label: 'Security' }]} />
      <div className="anim-fade">
        {tab === 'profile' && <ProfileForm />}
        {tab === 'preferences' && <Preferences />}
        {tab === 'security' && <Security />}
      </div>
    </div>
  );
}

function ProfileForm() {
  const { profile, updateProfile, toast } = useStore();
  const [p, setP] = useState<Profile>(profile);
  const [allowance, setAllowance] = useState(String(profile.allowance));
  const [goal, setGoal] = useState(String(profile.savingsGoal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const yearOptions = useYearOptions(profile.academicYear);
  const dirty = p.name !== profile.name || p.email !== profile.email || p.academicYear !== profile.academicYear || +allowance !== profile.allowance || +goal !== profile.savingsGoal;

  const save = () => {
    const e: Record<string, string> = {};
    if (p.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(p.email)) e.email = 'Enter a valid email, like you@university.edu.pk';
    if (!(+allowance >= 0) || allowance === '') e.allowance = 'Enter your usual monthly allowance (0 is fine).';
    if (!(+goal > 0)) e.goal = 'Set a savings goal above zero.';
    else if (+allowance && +goal > +allowance) e.goal = 'Your goal is higher than your allowance. That\u2019s bold. Maybe start smaller?';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    updateProfile({ ...p, name: p.name.trim(), allowance: +allowance, savingsGoal: +goal })
      .then(() => toast('Profile saved. Your dashboard is updated.'))
      .catch((err) => {
        const f = fieldErrors(err);
        if (Object.keys(f).length) setErrors({ name: f.name ?? '', email: f.email ?? '', academicYear: f.academicYear ?? '', allowance: f.allowance ?? '', goal: f.savingsGoal ?? '' });
        else toast(errorMessage(err), 'error');
      })
      .finally(() => setSaving(false));
  };

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <Avatar name={p.name || 'A'} size={64} />
        <div><p className="text-lg font-bold">{p.name}</p><p className="text-sm text-muted">{p.academicYear} · Student account</p></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={p.name} error={errors.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" />
        <Input label="Email" type="email" value={p.email} error={errors.email} onChange={(e) => setP({ ...p, email: e.target.value })} autoComplete="email" />
        <Select label="Academic year" value={p.academicYear} error={errors.academicYear} onChange={(e) => setP({ ...p, academicYear: e.target.value })} options={yearOptions} />
        <Input label="Monthly allowance" prefix="Rs." inputMode="numeric" value={allowance} error={errors.allowance} onChange={(e) => setAllowance(e.target.value.replace(/\D/g, ''))} hint="Your usual baseline, before part-time income" />
        <Input label="Monthly savings goal" prefix="Rs." inputMode="numeric" value={goal} error={errors.goal} onChange={(e) => setGoal(e.target.value.replace(/\D/g, ''))}
          hint={+allowance ? `That\u2019s ${Math.round((+goal / +allowance) * 100)}% of your allowance` : undefined} />
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
        {dirty && <span className="text-sm text-muted">Unsaved changes</span>}
        <Button disabled={!dirty} loading={saving} onClick={save}>Save profile</Button>
      </div>
    </Card>
  );
}

function Preferences() {
  const { settings, updateSettings, resetDemo, toast } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const n = settings.notify;
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-7">
        <CardHeader title="Appearance" subtitle="Make Campus Coin comfortable to read." />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[{ dark: false, label: 'Light', icon: Sun }, { dark: true, label: 'Dark', icon: Moon }].map((o) => (
            <button key={o.label} onClick={() => updateSettings({ dark: o.dark })} aria-pressed={settings.dark === o.dark}
              className={cx('overflow-hidden rounded-2xl border-2 text-left transition-colors', settings.dark === o.dark ? 'border-fg' : 'border-line hover:border-fg/30')}>
              <div className={cx('flex h-20 gap-2 p-3', o.dark ? 'bg-[#11141B]' : 'bg-cream')}>
                <div className={cx('w-6 rounded-md', o.dark ? 'bg-[#0C0F15]' : 'bg-ink')} />
                <div className="flex-1 space-y-1.5"><div className={cx('h-3 rounded', o.dark ? 'bg-[#1A1F2A]' : 'bg-white')} /><div className="h-3 w-2/3 rounded bg-mint" /><div className="h-3 w-1/2 rounded bg-lavender" /></div>
              </div>
              <p className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold"><o.icon className="h-4 w-4" />{o.label} mode</p>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Text size</p>
          <Segmented<FontSize> label="Text size" value={settings.fontSize} onChange={(v) => updateSettings({ fontSize: v })}
            options={[{ value: 'sm', label: <span className="text-xs">Aa Small</span> }, { value: 'md', label: <span className="text-sm">Aa Default</span> }, { value: 'lg', label: <span className="text-base">Aa Large</span> }]} />
          <p className="mt-2 text-xs text-muted">Changes text across the whole app, including charts and numbers.</p>
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <CardHeader title="Notifications" subtitle="Choose what Campus Coin tells you about." />
        <div className="mt-2 divide-y divide-line/60">
          <Toggle label="Budget alerts" description="When a category reaches 80% and when it goes over" checked={n.budget} onChange={(v) => updateSettings({ notify: { ...n, budget: v } })} />
          <Toggle label="New saving tips" description="When we spot a new way to save" checked={n.tips} onChange={(v) => updateSettings({ notify: { ...n, tips: v } })} />
          <Toggle label="Monthly insight" description="When your AI summary for the month is ready" checked={n.insights} onChange={(v) => updateSettings({ notify: { ...n, insights: v } })} />
          <Toggle label="Import updates" description="When a CSV import finishes" checked={n.imports} onChange={(v) => updateSettings({ notify: { ...n, imports: v } })} />
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <CardHeader title="Sample data" subtitle="Replace your data with six months of realistic sample transactions. Handy for demos." />
        <Button className="mt-4" variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirm(true)}>Load sample data</Button>
      </Card>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Replace your data with the sample?" subtitle="Your transactions, budgets, custom categories, insights and notifications will be deleted from the database and replaced."
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" loading={resetting} onClick={() => {
          setResetting(true);
          resetDemo().then(() => { setConfirm(false); toast('Sample data loaded.', 'info'); }).catch((e) => toast(errorMessage(e), 'error')).finally(() => setResetting(false));
        }}>Replace my data</Button></>}>
        <p className="text-sm text-muted">This can&rsquo;t be undone. Your profile and settings stay the same.</p>
      </Modal>
    </div>
  );
}

interface Session { id: number; device: string; mobile: boolean; ip: string | null; lastUsed: number; current: boolean }

function Security() {
  const { toast, profile } = useStore();
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [conf, setConf] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [sessionError, setSessionError] = useState('');
  const strength = [next.length >= 8, /\d/.test(next), /[A-Z]/.test(next), /[^A-Za-z0-9]/.test(next)].filter(Boolean).length;

  const loadSessions = () => {
    setSessionError('');
    api<{ sessions: Session[] }>('/account/sessions').then((r) => setSessions(r.sessions)).catch((e) => setSessionError(errorMessage(e)));
  };
  useEffect(loadSessions, []);

  const change = () => {
    const e: Record<string, string> = {};
    if (!cur) e.cur = 'Enter your current password.';
    if (next.length < 8) e.next = 'Use at least 8 characters.';
    if (conf !== next) e.conf = 'Passwords don\u2019t match yet.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    api('/account/password', 'POST', { current: cur, next })
      .then(() => { setCur(''); setNext(''); setConf(''); toast('Password updated. Other devices were signed out.'); loadSessions(); })
      .catch((err) => { const f = fieldErrors(err); if (Object.keys(f).length) setErrors(f); else toast(errorMessage(err), 'error'); })
      .finally(() => setSaving(false));
  };
  const signOutOthers = () => {
    api<{ revoked: number }>('/account/sessions/revoke-others', 'POST')
      .then((r) => { toast(r.revoked ? `Signed out of ${r.revoked} other ${r.revoked === 1 ? 'device' : 'devices'}.` : 'No other devices were signed in.', 'info'); loadSessions(); })
      .catch((e) => toast(errorMessage(e), 'error'));
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-7">
        <CardHeader title="Change password" subtitle={`Signed in as ${profile.email}`} />
        <div className="mt-5 space-y-4">
          <Input label="Current password" type="password" value={cur} error={errors.cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          <Input label="New password" type="password" value={next} error={errors.next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password"
            hint={next ? `Strength: ${['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][strength]}` : 'At least 8 characters. A number and a symbol make it stronger.'} />
          <div className="flex gap-1.5" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className={cx('h-1.5 flex-1 rounded-full', i < strength ? (strength > 2 ? 'bg-mint' : 'bg-[#F2C14E]') : 'bg-line')} />)}</div>
          <Input label="Confirm new password" type="password" value={conf} error={errors.conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
          <div className="flex justify-end"><Button loading={saving} icon={<Lock className="h-4 w-4" />} onClick={change}>Update password</Button></div>
        </div>
      </Card>
      <Card className="p-5 sm:p-7">
        <CardHeader title="Where you're signed in" subtitle="Sessions end automatically after 7 days of inactivity." />
        {sessionError ? <div className="mt-4"><ErrorState message={sessionError} onRetry={loadSessions} /></div>
          : !sessions ? <div className="mt-4 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          : (
            <ul className="mt-4 divide-y divide-line/60">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  {s.mobile ? <Smartphone className="h-5 w-5 text-muted" /> : <Laptop className="h-5 w-5 text-muted" />}
                  <div className="flex-1"><p className="font-semibold">{s.device}</p><p className="text-xs text-muted">{s.ip ?? 'Unknown network'} · {s.current ? 'Active now' : timeAgo(s.lastUsed)}</p></div>
                  {s.current && <Badge tone="pos">This device</Badge>}
                </li>
              ))}
            </ul>
          )}
        <Button variant="secondary" className="mt-3" disabled={!sessions || sessions.length < 2} onClick={signOutOthers}>Sign out of other devices</Button>
      </Card>
      <p className="text-center text-xs text-muted">Only you can see your transactions. Campus Coin never asks for bank or card details. Allowance baseline: {rs(profile.allowance)}.</p>
    </div>
  );
}
