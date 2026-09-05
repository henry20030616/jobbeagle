/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_EVENTS,
  checkoutValueUsd,
  consumePendingCheckout,
  rememberPendingCheckout,
  trackCheckoutReturn,
  trackEvent,
} from '@/lib/analytics';

describe('analytics', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockReset();
    (window as Window & { gtag?: typeof gtag }).gtag = gtag;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    delete (window as Window & { gtag?: typeof gtag }).gtag;
    window.sessionStorage.clear();
  });

  it('sends cleaned event params through gtag', () => {
    trackEvent(ANALYTICS_EVENTS.analyzeStart, {
      report_type: 'job_fit_snapshot',
      source: 'home',
      skip: null,
    });
    expect(gtag).toHaveBeenCalledWith('event', 'analyze_start', {
      report_type: 'job_fit_snapshot',
      source: 'home',
    });
  });

  it('does not throw when gtag is missing', () => {
    delete (window as Window & { gtag?: typeof gtag }).gtag;
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
        item_id: 'single_job_fit_snapshot',
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
});
