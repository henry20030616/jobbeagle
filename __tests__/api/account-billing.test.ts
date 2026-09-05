import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateClient = vi.fn();
const mockGetAdmin = vi.fn();
const mockEnsureProfile = vi.fn();
const mockFindLive = vi.fn();
const mockCancel = vi.fn();
const mockGetPayPal = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/profiles', () => ({
  ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
}));

vi.mock('@/lib/paypal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/paypal')>();
  return {
    ...actual,
    getPayPalConfig: () => mockGetPayPal(),
    findLivePayPalSubscription: (...args: unknown[]) => mockFindLive(...args),
    cancelPayPalSubscription: (...args: unknown[]) => mockCancel(...args),
    paypalBillingPortalUrl: () => 'https://www.paypal.com/myaccount/autopay/',
  };
});

import { POST as cancelPost } from '@/app/api/account/cancel-subscription/route';
import { GET as portalGet } from '@/app/api/account/billing-portal/route';
import { __resetMemoryRateLimitForTests } from '@/lib/rate-limit';

const PAYPAL_CONFIG = {
  clientId: 'id',
  clientSecret: 'secret',
  environment: 'live' as const,
  webhookId: 'wh',
  planIds: { standard_subscription: 'P-1', advanced_subscription: 'P-2' },
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
  mockGetPayPal.mockReturnValue(PAYPAL_CONFIG);
  mockEnsureProfile.mockResolvedValue({});
}

describe('POST /api/account/cancel-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
  });

  it('returns 401 when not signed in', async () => {
    mockGetPayPal.mockReturnValue(PAYPAL_CONFIG);
    mockGetAdmin.mockReturnValue({ from: vi.fn() });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const res = await cancelPost();
    expect(res.status).toBe(401);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('cancels the live PayPal subscription', async () => {
    signedIn();
    mockFindLive.mockResolvedValue({
      id: 'I-SUB1',
      status: 'ACTIVE',
      customId: 'order-1',
      nextBillingTime: '2026-10-03T00:00:00Z',
    });
    mockCancel.mockResolvedValue(undefined);
    const res = await cancelPost();
    expect(res.status).toBe(200);
    expect(mockCancel).toHaveBeenCalledWith('I-SUB1');
  });
});

describe('GET /api/account/billing-portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
    signedIn();
  });

  it('returns the PayPal billing portal URL', async () => {
    mockFindLive.mockResolvedValue({
      id: 'I-SUB1',
      status: 'ACTIVE',
      customId: 'order-1',
      nextBillingTime: null,
    });
    const res = await portalGet();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.url).toContain('paypal.com');
  });
});
