import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';

/** Count-based stat card (admin numbers are people and records, not rupees). */
export function CountCard({ label, value, delta, note, icon, accent }: { label: string; value: string; delta?: number | null; note: string; icon: ReactNode; accent: string }) {
  return (
    <Card interactive className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}33`, color: `color-mix(in srgb, ${accent} 55%, rgb(var(--fg)))` }}>{icon}</span>
      </div>
      <p className="money mt-3 text-[1.9rem] font-extrabold leading-none tracking-tight">{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs">
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 font-bold ${delta >= 0 ? 'text-pos' : 'text-neg'}`}>
            {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(delta)}%
          </span>
        )}
        <span className="text-muted">{note}</span>
      </p>
    </Card>
  );
}

/** Loading / error wrapper for admin pages that fetch data. */
export function Loadable({ loading, error, onRetry, children }: { loading: boolean; error: string; onRetry: () => void; children: ReactNode }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
  return <>{children}</>;
}

export const count = (n: number) => new Intl.NumberFormat('en-PK').format(Math.round(n));

export interface Activity { month: string; label: string; active: number; tx: number }
export interface Usage { id: string; name: string; color: string; share: number }
