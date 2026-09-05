import { Resend } from 'resend';
import { rateLimit } from '@/lib/rate-limit';

export type FailureScenario =
  | 'analysis_failed'
  | 'checkout_create_failed'
  | 'payment_fulfill_failed'
  | 'subscription_payment_failed';

export type FailureNotice = {
  scenario: FailureScenario;
  userEmail?: string | null;
  userId?: string | null;
  jobLabel?: string | null;
  planLabel?: string | null;
  orderId?: string | null;
  refunded?: boolean;
  userFacingReason?: string;
  technicalDetail?: string;
};

export type FailureEmailContent = {
  userSubject: string;
  userText: string;
  userHtml: string;
  alertSubject: string;
  alertText: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM = 'JobBeagle <noreply@jobbeagle.com>';
const DEFAULT_ALERT_EMAIL = 'henry061680@gmail.com';
const ACCOUNT_URL = 'https://www.jobbeagle.com/account';
const SUPPORT_EMAIL = 'henry061680@gmail.com';

let resendSingleton: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

export function __resetTransactionalEmailForTests(): void {
  resendSingleton = null;
}

export function isSendableEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function optionalLine(label: string, value: string | null | undefined): string {
  const clipped = value ? clip(value, 160) : '';
  return clipped ? `${label}: ${clipped}` : '';
}

export function resolveAlertEmails(): string[] {
  const raw = process.env.ALERT_EMAIL ?? process.env.BILLING_ALERT_EMAIL;
  if (raw?.trim().toLowerCase() === 'off') return [];
  const source = raw?.trim() ? raw : DEFAULT_ALERT_EMAIL;
  const unique = new Set<string>();
  for (const part of source.split(',')) {
    const email = part.trim().toLowerCase();
    if (isSendableEmail(email)) unique.add(email);
  }
  return [...unique];
}

export function resolveEmailFrom(): string {
  const from = process.env.RESEND_FROM?.trim();
  return from || DEFAULT_FROM;
}

export function buildFailureEmail(notice: FailureNotice): FailureEmailContent {
  const job = notice.jobLabel ? clip(notice.jobLabel, 160) : '';
  const plan = notice.planLabel ? clip(notice.planLabel, 80) : '';
  const orderId = notice.orderId ? clip(notice.orderId, 80) : '';
  const reason = notice.userFacingReason
    ? clip(notice.userFacingReason, 280)
    : defaultUserReason(notice);
  const tech = notice.technicalDetail ? clip(notice.technicalDetail, 280) : '';

  const userSubject = userSubjectFor(notice.scenario);
  const userText = [
    'Hi,',
    '',
    reason,
    job ? `Role: ${job}` : '',
    plan ? `Plan: ${plan}` : '',
    orderId ? `Order: ${orderId}` : '',
    '',
    `Account: ${ACCOUNT_URL}`,
    `Questions: ${SUPPORT_EMAIL}`,
    '',
    '— JobBeagle',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const userHtml = [
    '<p>Hi,</p>',
    `<p>${escapeEmailHtml(reason)}</p>`,
    job ? `<p><strong>Role:</strong> ${escapeEmailHtml(job)}</p>` : '',
    plan ? `<p><strong>Plan:</strong> ${escapeEmailHtml(plan)}</p>` : '',
    orderId ? `<p><strong>Order:</strong> ${escapeEmailHtml(orderId)}</p>` : '',
    `<p><a href="${ACCOUNT_URL}">Open your JobBeagle account</a></p>`,
    `<p>Questions: ${escapeEmailHtml(SUPPORT_EMAIL)}</p>`,
    '<p>— JobBeagle</p>',
  ]
    .filter(Boolean)
    .join('');

  const alertSubject = `[JobBeagle] ${notice.scenario}${notice.userId ? ` ${notice.userId.slice(0, 8)}` : ''}`;
  const alertText = [
    `scenario=${notice.scenario}`,
    optionalLine('userId', notice.userId),
    optionalLine('userEmail', notice.userEmail),
    optionalLine('job', job),
    optionalLine('plan', plan),
    optionalLine('orderId', orderId),
    notice.refunded === undefined ? '' : `refunded=${notice.refunded}`,
    optionalLine('reason', reason),
    optionalLine('detail', tech),
  ]
    .filter(Boolean)
    .join('\n');

  return { userSubject, userText, userHtml, alertSubject, alertText };
}

function defaultUserReason(notice: FailureNotice): string {
  switch (notice.scenario) {
    case 'analysis_failed':
      return notice.refunded === false
        ? 'We could not finish this analysis, and the credit refund did not go through automatically. Reply to this email and we will restore it.'
        : 'We could not finish this analysis. The credit for this run was returned to your account.';
    case 'checkout_create_failed':
      return 'We could not start PayPal checkout. You were not charged.';
    case 'payment_fulfill_failed':
      return 'PayPal reported a payment, but we could not add credits to your account. Reply to this email with your order id and we will fix it.';
    case 'subscription_payment_failed':
      return 'PayPal could not collect your JobBeagle subscription payment. PayPal will retry. Credits may pause until the charge succeeds.';
  }
}

function userSubjectFor(scenario: FailureScenario): string {
  switch (scenario) {
    case 'analysis_failed':
      return 'JobBeagle: we could not finish your analysis';
    case 'checkout_create_failed':
      return 'JobBeagle: checkout did not start';
    case 'payment_fulfill_failed':
      return 'JobBeagle: payment received — credits need a fix';
    case 'subscription_payment_failed':
      return 'JobBeagle: subscription payment failed';
  }
}

type AuthEmailAdmin = {
  auth: {
    admin: {
      getUserById: (id: string) => Promise<{
        data: { user: { email?: string | null } | null };
        error: { message: string } | null;
      }>;
    };
  };
};

export async function lookupUserEmail(
  admin: AuthEmailAdmin,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    const email = data.user?.email?.trim();
    if (error || !email || !isSendableEmail(email)) return null;
    return email;
  } catch {
    return null;
  }
}

export async function notifyFailure(notice: FailureNotice): Promise<{ sent: boolean }> {
  try {
    const resend = getResend();
    if (!resend) return { sent: false };

    const rateKey = notice.orderId || notice.userId || notice.userEmail || 'unknown';
    const limited = await rateLimit(`fail-mail-${notice.scenario}`, rateKey, 3, 3600);
    if (!limited.allowed) {
      console.warn('[email] failure notice rate-limited', notice.scenario, rateKey);
      return { sent: false };
    }

    const content = buildFailureEmail(notice);
    const from = resolveEmailFrom();
    const replyTo = resolveAlertEmails()[0] ?? SUPPORT_EMAIL;
    const recipients = new Set<string>();
    const userEmail = notice.userEmail?.trim().toLowerCase();
    if (userEmail && isSendableEmail(userEmail)) recipients.add(userEmail);
    for (const alert of resolveAlertEmails()) recipients.add(alert);

    if (recipients.size === 0) return { sent: false };

    const sends: Array<Promise<unknown>> = [];
    if (userEmail && recipients.has(userEmail)) {
      sends.push(
        resend.emails.send({
          from,
          to: userEmail,
          replyTo,
          subject: content.userSubject,
          text: content.userText,
          html: content.userHtml,
        }),
      );
    }
    const alerts = [...recipients].filter((email) => email !== userEmail);
    if (alerts.length > 0) {
      sends.push(
        resend.emails.send({
          from,
          to: alerts,
          replyTo,
          subject: content.alertSubject,
          text: content.alertText,
        }),
      );
    }

    await Promise.all(sends);
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'notifyFailure failed';
    console.error('[email] notifyFailure:', message);
    return { sent: false };
  }
}
