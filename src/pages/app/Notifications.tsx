import { useState } from 'react';
import { Bell, CircleCheck, Lightbulb, Megaphone, Sparkles, Target, TriangleAlert, Upload, X } from 'lucide-react';
import type { NotificationKind } from '../../lib/types';
import { cx, timeAgo } from '../../lib/format';
import { useStore } from '../../lib/store';
import { navigate } from '../../lib/router';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, Tabs } from '../../components/ui/Feedback';

const meta: Record<NotificationKind, { icon: typeof Bell; tone: string; label: string }> = {
  'budget-near': { icon: Target, tone: 'bg-[#F2C14E]/25 text-warn', label: 'Budget' },
  'budget-over': { icon: TriangleAlert, tone: 'bg-coral/20 text-neg', label: 'Budget' },
  tip: { icon: Lightbulb, tone: 'bg-mint/20 text-pos', label: 'Tip' },
  insight: { icon: Sparkles, tone: 'bg-lavender/20 text-ai', label: 'Insight' },
  import: { icon: Upload, tone: 'bg-fg/[.06] text-fg', label: 'Import' },
  announcement: { icon: Megaphone, tone: 'bg-lavender/20 text-ai', label: 'Announcement' },
};

export default function Notifications() {
  const { notifications, markRead, markAllRead, clearNotification } = useStore();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const list = tab === 'all' ? notifications : notifications.filter((n) => !n.read);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Notifications" subtitle="Budget alerts, new tips, monthly insights and news from the Campus Coin team."
        actions={unread > 0 && <Button variant="secondary" icon={<CircleCheck className="h-4 w-4" />} onClick={markAllRead}>Mark all as read</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: notifications.length }, { value: 'unread', label: 'Unread', count: unread }]} />
      <Card className="overflow-hidden">
        {list.length ? (
          <ul className="divide-y divide-line/60">
            {list.map((n) => {
              const m = meta[n.kind];
              return (
                <li key={n.id} className={cx('group flex gap-4 p-4 sm:p-5', !n.read && 'bg-lavender/[.05]')}>
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', m.tone)}><m.icon className="h-5 w-5" /></span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}>
                    <p className="flex items-center gap-2 font-bold leading-snug">{!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-coral" aria-label="Unread" />}{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                    <p className="mt-1.5 text-xs font-medium text-muted">{m.label} · {timeAgo(n.time)}</p>
                  </button>
                  <button onClick={() => clearNotification(n.id)} aria-label="Clear notification" className="self-start rounded-lg p-2 text-muted opacity-100 hover:bg-fg/5 hover:text-fg md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"><X className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState art="bell" title={tab === 'unread' ? 'You\u2019re all caught up' : 'No notifications yet'} body="We'll let you know when a budget gets close, or when a new tip or insight is ready." />}
      </Card>
    </div>
  );
}
