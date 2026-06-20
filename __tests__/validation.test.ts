import { isValidBreakdown, isValidProfile } from '@/lib/validation';

describe('isValidBreakdown', () => {
  it('returns true for a valid breakdown object', () => {
    expect(isValidBreakdown({ total: 10, transport: 3, energy: 3, food: 2, shopping: 2 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidBreakdown(null)).toBe(false);
  });

  it('returns false for a primitive', () => {
    expect(isValidBreakdown(42)).toBe(false);
    expect(isValidBreakdown('string')).toBe(false);
  });

  it('returns false when total is 0', () => {
    expect(isValidBreakdown({ total: 0, transport: 0, energy: 0, food: 0, shopping: 0 })).toBe(false);
  });

  it('returns false when total exceeds 1000', () => {
    expect(isValidBreakdown({ total: 1001, transport: 250, energy: 250, food: 250, shopping: 251 })).toBe(false);
  });

  it('returns false when a required numeric field is missing', () => {
    expect(isValidBreakdown({ total: 10, transport: 3, energy: 3, food: 2 })).toBe(false);
  });

  it('returns false when a field is a string instead of number', () => {
    expect(isValidBreakdown({ total: '10', transport: 3, energy: 3, food: 2, shopping: 2 })).toBe(false);
  });

  it('returns true for minimum valid total (just above 0)', () => {
    expect(isValidBreakdown({ total: 0.01, transport: 0, energy: 0, food: 0.01, shopping: 0 })).toBe(true);
  });

  it('returns true for maximum valid total (just below 1000)', () => {
    expect(isValidBreakdown({ total: 999, transport: 250, energy: 250, food: 250, shopping: 249 })).toBe(true);
  });
});

describe('isValidProfile', () => {
  it('returns true for a valid profile', () => {
    expect(isValidProfile({ name: 'Alex', location: 'USA' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidProfile(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidProfile(undefined)).toBe(false);
  });

  it('returns false for an empty name', () => {
    expect(isValidProfile({ name: '', location: 'USA' })).toBe(false);
  });

  it('returns false for a name exceeding 100 characters', () => {
    expect(isValidProfile({ name: 'a'.repeat(101), location: 'USA' })).toBe(false);
  });

  it('returns true for a name exactly 100 characters', () => {
    expect(isValidProfile({ name: 'a'.repeat(100), location: 'USA' })).toBe(true);
  });

  it('returns false when location is missing', () => {
    expect(isValidProfile({ name: 'Alex' })).toBe(false);
  });

  it('returns false when name is a number', () => {
    expect(isValidProfile({ name: 123, location: 'USA' })).toBe(false);
  });

  it('returns true when location is an empty string', () => {
    expect(isValidProfile({ name: 'Alex', location: '' })).toBe(true);
  });
});
