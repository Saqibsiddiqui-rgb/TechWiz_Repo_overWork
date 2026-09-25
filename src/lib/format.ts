const nf = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** Rs. 42,850 */
export const rs = (n: number) => `Rs. ${nf.format(Math.round(n))}`;
export const num = (n: number) => nf.format(Math.round(n));
/** Signed amount for transaction rows: + Rs. 30,000 / − Rs. 850 */
export const signed = (n: number, type: 'income' | 'expense') => `${type === 'income' ? '+' : '−'} ${rs(n)}`;
export const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

/** Local date as YYYY-MM-DD (not UTC, so late-night entries land on the right day in Pakistan). */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const TODAY = isoDate(new Date());
export const CURRENT_MONTH = TODAY.slice(0, 7);
/** Shift a YYYY-MM month by n months. */
export const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const PREV_MONTH = shiftMonth(CURRENT_MONTH, -1);
/** Days left in the current month, including today. */
export const daysLeftInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const monthLabel = (ym: string, long = false) => {
  const [y, m] = ym.split('-').map(Number);
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : MONTHS[m - 1];
};
export const shortDate = (d: string) => {
  const [, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]}`;
};
export const relativeDay = (d: string) => {
  const diff = Math.round((Date.parse(TODAY) - Date.parse(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7 && diff > 0) return `${diff} days ago`;
  return shortDate(d);
};
export const timeAgo = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};
/** Client-side ids (the server accepts them, so the UI can update without waiting). */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
