import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fulfillOrder, fulfillSubscriptionRenewal, downgradeExpiredSubscription } from '@/lib/fulfill-order';
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
      available_job_fit_snapshot_credits: 100,
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
