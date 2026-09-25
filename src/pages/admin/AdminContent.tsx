import { useEffect, useState } from 'react';
import { ExternalLink, RotateCcw, Save, Wand2 } from 'lucide-react';
import type { ContentSection } from '../../lib/types';
import { cx, timeAgo } from '../../lib/format';
import { api, errorMessage, fieldErrors } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useApi } from '../../lib/useApi';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, ErrorState, Modal } from '../../components/ui/Feedback';
import { Loadable } from './AdminShared';

/**
 * Admin → Site content. Every section of the website text (site_content table) is edited here as JSON.
 * The server checks that the structure matches the default, so a typo can't break the website.
 */
export default function AdminContent() {
  const { data, setData, loading, error, reload } = useApi<{ sections: ContentSection[] }>('/admin/content');
  const sections = data?.sections ?? [];
  const [selected, setSelected] = useState('');
  const current = sections.find((s) => s.key === selected) ?? sections[0];

  const replace = (s: ContentSection) => setData((d) => ({ sections: (d?.sections ?? []).map((x) => (x.key === s.key ? s : x)) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Site content" subtitle="Text on the home page, login pages, footer and form options. Changes go live for everyone as soon as you save."
        actions={<a href="#/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-fg/5"><ExternalLink className="h-4 w-4" /> View home page</a>} />
      <Loadable loading={loading} error={error} onRetry={reload}>
        {sections.length === 0 ? (
          <ErrorState message="No content sections found. Run setup.php to create them." onRetry={reload} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="p-2">
              <ul aria-label="Content sections">
                {sections.map((s) => (
                  <li key={s.key}>
                    <button onClick={() => setSelected(s.key)} aria-current={current?.key === s.key ? 'true' : undefined}
                      className={cx('w-full rounded-xl px-3 py-2.5 text-left text-sm', current?.key === s.key ? 'bg-fg/[.07] font-bold' : 'text-muted hover:bg-fg/5 hover:text-fg')}>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            {current && <SectionEditor key={current.key} section={current} onSaved={replace} />}
          </div>
        )}
      </Loadable>
    </div>
  );
}

function SectionEditor({ section, onSaved }: { section: ContentSection; onSaved: (s: ContentSection) => void }) {
  const { toast, reloadContent } = useStore();
  const pretty = (v: unknown) => JSON.stringify(v, null, 2);
  const [text, setText] = useState(pretty(section.content));
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = text !== pretty(section.content);

  useEffect(() => { setText(pretty(section.content)); setProblem(''); }, [section.content]);

  /** Checks the JSON in the browser first, so typos are caught before sending */
  const parse = (): unknown | undefined => {
    try {
      return JSON.parse(text);
    } catch (e) {
      setProblem(`This isn\u2019t valid JSON yet: ${(e as Error).message}. Check commas, quotes and brackets.`);
      return undefined;
    }
  };

  const save = async () => {
    const content = parse();
    if (content === undefined) return;
    setSaving(true); setProblem('');
    try {
      const r = await api<{ section: ContentSection }>(`/admin/content/${section.key}`, 'PUT', { content });
      onSaved(r.section);
      await reloadContent();
      toast(`\u201c${section.title}\u201d saved. It\u2019s live now.`);
    } catch (e) {
      setProblem(fieldErrors(e).content ?? errorMessage(e));
    }
    setSaving(false);
  };

  const reset = async () => {
    setConfirmReset(false);
    setSaving(true); setProblem('');
    try {
      const r = await api<{ section: ContentSection }>(`/admin/content/${section.key}/reset`, 'POST');
      onSaved(r.section);
      await reloadContent();
      toast('Back to the original text.', 'info');
    } catch (e) {
      setProblem(errorMessage(e));
    }
    setSaving(false);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{section.title}</h2>
          <p className="mt-1 text-sm text-muted">{section.description}</p>
        </div>
        <Badge tone="neutral">{section.key}</Badge>
      </div>
      <p className="mt-3 text-xs text-muted">
        Last saved {timeAgo(section.updatedAt)}{section.updatedBy ? ` by ${section.updatedBy}` : ''}.
        Change only the text or numbers. Keep every name before a colon, and keep the same brackets.
      </p>
      <label htmlFor="content-json" className="sr-only">Content JSON</label>
      <textarea id="content-json" data-lenis-prevent value={text} spellCheck={false} onChange={(e) => { setText(e.target.value); setProblem(''); }}
        className="mt-4 h-[420px] w-full resize-y rounded-2xl border border-line bg-raised p-4 font-mono text-[0.8rem] leading-relaxed text-fg focus:outline-none focus:ring-4 focus:ring-lavender/25" />
      {problem && <div className="mt-3"><ErrorState message={problem} /></div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" icon={<Wand2 className="h-4 w-4" />} onClick={() => { const v = parse(); if (v !== undefined) setText(pretty(v)); }}>Tidy JSON</Button>
          {section.hasDefault && <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>Reset to default</Button>}
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-sm text-muted">Unsaved changes</span>}
          {dirty && <Button variant="ghost" onClick={() => { setText(pretty(section.content)); setProblem(''); }}>Undo</Button>}
          <Button disabled={!dirty} loading={saving} icon={<Save className="h-4 w-4" />} onClick={save}>Save</Button>
        </div>
      </div>
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Go back to the original text?"
        subtitle="This replaces the saved text of this section with the default from setup."
        footer={<><Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button><Button variant="danger" onClick={reset}>Reset section</Button></>}>
        <p className="text-sm text-muted">Other sections are not changed.</p>
      </Modal>
    </Card>
  );
}
