import type { CheckoutPlanType } from '@/constants/checkout-plans';

export async function startCheckout(
  planType: CheckoutPlanType,
  reportId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planType, reportId: reportId ?? undefined }),
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
