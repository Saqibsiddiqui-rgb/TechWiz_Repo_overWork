import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from '../../lib/format';

const control =
  'w-full rounded-xl border bg-surface px-3.5 text-[0.95rem] text-fg placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-4 focus:ring-lavender/25';

function Wrap({ id, label, hint, error, children, optional }: { id: string; label?: string; hint?: ReactNode; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold text-fg">
          {label}
          {optional && <span className="text-xs font-medium text-muted">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="flex items-center gap-1.5 text-[0.8rem] font-medium text-neg">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-[0.8rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: ReactNode; error?: string; prefix?: string; suffix?: ReactNode; optional?: boolean;
}
export function Input({ label, hint, error, prefix, suffix, optional, className, id, ...rest }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">{prefix}</span>}
        <input
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${fid}-msg` : undefined}
          className={cx(control, 'h-11', error ? 'border-neg' : 'border-line hover:border-fg/25', prefix && 'pl-11', !!suffix && 'pr-11', className)}
          {...rest}
        />
        {suffix && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
    </Wrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; hint?: ReactNode; error?: string; options: { value: string; label: string }[];
}
export function Select({ label, hint, error, options, className, id, ...rest }: SelectProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error}>
      <select
        id={fid}
        aria-invalid={!!error || undefined}
        className={cx(control, 'h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', error ? 'border-neg' : 'border-line hover:border-fg/25', className)}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23697386' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Wrap>
  );
}

export function Textarea({ label, hint, error, className, id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} hint={hint} error={error}>
      <textarea id={fid} className={cx(control, 'min-h-[96px] py-3', error ? 'border-neg' : 'border-line', className)} {...rest} />
    </Wrap>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-fg">{label}</label>
        {description && <p className="text-[0.8rem] text-muted">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-mint' : 'bg-line')}
      >
        <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-line bg-raised p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg font-semibold transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
            value === o.value ? 'bg-surface text-fg shadow-soft' : 'text-muted hover:text-fg',
          )}
        >
          {o.label};
        </button>
      ))};
    </div>
  );
}
