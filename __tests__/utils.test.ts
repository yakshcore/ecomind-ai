import {
  cn,
  formatTonnes,
  formatKg,
  categoryColor,
  categoryEmoji,
  difficultyColor,
  monthLabel,
} from '@/lib/utils';

describe('cn', () => {
  it('merges multiple class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('resolves conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('text-white', false, null, undefined, 'font-bold')).toBe('text-white font-bold');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });
});

describe('formatTonnes', () => {
  it('formats a whole number with 2 decimal places', () => {
    expect(formatTonnes(5)).toBe('5.00t');
  });

  it('formats a decimal value correctly', () => {
    expect(formatTonnes(3.456)).toBe('3.46t');
  });

  it('formats zero as 0.00t', () => {
    expect(formatTonnes(0)).toBe('0.00t');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatTonnes(1.999)).toBe('2.00t');
  });
});

describe('formatKg', () => {
  it('returns kg for values under 1000', () => {
    expect(formatKg(500)).toBe('500kg');
  });

  it('returns tonnes for values 1000 and above', () => {
    expect(formatKg(1000)).toBe('1.0t');
  });

  it('returns tonnes with one decimal for large values', () => {
    expect(formatKg(2500)).toBe('2.5t');
  });

  it('rounds kg to nearest integer', () => {
    expect(formatKg(99.7)).toBe('100kg');
  });

  it('handles zero', () => {
    expect(formatKg(0)).toBe('0kg');
  });
});

describe('categoryColor', () => {
  it('returns blue for transport', () => {
    expect(categoryColor('transport')).toBe('#3b82f6');
  });

  it('returns amber for energy', () => {
    expect(categoryColor('energy')).toBe('#f59e0b');
  });

  it('returns green for food', () => {
    expect(categoryColor('food')).toBe('#10b981');
  });

  it('returns purple for shopping', () => {
    expect(categoryColor('shopping')).toBe('#a855f7');
  });

  it('returns fallback color for unknown category', () => {
    expect(categoryColor('unknown')).toBe('#6b7280');
  });
});

describe('categoryEmoji', () => {
  it('returns car emoji for transport', () => {
    expect(categoryEmoji('transport')).toBe('🚗');
  });

  it('returns bolt emoji for energy', () => {
    expect(categoryEmoji('energy')).toBe('⚡');
  });

  it('returns salad emoji for food', () => {
    expect(categoryEmoji('food')).toBe('🥗');
  });

  it('returns bag emoji for shopping', () => {
    expect(categoryEmoji('shopping')).toBe('🛍️');
  });

  it('returns fallback emoji for unknown category', () => {
    expect(categoryEmoji('other')).toBe('📊');
  });
});

describe('difficultyColor', () => {
  it('returns green class for easy', () => {
    expect(difficultyColor('easy')).toContain('green');
  });

  it('returns yellow class for medium', () => {
    expect(difficultyColor('medium')).toContain('yellow');
  });

  it('returns red class for hard', () => {
    expect(difficultyColor('hard')).toContain('red');
  });
});

describe('monthLabel', () => {
  it('formats a valid ISO month string', () => {
    const label = monthLabel('2026-01');
    expect(label).toMatch(/Jan/i);
  });

  it('includes the year abbreviation', () => {
    const label = monthLabel('2026-06');
    expect(label).toContain('26');
  });

  it('formats December correctly', () => {
    const label = monthLabel('2025-12');
    expect(label).toMatch(/Dec/i);
  });
});
