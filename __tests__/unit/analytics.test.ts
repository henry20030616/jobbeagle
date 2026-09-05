/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));
import {
  ANALYTICS_EVENTS,
  FUNNEL,
  checkoutValueUsd,
  consumePendingCheckout,
  enableGaDebug,
  rememberPendingCheckout,
  trackAuthSuccess,
  trackCheckoutReturn,
  trackEvent,
} from '@/lib/analytics';

describe('analytics funnel', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockReset();
    window.gtag = gtag;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    delete window.gtag;
    window.sessionStorage.clear();
  });

  it('exposes seven conversion nodes in order', () => {
    expect(Object.values(FUNNEL).map((node) => `${node.step}:${node.event}`)).toEqual([
      '1:sign_up',
      '1:login',
      '2:add_extension',
      '3:preflight',
      '4:job_analyzed',
      '5:view_item_list',
      '6:begin_checkout',
      '7:purchase',
    ]);
  });

  it('stamps funnel_step on conversion events', () => {
    trackEvent(ANALYTICS_EVENTS.analyzeComplete, {
      report_type: 'job_fit_snapshot',
      source: 'home',
      skip: null,
    });
    expect(gtag).toHaveBeenCalledWith('event', 'job_analyzed', {
      report_type: 'job_fit_snapshot',
      source: 'home',
      funnel_step: 4,
    });
  });

  it('does not throw when gtag is missing', () => {
    delete window.gtag;
    expect(() => trackEvent('purchase', { value: 3 })).not.toThrow();
  });

  it('maps plan prices to USD for checkout events', () => {
    expect(checkoutValueUsd('single_job_fit_snapshot')).toBe(3);
    expect(checkoutValueUsd('standard_subscription')).toBe(19.99);
    expect(checkoutValueUsd('author_sponsor', '2.50')).toBe(2.5);
  });

  it('records purchase from the pending checkout after PayPal return', () => {
    rememberPendingCheckout('single_job_fit_snapshot', 3);
    trackCheckoutReturn('success');
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        currency: 'USD',
        value: 3,
        funnel_step: 7,
        items: [
          expect.objectContaining({
            item_id: 'single_job_fit_snapshot',
            price: 3,
            quantity: 1,
          }),
        ],
      }),
    );
    expect(consumePendingCheckout()).toBeNull();
  });

  it('records checkout_cancel without a purchase', () => {
    rememberPendingCheckout('advanced_subscription', 39.99);
    trackCheckoutReturn('cancel');
    expect(gtag).toHaveBeenCalledWith('event', 'checkout_cancel', {
      item_id: 'advanced_subscription',
    });
    expect(gtag.mock.calls.some((call) => call[1] === 'purchase')).toBe(false);
  });

  it('adds debug_mode only after enableGaDebug', () => {
    trackEvent('view_report', { report_type: 'job_fit_snapshot' });
    expect(gtag.mock.calls.at(-1)?.[2]).not.toMatchObject({ debug_mode: true });
    enableGaDebug();
    trackEvent('view_report', { report_type: 'job_fit_snapshot' });
    expect(gtag.mock.calls.at(-1)?.[2]).toMatchObject({ debug_mode: true });
  });

  it('treats a brand-new account as sign_up', () => {
    trackAuthSuccess(new Date().toISOString());
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'sign_up',
      expect.objectContaining({ method: 'google', funnel_step: 1 }),
    );
  });
});
