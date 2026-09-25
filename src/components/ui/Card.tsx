import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/format';

export function Card({ className, interactive, children, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      {...rest}
      className={cx(
        'rounded-card border border-line bg-surface shadow-soft',
        interactive && 'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[1.05rem] font-bold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
