import { useState } from 'react';
import { useStore } from '../../lib/store';
import { navigate } from '../../lib/router';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, Tabs } from '../../components/ui/Feedback';
import { InsightCard, TipCard } from '../../components/Finance';

export default function Bookmarks() {
  const { bookmarks, tips, insights } = useStore();
  const [tab, setTab] = useState<'tips' | 'insights'>('tips');
  const savedTips = tips.filter((t) => bookmarks.tips.includes(t.id));
  const savedInsights = insights.filter((i) => bookmarks.insights.includes(i.id));
  return (
    <div className="space-y-6">
      <PageHeader title="Bookmarks" subtitle="Tips and insights you saved for later." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'tips', label: 'Saved Tips', count: savedTips.length }, { value: 'insights', label: 'Saved Insights', count: savedInsights.length }]} />
      <div role="tabpanel" className="anim-fade">
        {tab === 'tips' ? (savedTips.length ? <div className="grid gap-4 lg:grid-cols-2">{savedTips.map((t) => <TipCard key={t.id} tip={t} />)}</div>
          : <Card><EmptyState art="bookmark" title="No saved tips yet" body="Tap Bookmark on any tip and it will wait for you here." action={<Button variant="secondary" onClick={() => navigate('/app/tips')}>Browse tips</Button>} /></Card>)
          : (savedInsights.length ? <div className="grid gap-5 md:grid-cols-2">{savedInsights.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
          : <Card><EmptyState art="bookmark" title="No saved insights yet" body="Bookmark a monthly insight to compare months later." action={<Button variant="secondary" onClick={() => navigate('/app/insights')}>See insights</Button>} /></Card>)}
      </div>
    </div>
  );
}
