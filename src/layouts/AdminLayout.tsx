import type { ReactNode } from 'react';
import { ChartNoAxesCombined, ChevronRight, FileText, LayoutDashboard, LogOut, Megaphone, Moon, Shapes, ShieldCheck, Sun, Users } from 'lucide-react';
import { cx } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { Logo, LogoMark } from '../components/Brand';
import { Avatar, Dropdown } from './StudentLayout';

export const adminNav = [
  { to: '/admin', label: 'Overview', short: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', short: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', short: 'Categories', icon: Shapes },
  { to: '/admin/tips', label: 'Tips & Announcements', short: 'Tips', icon: Megaphone },
  { to: '/admin/stats', label: 'Statistics', short: 'Stats', icon: ChartNoAxesCombined },
  { to: '/admin/content', label: 'Site content', short: 'Content', icon: FileText },
];

export function AdminLayout({ path, children }: { path: string; children: ReactNode }) {
  const route = path.split('?')[0];
  const current = adminNav.find((n) => n.to === route) ?? adminNav[0];

  return (
    <>
      <div className="min-h-screen bg-canvas" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Sidebar: same Ink base as the student app, with a lavender "staff" rail so it never feels like the same space */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col bg-nav px-4 py-5 md:flex lg:w-[256px]" aria-label="Admin navigation">
          <a href="#/admin" aria-label="Campus Coin admin home" className="flex items-center justify-center lg:justify-start lg:px-1">
            <span className="lg:hidden"><LogoMark size={36} /></span>
            <span className="hidden lg:block"><Logo light /></span>
          </a>
          <p className="mt-4 hidden items-center gap-1.5 self-start rounded-full bg-lavender/20 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-lavender lg:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin console
          </p>
          <nav className="mt-6 flex-1 space-y-1">
            {adminNav.map((n) => {
              const active = route === n.to;
              return (
                <a key={n.to} href={`#${n.to}`} aria-current={active ? 'page' : undefined} title={n.label}
                  className={cx('relative flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-[0.92rem] font-semibold transition-colors lg:justify-start',
                    active ? 'bg-cream/[.08] text-cream' : 'text-cream/60 hover:bg-cream/[.05] hover:text-cream')}>
                  {active && <span className="absolute -left-4 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-lavender" aria-hidden />}
                  <n.icon className={cx('h-5 w-5 shrink-0', active && 'text-lavender')} />
                  <span className="hidden flex-1 truncate lg:block">{n.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="hidden rounded-2xl bg-cream/[.06] p-4 text-xs text-cream/60 lg:block">
            <p className="font-bold text-cream">You&rsquo;re in the staff area</p>
            <p className="mt-1">Changes to defaults and announcements reach every student.</p>
          </div>
        </aside>

        <div className="md:pl-[84px] lg:pl-[256px]">
          <AdminTopbar title={current.label} isHome={route === '/admin'} />
          <main key={route} className="anim-page mx-auto max-w-[1280px] px-4 pb-28 pt-2 sm:px-6 md:pb-12 lg:px-8">{children}</main>
        </div>

        {/* Mobile: compact tab bar */}
        <nav aria-label="Admin mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mx-auto grid h-16 max-w-md grid-cols-6 items-center">
            {adminNav.map((n) => (
              <a key={n.to} href={`#${n.to}`} aria-current={route === n.to ? 'page' : undefined}
                className={cx('flex flex-col items-center gap-0.5 text-[0.66rem] font-semibold', route === n.to ? 'text-fg' : 'text-muted')}>
                <n.icon className={cx('h-5 w-5', route === n.to && 'text-ai')} />{n.short}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

function AdminTopbar({ title, isHome }: { title: string; isHome: boolean }) {
  const { settings, updateSettings, logout, profile } = useStore();
  return (
    <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="md:hidden"><LogoMark size={32} /></span>
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm md:flex">
          <a href="#/admin" className="font-medium text-muted hover:text-fg">Admin</a>
          {!isHome && <><ChevronRight className="h-4 w-4 text-muted" /><span className="font-semibold">{title}</span></>}
        </nav>
        <span className="text-base font-bold md:hidden">{title}</span>
        <span className="ml-1 hidden rounded-full bg-lavender/20 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-ai sm:inline md:hidden">Admin</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => updateSettings({ dark: !settings.dark })} aria-label={settings.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-xl p-2.5 text-muted hover:bg-fg/5 hover:text-fg">
            {settings.dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Dropdown label="Admin account menu" trigger={<Avatar name={profile.name || 'Admin'} size={34} />}>
            <div className="border-b border-line px-3 pb-3 pt-1">
              <p className="font-bold">{profile.name}</p>
              <p className="text-xs text-muted">{profile.email}</p>
            </div>
            <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-fg/[.04]">
              <LogOut className="h-4 w-4 text-muted" /> Sign out
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
