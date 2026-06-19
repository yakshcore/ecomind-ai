import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTonnes(value: number): string {
  return `${value.toFixed(2)}t`;
}

export function formatKg(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(1)}t`
    : `${Math.round(value)}kg`;
}

export function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    transport: '#3b82f6',
    energy: '#f59e0b',
    food: '#10b981',
    shopping: '#a855f7',
  };
  return colors[cat] ?? '#6b7280';
}

export function categoryEmoji(cat: string): string {
  const emojis: Record<string, string> = {
    transport: '🚗',
    energy: '⚡',
    food: '🥗',
    shopping: '🛍️',
  };
  return emojis[cat] ?? '📊';
}

export function difficultyColor(d: string): string {
  return d === 'easy' ? 'text-green-400' : d === 'medium' ? 'text-yellow-400' : 'text-red-400';
}

export function monthLabel(iso: string): string {
  const [year, month] = iso.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}
