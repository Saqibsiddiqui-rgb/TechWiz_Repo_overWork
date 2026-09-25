import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { compact, cx, rs } from '../../lib/format';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    setW(ref.current.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const niceMax = (v: number) => {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / 2) * 2 * p;
};

function Tip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="anim-fade pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs text-cream shadow-lift dark:bg-raised dark:text-fg"
      style={{ left: x, top: y - 8 }}>
      {children}
    </div>
  );
}

export interface Series { key: string; name: string; color: string }

/** Grouped bars (e.g. income vs expenses) */
export function BarChart({ data, series, height = 240, format = rs }: { data: Record<string, number | string>[]; series: Series[]; height?: number; format?: (n: number) => string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 40, r: 8, t: 12, b: 28 };
  const max = niceMax(Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))));
  const iw = Math.max(0, width - pad.l - pad.r), ih = height - pad.t - pad.b;
  const band = data.length ? iw / data.length : 0;
  const bw = Math.min(22, (band * 0.62) / series.length);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`Bar chart: ${series.map((s) => s.name).join(' vs ')}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={width - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="rgb(var(--line))" strokeDasharray={f ? '3 5' : undefined} />
              <text x={pad.l - 8} y={y(max * f) + 4} textAnchor="end" className="fill-muted text-[10px]">{compact(max * f)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x0 = pad.l + band * i + (band - bw * series.length - 4 * (series.length - 1)) / 2;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill={hover === i ? 'rgb(var(--fg) / .04)' : 'transparent'} rx={10} />
                {series.map((s, j) => {
                  const v = Number(d[s.key]) || 0;
                  return <rect key={s.key} className="anim-grow-y" style={{ animationDelay: `${i * 40}ms` }}
                    x={x0 + j * (bw + 4)} y={y(v)} width={bw} height={Math.max(0, pad.t + ih - y(v))} rx={Math.min(6, bw / 2)} fill={s.color} />;
                })}
                <text x={pad.l + band * i + band / 2} y={height - 8} textAnchor="middle" className="fill-muted text-[11px] font-medium">{d.label}</text>
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tip x={pad.l + band * hover + band / 2} y={y(Math.max(...series.map((s) => Number(data[hover][s.key]) || 0)))}>
          <p className="mb-1 font-semibold">{data[hover].label}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}: <b className="money">{format(Number(data[hover][s.key]) || 0)}</b></p>
          ))}
        </Tip>
      )}
    </div>
  );
}

/** Smooth area line (daily spending, trends) */
export function AreaChart({ data, color = '#FF8B73', height = 200, valueLabel = 'Spent', format = rs }: { data: { label: string; value: number }[]; color?: string; height?: number; valueLabel?: string; format?: (n: number) => string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 36, r: 10, t: 12, b: 26 };
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const iw = Math.max(0, width - pad.l - pad.r), ih = height - pad.t - pad.b;
  const px = (i: number) => pad.l + (data.length > 1 ? (iw * i) / (data.length - 1) : iw / 2);
  const py = (v: number) => pad.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [px(i), py(d.value)] as const);
  const line = pts.reduce((acc, [x, yy], i) => {
    if (!i) return `M${x},${yy}`;
    const [x0, y0] = pts[i - 1];
    const cx1 = x0 + (x - x0) / 2;
    return `${acc} C${cx1},${y0} ${cx1},${yy} ${x},${yy}`;
  }, '');
  const area = `${line} L${px(data.length - 1)},${pad.t + ih} L${px(0)},${pad.t + ih} Z`;
  const gid = `g${color.replace('#', '')}`;
  const every = Math.ceil(data.length / 8);
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`Line chart of ${valueLabel.toLowerCase()}`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = (e.currentTarget as SVGElement).getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left - pad.l) / iw) * (data.length - 1));
            setHover(Math.max(0, Math.min(data.length - 1, i)));
          }}>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={width - pad.r} y1={py(max * f)} y2={py(max * f)} stroke="rgb(var(--line))" strokeDasharray={f ? '3 5' : undefined} />
              <text x={pad.l - 8} y={py(max * f) + 4} textAnchor="end" className="fill-muted text-[10px]">{compact(max * f)}</text>
            </g>
          ))}
          <path d={area} fill={`url(#${gid})`} className="anim-fade" />
          <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" className="anim-draw" style={{ ['--len' as string]: 2000 }} />
          {data.map((d, i) => (i % every === 0 || i === data.length - 1) && (
            <text key={i} x={px(i)} y={height - 7} textAnchor="middle" className="fill-muted text-[10px] font-medium">{d.label}</text>
          ))}
          {hover !== null && (<>
            <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgb(var(--fg) / .2)" />
            <circle cx={px(hover)} cy={py(data[hover].value)} r={5} fill="rgb(var(--surface))" stroke={color} strokeWidth={2.5} />
          </>)}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tip x={px(hover)} y={py(data[hover].value)}>
          <p className="font-semibold">{data[hover].label}</p>
          <p>{valueLabel}: <b className="money">{format(data[hover].value)}</b></p>
        </Tip>
      )}
    </div>
  );
}

/** Donut for "Where your money goes" */
export function DonutChart({ data, size = 200, center, format = rs }: { data: { label: string; value: number; color: string }[]; size?: number; center?: ReactNode; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 14, c = 2 * Math.PI * r;
  let acc = 0;
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 30); return () => clearTimeout(t); }, []);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label="Spending by category">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--fg) / .06)" strokeWidth={22} />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const gap = data.length > 1 ? 3 : 0;
          const el = (
            <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color}
              strokeWidth={hover === i ? 28 : 22} strokeLinecap="butt"
              strokeDasharray={`${ready ? Math.max(0, len - gap) : 0} ${c}`} strokeDashoffset={-acc}
              style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1), stroke-width .15s' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {hover !== null ? (
          <>
            <span className="text-xs font-semibold text-muted">{data[hover].label}</span>
            <span className="money text-xl font-extrabold">{format(data[hover].value)}</span>
            <span className="text-xs text-muted">{Math.round((data[hover].value / total) * 100)}% of spending</span>
          </>
        ) : center}
      </div>
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string; value?: string }[]; className?: string }) {
  return (
    <ul className={cx('flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted', className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />{i.label}{i.value && <b className="money text-fg">{i.value}</b>}
        </li>
      ))}
    </ul>
  );
}

/** Horizontal share bars for category breakdowns */
export function ShareBars({ rows }: { rows: { label: string; value: number; color: string; note?: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-semibold">{r.label}</span>
            <span className="money font-bold">{r.note ?? rs(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-fg/[.06]">
            <div className="anim-grow-x h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
