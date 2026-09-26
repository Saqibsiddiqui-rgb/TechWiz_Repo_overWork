import {
  BookOpen, Briefcase, Bus, Clapperboard, Coffee, Gift, GraduationCap, Heart, House, Music, Shapes,
  ShoppingBasket, Smartphone, Tv, Wallet, Coins, Tag,
} from 'lucide-react';
import type { IconKey } from '../lib/types';
import { cx } from '../lib/format';

/** Campus Coin mark: a coin ring with an open "C", topped by a small mortarboard. No dollar sign. */
export function LogoMark() {
  return (
    <img src='Campus-Logo.png' className='h-10 w-10'></img>
  );
}

export function Logo({ light, size = 34, className }: { light?: boolean; size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cx('text-[1.15rem] font-extrabold tracking-tight text-white', light ? 'text-cream' : 'text-fg')}>
        Campus<span className="font-medium opacity-80"> Coin</span>
      </span>
    </span>
  );
}

const icons: Record<IconKey, typeof Coffee> = {
  allowance: Wallet, job: Briefcase, scholarship: GraduationCap, gift: Gift, 'other-income': Coins,
  food: Coffee, transport: Bus, hostel: House, academics: BookOpen, subscriptions: Tv, entertainment: Clapperboard,
  misc: Shapes, groceries: ShoppingBasket, health: Heart, music: Music, phone: Smartphone, custom: Tag,
};
export const iconOptions = Object.keys(icons) as IconKey[];

export function CategoryIcon({ icon, color, size = 'md' }: { icon: IconKey; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = icons[icon] ?? Tag;
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const glyph = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center', box)}
      style={{ backgroundColor: `${color}2E`, color: `color-mix(in srgb, ${color} 62%, rgb(var(--fg)))` }}
      aria-hidden
    >
      <Icon className={glyph} strokeWidth={2.1} />
    </span>
  );
}
