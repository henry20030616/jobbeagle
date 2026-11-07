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

function createClaimMock(opts: {
  /** Results returned by successive claim_and_fulfill_order_entitlements calls */
  claimResults?: Array<'fulfilled' | 'idempotent' | 'missing' | Error>;
}) {
  const calls: Call[] = [];
  const results = [...(opts.claimResults ?? ['fulfilled'])];
  let claimIndex = 0;

  const admin = {
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
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
      if (name === 'claim_and_fulfill_order_entitlements') {
        const next = results[Math.min(claimIndex, results.length - 1)];
        claimIndex += 1;
        if (next instanceof Error) {
          return { data: null, error: { message: next.message } };
        }
        return { data: next, error: null };
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

  it('no-ops when claim RPC reports idempotent (does not re-touch reports)', async () => {
    const { admin, calls } = createClaimMock({ claimResults: ['idempotent'] });
    await fulfillOrder(
      admin,
      'order-1',
      'user-1',
      'single_job_fit_snapshot',
      'report-1',
      'pay_1',
    );
    expect(calls.filter((c) => c.op === 'rpc')).toHaveLength(1);
    expect(calls.filter((c) => c.op === 'update')).toHaveLength(0);
  });

  it('grants snapshot credits via atomic claim RPC', async () => {
    const { admin, calls } = createClaimMock({ claimResults: ['fulfilled'] });
    await fulfillOrder(
      admin,
      'order-2',
      'user-2',
      'single_job_fit_snapshot',
      null,
      'pay_2',
    );
    const rpc = calls.find((c) => c.op === 'rpc' && c.rpc === 'claim_and_fulfill_order_entitlements');
    expect(rpc?.payload).toMatchObject({
      p_order_id: 'order-2',
      p_user_id: 'user-2',
      p_job_fit_snapshot: 1,
      p_interview_strategy_guide: 0,
      p_membership_tier: null,
      p_external_payment_id: 'pay_2',
    });
  });

  it('second concurrent fulfill is idempotent — claim RPC only grants once', async () => {
    const { admin, calls } = createClaimMock({
      claimResults: ['fulfilled', 'idempotent'],
    });
    await fulfillOrder(admin, 'order-race', 'user-race', 'single_job_fit_snapshot', null, 'pay-a');
    await fulfillOrder(admin, 'order-race', 'user-race', 'single_job_fit_snapshot', null, 'pay-b');
    const claims = calls.filter(
      (c) => c.op === 'rpc' && c.rpc === 'claim_and_fulfill_order_entitlements',
    );
    expect(claims).toHaveLength(2);
    expect(claims[0]?.payload).toMatchObject({ p_job_fit_snapshot: 1 });
    expect(claims[1]?.payload).toMatchObject({ p_job_fit_snapshot: 1 });
    // Side effects only after first fulfilled — no duplicate report updates here.
    expect(calls.filter((c) => c.op === 'update')).toHaveLength(0);
  });

  it('passes subscription allowance + tier into the atomic claim', async () => {
    const { admin, calls } = createClaimMock({ claimResults: ['fulfilled'] });
    await fulfillOrder(
      admin,
      'order-sub',
      'user-sub',
      'advanced_subscription',
      null,
      'paypal-sub-1',
    );
    const rpc = calls.find((c) => c.op === 'rpc' && c.rpc === 'claim_and_fulfill_order_entitlements');
    expect(rpc?.payload).toMatchObject({
      p_user_id: 'user-sub',
      p_job_fit_snapshot: 100,
      p_interview_strategy_guide: 15,
      p_membership_tier: 'advanced_sub',
    });
  });

  it('author_sponsor claims success without credit amounts', async () => {
    const { admin, calls } = createClaimMock({ claimResults: ['fulfilled'] });
    await fulfillOrder(admin, 'order-tip', 'user-tip', 'author_sponsor', null, 'paypal-tip-1');
    const rpc = calls.find((c) => c.op === 'rpc' && c.rpc === 'claim_and_fulfill_order_entitlements');
    expect(rpc?.payload).toMatchObject({
      p_job_fit_snapshot: 0,
      p_interview_strategy_guide: 0,
      p_membership_tier: null,
    });
  });

  it('marks Guide report premium only after a successful claim', async () => {
    const { admin, calls } = createClaimMock({ claimResults: ['fulfilled'] });
    await fulfillOrder(
      admin,
      'order-guide',
      'user-guide',
      'single_interview_strategy_guide',
      'report-9',
      'pay-g',
    );
    const reportUpdate = calls.find((c) => c.op === 'update' && c.table === 'analysis_reports');
    expect(reportUpdate?.payload).toMatchObject({ is_premium: true });
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
