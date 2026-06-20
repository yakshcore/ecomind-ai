import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Each test uses a unique IP so the module-level request map does not leak state between tests.
let ipCounter = 0;
const uniqueIp = () => `10.0.0.${ipCounter++}`;

describe('checkRateLimit', () => {
  it('allows the first request and reports remaining quota', () => {
    const result = checkRateLimit(uniqueIp());
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it('decrements remaining quota on successive requests', () => {
    const ip = uniqueIp();
    checkRateLimit(ip);
    checkRateLimit(ip);
    const third = checkRateLimit(ip);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(17);
  });

  it('blocks the 21st request within the window', () => {
    const ip = uniqueIp();
    for (let i = 0; i < 20; i++) checkRateLimit(ip);
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets the quota after the time window elapses', () => {
    const ip = uniqueIp();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    for (let i = 0; i < 20; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);

    // Advance time beyond the 60s window
    nowSpy.mockReturnValue(1_000_000 + 61_000);
    const afterReset = checkRateLimit(ip);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(19);

    nowSpy.mockRestore();
  });

  it('tracks separate quotas for different IPs', () => {
    const ipA = uniqueIp();
    const ipB = uniqueIp();
    checkRateLimit(ipA);
    checkRateLimit(ipA);
    const bFirst = checkRateLimit(ipB);
    expect(bFirst.remaining).toBe(19);
  });
});

describe('getClientIp', () => {
  const mockReq = (headerValue: string | null): Request =>
    ({ headers: { get: (key: string) => (key === 'x-forwarded-for' ? headerValue : null) } } as unknown as Request);

  it('extracts the first IP from a comma-separated x-forwarded-for header', () => {
    expect(getClientIp(mockReq('203.0.113.5, 70.41.3.18, 150.172.238.178'))).toBe('203.0.113.5');
  });

  it('trims whitespace around the IP', () => {
    expect(getClientIp(mockReq('  203.0.113.9  '))).toBe('203.0.113.9');
  });

  it('returns "unknown" when the header is absent', () => {
    expect(getClientIp(mockReq(null))).toBe('unknown');
  });
});
