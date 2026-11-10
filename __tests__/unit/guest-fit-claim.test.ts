import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  claimGuestFitSnapshot,
  GUEST_FIT_LIFETIME_DATE,
  hashClientIp,
  normalizeFingerprint,
  normalizeGuestId,
} from '@/lib/guest-fit-claim';

describe('guest-fit-claim helpers', () => {
  it('normalizes guest UUID and rejects junk', () => {
    expect(normalizeGuestId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(normalizeGuestId('not-a-uuid')).toBeNull();
    expect(normalizeGuestId('')).toBeNull();
  });

  it('normalizes fingerprint length and charset', () => {
    expect(normalizeFingerprint('abcd1234')).toBe('abcd1234');
    expect(normalizeFingerprint('short')).toBeNull();
    expect(normalizeFingerprint('bad fingerprint!')).toBeNull();
  });

  it('hashes IP stably', () => {
    expect(hashClientIp('1.2.3.4')).toBe(hashClientIp('1.2.3.4'));
    expect(hashClientIp('1.2.3.4')).not.toBe(hashClientIp('1.2.3.5'));
  });
});

describe('claimGuestFitSnapshot', () => {
  const insert = vi.fn();
  const select = vi.fn();
  const inFn = vi.fn();
  const eq = vi.fn();
  const limit = vi.fn();

  const admin = {
    from: vi.fn(() => ({
      select: (...args: unknown[]) => {
        select(...args);
        return { in: inFn };
      },
      insert: (...args: unknown[]) => {
        insert(...args);
        return {
          select: () =>
            Promise.resolve({
              data: [{ id: 'claim-1', ip_hash: 'guest_fp:fp_abcdef12' }],
              error: null,
            }),
        };
      },
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    inFn.mockReturnValue({ eq });
    eq.mockReturnValue({ limit });
    limit.mockResolvedValue({ data: [], error: null });
  });

  it('requires fingerprint or guest id', async () => {
    const result = await claimGuestFitSnapshot(admin as never, {
      fingerprint: null,
      guestId: null,
      ip: '9.9.9.9',
    });
    expect(result).toEqual({ ok: false, code: 'GUEST_DEVICE_REQUIRED' });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('returns GUEST_FIT_USED when a prior claim exists', async () => {
    limit.mockResolvedValue({ data: [{ id: 'old' }], error: null });
    const result = await claimGuestFitSnapshot(admin as never, {
      fingerprint: 'fp_abcdef12',
      guestId: '550e8400-e29b-41d4-a716-446655440000',
      ip: '9.9.9.9',
    });
    expect(result).toEqual({ ok: false, code: 'GUEST_FIT_USED' });
    expect(insert).not.toHaveBeenCalled();
  });

  it('inserts lifetime usage_limits rows when free', async () => {
    const result = await claimGuestFitSnapshot(admin as never, {
      fingerprint: 'fp_abcdef12',
      guestId: '550e8400-e29b-41d4-a716-446655440000',
      ip: '9.9.9.9',
    });
    expect(result).toEqual({
      ok: true,
      claimKey: 'guest_fp:fp_abcdef12',
      claimId: 'claim-1',
    });
    expect(insert).toHaveBeenCalledWith([
      {
        ip_hash: 'guest_fp:fp_abcdef12',
        date: GUEST_FIT_LIFETIME_DATE,
        count: 1,
      },
      {
        ip_hash: 'guest_gid:550e8400-e29b-41d4-a716-446655440000',
        date: GUEST_FIT_LIFETIME_DATE,
        count: 1,
      },
    ]);
  });
});
