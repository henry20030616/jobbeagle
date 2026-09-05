import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetMemoryRateLimitForTests } from '@/lib/rate-limit';

const send = vi.fn().mockResolvedValue({ error: null });

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
    constructor(_key: string) {}
  },
}));

import {
  __resetTransactionalEmailForTests,
  buildFailureEmail,
  escapeEmailHtml,
  lookupUserEmail,
  notifyFailure,
  resolveAlertEmails,
} from '@/lib/transactional-email';

describe('transactional failure email', () => {
  const prev = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ALERT_EMAIL: process.env.ALERT_EMAIL,
    BILLING_ALERT_EMAIL: process.env.BILLING_ALERT_EMAIL,
    RESEND_FROM: process.env.RESEND_FROM,
  };

  beforeEach(() => {
    send.mockClear();
    __resetTransactionalEmailForTests();
    __resetMemoryRateLimitForTests();
    delete process.env.RESEND_API_KEY;
    delete process.env.ALERT_EMAIL;
    delete process.env.BILLING_ALERT_EMAIL;
    delete process.env.RESEND_FROM;
  });

  afterEach(() => {
    __resetTransactionalEmailForTests();
    __resetMemoryRateLimitForTests();
    if (prev.RESEND_API_KEY === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prev.RESEND_API_KEY;
    if (prev.ALERT_EMAIL === undefined) delete process.env.ALERT_EMAIL;
    else process.env.ALERT_EMAIL = prev.ALERT_EMAIL;
    if (prev.BILLING_ALERT_EMAIL === undefined) delete process.env.BILLING_ALERT_EMAIL;
    else process.env.BILLING_ALERT_EMAIL = prev.BILLING_ALERT_EMAIL;
    if (prev.RESEND_FROM === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = prev.RESEND_FROM;
  });

  it('tells the user the analysis credit was returned', () => {
    const email = buildFailureEmail({
      scenario: 'analysis_failed',
      refunded: true,
      jobLabel: 'Analyst at Acme',
    });
    expect(email.userSubject).toBe('JobBeagle: we could not finish your analysis');
    expect(email.userText).toContain('credit for this run was returned');
    expect(email.userText).toContain('Analyst at Acme');
    expect(email.userHtml).toContain('Analyst at Acme');
    expect(email.alertText).toContain('scenario=analysis_failed');
  });

  it('does not put job-description dumps in the user copy', () => {
    const email = buildFailureEmail({
      scenario: 'analysis_failed',
      jobLabel: 'PM at Globex',
      technicalDetail: 'Gemini 500 INTERNAL',
      userFacingReason: 'We could not finish this analysis. The credit for this run was returned to your account.',
    });
    expect(email.userText).not.toContain('Gemini 500 INTERNAL');
    expect(email.userHtml).not.toContain('Gemini 500 INTERNAL');
    expect(email.alertText).toContain('Gemini 500 INTERNAL');
  });

  it('says checkout create failed without a charge', () => {
    const email = buildFailureEmail({
      scenario: 'checkout_create_failed',
      planLabel: 'Standard',
      orderId: 'ord_1',
    });
    expect(email.userSubject).toContain('checkout did not start');
    expect(email.userText).toContain('You were not charged');
    expect(email.userText).toContain('ord_1');
  });

  it('asks the user to reply when payment landed but credits did not', () => {
    const email = buildFailureEmail({
      scenario: 'payment_fulfill_failed',
      orderId: 'ord_pay',
    });
    expect(email.userSubject).toContain('credits need a fix');
    expect(email.userText).toContain('could not add credits');
    expect(email.userText).toContain('ord_pay');
  });

  it('escapes HTML in interpolated fields', () => {
    const sneaky = '<img src=x onerror=alert(1)>';
    const email = buildFailureEmail({
      scenario: 'analysis_failed',
      jobLabel: sneaky,
    });
    expect(email.userHtml).toContain(escapeEmailHtml(sneaky));
    expect(email.userHtml).not.toContain('<img src=x');
  });

  it('turns ALERT_EMAIL=off into no owner copy', () => {
    process.env.ALERT_EMAIL = 'off';
    expect(resolveAlertEmails()).toEqual([]);
  });

  it('looks up an auth email and ignores invalid rows', async () => {
    const ok = await lookupUserEmail(
      {
        auth: {
          admin: {
            getUserById: async () => ({
              data: { user: { email: 'user@example.com' } },
              error: null,
            }),
          },
        },
      },
      'u1',
    );
    expect(ok).toBe('user@example.com');

    const bad = await lookupUserEmail(
      {
        auth: {
          admin: {
            getUserById: async () => ({
              data: { user: { email: 'not-an-email' } },
              error: null,
            }),
          },
        },
      },
      'u2',
    );
    expect(bad).toBeNull();
  });

  it('does not send when RESEND_API_KEY is missing', async () => {
    const result = await notifyFailure({
      scenario: 'analysis_failed',
      userEmail: 'user@example.com',
    });
    expect(result.sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends a user letter and an owner alert when Resend is configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.ALERT_EMAIL = 'owner@example.com';
    const result = await notifyFailure({
      scenario: 'checkout_create_failed',
      userEmail: 'user@example.com',
      userId: 'user-12345678',
      planLabel: 'Standard',
      orderId: 'ord_9',
    });
    expect(result.sent).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      to: 'user@example.com',
      subject: 'JobBeagle: checkout did not start',
    });
    expect(send.mock.calls[1]?.[0]).toMatchObject({
      to: ['owner@example.com'],
    });
    expect(String(send.mock.calls[1]?.[0]?.subject)).toContain('checkout_create_failed');
  });
});
