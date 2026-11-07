import type { CheckoutPlanType } from '@/constants/checkout-plans';
import {
  ANALYTICS_EVENTS,
  checkoutItem,
  checkoutValueUsd,
  rememberPendingCheckout,
  trackEvent,
} from '@/lib/analytics';

export async function startCheckout(
  planType: CheckoutPlanType,
  reportId?: string | null,
  amountUsd?: string,
  couponCode?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const value = checkoutValueUsd(planType, amountUsd);
  rememberPendingCheckout(planType, value);
  trackEvent(ANALYTICS_EVENTS.beginCheckout, {
    currency: 'USD',
    value,
    items: [checkoutItem(planType, value)],
  });

  const trimmedCoupon = couponCode?.trim();
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planType,
      reportId: reportId ?? undefined,
      ...(amountUsd != null ? { amountUsd } : {}),
      ...(trimmedCoupon ? { couponCode: trimmedCoupon } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data.error || 'Checkout failed' };
  }

  if (data.url) {
    window.location.href = data.url;
    return { ok: true };
  }

  return { ok: false, error: 'No checkout URL returned' };
}
