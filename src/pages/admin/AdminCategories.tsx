import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, TxType } from '../../lib/types';
import { cx } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useApi } from '../../lib/useApi';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, EmptyState, Modal } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../components/Brand';
import { CategoryModal } from '../app/Categories';

export default function AdminCategories() {
  const { categories, keywords, deleteCategory, toast } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);
  // Usage numbers come from all students' transactions; the category list itself lives in the store
  const { data: stats } = useApi<{ usage: Record<string, number>; customCount: number }>('/admin/categories');
  const share = (id: string) => stats?.usage[id];
  const customCount = stats?.customCount ?? 0;

  const group = (type: TxType) => {
    const list = categories.filter((c) => c.type === type && c.isDefault);
    return (
      <Card className="p-5 sm:p-6">
        <CardHeader
          title={<span className="flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full', type === 'income' ? 'bg-mint' : 'bg-coral')} />{type === 'income' ? 'Default income categories' : 'Default expense categories'}</span>}
          subtitle={`${list.length} shown to every student`}
          action={<Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />}
            onClick={() => setEditing({ id: '', name: '', type, icon: 'custom', color: type === 'income' ? '#72E6B0' : '#FF8B73', isDefault: true })}>Add default</Button>} />
        {list.length === 0 ? (
          <div className="mt-4"><EmptyState title="No defaults here" body="Students will only see categories they create themselves. Add one to give everyone a head start." /></div>
        ) : (
          <ul className="mt-4 divide-y divide-line/60">
            {list.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <CategoryIcon icon={c.icon} color={c.color} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{share(c.id) !== undefined ? `${share(c.id)}% of expense entries (90 days)` : type === 'income' ? 'Income source' : 'Not used recently'}
                    {' \u00b7 '}{(keywords[c.id]?.length ?? 0)} AI keywords</p>
                </div>
                <button onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirm(c)} aria-label={`Remove ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Default categories" subtitle="These appear for every student on sign-up. Students can still add personal ones on top." />
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line p-4 text-sm">
        <Badge tone="ai">Heads up</Badge>
        <span className="text-muted">Edits apply to everyone instantly. There {customCount === 1 ? 'is' : 'are'} also {customCount} student-created {customCount === 1 ? 'category' : 'categories'} you don&rsquo;t manage here.</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {group('expense')}
        {group('income')}
      </div>
      <CategoryModal category={editing} onClose={() => setEditing(null)} admin />
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Remove \u201c${confirm?.name}\u201d for everyone?`}
        subtitle="Existing transactions keep their history, but students won't be able to pick this category for new entries."
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) { deleteCategory(confirm.id); toast(`\u201c${confirm.name}\u201d removed from defaults.`, 'info'); } setConfirm(null); }}>Remove default</Button></>}>
        <p className="text-sm text-muted">Tip: if a category is just badly named, editing it is kinder than removing it.</p>
      </Modal>
    </div>
  );
}
