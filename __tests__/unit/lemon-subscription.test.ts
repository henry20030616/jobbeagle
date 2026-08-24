import { describe, it, expect } from 'vitest';
import {
  desiredMembershipFromLemonSubscriptions,
  isInCancelGrace,
  parseLemonSubscriptionRow,
  pickCancellableLemonSubscription,
  pickManageableLemonSubscription,
  toLemonSubscriptionBillingView,
  type LemonSubscriptionSummary,
} from '@/lib/lemonsqueezy';

function sub(
  partial: Partial<LemonSubscriptionSummary> & Pick<LemonSubscriptionSummary, 'id' | 'status'>,
): LemonSubscriptionSummary {
  return {
    variantId: '8888',
    userEmail: 'user@example.com',
    renewsAt: null,
    endsAt: null,
    cancelled: false,
    customerPortalUrl: null,
    planType: 'standard_subscription',
    membershipTier: 'standard_sub',
    ...partial,
  };
}

describe('parseLemonSubscriptionRow', () => {
  it('reads portal URL, ends_at, and cancelled flag', () => {
    const parsed = parseLemonSubscriptionRow({
      id: '42',
      attributes: {
        status: 'cancelled',
        variant_id: 8888,
        user_email: 'user@example.com',
        renews_at: null,
        ends_at: '2026-09-01T00:00:00.000000Z',
        cancelled: true,
        urls: { customer_portal: 'https://lemonsqueezy.com/billing?token=abc' },
      },
    });
    expect(parsed.id).toBe('42');
    expect(parsed.cancelled).toBe(true);
    expect(parsed.endsAt).toBe('2026-09-01T00:00:00.000000Z');
    expect(parsed.customerPortalUrl).toContain('lemonsqueezy.com/billing');
  });
});

describe('pickCancellableLemonSubscription', () => {
  it('prefers Advanced over Standard when both are live', () => {
    const chosen = pickCancellableLemonSubscription([
      sub({ id: 'std', status: 'active' }),
      sub({
        id: 'adv',
        status: 'on_trial',
        membershipTier: 'advanced_sub',
        planType: 'advanced_subscription',
      }),
    ]);
    expect(chosen?.id).toBe('adv');
  });

  it('does not treat a cancelled sub as cancellable', () => {
    const chosen = pickCancellableLemonSubscription([
      sub({
        id: 'c1',
        status: 'cancelled',
        cancelled: true,
        endsAt: '2099-01-01T00:00:00.000Z',
      }),
    ]);
    expect(chosen).toBeNull();
  });
});

describe('pickManageableLemonSubscription', () => {
  it('falls back to a cancelled-in-grace sub for the customer portal', () => {
    const now = Date.parse('2026-08-24T00:00:00.000Z');
    const chosen = pickManageableLemonSubscription(
      [
        sub({
          id: 'grace',
          status: 'cancelled',
          cancelled: true,
          endsAt: '2026-09-01T00:00:00.000Z',
        }),
      ],
      now,
    );
    expect(chosen?.id).toBe('grace');
  });
});

describe('desiredMembershipFromLemonSubscriptions', () => {
  it('keeps paid tier during cancel grace', () => {
    const now = Date.parse('2026-08-24T00:00:00.000Z');
    expect(
      desiredMembershipFromLemonSubscriptions(
        [
          sub({
            id: 'grace',
            status: 'cancelled',
            cancelled: true,
            endsAt: '2026-09-01T00:00:00.000Z',
          }),
        ],
        now,
      ),
    ).toBe('standard_sub');
  });

  it('returns free when the cancelled period has ended', () => {
    const now = Date.parse('2026-09-02T00:00:00.000Z');
    expect(
      desiredMembershipFromLemonSubscriptions(
        [
          sub({
            id: 'done',
            status: 'expired',
            cancelled: true,
            endsAt: '2026-09-01T00:00:00.000Z',
          }),
        ],
        now,
      ),
    ).toBe('free');
  });

  it('isInCancelGrace is false without endsAt', () => {
    expect(
      isInCancelGrace(sub({ id: 'x', status: 'cancelled', cancelled: true, endsAt: null })),
    ).toBe(false);
  });
});

describe('toLemonSubscriptionBillingView', () => {
  it('exposes canCancel only for live monthly plans', () => {
    const view = toLemonSubscriptionBillingView(sub({ id: 'live', status: 'active' }));
    expect(view).toMatchObject({ canCancel: true, canManage: true, cancelled: false });
    const cancelled = toLemonSubscriptionBillingView(
      sub({ id: 'c', status: 'cancelled', cancelled: true, endsAt: '2026-09-01T00:00:00Z' }),
    );
    expect(cancelled?.canCancel).toBe(false);
  });
});
