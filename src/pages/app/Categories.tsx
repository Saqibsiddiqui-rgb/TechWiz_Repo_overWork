import { useState } from 'react';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, IconKey, TxType } from '../../lib/types';
import { cx, uid } from '../../lib/format';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useContent, useStore } from '../../lib/store';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Segmented, Textarea } from '../../components/ui/Field';
import { Badge, Modal } from '../../components/ui/Feedback';
import { CategoryIcon, iconOptions } from '../../components/Brand';

export default function Categories() {
  const { categories, transactions, deleteCategory, toast } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);
  const usage = (id: string) => transactions.filter((t) => t.categoryId === id).length;

  const Group = ({ type }: { type: TxType }) => {
    const list = categories.filter((c) => c.type === type);
    return (
      <Card className="p-5 sm:p-6">
        <CardHeader
          title={<span className="flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full', type === 'income' ? 'bg-mint' : 'bg-coral')} />{type === 'income' ? 'Income categories' : 'Expense categories'}</span>}
          subtitle={type === 'income' ? 'Where your money comes from' : 'Where your money goes'}
          action={<Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />}
            onClick={() => setEditing({ id: '', name: '', type, icon: 'custom', color: type === 'income' ? '#72E6B0' : '#FF8B73', isDefault: false })}>Add</Button>} />
        <ul className="mt-4 divide-y divide-line/60">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <CategoryIcon icon={c.icon} color={c.color} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{usage(c.id)} transactions</p>
              </div>
              {c.isDefault ? <Badge><Lock className="h-3 w-3" /> Default</Badge> : <Badge tone="ai">Yours</Badge>}
              {!c.isDefault && (<>
                <button onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirm(c)} aria-label={`Delete ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-coral/15 hover:text-neg"><Trash2 className="h-4 w-4" /></button>
              </>)}
            </li>
          ))}
        </ul>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" subtitle="Defaults cover most student life. Add your own for anything else, like Gym or Tuition Centre." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Group type="expense" />
        <Group type="income" />
      </div>
      <CategoryModal category={editing} onClose={() => setEditing(null)} />
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Delete \u201c${confirm?.name}\u201d?`}
        subtitle={confirm && usage(confirm.id) ? `${usage(confirm.id)} transactions use it. They\u2019ll stay in your history as \u201cUncategorized\u201d.` : 'No transactions use this category.'}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (confirm) { deleteCategory(confirm.id); toast(`\u201c${confirm.name}\u201d deleted.`, 'info'); } setConfirm(null); }}>Delete category</Button></>}>
        <p className="text-sm text-muted">Any budget linked to this category will be removed too.</p>
      </Modal>
    </div>
  );
}

export function CategoryModal({ category, onClose, admin }: { category: Category | null; onClose: () => void; admin?: boolean }) {
  return (
    <Modal open={!!category} onClose={onClose} title={category?.id ? 'Edit category' : admin ? 'New default category' : 'New category'}
      subtitle={admin ? 'Default categories appear for every student.' : 'Only you will see this category.'}>
      {category && <CategoryEditor key={category.id || 'new'} initial={category} onClose={onClose} admin={admin} />}
    </Modal>
  );
}

function CategoryEditor({ initial, onClose, admin }: { initial: Category; onClose: () => void; admin?: boolean }) {
  const { categories, keywords, saveCategory, toast } = useStore();
  const [d, setD] = useState<Category>(initial);
  const [error, setError] = useState('');
  // Colour choices come from Admin → Site content (category_colors); keep the current colour selectable too
  const palette = useContent('category_colors')?.options ?? [];
  const swatches = palette.includes(d.color) ? palette : [...palette, d.color];
  // Admins also edit the words the AI suggester looks for (category_keywords table)
  const [words, setWords] = useState((keywords[initial.id] ?? []).join(', '));

  const [saving, setSaving] = useState(false);
  const save = async () => {
    const name = d.name.trim();
    if (!name) return setError('Give your category a name.');
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.type === d.type && c.id !== d.id)) return setError('You already have a category with that name.');
    setSaving(true);
    try {
      await saveCategory({ ...d, name, id: d.id || uid(), isDefault: admin ? true : d.isDefault }, admin ? words.split(',').map((w) => w.trim()).filter(Boolean) : undefined);
      toast(d.id ? 'Category updated.' : `Nice! \u201c${name}\u201d is ready to use.`);
      onClose();
    } catch (e) {
      setError(fieldErrors(e).name ?? errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-raised p-3">
        <CategoryIcon icon={d.icon} color={d.color} size="lg" />
        <span className="font-bold">{d.name || 'Your category'}</span>
      </div>
      <Input label="Name" value={d.name} maxLength={24} placeholder="e.g. Gym, Tuition centre" error={error}
        onChange={(e) => { setD({ ...d, name: e.target.value }); setError(''); }} />
      {!d.id && <Segmented label="Category type" value={d.type} onChange={(v) => setD({ ...d, type: v })} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Icon</legend>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((k: IconKey) => (
            <button key={k} type="button" aria-label={k} aria-pressed={d.icon === k} onClick={() => setD({ ...d, icon: k })}
              className={cx('rounded-xl p-0.5 ring-2', d.icon === k ? 'ring-fg' : 'ring-transparent')}>
              <CategoryIcon icon={k} color={d.color} size="sm" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {swatches.map((c) => (
            <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={d.color === c} onClick={() => setD({ ...d, color: c })}
              className={cx('h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface', d.color === c ? 'ring-fg' : 'ring-transparent')} style={{ background: c }} />
          ))}
        </div>
      </fieldset>
      {admin && (
        <Textarea label="AI keywords" rows={3} value={words} onChange={(e) => setWords(e.target.value)}
          hint="Comma-separated. When a description contains one of these words, the AI suggests this category." />
      )}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={save}>{d.id ? 'Save changes' : 'Create category'}</Button>
      </div>
    </div>
  );
}
