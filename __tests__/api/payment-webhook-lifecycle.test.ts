import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const mockApply = vi.fn();
const mockFulfill = vi.fn();
const mockRenew = vi.fn();
const mockList = vi.fn();
const mockGetAdmin = vi.fn();

vi.mock('@/lib/fulfill-order', () => ({
  fulfillOrder: (...args: unknown[]) => mockFulfill(...args),
  fulfillSubscriptionRenewal: (...args: unknown[]) => mockRenew(...args),
  applyMembershipFromLemonSubscriptions: (...args: unknown[]) => mockApply(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/lemonsqueezy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lemonsqueezy')>();
  return {
    ...actual,
    getLemonSqueezyConfig: () => ({
      apiKey: 'test-key',
      storeId: '1',
      webhookSecret: 'whsec',
      variantIds: {},
    }),
    listLemonSubscriptionsForEmail: (...args: unknown[]) => mockList(...args),
  };
});

import { POST } from '@/app/api/payment/webhook/route';

function signedRequest(body: object, secret = 'whsec') {
  const raw = JSON.stringify(body);
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    headers: { 'x-signature': signature, 'content-type': 'application/json' },
    body: raw,
  });
}

describe('Lemon Squeezy subscription lifecycle webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdmin.mockReturnValue({
      from: vi.fn(),
      auth: { admin: { listUsers: vi.fn() } },
    });
    mockList.mockResolvedValue([]);
    mockApply.mockResolvedValue('free');
  });

  it('rejects an invalid signature', async () => {
    const res = await POST(
      signedRequest({ meta: { event_name: 'subscription_expired' } }, 'wrong'),
    );
    expect(res.status).toBe(400);
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('does not downgrade on subscription_cancelled', async () => {
    const res = await POST(
      signedRequest({
        meta: {
          event_name: 'subscription_cancelled',
          custom_data: { user_id: 'u-1', plan_type: 'standard_subscription' },
        },
        data: {
          id: 'sub-1',
          attributes: { status: 'cancelled', user_email: 'user@example.com' },
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      lifecycle: 'subscription_cancelled',
    });
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('downgrades membership when the subscription expires', async () => {
    const res = await POST(
      signedRequest({
        meta: {
          event_name: 'subscription_expired',
          custom_data: { user_id: 'u-1', plan_type: 'standard_subscription' },
        },
        data: {
          id: 'sub-1',
          attributes: { status: 'expired', user_email: 'user@example.com' },
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      lifecycle: 'subscription_expired',
    });
    expect(mockApply).toHaveBeenCalledWith(
      expect.anything(),
      'u-1',
      [],
      { emptyMeans: 'free' },
    );
  });
});
