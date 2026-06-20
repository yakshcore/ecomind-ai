import type { UserProfile, CarbonBreakdown } from './types';

export function isValidBreakdown(b: unknown): b is CarbonBreakdown {
  if (!b || typeof b !== 'object') return false;
  const bd = b as Record<string, unknown>;
  return (
    typeof bd.total === 'number' &&
    typeof bd.transport === 'number' &&
    typeof bd.energy === 'number' &&
    typeof bd.food === 'number' &&
    typeof bd.shopping === 'number' &&
    bd.total > 0 &&
    bd.total < 1000
  );
}

export function isValidProfile(p: unknown): p is UserProfile {
  if (!p || typeof p !== 'object') return false;
  const pr = p as Record<string, unknown>;
  return (
    typeof pr.name === 'string' &&
    pr.name.length > 0 &&
    pr.name.length <= 100 &&
    typeof pr.location === 'string'
  );
}
