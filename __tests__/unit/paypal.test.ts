import { describe, expect, it } from 'vitest';
import {
  getMissingPayPalPlanIds,
  isAllowedPayPalCertUrl,
  isPayPalWebhookRequest,
  parsePayPalWebhookEvent,
  paypalApiBase,
  usdAmountFromCents,
} from '@/lib/paypal';

describe('PayPal money and API host', () => {
  it('formats USD amounts from cents', () => {
    expect(usdAmountFromCents(300)).toBe('3.00');
    expect(usdAmountFromCents(999)).toBe('9.99');
    expect(usdAmountFromCents(1999)).toBe('19.99');
    expect(usdAmountFromCents(3999)).toBe('39.99');
  });

  it('uses sandbox or live API hosts', () => {
    expect(paypalApiBase('sandbox')).toBe('https://api-m.sandbox.paypal.com');
    expect(paypalApiBase('live')).toBe('https://api-m.paypal.com');
  });
});

describe('PayPal webhook request detection', () => {
  it('requires PayPal transmission headers', () => {
    expect(isPayPalWebhookRequest({ 'content-type': 'application/json' })).toBe(false);
    expect(
      isPayPalWebhookRequest({
        'paypal-transmission-id': 'id-1',
        'paypal-transmission-sig': 'sig',
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.sandbox.paypal.com/cert',
        'paypal-transmission-time': '2026-09-02T00:00:00Z',
      }),
    ).toBe(true);
  });

  it('only trusts PayPal certificate hosts', () => {
    expect(isAllowedPayPalCertUrl('https://api.sandbox.paypal.com/v1/notifications/certs/foo')).toBe(
      true,
    );
    expect(isAllowedPayPalCertUrl('https://api-m.paypal.com/v1/notifications/certs/foo')).toBe(true);
    expect(isAllowedPayPalCertUrl('https://evil.example/cert')).toBe(false);
    expect(isAllowedPayPalCertUrl('http://api.paypal.com/cert')).toBe(false);
  });
});

describe('PayPal subscription plan env', () => {
  it('reports missing Standard and Advanced plan ids', () => {
    const prevStd = process.env.PAYPAL_PLAN_STANDARD_SUB;
    const prevAdv = process.env.PAYPAL_PLAN_ADVANCED_SUB;
    try {
      delete process.env.PAYPAL_PLAN_STANDARD_SUB;
      delete process.env.PAYPAL_PLAN_ADVANCED_SUB;
      expect(getMissingPayPalPlanIds()).toEqual([
        'PAYPAL_PLAN_STANDARD_SUB',
        'PAYPAL_PLAN_ADVANCED_SUB',
      ]);
    } finally {
      if (prevStd === undefined) delete process.env.PAYPAL_PLAN_STANDARD_SUB;
      else process.env.PAYPAL_PLAN_STANDARD_SUB = prevStd;
      if (prevAdv === undefined) delete process.env.PAYPAL_PLAN_ADVANCED_SUB;
      else process.env.PAYPAL_PLAN_ADVANCED_SUB = prevAdv;
    }
  });
});

describe('parsePayPalWebhookEvent', () => {
  it('reads custom_id from a capture resource', () => {
    expect(
      parsePayPalWebhookEvent({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'CAP-1', custom_id: 'order-uuid', status: 'COMPLETED' },
      }),
    ).toEqual({
      eventType: 'PAYMENT.CAPTURE.COMPLETED',
      resourceId: 'CAP-1',
      customId: 'order-uuid',
      status: 'COMPLETED',
      billingAgreementId: null,
    });
  });

  it('reads custom_id from checkout purchase_units', () => {
    const parsed = parsePayPalWebhookEvent({
      event_type: 'CHECKOUT.ORDER.APPROVED',
      resource: {
        id: 'PAYPAL-ORDER',
        purchase_units: [{ custom_id: 'order-uuid' }],
      },
    });
    expect(parsed.customId).toBe('order-uuid');
    expect(parsed.resourceId).toBe('PAYPAL-ORDER');
  });
});
