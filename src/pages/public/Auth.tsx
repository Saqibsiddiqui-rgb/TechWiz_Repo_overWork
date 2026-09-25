import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Eye, EyeOff, MailCheck, ShieldCheck } from 'lucide-react';
import { cx } from '../../lib/format';
import { navigate } from '../../lib/router';
import { useContent, useStore } from '../../lib/store';
import { api, errorMessage, fieldErrors } from '../../lib/api';
import { Logo } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { ErrorState } from '../../components/ui/Feedback';
import { useYearOptions } from '../app/Settings';

/* ---------------- Split auth layout ---------------- */
function AuthShell({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const panel = useContent('auth_panel'); // text comes from Admin → Site content
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-cream lg:flex lg:flex-col">
        <a href="#/" aria-label="Campus Coin home"><Logo light /></a>
        <div className="my-auto max-w-md">
          {panel && (admin ? (<>
            <p className="text-sm font-bold text-lavender">{panel.admin.eyebrow}</p>
            <h2 className="mt-3 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">{panel.admin.title}</h2>
            <p className="mt-4 text-cream/70">{panel.admin.body}</p>
          </>) : (<>
            <h2 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">{panel.student.title}</h2>
            <p className="mt-4 text-lg text-cream/70">{panel.student.body}</p>
            <ul className="mt-8 space-y-3 text-cream/85">
              {panel.student.bullets.map((t) => (
                <li key={t} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-black text-ink">✓</span>{t}</li>
              ))}
            </ul>
          </>))}
        </div>
        <AuthDoodle />
        {panel?.legal && <p className="relative text-xs text-cream/50">{panel.legal}</p>}
      </aside>
      <main className="flex flex-col bg-canvas px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <a href="#/" className="lg:hidden" aria-label="Campus Coin home"><Logo /></a>
          <a href="#/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" /> Home</a>
        </div>
        <div className="anim-page mx-auto my-auto w-full max-w-[420px] py-10">{children}</div>
      </main>
    </div>
  );
}

function AuthDoodle() {
  return (
    <svg className="pointer-events-none absolute -bottom-16 -right-16 h-[360px] w-[360px]" viewBox="0 0 200 200" aria-hidden>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#72E6B0" strokeWidth="14" opacity=".9" />
      <path d="M130 78a38 38 0 1 0 0 44" fill="none" stroke="#F7F4EC" strokeWidth="12" strokeLinecap="round" opacity=".9" />
      <path d="M100 6l34 17-34 17-34-17z" fill="#A99BFF" />
      <path d="M134 23v22" stroke="#A99BFF" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PasswordInput(props: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Input label={props.label} type={show ? 'text' : 'password'} value={props.value} error={props.error} hint={props.hint} autoComplete={props.autoComplete}
      onChange={(e) => props.onChange(e.target.value)}
      suffix={<button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="rounded-lg p-2 text-muted hover:text-fg">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
  );
}

/* ---------------- Login (student + separate admin entry) ---------------- */
export function Login({ admin }: { admin?: boolean }) {
  const { login, site } = useStore();
  // Demo account from config.php; the API only sends it while debug mode is on
  const demo = (admin ? site?.demo?.admin : site?.demo?.student) ?? null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter the email you signed up with.';
    if (!password) e.password = 'Enter your password.';
    setErrors(e); setFailed('');
    if (Object.keys(e).length) return;
    setLoading(true);
    login(email.trim(), password, admin)
      .then((role) => navigate(role === 'admin' ? '/admin' : '/app'))
      .catch((err) => {
        const f = fieldErrors(err);
        if (Object.keys(f).length) setErrors(f); else setFailed(errorMessage(err));
        setLoading(false);
      });
  };

  return (
    <AuthShell admin={admin}>
      {admin && <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-lavender/20 px-3 py-1 text-xs font-bold text-ai"><ShieldCheck className="h-3.5 w-3.5" /> Administrator access</p>}
      <h1 className="text-3xl font-extrabold tracking-tight">{admin ? 'Admin sign in' : 'Welcome back'}</h1>
      <p className="mt-2 text-muted">{admin ? 'Staff accounts only. Student accounts can\u2019t sign in here.' : 'Pick up where you left off. Your budgets missed you.'}</p>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {failed && <ErrorState message={failed} />}
        <Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu.pk" />
        <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} />
        {!admin && <div className="flex justify-end"><a href="#/forgot-password" className="text-sm font-semibold text-muted underline-offset-4 hover:text-fg hover:underline">Forgot password?</a></div>}
        <Button type="submit" size="lg" block loading={loading}>{admin ? 'Sign in to admin' : 'Log in'}</Button>
      </form>
      {demo && (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm">
          <p className="font-semibold">Demo {admin ? 'admin' : 'student'} account</p>
          <p className="mt-1 text-muted">{demo.email} / {demo.password}</p>
          <button onClick={() => { setEmail(demo.email); setPassword(demo.password); }} className="mt-2 font-bold text-ai underline-offset-4 hover:underline">Fill it in for me</button>
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted">
        {admin ? <a href="#/login" className="font-bold text-fg hover:underline">Student login</a>
          : <>New here? <a href="#/register" className="font-bold text-fg underline-offset-4 hover:underline">Create an account</a></>}
      </p>
    </AuthShell>
  );
}

/* ---------------- Register ---------------- */
export function Register() {
  const { register, toast } = useStore();
  const years = useYearOptions();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', year: years[0]?.value ?? '', allowance: '', goal: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const up = (k: keyof typeof f) => (v: string) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: '' }); };

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (f.confirm !== f.password) e.confirm = 'Passwords don\u2019t match yet.';
    if (f.allowance === '') e.allowance = 'Roughly how much do you get each month? 0 is fine.';
    if (f.goal && +f.allowance && +f.goal > +f.allowance) e.goal = 'Your goal is more than your allowance. Try a smaller number to start.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    register({ name: f.name.trim(), email: f.email.trim(), password: f.password, academicYear: f.year, allowance: +f.allowance, savingsGoal: +f.goal || Math.round(+f.allowance * 0.2) })
      .then(() => {
        toast(`Welcome to Campus Coin, ${f.name.split(' ')[0]}! Let\u2019s log your first transaction.`);
        navigate('/app');
      })
      .catch((err) => {
        const fe = fieldErrors(err);
        if (Object.keys(fe).length) setErrors({ ...fe, goal: fe.savingsGoal ?? '', year: fe.academicYear ?? '' });
        else toast(errorMessage(err), 'error');
        setLoading(false);
      });
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Start tracking</h1>
      <p className="mt-2 text-muted">Free, takes a minute, and no bank details needed.</p>
      <form className="mt-8 space-y-6" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-muted">About you</legend>
          <Input label="Name" autoComplete="name" value={f.name} error={errors.name} onChange={(e) => up('name')(e.target.value)} placeholder="Alex Khan" />
          <Input label="Email" type="email" autoComplete="email" value={f.email} error={errors.email} onChange={(e) => up('email')(e.target.value)} placeholder="you@university.edu.pk" />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordInput label="Password" autoComplete="new-password" value={f.password} onChange={up('password')} error={errors.password} hint="8+ characters" />
            <PasswordInput label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={up('confirm')} error={errors.confirm} />
          </div>
          <Select label="Academic year" value={f.year} error={errors.year} onChange={(e) => up('year')(e.target.value)} options={years} />
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-muted">Your money</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Monthly allowance" prefix="Rs." inputMode="numeric" value={f.allowance} error={errors.allowance} onChange={(e) => up('allowance')(e.target.value.replace(/\D/g, ''))} placeholder="60,000" />
            <Input label="Savings goal" optional prefix="Rs." inputMode="numeric" value={f.goal} error={errors.goal} onChange={(e) => up('goal')(e.target.value.replace(/\D/g, ''))} placeholder="20,000" hint={!errors.goal && f.allowance && !f.goal ? 'We\u2019ll suggest 20% if you skip this' : undefined} />
          </div>
        </fieldset>
        <Button type="submit" size="lg" block loading={loading}>Create my account</Button>
        <p className="text-center text-xs text-muted">By continuing you agree to our Terms and Privacy Policy.</p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <a href="#/login" className="font-bold text-fg underline-offset-4 hover:underline">Log in</a></p>
    </AuthShell>
  );
}

/* ---------------- Forgot / reset password (tokenized link flow) ---------------- */
export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const request = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the email you signed up with.');
    setLoading(true);
    api<{ ok: boolean; devLink?: string }>('/auth/forgot', 'POST', { email: email.trim() })
      .then((r) => { setDevLink(r.devLink ?? ''); setSent(true); })
      .catch((e) => setError(fieldErrors(e).email ?? errorMessage(e)))
      .finally(() => setLoading(false));
  };

  return (
    <AuthShell>
      {!sent ? (<>
        <h1 className="text-3xl font-extrabold tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-muted">It happens, usually right before exams. Enter your email and we&rsquo;ll send a reset link.</p>
        <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); request(); }}>
          <Input label="Email" type="email" value={email} error={error} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@university.edu.pk" />
          <Button type="submit" size="lg" block loading={loading}>Send reset link</Button>
        </form>
      </>) : (
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/25 text-pos"><MailCheck className="h-8 w-8" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-muted">If <b className="text-fg">{email}</b> has a Campus Coin account, a reset link is on its way. It works once and expires in 30 minutes.</p>
          {devLink && (
            <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-left text-sm">
              <p className="font-semibold">Local development</p>
              <p className="mt-1 text-muted">Email isn&rsquo;t set up on this server, so here&rsquo;s the link that was saved in the email log.</p>
              <Button className="mt-3" variant="secondary" block onClick={() => { window.location.href = devLink; }}>Open reset link</Button>
            </div>
          )}
          <button onClick={() => { setSent(false); setDevLink(''); }} className="mt-4 text-sm font-semibold text-muted hover:text-fg">Use a different email</button>
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted">Remembered it? <a href="#/login" className="font-bold text-fg underline-offset-4 hover:underline">Log in</a></p>
    </AuthShell>
  );
}

export function ResetPassword({ token }: { token: string }) {
  const [state, setState] = useState<'checking' | 'invalid' | 'form' | 'done'>('checking');
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState('');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ email: string }>('/auth/reset/check', 'POST', { token })
      .then((r) => { setEmail(r.email); setState('form'); })
      .catch((e) => { setProblem(errorMessage(e)); setState('invalid'); });
  }, [token]);

  const save = () => {
    if (pw.length < 8) return setError('Use at least 8 characters.');
    if (pw !== pw2) return setError('Passwords don\u2019t match yet.');
    setLoading(true);
    api('/auth/reset', 'POST', { token, password: pw })
      .then(() => setState('done'))
      .catch((e) => setError(fieldErrors(e).password ?? errorMessage(e)))
      .finally(() => setLoading(false));
  };

  return (
    <AuthShell>
      {state === 'checking' && <p className="text-muted">Checking your reset link&hellip;</p>}
      {state === 'invalid' && (<>
        <h1 className="text-3xl font-extrabold tracking-tight">This link can&rsquo;t be used</h1>
        <div className="mt-6"><ErrorState message={problem} /></div>
        <Button className="mt-6" size="lg" block onClick={() => navigate('/forgot-password')}>Request a new link</Button>
      </>)}
      {state === 'form' && (<>
        <h1 className="text-3xl font-extrabold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-muted">For {email}.</p>
        <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <PasswordInput label="New password" autoComplete="new-password" value={pw} onChange={(v) => { setPw(v); setError(''); }} />
          <PasswordInput label="Confirm new password" autoComplete="new-password" value={pw2} onChange={(v) => { setPw2(v); setError(''); }} error={error} />
          <Button type="submit" size="lg" block loading={loading}>Save new password</Button>
        </form>
      </>)}
      {state === 'done' && (
        <div className="text-center">
          <span className={cx('mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-3xl')}>🎉</span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">You&rsquo;re back in</h1>
          <p className="mt-2 text-muted">Your password has been updated and old sessions were signed out. Log in with the new one.</p>
          <Button className="mt-6" size="lg" block onClick={() => navigate('/login')}>Go to login</Button>
        </div>
      )}
    </AuthShell>
  );
}
