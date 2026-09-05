import { CHECKOUT_PLANS, type CheckoutPlanType } from '@/constants/checkout-plans';

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-5EV9NSSJRW';

/**
 * Conversion funnel — these seven names are the only nodes worth optimizing.
 * GA4 recommended events keep login / paywall / checkout / purchase in standard reports.
 */
export const FUNNEL = {
  signUp: { event: 'sign_up', step: 1 },
  login: { event: 'login', step: 1 },
  addExtension: { event: 'add_extension', step: 2 },
  preflight: { event: 'preflight', step: 3 },
  jobAnalyzed: { event: 'job_analyzed', step: 4 },
  paywall: { event: 'view_item_list', step: 5 },
  beginCheckout: { event: 'begin_checkout', step: 6 },
  purchase: { event: 'purchase', step: 7 },
} as const;

export const ANALYTICS_EVENTS = {
  pageView: 'page_view',
  login: FUNNEL.login.event,
  signUp: FUNNEL.signUp.event,
  extensionInstallClick: FUNNEL.addExtension.event,
  confirmView: FUNNEL.preflight.event,
  analyzeStart: 'analyze_start',
  analyzeComplete: FUNNEL.jobAnalyzed.event,
  analyzeError: 'analyze_error',
  reportView: 'view_report',
  paywallView: FUNNEL.paywall.event,
  beginCheckout: FUNNEL.beginCheckout.event,
  purchase: FUNNEL.purchase.event,
  checkoutCancel: 'checkout_cancel',
  exception: 'exception',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsParam = string | number | boolean;

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

type EventParams = Record<string, AnalyticsParam | AnalyticsItem[] | null | undefined>;

const PENDING_CHECKOUT_KEY = 'jb_pending_checkout';
const AUTH_TRACK_PREFIX = 'jb_auth_ev_';
const DEBUG_KEY = 'jb_ga_debug';

type PendingCheckout = {
  planType: string;
  value: number;
};

type QueuedEvent = { name: string; params: Record<string, AnalyticsParam | AnalyticsItem[]> };

const queue: QueuedEvent[] = [];
let flushTimer: number | null = null;

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

function cleanParams(params?: EventParams): Record<string, AnalyticsParam | AnalyticsItem[]> {
  const cleaned: Record<string, AnalyticsParam | AnalyticsItem[]> = {};
  if (!params) return cleaned;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      cleaned[key] = value;
      continue;
    }
    cleaned[key] = clipParam(value);
  }
  return cleaned;
}

function funnelStepFor(name: string): number | undefined {
  for (const node of Object.values(FUNNEL)) {
    if (node.event === name) return node.step;
  }
  return undefined;
}

function flushQueue(): void {
  const send = gtagFn();
  if (!send) return;
  while (queue.length > 0) {
    const next = queue.shift();
    if (next) send('event', next.name, next.params);
  }
}

function scheduleFlush(): void {
  if (typeof window === 'undefined' || flushTimer != null) return;
  const started = Date.now();
  flushTimer = window.setInterval(() => {
    if (gtagFn() || Date.now() - started > 8000) {
      if (flushTimer != null) window.clearInterval(flushTimer);
      flushTimer = null;
      flushQueue();
    }
  }, 200);
}

function trackVercel(name: string, params: Record<string, AnalyticsParam | AnalyticsItem[]>): void {
  if (typeof window === 'undefined') return;
  const vercelParams: Record<string, AnalyticsParam> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      vercelParams[key] = value;
    }
  }
  void import('@vercel/analytics')
    .then(({ track }) => {
      track(name, vercelParams);
    })
    .catch(() => {
      /* analytics package missing in some test envs */
    });
}

export function enableGaDebug(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DEBUG_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function isGaDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

export function trackEvent(name: AnalyticsEventName | string, params?: EventParams): void {
  const cleaned = cleanParams(params);
  const step = funnelStepFor(name);
  if (step !== undefined && cleaned.funnel_step === undefined) {
    cleaned.funnel_step = step;
  }
  if (isGaDebugEnabled() && cleaned.debug_mode === undefined) {
    cleaned.debug_mode = true;
  }
  const send = gtagFn();
  if (send) send('event', name, cleaned);
  else {
    queue.push({ name, params: cleaned });
    scheduleFlush();
  }
  trackVercel(name, cleaned);
}

export function trackPageView(path: string): void {
  trackEvent(ANALYTICS_EVENTS.pageView, {
    page_path: path,
    page_location: typeof window !== 'undefined' ? `${window.location.origin}${path}` : path,
    page_title: typeof document !== 'undefined' ? document.title : path,
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

export function checkoutItem(planType: string, value: number): AnalyticsItem {
  const known = planType in CHECKOUT_PLANS ? CHECKOUT_PLANS[planType as CheckoutPlanType] : null;
  return {
    item_id: planType,
    item_name: known?.labelEn ?? planType,
    price: value,
    quantity: 1,
  };
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
  const planType = pending?.planType ?? 'unknown';
  const value = pending?.value ?? 0;
  if (status === 'success') {
    trackEvent(ANALYTICS_EVENTS.purchase, {
      currency: 'USD',
      value,
      transaction_id: `paypal_${planType}`,
      items: [checkoutItem(planType, value)],
    });
    return;
  }
  if (status === 'cancel') {
    trackEvent(ANALYTICS_EVENTS.checkoutCancel, {
      item_id: planType,
    });
  }
}

export function trackAuthSuccess(createdAtIso?: string | null): void {
  if (typeof window === 'undefined') return;
  const createdMs = createdAtIso ? Date.parse(createdAtIso) : Number.NaN;
  const isNew = Number.isFinite(createdMs) && Date.now() - createdMs < 15 * 60 * 1000;
  trackEvent(isNew ? ANALYTICS_EVENTS.signUp : ANALYTICS_EVENTS.login, {
    method: 'google',
  });
}

export function shouldTrackAuthOnce(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = `${AUTH_TRACK_PREFIX}${userId}`;
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}
