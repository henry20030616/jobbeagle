import { describe, expect, it } from 'vitest';

/** Mirror free-tier IP cap policy from analyze route (dual Sybil). */
function freeIpLimit(mode: 'fingerprinted' | 'no_fingerprint' | 'paid') {
  if (mode === 'paid') return null;
  if (mode === 'fingerprinted') return { limit: 20, windowSec: 3600 };
  return { limit: 3, windowSec: 86400 };
}

describe('dual Sybil IP policy', () => {
  it('tightens IP when fingerprint is missing', () => {
    expect(freeIpLimit('no_fingerprint')).toEqual({ limit: 3, windowSec: 86400 });
  });

  it('allows a higher hourly IP cap when fingerprinted', () => {
    expect(freeIpLimit('fingerprinted')).toEqual({ limit: 20, windowSec: 3600 });
  });

  it('skips free IP gate for paid/sub', () => {
    expect(freeIpLimit('paid')).toBeNull();
  });
});
