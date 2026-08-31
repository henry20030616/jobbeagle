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
  applyMembershipFromPaddleSubscriptions: (...args: unknown[]) => mockApply(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/paddle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/paddle')>();
  return {
    ...actual,
    getPaddleConfig: () => ({
      apiKey: 'test-key',
      environment: 'sandbox' as const,
      webhookSecret: 'whsec',
      priceIds: {},
    }),
    getPaddleClient: () => ({}),
    listPaddleSubscriptionsForEmail: (...args: unknown[]) => mockList(...args),
  };
});

import { POST } from '@/app/api/payment/webhook/route';

function signedPaddleRequest(body: object, secret = 'whsec') {
  const raw = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}:${raw}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  const paddleSignature = `ts=${timestamp};h1=${signature}`;
  
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    headers: { 'paddle-signature': paddleSignature, 'content-type': 'application/json' },
    body: raw,
  });
}

describe('Paddle subscription lifecycle webhook', () => {
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
      signedPaddleRequest({ event_type: 'subscription.canceled' }, 'wrong'),
    );
    expect(res.status).toBe(400);
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('does not downgrade on subscription_canceled', async () => {
    const res = await POST(
      signedPaddleRequest({
        event_type: 'subscription.canceled',
        data: {
          id: 'sub-1',
          status: 'canceled',
          customer_email: 'user@example.com',
          custom_data: { user_id: 'u-1', plan_type: 'standard_subscription' },
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      lifecycle: 'subscription.canceled',
    });
    expect(mockApply).toHaveBeenCalled();
  });

  it('handles subscription lifecycle events', async () => {
    mockList.mockResolvedValue([
      {
        id: 'sub-1',
        status: 'canceled',
        priceId: 'pri_123',
        customerEmail: 'user@example.com',
        currentBillingPeriodEndsAt: null,
        scheduledChange: null,
        planType: 'standard_subscription',
        membershipTier: 'standard_sub',
      },
    ]);

    const res = await POST(
      signedPaddleRequest({
        event_type: 'subscription.canceled',
        data: {
          id: 'sub-1',
          status: 'canceled',
          customer_email: 'user@example.com',
          custom_data: { user_id: 'u-1', plan_type: 'standard_subscription' },
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockApply).toHaveBeenCalledWith(
      expect.anything(),
      'u-1',
      expect.any(Array),
      { emptyMeans: 'free' },
    );
  });
});
