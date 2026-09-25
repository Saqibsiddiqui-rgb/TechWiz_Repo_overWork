import { useEffect, useState, type ReactNode } from 'react';
import { useRoute, navigate } from './lib/router';
import { useStore } from './lib/store';
import { initSmoothScroll } from './lib/smoothScroll';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';
import Landing from './pages/public/Landing';
import { ForgotPassword, Login, Register, ResetPassword } from './pages/public/Auth';
import { LogoMark } from './components/Brand';
import { ErrorState } from './components/ui/Feedback';
import Dashboard from './pages/app/Dashboard';
import Transactions from './pages/app/Transactions';
import AddTransaction from './pages/app/AddTransaction';
import Categories from './pages/app/Categories';
import Budgets from './pages/app/Budgets';
import Reports from './pages/app/Reports';
import Insights from './pages/app/Insights';
import Tips from './pages/app/Tips';
import Bookmarks from './pages/app/Bookmarks';
import Notifications from './pages/app/Notifications';
import Settings from './pages/app/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTips from './pages/admin/AdminTips';
import AdminStats from './pages/admin/AdminStats';
import AdminContent from './pages/admin/AdminContent';

const titles: Record<string, string> = {
  '/': 'Know where your money goes', '/login': 'Log in', '/register': 'Create account', '/forgot-password': 'Forgot password', '/reset-password': 'Set a new password',
  '/admin/login': 'Admin sign in', '/app': 'Overview', '/app/transactions': 'Transactions', '/app/budgets': 'Budgets',
  '/app/reports': 'Reports', '/app/insights': 'AI Insights', '/app/tips': 'Saving Tips', '/app/bookmarks': 'Bookmarks',
  '/app/categories': 'Categories', '/app/notifications': 'Notifications', '/app/settings': 'Settings', '/app/profile': 'Profile',
  '/app/add-expense': 'Add expense', '/app/add-income': 'Add income', '/admin': 'Admin overview', '/admin/users': 'Users',
  '/admin/categories': 'Default categories', '/admin/tips': 'Tips & announcements', '/admin/stats': 'System statistics', '/admin/content': 'Site content',
};

/** Only the right role reaches each area; everyone else is sent to the matching login. */
function Guard({ ok, to, children }: { ok: boolean; to: string; children: ReactNode }) {
  useEffect(() => { if (!ok) navigate(to); }, [ok, to]);
  return ok ? <>{children}</> : null;
}

/** Visible warning (debug mode only) when the database is missing accounts or default data. */
function SetupNotice() {
  const { site } = useStore();
  const [hidden, setHidden] = useState(false);
  const install = site?.install;
  if (!install || install.ok || hidden) return null;
  const noUsers = (install.counts.users ?? 0) === 0;
  const link = noUsers ? install.setupUrl : `${install.setupUrl}?repair=1`;
  return (
    <div role="alert" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-2xl border-2 border-coral bg-surface p-4 text-sm shadow-lift">
      <p className="font-bold">Database setup isn’t complete</p>
      <ul className="mt-1 list-disc pl-5 text-muted">{install.problems.map((p) => <li key={p}>{p}</li>)}</ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a href={link} target="_blank" rel="noreferrer" className="rounded-xl bg-ink px-4 py-2 font-semibold text-cream dark:bg-mint dark:text-ink">
          {noUsers ? 'Open setup.php' : 'Open setup.php?repair=1'}
        </a>
        <button onClick={() => window.location.reload()} className="font-semibold underline-offset-4 hover:underline">I ran it, reload</button>
        <button onClick={() => setHidden(true)} className="ml-auto text-muted hover:text-fg">Hide</button>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => initSmoothScroll(), []); // Lenis smooth scrolling for the whole app
  return <><AppRoutes /><SetupNotice /></>;
}

function AppRoutes() {
  const path = useRoute();
  const { role, status, bootError, retryBoot } = useStore();
  const [route, qs] = path.split('?');
  const query = new URLSearchParams(qs ?? '');

  useEffect(() => { document.title = `${titles[route] ?? 'Campus Coin'} · Campus Coin`; }, [route]);

  // Checking the saved session with the server
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas" role="status" aria-label="Loading Campus Coin">
        <span className="animate-pulse"><LogoMark size={56} /></span>
        <p className="text-sm font-semibold text-muted">Loading your money&hellip;</p>
      </div>
    );
  }
  if (status === 'offline') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <LogoMark size={48} className="mx-auto" />
          <h1 className="text-2xl font-extrabold">We can&rsquo;t reach Campus Coin</h1>
          <ErrorState message={bootError} onRetry={retryBoot} />
        </div>
      </div>
    );
  }

  if (route.startsWith('/admin') && route !== '/admin/login') {
    const page: Record<string, ReactNode> = {
      '/admin': <AdminDashboard />, '/admin/users': <AdminUsers />, '/admin/categories': <AdminCategories />,
      '/admin/tips': <AdminTips />, '/admin/stats': <AdminStats />, '/admin/content': <AdminContent />,
    };
    return (
      <Guard ok={role === 'admin'} to="/admin/login">
        <AdminLayout path={path}>{page[route] ?? <NotFound home="/admin" />}</AdminLayout>
      </Guard>
    );
  }

  if (route.startsWith('/app')) {
    const page: Record<string, ReactNode> = {
      '/app': <Dashboard />, '/app/transactions': <Transactions query={query} />,
      '/app/add-expense': <AddTransaction type="expense" />, '/app/add-income': <AddTransaction type="income" />,
      '/app/categories': <Categories />, '/app/budgets': <Budgets />, '/app/reports': <Reports />, '/app/insights': <Insights />,
      '/app/tips': <Tips />, '/app/bookmarks': <Bookmarks />, '/app/notifications': <Notifications />,
      '/app/profile': <Settings initialTab="profile" />, '/app/settings': <Settings initialTab="preferences" />,
    };
    return (
      <Guard ok={role === 'student'} to="/login">
        <StudentLayout path={path}>{page[route] ?? <NotFound home="/app" />}</StudentLayout>
      </Guard>
    );
  }

  switch (route) {
    case '/login': return <Login key="student" />;
    case '/admin/login': return <Login key="admin" admin />;
    case '/register': return <Register />;
    case '/forgot-password': return <ForgotPassword />;
    case '/reset-password': return <ResetPassword token={query.get('token') ?? ''} />;
    case '/': return <Landing />;
    default: return <NotFound home="/" />;
  }
}

function NotFound({ home }: { home: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="money text-6xl font-extrabold text-muted/40">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">This page wandered off campus</h1>
      <p className="mt-2 max-w-sm text-muted">The link might be old, or there was a typo. Your money data is safe either way.</p>
      <a href={`#${home}`} className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-cream dark:bg-mint dark:text-ink">Take me back</a>
    </div>
  );
}
