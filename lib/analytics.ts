import { CHECKOUT_PLANS, type CheckoutPlanType } from '@/constants/checkout-plans';

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-5EV9NSSJRW';

export const ANALYTICS_EVENTS = {
  pageView: 'page_view',
  loginClick: 'login_click',
  extensionInstallClick: 'extension_install_click',
  confirmView: 'confirm_view',
  analyzeStart: 'analyze_start',
  analyzeComplete: 'analyze_complete',
  analyzeError: 'analyze_error',
  paywallView: 'paywall_view',
  beginCheckout: 'begin_checkout',
  purchase: 'purchase',
  checkoutCancel: 'checkout_cancel',
  exception: 'exception',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsParam = string | number | boolean;

const PENDING_CHECKOUT_KEY = 'jb_pending_checkout';

type PendingCheckout = {
  planType: string;
  value: number;
};

function gtagFn(): ((...args: unknown[]) => void) | null {
  if (typeof window === 'undefined') return null;
  return typeof window.gtag === 'function' ? window.gtag : null;
}

function clipParam(value: AnalyticsParam): AnalyticsParam {
  if (typeof value === 'string') {
    return value.length > 100 ? `${value.slice(0, 99)}…` : value;
  }
  return value;
}

function cleanParams(
  params?: Record<string, AnalyticsParam | null | undefined>,
): Record<string, AnalyticsParam> {
  const cleaned: Record<string, AnalyticsParam> = {};
  if (!params) return cleaned;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    cleaned[key] = clipParam(value);
  }
  return cleaned;
}

function trackVercel(name: string, params: Record<string, AnalyticsParam>): void {
  if (typeof window === 'undefined') return;
  void import('@vercel/analytics')
    .then(({ track }) => {
      track(name, params);
    })
    .catch(() => {
      /* analytics package missing in some test envs */
    });
}

export function trackEvent(
  name: AnalyticsEventName | string,
  params?: Record<string, AnalyticsParam | null | undefined>,
): void {
  const cleaned = cleanParams(params);
  const send = gtagFn();
  if (send) send('event', name, cleaned);
  trackVercel(name, cleaned);
}

export function trackPageView(path: string): void {
  const send = gtagFn();
  if (!send || !GA_MEASUREMENT_ID) return;
  send('event', ANALYTICS_EVENTS.pageView, {
    page_path: clipParam(path),
    page_location: clipParam(`${window.location.origin}${path}`),
    page_title: typeof document !== 'undefined' ? clipParam(document.title) : path,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackException(message: string, fatal = false): void {
  trackEvent(ANALYTICS_EVENTS.exception, {
    description: message,
    fatal,
  });
}

export function checkoutValueUsd(planType: CheckoutPlanType, amountUsd?: string): number {
  if (planType === 'author_sponsor' && amountUsd) {
    const parsed = Number.parseFloat(amountUsd);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed * 100) / 100;
  }
  return CHECKOUT_PLANS[planType].amountCents / 100;
}

export function rememberPendingCheckout(planType: CheckoutPlanType, value: number): void {
  if (typeof window === 'undefined') return;
  const payload: PendingCheckout = { planType, value };
  try {
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function consumePendingCheckout(): PendingCheckout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!('planType' in parsed) || typeof parsed.planType !== 'string') return null;
    const value =
      'value' in parsed && typeof parsed.value === 'number' && Number.isFinite(parsed.value)
        ? parsed.value
        : 0;
    return { planType: parsed.planType, value };
  } catch {
    return null;
  }
}

export function trackCheckoutReturn(status: 'success' | 'cancel' | 'error'): void {
  const pending = consumePendingCheckout();
  if (status === 'success') {
    trackEvent(ANALYTICS_EVENTS.purchase, {
      currency: 'USD',
      value: pending?.value ?? 0,
      item_id: pending?.planType ?? 'unknown',
      transaction_id: pending?.planType ?? 'paypal',
    });
    return;
  }
  if (status === 'cancel') {
    trackEvent(ANALYTICS_EVENTS.checkoutCancel, {
      item_id: pending?.planType ?? 'unknown',
    });
  }
}
