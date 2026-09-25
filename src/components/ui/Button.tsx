import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cx } from '../../lib/format';

type Variant = 'primary' | 'mint' | 'secondary' | 'ghost' | 'danger' | 'ai';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-ink/90 dark:bg-mint dark:text-ink dark:hover:bg-mint/90',
  mint: 'bg-mint text-ink hover:brightness-95',
  secondary: 'bg-surface text-fg border border-line hover:border-fg/25 hover:bg-raised',
  ghost: 'text-fg hover:bg-fg/5',
  danger: 'bg-coral text-ink hover:brightness-95',
  ai: 'bg-lavender-soft text-ai hover:bg-lavender/30 dark:bg-lavender/15',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-2xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-[transform,background-color,border-color,filter] duration-150 active:scale-[.98] disabled:opacity-55 disabled:pointer-events-none',
        variants[variant], sizes[size], block && 'w-full', className,
      )}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cx('inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-fg/5 hover:text-fg', className)}
    >
      {children}
    </button>
  );
}
