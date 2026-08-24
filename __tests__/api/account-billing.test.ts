import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateClient = vi.fn();
const mockGetAdmin = vi.fn();
const mockEnsureProfile = vi.fn();
const mockList = vi.fn();
const mockCancel = vi.fn();
const mockRetrieve = vi.fn();
const mockGetLs = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/profiles', () => ({
  ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
}));

vi.mock('@/lib/lemonsqueezy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lemonsqueezy')>();
  return {
    ...actual,
    getLemonSqueezyConfig: () => mockGetLs(),
    listLemonSubscriptionsForEmail: (...args: unknown[]) => mockList(...args),
    cancelLemonSubscription: (...args: unknown[]) => mockCancel(...args),
    retrieveLemonSubscription: (...args: unknown[]) => mockRetrieve(...args),
  };
});

import { POST as cancelPost } from '@/app/api/account/cancel-subscription/route';
import { GET as portalGet } from '@/app/api/account/billing-portal/route';
import { __resetMemoryRateLimitForTests } from '@/lib/rate-limit';

const LS_CONFIG = {
  apiKey: 'test-key',
  storeId: '1',
  webhookSecret: 'whsec',
  variantIds: {},
};

function signedIn(email = 'user@example.com') {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'u-1', email, user_metadata: {} } },
        error: null,
      }),
    },
  });
  mockGetAdmin.mockReturnValue({ from: vi.fn() });
  mockGetLs.mockReturnValue(LS_CONFIG);
  mockEnsureProfile.mockResolvedValue({});
}

describe('POST /api/account/cancel-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
  });

  it('returns 401 when not signed in', async () => {
    mockGetLs.mockReturnValue(LS_CONFIG);
    mockGetAdmin.mockReturnValue({ from: vi.fn() });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const res = await cancelPost();
    expect(res.status).toBe(401);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('cancels the live Standard sub owned by the signed-in email', async () => {
    signedIn();
    mockList.mockResolvedValue([
      {
        id: 'sub-std',
        status: 'active',
        variantId: '8888',
        userEmail: 'user@example.com',
        renewsAt: '2026-09-24T00:00:00.000Z',
        endsAt: null,
        cancelled: false,
        customerPortalUrl: null,
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);
    mockCancel.mockResolvedValue({
      id: 'sub-std',
      status: 'cancelled',
      variantId: '8888',
      userEmail: 'user@example.com',
      renewsAt: null,
      endsAt: '2026-09-24T00:00:00.000Z',
      cancelled: true,
      customerPortalUrl: 'https://portal.example',
      planType: 'standard_subscription',
      membershipTier: 'standard_sub',
    });

    const res = await cancelPost();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cancelled).toBe(true);
    expect(json.ends_at).toBe('2026-09-24T00:00:00.000Z');
    expect(json.subscription.canCancel).toBe(false);
    expect(mockCancel).toHaveBeenCalledWith('test-key', 'sub-std');
    expect(mockList).toHaveBeenCalledWith('test-key', '1', 'user@example.com');
  });

  it('returns 404 when there is no live monthly subscription', async () => {
    signedIn();
    mockList.mockResolvedValue([
      {
        id: 'sub-done',
        status: 'cancelled',
        variantId: '8888',
        userEmail: 'user@example.com',
        renewsAt: null,
        endsAt: '2026-09-24T00:00:00.000Z',
        cancelled: true,
        customerPortalUrl: null,
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);
    const res = await cancelPost();
    expect(res.status).toBe(404);
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe('GET /api/account/billing-portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
  });

  it('returns 401 when not signed in', async () => {
    mockGetLs.mockReturnValue(LS_CONFIG);
    mockGetAdmin.mockReturnValue({ from: vi.fn() });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const res = await portalGet();
    expect(res.status).toBe(401);
  });

  it('returns a fresh signed portal URL', async () => {
    signedIn();
    mockList.mockResolvedValue([
      {
        id: 'sub-std',
        status: 'active',
        variantId: '8888',
        userEmail: 'user@example.com',
        renewsAt: '2026-09-24T00:00:00.000Z',
        endsAt: null,
        cancelled: false,
        customerPortalUrl: 'https://stale.example',
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);
    mockRetrieve.mockResolvedValue({
      id: 'sub-std',
      status: 'active',
      variantId: '8888',
      userEmail: 'user@example.com',
      renewsAt: '2026-09-24T00:00:00.000Z',
      endsAt: null,
      cancelled: false,
      customerPortalUrl: 'https://fresh.lemonsqueezy.com/billing',
      planType: 'standard_subscription',
      membershipTier: 'standard_sub',
    });
    const res = await portalGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://fresh.lemonsqueezy.com/billing' });
    expect(mockRetrieve).toHaveBeenCalledWith('test-key', 'sub-std');
  });
});
