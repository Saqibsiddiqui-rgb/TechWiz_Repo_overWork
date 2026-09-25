import type { ReactNode } from 'react';
import { ArrowRight, Bell, Bookmark, FileDown, Lock, Pin, Plus, Sparkles, Upload, Wallet } from 'lucide-react';
import { useContent, useStore } from '../../lib/store';
import { rs } from '../../lib/format';
import { Logo } from '../../components/Brand';
import { CategoryIcon } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Feedback';
import { navigate } from '../../lib/router';
import { scrollToElement } from '../../lib/smoothScroll';
import type { Category, IconKey, SiteContent } from '../../lib/types';

/*
 * Every piece of text and every example number on this page comes from the site_content table
 * (GET /content). Admins edit it in Admin → Site content. Category icons, colours and names come
 * from the categories table, and the tips from the tips table.
 */

/** Looks up a default category from the database; unknown ids fall back to a neutral style. */
function useCategoryLookup() {
  const cats = useStore().site?.categories ?? [];
  return (id: string): Pick<Category, 'name' | 'icon' | 'color'> =>
    cats.find((c) => c.id === id) ?? { name: id, icon: 'custom' as IconKey, color: '#9AA3B5' };
}

const stepIcons = { wallet: Wallet, upload: Upload, sparkles: Sparkles };
const scrollTo = (id: string) => { const el = document.getElementById(id); if (el) scrollToElement(el); };

export default function Landing() {
  const { role, site } = useStore();
  const catOf = useCategoryLookup();
  const nav = useContent('landing_nav');
  const hero = useContent('landing_hero');
  const why = useContent('landing_why');
  const showcase = useContent('landing_categories');
  const how = useContent('landing_how');
  const insight = useContent('landing_insight');
  const budgets = useContent('landing_budgets');
  const tipsSection = useContent('landing_tips');
  const mobile = useContent('landing_mobile');
  const cta = useContent('landing_cta');
  const tips = site?.tips ?? [];
  // While developing, say out loud which sections are missing instead of silently hiding them
  const sections = { landing_nav: nav, landing_hero: hero, landing_why: why, landing_categories: showcase, landing_how: how,
    landing_insight: insight, landing_budgets: budgets, landing_tips: tipsSection, landing_mobile: mobile, landing_cta: cta };
  const missing = Object.entries(sections).filter(([, v]) => !v).map(([k]) => k);
  if (tipsSection && tips.length === 0) missing.push('tips (none of landing_tips.tipIds are active in the tips table)');
  const start = () => navigate(role === 'student' ? '/app' : '/register');
  return (
    <div className="min-h-screen bg-canvas text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#/" aria-label="Campus Coin home"><Logo /></a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex" aria-label="Sections">
            {nav?.links.map((l) => (
              <a key={l.section} href={`#/?s=${l.section}`} onClick={(e) => { e.preventDefault(); scrollTo(l.section); }} className="hover:text-fg">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold hover:bg-fg/5 sm:block">{nav?.loginLabel ?? 'Log in'}</a>
            <Button size="sm" onClick={start}>{nav?.ctaLabel ?? 'Start Tracking'}</Button>
          </div>
        </div>
      </header>

      {import.meta.env.DEV && missing.length > 0 && (
        <div role="alert" className="mx-auto mt-4 max-w-6xl px-5">
          <div className="rounded-2xl border-2 border-dashed border-coral bg-coral/10 p-4 text-sm">
            <p className="font-bold">Missing website content (you only see this while developing)</p>
            <p className="mt-1 text-muted">Not found in the database: {missing.join(', ')}. Run setup.php?repair=1, or use Admin → Site content → Reset to default.</p>
          </div>
        </div>
      )}

      {/* Hero */}
      {hero && (
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div className="anim-page">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-mint" /> {hero.badge}
            </p>
            <h1 className="mt-6 text-[2.9rem] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-[4.2rem]">{hero.title}</h1>
            <p className="mt-6 max-w-lg text-lg text-muted">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={start} icon={<Plus className="h-5 w-5" />}>{hero.primaryCta}</Button>
              <Button size="lg" variant="secondary" onClick={() => scrollTo('how')}>{hero.secondaryCta}</Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted"><Lock className="h-4 w-4" /> {hero.note}</p>
          </div>
          <HeroPreview doodle={hero.doodle} />
        </section>
      )}

      {/* Why */}
      {why && (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
            <h2 className="text-3xl font-extrabold tracking-tight md:col-span-3">{why.title}</h2>
            {why.items.map((w) => <Why key={w.title} title={w.title} body={w.body} />)}
          </div>
        </section>
      )}

      {/* Categories */}
      {showcase && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight">{showcase.title}</h2>
          <p className="mt-3 max-w-xl text-muted">{showcase.subtitle}</p>
          <div className="no-scrollbar -mx-5 mt-8 flex gap-3 overflow-x-auto px-5 pb-2">
            {showcase.examples.map((e, i) => {
              const c = catOf(e.categoryId);
              return (
                <div key={`${e.name}-${i}`} className="flex min-w-[170px] flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-soft">
                  <CategoryIcon icon={c.icon} color={c.color} size="lg" />
                  <div><p className="font-bold">{e.name}</p><p className="text-xs text-muted">{c.name}</p></div>
                  <p className="money text-lg font-extrabold">− {rs(e.amount)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      {how && (
        <section id="how" className="bg-ink text-cream">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">{how.title}</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {how.steps.map((s, i) => {
                const Icon = stepIcons[s.icon] ?? Sparkles;
                return (
                  <li key={`${s.title}-${i}`} className="relative">
                    <span className="money text-6xl font-extrabold text-cream/15">{i + 1}</span>
                    <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-ink"><Icon className="h-5 w-5" /></span>
                    <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-cream/70">{s.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* Insights + budgets */}
      {(insight || budgets) && (
        <section id="insights" className="mx-auto grid max-w-6xl gap-6 px-5 py-20 lg:grid-cols-2">
          {insight && (
            <div className="ai-texture relative overflow-hidden rounded-[1.75rem] border border-lavender/50 bg-lavender-soft p-7 dark:bg-lavender/[.08] sm:p-9">
              <p className="flex items-center gap-2 text-sm font-bold text-ai"><Sparkles className="h-4 w-4" /> {insight.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{insight.title}</h2>
              <div className="mt-6 rounded-2xl bg-surface p-5 shadow-soft">
                <p className="font-bold">{insight.headline}</p>
                <p className="mt-3 text-sm text-muted">{insight.action}</p>
              </div>
              <p className="mt-4 text-xs text-muted">{insight.disclaimer}</p>
            </div>
          )}
          {budgets && (
            <div className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-soft sm:p-9">
              <p className="text-sm font-bold text-pos">{budgets.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{budgets.title}</h2>
              <div className="mt-6 space-y-5">
                {budgets.items.map((b, i) => {
                  const name = catOf(b.categoryId).name;
                  return (
                    <div key={`${b.categoryId}-${i}`}>
                      <div className="mb-1.5 flex justify-between text-sm"><b>{name}</b><span className="money text-muted"><b className="text-fg">{rs(b.spent)}</b> / {rs(b.limit)}</span></div>
                      <ProgressBar value={b.spent} max={b.limit} label={`${name} budget`} />
                    </div>
                  );
                })}
              </div>
              {budgets.alert && <p className="mt-5 flex items-center gap-2 rounded-2xl bg-coral/15 px-4 py-3 text-sm"><Bell className="h-4 w-4 text-neg" /> {budgets.alert}</p>}
            </div>
          )}
        </section>
      )}

      {/* Tips (from the tips table) */}
      {tipsSection && tips.length > 0 && (
        <section id="tips" className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="text-3xl font-extrabold tracking-tight">{tipsSection.title}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {tips.map((t) => (
              <article key={t.id} className="rounded-card border border-line bg-surface p-5">
                <span aria-hidden>💡</span>
                <h3 className="mt-2 font-bold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.body}</p>
                <p className="mt-4 flex items-center justify-between text-xs font-bold">
                  {t.impact > 0 ? <span className="text-pos">~{rs(t.impact)}/month</span> : <span />}
                  <span className="flex gap-2 text-muted"><Pin className="h-4 w-4" /><Bookmark className="h-4 w-4" /></span>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Mobile preview */}
      {mobile && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">{mobile.title}</h2>
              <p className="mt-3 max-w-md text-muted">{mobile.body}</p>
              <ul className="mt-6 space-y-2 text-sm font-semibold">
                {mobile.bullets.map((b, i) => (
                  <li key={`${b}-${i}`} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint" /> {b}
                    {/pdf|export/i.test(b) && <FileDown className="h-4 w-4 text-muted" />}
                  </li>
                ))}
              </ul>
            </div>
            <PhonePreview phone={mobile.phone} />
          </div>
        </section>
      )}

      {/* Final CTA */}
      {cta && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-14 text-cream sm:px-14">
            <svg className="absolute -right-12 -top-12 h-64 w-64 opacity-60" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="40" fill="none" stroke="#72E6B0" strokeWidth="8" /><circle cx="50" cy="50" r="26" fill="none" stroke="#A99BFF" strokeWidth="2" strokeDasharray="3 5" /></svg>
            <h2 className="relative max-w-xl text-4xl font-extrabold leading-tight tracking-tight">{cta.title}</h2>
            <p className="relative mt-3 max-w-md text-cream/70">{cta.body}</p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="mint" onClick={start}>{cta.primaryCta} <ArrowRight className="h-5 w-5" /></Button>
              <a href="#/login" className="inline-flex h-12 items-center rounded-2xl px-6 font-semibold text-cream hover:bg-cream/10">{cta.secondaryCta}</a>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function Why({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t-2 border-fg pt-5">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-muted">{body}</p>
    </div>
  );
}

/** Picture of the dashboard next to the hero text. Numbers come from landing_hero_preview. */
function HeroPreview({ doodle }: { doodle: string }) {
  const p = useContent('landing_hero_preview');
  const catOf = useCategoryLookup();
  if (!p) return null;
  const top = catOf(p.topCategory.categoryId);
  return (
    <div className="relative mx-auto w-full max-w-[560px]" aria-label="Preview of the Campus Coin dashboard" role="img">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-mint/30 via-transparent to-lavender/30 blur-2xl" aria-hidden />
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 rounded-card bg-ink p-5 text-cream shadow-lift">
          <p className="text-xs font-semibold text-cream/60">{p.balanceLabel}</p>
          <p className="money mt-2 text-[2.1rem] font-extrabold leading-none"><span className="mr-1 text-base opacity-60">Rs.</span>{p.balance.toLocaleString('en-US')}</p>
          <div className="mt-4 flex gap-4 text-xs"><span className="text-mint">+ {rs(p.income)} {p.inLabel}</span><span className="text-coral">− {rs(p.expenses)} {p.outLabel}</span></div>
          <div className="mt-5 flex h-16 items-end gap-1.5">
            {p.bars.map((h, i) => <span key={i} className="anim-grow-y flex-1 rounded-t-md bg-mint/80" style={{ height: `${Math.max(0, Math.min(100, h))}%`, animationDelay: `${i * 35}ms` }} />)}
          </div>
        </div>
        <div className="col-span-2 flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="text-xs font-semibold text-muted">{p.topCategoryLabel}</p>
          <div className="flex items-center gap-2"><CategoryIcon icon={top.icon} color={top.color} /><b className="text-lg">{top.name}</b></div>
          <p className="money text-2xl font-extrabold">{rs(p.topCategory.amount)}</p>
        </div>
        <div className="col-span-2 rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="mb-3 text-xs font-semibold text-muted">{p.budgetLabel}</p>
          <div className="space-y-3 text-xs">
            {p.budgets.map((b, i) => (
              <div key={`${b.categoryId}-${i}`}>
                <div className="mb-1 flex justify-between"><b>{catOf(b.categoryId).name}</b><span className={b.percent > 100 ? 'text-neg' : undefined}>{b.percent}%</span></div>
                <ProgressBar value={b.percent} max={100} size="sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-3 rounded-card border border-lavender/50 bg-lavender-soft p-4 shadow-soft dark:bg-[#231f3d]">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ai"><Sparkles className="h-3.5 w-3.5" /> {p.insightLabel}</p>
          <p className="mt-2 text-sm font-bold leading-snug">{p.insightTitle}</p>
          <p className="mt-1 text-xs text-muted">{p.insightAction}</p>
        </div>
      </div>
      {/* hand-drawn note */}
      {doodle && (
        <div className="pointer-events-none absolute -bottom-12 left-2 hidden items-center gap-1 sm:flex" aria-hidden>
          <svg width="46" height="40" viewBox="0 0 46 40" className="text-fg"><path d="M4 36C10 20 22 10 40 6M40 6l-9-1M40 6l-3 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="-mb-6 rotate-[-4deg] text-sm font-semibold italic text-muted">{doodle}</span>
        </div>
      )}
    </div>
  );
}

type Phone = SiteContent['landing_mobile']['phone'];

function PhonePreview({ phone }: { phone: Phone }) {
  const catOf = useCategoryLookup();
  return (
    <div className="mx-auto w-[270px] rounded-[2.6rem] border-[10px] border-ink bg-canvas p-3 shadow-lift" role="img" aria-label="Campus Coin on a phone">
      <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-ink" />
      <div className="rounded-3xl bg-ink p-4 text-cream">
        <p className="text-[0.65rem] text-cream/60">{phone.balanceLabel}</p>
        <p className="money text-2xl font-extrabold">{rs(phone.balance)}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem] font-bold">
        <span className="rounded-xl bg-coral py-2 text-center text-ink">− {phone.expenseLabel}</span>
        <span className="rounded-xl bg-mint py-2 text-center text-ink">+ {phone.incomeLabel}</span>
      </div>
      <div className="mt-3 space-y-2 rounded-2xl bg-surface p-3">
        <div className="flex justify-between text-[0.7rem]"><b>{catOf(phone.budget.categoryId).name}</b><span>{phone.budget.percent}%</span></div>
        <ProgressBar value={phone.budget.percent} max={100} size="sm" />
      </div>
      {phone.rows.map((r, i) => {
        const c = catOf(r.categoryId);
        return <PreviewRow key={`${r.name}-${i}`} icon={c.icon} color={c.color} name={r.name} amount={r.amount} />;
      })}
      <div className="mt-3 flex items-center justify-around rounded-2xl bg-surface py-2">
        <span className="h-1.5 w-6 rounded-full bg-line" /><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-mint"><Plus className="h-5 w-5" /></span><span className="h-1.5 w-6 rounded-full bg-line" />
      </div>
    </div>
  );
}
function PreviewRow({ icon, color, name, amount }: { icon: IconKey; color: string; name: string; amount: number }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-2xl bg-surface p-2">
      <CategoryIcon icon={icon} color={color} size="sm" />
      <span className="flex-1 text-[0.72rem] font-bold">{name}</span>
      <span className="money text-[0.72rem] font-bold">− {rs(amount)}</span>
    </div>
  );
}

/** Sitemap in the footer (SRS requirement). Text and links come from the site_footer section. */
export function SiteFooter() {
  const footer = useContent('site_footer');
  const col = (title: string, links: { label: string; href: string }[]): ReactNode => (
    <div key={title}>
      <p className="text-sm font-bold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted">{links.map((l) => <li key={l.href + l.label}><a href={`#${l.href}`} className="hover:text-fg">{l.label}</a></li>)}</ul>
    </div>
  );
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          {footer && <p className="mt-3 max-w-xs text-sm text-muted">{footer.tagline}</p>}
        </div>
        {footer?.columns.map((c) => col(c.title, c.links))}
      </div>
      {footer?.legal && <p className="border-t border-line px-5 py-5 text-center text-xs text-muted">{footer.legal}</p>}
    </footer>
  );
}
