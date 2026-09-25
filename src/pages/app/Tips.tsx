import { RotateCcw } from 'lucide-react';
import { rs } from '../../lib/format';
import { useStore } from '../../lib/store';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { TipCard } from '../../components/Finance';

export default function Tips() {
  const { tips, restoreTips } = useStore();
  const active = tips.filter((t) => !t.dismissed).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.impact - a.impact);
  const potential = active.reduce((s, t) => s + t.impact, 0);
  const dismissed = tips.length - active.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Saving Tips" subtitle="Built from your own spending, compared with your usual months and your budgets. Biggest potential savings first." />
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-ink p-5 text-cream dark:bg-raised sm:p-6">
        <div>
          <p className="text-sm text-cream/70 dark:text-muted">If you tried every tip below</p>
          <p className="money mt-1 text-3xl font-extrabold text-mint">~{rs(potential)} a month</p>
        </div>
        <p className="max-w-sm text-sm text-cream/70 dark:text-muted">Estimates, not promises. Pin the ones that fit your life and dismiss the rest.</p>
      </Card>
      {active.length ? (
        <div className="grid gap-4 lg:grid-cols-2">{active.map((t) => <TipCard key={t.id} tip={t} />)}</div>
      ) : (
        <Card><EmptyState title="You're all caught up" body="New tips show up when your spending changes. Check back after a few more transactions." /></Card>
      )}
      {dismissed > 0 && (
        <div className="text-center"><Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={restoreTips}>Show {dismissed} dismissed {dismissed === 1 ? 'tip' : 'tips'}</Button></div>
      )}
    </div>
  );
}
