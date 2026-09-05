import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: vi.fn() }),
}));

vi.mock('@/lib/paypal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/paypal')>();
  return {
    ...actual,
    getPayPalConfig: () => ({
      clientId: 'id',
      clientSecret: 'secret',
      environment: 'live' as const,
      webhookId: 'wh',
      planIds: { standard_subscription: 'P-1', advanced_subscription: 'P-2' },
    }),
  };
});

import { POST } from '@/app/api/payment/webhook/route';

describe('PayPal webhook routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without PayPal transmission headers', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/payment/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event_type: 'BILLING.SUBSCRIPTION.CANCELLED' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Unknown webhook provider' });
  });
});
