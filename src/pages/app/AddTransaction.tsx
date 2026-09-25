import type { TxType } from '../../lib/types';
import { navigate } from '../../lib/router';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { TransactionForm } from '../../components/TransactionForm';
import { AiNote } from '../../components/Finance';

/** Full-page version of the quick-add form (also available as a modal from anywhere). */
export default function AddTransaction({ type }: { type: TxType }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={type === 'expense' ? 'Add Expense' : 'Add Income'}
        subtitle={type === 'expense' ? 'Type what you bought and we\u2019ll suggest a category. You can always change it.' : 'Allowance, tutoring, a scholarship or Eidi. Log it and watch your balance update.'} />
      <Card className="p-5 sm:p-7">
        <TransactionForm key={type} initialType={type} onDone={() => navigate('/app/transactions')} />
      </Card>
      <AiNote className="justify-center" />
    </div>
  );
}
