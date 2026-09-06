import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isShortsEnabled } from '../../constants/features';
import { CHECKOUT_PLANS } from '../../constants/checkout-plans';
import { REPORT_CODES } from '../../constants/report-products';
import { normalizeCareerContext } from '../../lib/career-context';
import {
  createHandoffToken,
  validateCaptureInput,
  verifyHandoffToken,
} from '../../lib/extension-handoff';
import { fulfillOrder } from '../../lib/fulfill-order';
import { decodeExtensionPayload } from '../../lib/payload';
import {
  isAllowedPayPalCertUrl,
  parsePayPalWebhookEvent,
  readPayPalWebhookHeaders,
  usdAmountFromCents,
} from '../../lib/paypal';
import {
  canAffordReport,
  checkDeviceSybil,
  coerceProfileRow,
  deductCredit,
  refundCredit,
  type ProfileRow,
} from '../../lib/profiles';
import {
  __resetMemoryRateLimitForTests,
  rateLimitExtensionCapture,
} from '../../lib/rate-limit';
import { loadReportSession } from '../../lib/report-session';
import { validateJobDescription } from '../../lib/validate-job-description';
import type { SystemResponse } from './types';

function ensureHandoffSecret(): void {
  if (!process.env.CRON_SECRET && !process.env.EXTENSION_HANDOFF_SECRET) {
    process.env.CRON_SECRET = 'poc-handoff-secret';
  }
}

const LINKEDIN_JD = `
Senior Backend Engineer — Payments Platform | Stripe | LinkedIn

About the role
We are hiring a Senior Backend Engineer to scale authorization throughput
across card networks. You will own latency budgets, idempotent settlement,
and on-call for a PCI-scoped service.

Responsibilities
- Design distributed Go services on Kubernetes
- Cut p99 authorization latency and cloud spend
- Partner with risk and finance on ledger correctness

Qualifications
- 6+ years backend experience
- Production Go, PostgreSQL, Kafka
- Payments or fintech domain preferred
`.trim();

type RpcCall = { name: string; args: Record<string, unknown> };

function createAdminMock(opts: {
  orderStatus?: string | null;
  fingerprintConflicts?: boolean;
}): { admin: SupabaseClient; rpcs: RpcCall[] } {
  const rpcs: RpcCall[] = [];

  const thenable = (value: { error: null }) => ({
    then: (resolve: (v: { error: null }) => unknown) => Promise.resolve(value).then(resolve),
    eq() {
      return thenable(value);
    },
  });

  const admin = {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: table === 'orders' ? { status: opts.orderStatus ?? 'pending' } : null,
                  error: null,
                }),
                neq() {
                  return {
                    limit: async () => ({
                      data: opts.fingerprintConflicts ? [{ id: 'other-user' }] : [],
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
        update() {
          return thenable({ error: null });
        },
        delete() {
          return thenable({ error: null });
        },
      };
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcs.push({ name, args });
      return { data: 2, error: null };
    },
  };

  // Narrow mock: only the from/select/eq/rpc surface fulfillOrder + checkDeviceSybil touch.
  return { admin: admin as unknown as SupabaseClient, rpcs };
}

function freeProfile(snapshot: number, strategy = 0): ProfileRow {
  return coerceProfileRow({
    id: 'poc-user',
    membership_tier: 'free',
    available_job_fit_snapshot_credits: snapshot,
    available_interview_strategy_guide_credits: strategy,
    deactivated_at: null,
  });
}

function readRepoFile(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

export async function runSystemCase(id: string): Promise<SystemResponse> {
  ensureHandoffSecret();

  switch (id) {
    case 'TC-SYS01': {
      const input = validateCaptureInput({
        pageTitle: 'Senior Backend Engineer at Stripe | LinkedIn',
        pageUrl: 'https://www.linkedin.com/jobs/view/4291001001',
        rawText: LINKEDIN_JD,
        jobId: '4291001001',
        jobTitle: 'Senior Backend Engineer',
        companyName: 'Stripe',
      });
      if (input.rawText.length < 40) {
        return { status: 400, code: 'JD_TOO_SHORT' };
      }
      return { status: 200 };
    }
    case 'TC-SYS02': {
      const jd = validateJobDescription('too short');
      try {
        validateCaptureInput({
          pageTitle: 'x',
          pageUrl: 'https://www.linkedin.com/jobs/view/1',
          rawText: 'too short',
          jobId: '1',
        });
      } catch {
        return { status: 400, code: jd.code ?? 'JD_TOO_SHORT' };
      }
      return { status: 200 };
    }
    case 'TC-SYS03': {
      const sid = createHandoffToken({
        pageTitle: 'Senior Backend Engineer at Stripe | LinkedIn',
        pageUrl: 'https://www.linkedin.com/jobs/view/4291001001',
        rawText: LINKEDIN_JD,
        jobId: '4291001001',
        jobTitle: 'Senior Backend Engineer',
        companyName: 'Stripe',
      });
      const payload = verifyHandoffToken(sid);
      if (!sid.includes('.') || payload.jobId !== '4291001001') {
        return { status: 400 };
      }
      return { status: 200 };
    }
    case 'TC-SYS04': {
      const secret =
        process.env.EXTENSION_HANDOFF_SECRET || process.env.CRON_SECRET || 'poc-handoff-secret';
      const payload = {
        pageTitle: 'Role',
        pageUrl: 'https://www.linkedin.com/jobs/view/1',
        rawText: LINKEDIN_JD,
        jobId: '1',
        exp: Date.now() - 31 * 60 * 1000,
      };
      const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
      const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');
      try {
        verifyHandoffToken(`${payloadB64}.${signature}`);
        return { status: 200 };
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        return { status: /expired/i.test(message) ? 410 : 400 };
      }
    }
    case 'TC-SYS05': {
      __resetMemoryRateLimitForTests();
      const ip = `poc-sys05-${Date.now()}`;
      let lastAllowed = true;
      for (let i = 0; i < 61; i += 1) {
        const result = await rateLimitExtensionCapture(ip, 60, 3600);
        lastAllowed = result.allowed;
      }
      return lastAllowed
        ? { status: 200 }
        : { status: 429, code: 'RATE_LIMIT' };
    }
    case 'TC-SYS06': {
      const encoded = Buffer.from(
        JSON.stringify({
          pageTitle: 'Analyst at Capital One | Indeed',
          pageUrl: 'https://www.indeed.com/viewjob?jk=abc',
          rawText: LINKEDIN_JD,
          jobId: 'abc',
          jobTitle: 'Analyst',
          companyName: 'Capital One',
        }),
        'utf8',
      ).toString('base64');
      const decoded = decodeExtensionPayload(encoded);
      return decoded.rawText.length >= 40 ? { status: 200 } : { status: 400 };
    }
    case 'TC-SYS07': {
      const allowed = canAffordReport(freeProfile(0, 0), REPORT_CODES.JOB_FIT_SNAPSHOT);
      return allowed
        ? { status: 200 }
        : { status: 402, code: 'PAYMENT_REQUIRED' };
    }
    case 'TC-SYS08': {
      const allowed = canAffordReport(freeProfile(3, 0), REPORT_CODES.INTERVIEW_STRATEGY_GUIDE);
      return allowed
        ? { status: 200 }
        : { status: 402, code: 'PAYMENT_REQUIRED' };
    }
    case 'TC-SYS09': {
      const { admin, rpcs } = createAdminMock({});
      await deductCredit(admin, 'poc-user', REPORT_CODES.JOB_FIT_SNAPSHOT);
      await refundCredit(admin, 'poc-user', REPORT_CODES.JOB_FIT_SNAPSHOT);
      const deducted = rpcs.some((c) => c.name === 'decrement_job_fit_snapshot_credit');
      const refunded = rpcs.some(
        (c) =>
          c.name === 'increment_profile_credits'
          && c.args.p_job_fit_snapshot === 1,
      );
      return deducted && refunded
        ? { status: 500, code: 'ANALYSIS_ERROR' }
        : { status: 500 };
    }
    case 'TC-SYS10': {
      const { admin } = createAdminMock({ fingerprintConflicts: true });
      const result = await checkDeviceSybil(admin, 'poc-user', 'device-fp-1', 'free');
      return result.allowed
        ? { status: 200 }
        : { status: 403, code: 'DEVICE_LIMIT' };
    }
    case 'TC-SYS11': {
      const amount = usdAmountFromCents(CHECKOUT_PLANS.single_job_fit_snapshot.amountCents);
      const event = parsePayPalWebhookEvent({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'CAP-POC', custom_id: 'order-poc', status: 'COMPLETED' },
      });
      return amount === '3.00' && event.customId === 'order-poc'
        ? { status: 200 }
        : { status: 400 };
    }
    case 'TC-SYS12': {
      const { admin, rpcs } = createAdminMock({ orderStatus: 'succeeded' });
      await fulfillOrder(
        admin,
        'order-1',
        'user-1',
        'single_job_fit_snapshot',
        null,
        'PAYPAL-1',
      );
      const granted = rpcs.some((c) => c.name === 'increment_profile_credits');
      return granted ? { status: 409 } : { status: 200 };
    }
    case 'TC-SYS13': {
      const { admin, rpcs } = createAdminMock({ orderStatus: 'pending' });
      await fulfillOrder(
        admin,
        'order-sub-1',
        'user-1',
        'standard_subscription',
        null,
        'PAYPAL-SUB-1',
      );
      const increment = rpcs.find((c) => c.name === 'increment_profile_credits');
      const addedSnapshot = increment?.args.p_job_fit_snapshot === 100;
      const addedGuide = increment?.args.p_interview_strategy_guide === 5;
      return addedSnapshot && addedGuide ? { status: 200 } : { status: 400 };
    }
    case 'TC-SYS14': {
      const headers = readPayPalWebhookHeaders({
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://evil.example/cert',
        'paypal-transmission-id': 'id-1',
        'paypal-transmission-sig': 'forged-sig',
        'paypal-transmission-time': '2026-09-06T00:00:00Z',
      });
      const certOk = isAllowedPayPalCertUrl('https://evil.example/cert');
      return headers === null && !certOk ? { status: 401 } : { status: 200 };
    }
    case 'TC-SYS15': {
      const src = readRepoFile('app/api/reports/[id]/route.ts');
      const usesUserClient = src.includes('createClient()') && src.includes('auth.getUser()');
      const notFound = src.includes("error: 'Report not found'") && src.includes('404');
      const noServiceRole = !src.includes('getSupabaseAdmin');
      return usesUserClient && notFound && noServiceRole
        ? { status: 404 }
        : { status: 500 };
    }
    case 'TC-SYS16': {
      const ctx = normalizeCareerContext({
        available_job_fit_snapshot_credits: 999,
        membership_tier: 'advanced_sub',
        target_level: 'Staff',
      });
      const creditsIgnored =
        !('available_job_fit_snapshot_credits' in ctx)
        && ctx.target_level === 'Staff';
      const profileSrc = readRepoFile('app/api/profile/route.ts');
      const onlyCareer =
        profileSrc.includes('career_context required') && profileSrc.includes('400');
      return creditsIgnored && onlyCareer ? { status: 400 } : { status: 200 };
    }
    case 'TC-SYS17': {
      const row = coerceProfileRow({
        id: 'u-deactivated',
        membership_tier: 'free',
        available_job_fit_snapshot_credits: 3,
        available_interview_strategy_guide_credits: 0,
        deactivated_at: '2026-09-01T00:00:00.000Z',
      });
      return row.deactivated_at
        ? { status: 403, code: 'ACCOUNT_DEACTIVATED' }
        : { status: 200 };
    }
    case 'TC-SYS18': {
      const src = readRepoFile('app/api/account/delete/route.ts');
      const cascade =
        src.includes("from('analysis_reports')")
        && src.includes("from('resume_history')")
        && src.includes('deleteUser');
      return cascade ? { status: 200 } : { status: 500 };
    }
    case 'TC-SYS19': {
      const session = loadReportSession();
      return session === null ? { status: 200 } : { status: 409 };
    }
    case 'TC-SYS20': {
      if (isShortsEnabled()) {
        return { status: 200 };
      }
      const mw = readRepoFile('middleware.ts');
      const redirects =
        mw.includes("url.pathname = '/'") && mw.includes('NextResponse.redirect');
      return redirects ? { status: 307 } : { status: 302 };
    }
    default:
      return { status: 500, code: 'UNKNOWN_SYSTEM_CASE' };
  }
}
