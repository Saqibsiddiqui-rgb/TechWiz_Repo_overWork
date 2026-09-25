import { useEffect, useRef, type ReactNode } from 'react';
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';
import { cx } from '../../lib/format';
import { useStore } from '../../lib/store';
import { lockScroll } from '../../lib/smoothScroll';

/* ---------------- Badge ---------------- */
type Tone = 'neutral' | 'pos' | 'neg' | 'ai' | 'warn' | 'ink';
const tones: Record<Tone, string> = {
  neutral: 'bg-fg/[.06] text-muted',
  pos: 'bg-mint/20 text-pos',
  neg: 'bg-coral/20 text-neg',
  ai: 'bg-lavender/20 text-ai',
  warn: 'bg-[#F2C14E]/25 text-warn',
  ink: 'bg-ink text-cream dark:bg-cream dark:text-ink',
};
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

/* ---------------- ProgressBar ---------------- */
export function ProgressBar({ value, max, label, size = 'md' }: { value: number; max: number; label?: string; size?: 'sm' | 'md' }) {
  const ratio = max ? value / max : 0;
  const color = ratio > 1 ? 'bg-coral' : ratio >= 0.75 ? 'bg-[#F2C14E]' : 'bg-mint';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cx('relative w-full overflow-hidden rounded-full bg-fg/[.07]', size === 'sm' ? 'h-1.5' : 'h-2.5')}
    >
      <div className={cx('anim-grow-x h-full rounded-full', color)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      {ratio > 1 && (
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 5px, rgb(255 255 255 / .7) 5px 8px)' }} />
      )}
    </div>
  );
}

/* ---------------- Modal (bottom sheet on mobile) ---------------- */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const unlock = lockScroll(); // stops Lenis + page scroll; the modal itself still scrolls
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus({ preventScroll: true }), 30);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); unlock(); prev?.focus({ preventScroll: true }); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} data-lenis-prevent>
      <div className="anim-fade absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className={cx(
          'anim-sheet relative flex max-h-[92vh] w-full flex-col rounded-t-[1.75rem] border border-line bg-surface shadow-lift sm:rounded-card',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button data-close onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-muted hover:bg-fg/5 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-6 pt-2" data-lenis-prevent>{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */
const toastIcon = { success: CircleCheck, error: CircleAlert, info: Info, warn: TriangleAlert };
const toastColor = { success: 'text-mint', error: 'text-coral', info: 'text-lavender', warn: 'text-[#F2C14E]' };
export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6">
      {toasts.map((t) => {
        const Icon = toastIcon[t.tone];
        return (
          <div key={t.id} role="status" className="anim-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-cream shadow-lift dark:bg-raised dark:text-fg">
            <Icon className={cx('h-5 w-5 shrink-0', toastColor[t.tone])} aria-hidden />
            <span className="flex-1 font-medium">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="rounded-lg p-1 text-cream/60 hover:text-cream dark:text-muted"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Empty / loading / error states ---------------- */
export function EmptyState({ title, body, action, art = 'coins' }: { title: string; body: string; action?: ReactNode; art?: 'coins' | 'bookmark' | 'bell' | 'search' }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <EmptyArt kind={art} />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function EmptyArt({ kind }: { kind: string }) {
  // Small hand-drawn-style campus/coin doodles
  return (
    <svg width="120" height="84" viewBox="0 0 120 84" fill="none" aria-hidden className="text-fg">
      <path d="M8 74c30-3 72-3 104 0" stroke="currentColor" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
      {kind === 'coins' && (<>
        <ellipse cx="46" cy="62" rx="20" ry="7" fill="#72E6B0" /><ellipse cx="46" cy="54" rx="20" ry="7" fill="#A6F0CD" stroke="#172033" strokeOpacity=".2" />
        <ellipse cx="78" cy="58" rx="16" ry="6" fill="#A99BFF" /><circle cx="70" cy="28" r="16" fill="#F7F4EC" stroke="#172033" strokeWidth="2.5" />
        <path d="M76 23a7 7 0 1 0 0 10" stroke="#172033" strokeWidth="2.5" strokeLinecap="round" /><path d="M70 6l9 4.5-9 4.5-9-4.5z" fill="#172033" />
      </>)}
      {kind === 'bookmark' && (<><path d="M44 12h32v52L60 52 44 64z" fill="#ECE8FF" stroke="#172033" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="60" cy="30" r="6" fill="#A99BFF" /></>)}
      {kind === 'bell' && (<><path d="M42 54V38a18 18 0 0 1 36 0v16l6 6H36z" fill="#DDF8EA" stroke="#172033" strokeWidth="2.5" strokeLinejoin="round" /><path d="M54 66a6 6 0 0 0 12 0" stroke="#172033" strokeWidth="2.5" /><path d="M86 22l6-4M88 32h7" stroke="#72E6B0" strokeWidth="3" strokeLinecap="round" /></>)}
      {kind === 'search' && (<><circle cx="54" cy="36" r="18" fill="#FFE5DE" stroke="#172033" strokeWidth="2.5" /><path d="M67 49l14 14" stroke="#172033" strokeWidth="4" strokeLinecap="round" /></>)}
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
      <CircleAlert className="h-5 w-5 shrink-0 text-neg" />
      <span className="flex-1 text-fg">{message}</span>
      {onRetry && <button onClick={onRetry} className="font-semibold text-neg underline underline-offset-2">Try again</button>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx('relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            value === t.value ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg')}
        >
          {t.label}
          {t.count !== undefined && <span className="rounded-full bg-fg/[.07] px-2 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
