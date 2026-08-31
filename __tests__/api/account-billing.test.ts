import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateClient = vi.fn();
const mockGetAdmin = vi.fn();
const mockEnsureProfile = vi.fn();
const mockList = vi.fn();
const mockCancel = vi.fn();
const mockRetrieve = vi.fn();
const mockGetPaddle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/profiles', () => ({
  ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
}));

vi.mock('@/lib/paddle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/paddle')>();
  return {
    ...actual,
    getPaddleConfig: () => mockGetPaddle(),
    getPaddleClient: () => ({}),
    listPaddleSubscriptionsForEmail: (...args: unknown[]) => mockList(...args),
    cancelPaddleSubscription: (...args: unknown[]) => mockCancel(...args),
    retrievePaddleSubscription: (...args: unknown[]) => mockRetrieve(...args),
    createPaddleCustomerPortalUrl: async () => 'https://customer-portal.paddle.com/session',
  };
});

import { POST as cancelPost } from '@/app/api/account/cancel-subscription/route';
import { GET as portalGet } from '@/app/api/account/billing-portal/route';
import { __resetMemoryRateLimitForTests } from '@/lib/rate-limit';

const PADDLE_CONFIG = {
  apiKey: 'test-key',
  environment: 'sandbox' as const,
  webhookSecret: 'whsec',
  priceIds: {},
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
  mockGetPaddle.mockReturnValue(PADDLE_CONFIG);
  mockEnsureProfile.mockResolvedValue({});
}

describe('POST /api/account/cancel-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
  });

  it('returns 401 when not signed in', async () => {
    mockGetPaddle.mockReturnValue(PADDLE_CONFIG);
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
        priceId: 'pri_123',
        customerId: 'ctm_1',
        customerEmail: 'user@example.com',
        currentBillingPeriodEndsAt: '2026-09-24T00:00:00.000Z',
        scheduledChange: null,
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);
    mockCancel.mockResolvedValue({
        id: 'sub-std',
        status: 'canceled',
        priceId: 'pri_123',
        customerId: 'ctm_1',
        customerEmail: 'user@example.com',
      currentBillingPeriodEndsAt: '2026-09-24T00:00:00.000Z',
      scheduledChange: { action: 'cancel', effectiveAt: '2026-09-24T00:00:00.000Z' },
      planType: 'standard_subscription',
      membershipTier: 'standard_sub',
    });

    const res = await cancelPost();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cancelled).toBe(true);
    expect(json.current_billing_period_ends_at).toBe('2026-09-24T00:00:00.000Z');
    expect(json.subscription.canCancel).toBe(false);
    expect(mockCancel).toHaveBeenCalledWith({}, 'sub-std');
    expect(mockList).toHaveBeenCalledWith({}, 'user@example.com');
  });

  it('returns 404 when there is no live monthly subscription', async () => {
    signedIn();
    mockList.mockResolvedValue([
      {
        id: 'sub-done',
        status: 'canceled',
        priceId: 'pri_123',
        customerId: 'ctm_1',
        customerEmail: 'user@example.com',
        currentBillingPeriodEndsAt: '2026-09-24T00:00:00.000Z',
        scheduledChange: null,
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
    mockGetPaddle.mockReturnValue(PADDLE_CONFIG);
    mockGetAdmin.mockReturnValue({ from: vi.fn() });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const res = await portalGet();
    expect(res.status).toBe(401);
  });

  it('returns the Paddle customer portal URL', async () => {
    signedIn();
    mockList.mockResolvedValue([
      {
        id: 'sub-std',
        status: 'active',
        priceId: 'pri_123',
        customerId: 'ctm_1',
        customerEmail: 'user@example.com',
        currentBillingPeriodEndsAt: '2026-09-24T00:00:00.000Z',
        scheduledChange: null,
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);
    const res = await portalGet();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://customer-portal.paddle.com/session');
  });
});
