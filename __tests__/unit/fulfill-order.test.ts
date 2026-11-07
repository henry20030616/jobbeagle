import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fulfillOrder,
  fulfillSubscriptionRenewal,
  downgradeExpiredSubscription,
  markSubscriptionActivated,
  recordSubscriptionSaleAndMaybeRenew,
  SUBSCRIPTION_ACTIVATED_MARKER,
} from '@/lib/fulfill-order';
import type { SupabaseClient } from '@supabase/supabase-js';

type Call = { op: string; table?: string; payload?: unknown; rpc?: string };

function createFulfillMock(opts: {
  orderStatus?: string | null;
  rpcErrorFirst?: boolean;
}) {
  const calls: Call[] = [];
  let orderSelectDone = false;

  const admin = {
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      chain.select = vi.fn(self);
      chain.eq = vi.fn(self);
      chain.maybeSingle = vi.fn(async () => {
        if (table === 'orders' && !orderSelectDone) {
          orderSelectDone = true;
          calls.push({ op: 'select', table });
          return {
            data: opts.orderStatus ? { status: opts.orderStatus } : null,
            error: null,
          };
        }
        return { data: null, error: null };
      });
      chain.update = vi.fn((payload: unknown) => {
        calls.push({ op: 'update', table, payload });
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
            then: undefined,
            error: null,
          })),
        };
      });
      // Make update().eq() awaitable as { error }
      chain.update = vi.fn((payload: unknown) => {
        calls.push({ op: 'update', table, payload });
        const result = Promise.resolve({ error: null });
        const eqChain = {
          eq: vi.fn(() => eqChain),
          then: result.then.bind(result),
        };
        return eqChain;
      });
      return chain;
    },
    rpc: vi.fn(async (name: string, args: unknown) => {
      calls.push({ op: 'rpc', rpc: name, payload: args });
      if (opts.rpcErrorFirst && calls.filter((c) => c.op === 'rpc').length === 1) {
        return { error: { message: 'legacy schema' } };
      }
      return { error: null };
    }),
  };

  return { admin: admin as unknown as SupabaseClient, calls };
}

describe('fulfillOrder idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no-ops when order already succeeded (does not grant credits twice)', async () => {
    const { admin, calls } = createFulfillMock({ orderStatus: 'succeeded' });
    await fulfillOrder(
      admin,
      'order-1',
      'user-1',
      'single_job_fit_snapshot',
      null,
      'ls_pay_1',
    );
    expect(calls.filter((c) => c.op === 'rpc')).toHaveLength(0);
    expect(calls.filter((c) => c.op === 'update' && c.table === 'orders')).toHaveLength(0);
  });

  it('grants snapshot credits then marks order succeeded', async () => {
    const { admin, calls } = createFulfillMock({ orderStatus: 'pending' });
    await fulfillOrder(
      admin,
      'order-2',
      'user-2',
      'single_job_fit_snapshot',
      null,
      'ls_pay_2',
    );
    const rpc = calls.find((c) => c.op === 'rpc' && c.rpc === 'increment_profile_credits');
    expect(rpc).toBeTruthy();
    expect(rpc?.payload).toMatchObject({
      p_user_id: 'user-2',
      p_job_fit_snapshot: 1,
      p_interview_strategy_guide: 0,
    });
    const orderUpdate = calls.find((c) => c.op === 'update' && c.table === 'orders');
    expect(orderUpdate?.payload).toMatchObject({ status: 'succeeded' });
  });

  it('adds subscription allowance instead of replacing leftover credits', async () => {
    const { admin, calls } = createFulfillMock({ orderStatus: 'pending' });
    await fulfillOrder(
      admin,
      'order-sub',
      'user-sub',
      'advanced_subscription',
      null,
      'paypal-sub-1',
    );
    const rpc = calls.find((c) => c.op === 'rpc' && c.rpc === 'increment_profile_credits');
    expect(rpc?.payload).toMatchObject({
      p_user_id: 'user-sub',
      p_job_fit_snapshot: 100,
      p_interview_strategy_guide: 15,
    });
    const profileUpdates = calls.filter((c) => c.op === 'update' && c.table === 'profiles');
    expect(profileUpdates).toHaveLength(1);
    expect(profileUpdates[0]?.payload).toMatchObject({ membership_tier: 'advanced_sub' });
    expect(profileUpdates[0]?.payload).not.toHaveProperty('available_job_fit_snapshot_credits');
  });

  it('author_sponsor marks the order paid without granting credits', async () => {
    const { admin, calls } = createFulfillMock({ orderStatus: 'pending' });
    await fulfillOrder(admin, 'order-tip', 'user-tip', 'author_sponsor', null, 'paypal-tip-1');
    expect(calls.filter((c) => c.op === 'rpc')).toHaveLength(0);
    const orderUpdate = calls.find((c) => c.op === 'update' && c.table === 'orders');
    expect(orderUpdate?.payload).toMatchObject({ status: 'succeeded' });
  });
});

describe('fulfillSubscriptionRenewal', () => {
  it('resets monthly allowance for standard_sub', async () => {
    const updates: unknown[] = [];
    const admin = {
      from: () => ({
        update: (payload: unknown) => {
          updates.push(payload);
          return {
            eq: async () => ({ error: null }),
          };
        },
      }),
    } as unknown as SupabaseClient;

    await fulfillSubscriptionRenewal(admin, 'user-sub', 'standard_sub');
    expect(updates[0]).toMatchObject({
      membership_tier: 'standard_sub',
      available_job_fit_snapshot_credits: 50,
      available_interview_strategy_guide_credits: 5,
    });
  });
});

describe('downgradeExpiredSubscription', () => {
  it('sets membership_tier to free without touching credits', async () => {
    const updates: unknown[] = [];
    const admin = {
      from: () => ({
        update: (payload: unknown) => {
          updates.push(payload);
          return {
            eq: async () => ({ error: null }),
          };
        },
      }),
    } as unknown as SupabaseClient;

    await downgradeExpiredSubscription(admin, 'user-sub');
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ membership_tier: 'free' });
    expect(updates[0]).not.toHaveProperty('available_job_fit_snapshot_credits');
  });
});

describe('recordSubscriptionSaleAndMaybeRenew', () => {
  function createRenewalMock() {
    const updates: unknown[] = [];
    const admin = {
      from: () => ({
        update: (payload: unknown) => {
          updates.push(payload);
          return {
            eq: async () => ({ error: null }),
          };
        },
      }),
    } as unknown as SupabaseClient;
    return { admin, updates };
  }

  it('records the first sale after activation without renewing credits', async () => {
    const { admin, updates } = createRenewalMock();
    const result = await recordSubscriptionSaleAndMaybeRenew(
      admin,
      {
        id: 'order-1',
        user_id: 'user-1',
        plan_type: 'standard_subscription',
        metadata: { processed_sale_ids: [SUBSCRIPTION_ACTIVATED_MARKER] },
      },
      'sale-first',
    );
    expect(result).toBe('initial_sale_recorded');
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      metadata: {
        processed_sale_ids: [SUBSCRIPTION_ACTIVATED_MARKER, 'sale-first'],
      },
    });
  });

  it('resets monthly allowance on a later sale id', async () => {
    const { admin, updates } = createRenewalMock();
    const result = await recordSubscriptionSaleAndMaybeRenew(
      admin,
      {
        id: 'order-1',
        user_id: 'user-1',
        plan_type: 'standard_subscription',
        metadata: {
          processed_sale_ids: [SUBSCRIPTION_ACTIVATED_MARKER, 'sale-first'],
        },
      },
      'sale-month-2',
    );
    expect(result).toBe('renewed');
    expect(updates.length).toBeGreaterThanOrEqual(2);
    expect(updates.some((u) => {
      const row = u as Record<string, unknown>;
      return row.available_job_fit_snapshot_credits === 50;
    })).toBe(true);
  });

  it('is idempotent when the same sale id is replayed', async () => {
    const { admin, updates } = createRenewalMock();
    const result = await recordSubscriptionSaleAndMaybeRenew(
      admin,
      {
        id: 'order-1',
        user_id: 'user-1',
        plan_type: 'advanced_subscription',
        metadata: {
          processed_sale_ids: [SUBSCRIPTION_ACTIVATED_MARKER, 'sale-1'],
        },
      },
      'sale-1',
    );
    expect(result).toBe('idempotent');
    expect(updates).toHaveLength(0);
  });

  it('markSubscriptionActivated stamps the activation marker once', async () => {
    const { admin, updates } = createRenewalMock();
    await markSubscriptionActivated(admin, 'order-1', { plan_label: 'Standard' });
    expect(updates[0]).toMatchObject({
      metadata: {
        plan_label: 'Standard',
        processed_sale_ids: [SUBSCRIPTION_ACTIVATED_MARKER],
      },
    });
  });
});
