import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  rateLimitAnalyze,
  __resetMemoryRateLimitForTests,
} from '@/lib/rate-limit';

const mockCreateClient = vi.fn();
const mockGetAdmin = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

vi.mock('@/lib/profiles', () => ({
  ensureProfile: vi.fn(),
  checkDeviceSybil: vi.fn(),
  bindDeviceFingerprint: vi.fn(),
  canAffordReport: vi.fn(),
  deductCredit: vi.fn(),
  refundCredit: vi.fn(),
  hasSubscriptionCredits: vi.fn(),
}));

vi.mock('@/lib/gemini-analyze', () => ({
  countCombinedTokens: vi.fn(),
  isTokenLimitExceeded: vi.fn(),
  executeLiteAnalysis: vi.fn(),
  executeFullAnalysis: vi.fn(),
}));

vi.mock('@/lib/resume-parser', () => ({
  resolveResumeForAnalysis: vi.fn(),
}));

vi.mock('@/lib/referrals', () => ({
  tryActivateReferralMilestone: vi.fn(),
}));

vi.mock('@/lib/resumes', () => ({
  upsertResumeForUser: vi.fn(),
}));

import { POST } from '@/app/api/analyze/route';
import {
  ensureProfile,
  checkDeviceSybil,
  canAffordReport,
} from '@/lib/profiles';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/analyze auth & rate limit seams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMemoryRateLimitForTests();
  });

  it('returns 401 AUTH_REQUIRED when not signed in', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    });
    const res = await post({
      report_type: 'lite',
      jobDescription: 'Company: Acme\nTitle: Analyst\n' + 'x'.repeat(80),
      resume: { kind: 'text', text: 'Resume body with enough characters for parse.' },
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  it('returns 503 SERVER_CONFIG when admin client missing', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u1', user_metadata: {} } },
          error: null,
        }),
      },
    });
    mockGetAdmin.mockReturnValue(null);
    const res = await post({ report_type: 'lite' });
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('SERVER_CONFIG');
  });

  it('returns 429 RATE_LIMIT when per-user analyze bucket is exhausted', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'rate-user', user_metadata: {} } },
          error: null,
        }),
      },
    });
    mockGetAdmin.mockReturnValue({});
    vi.mocked(ensureProfile).mockResolvedValue({
      id: 'rate-user',
      full_name: null,
      avatar_url: null,
      membership_tier: 'standard_sub',
      available_job_fit_snapshot_credits: 10,
      available_interview_strategy_guide_credits: 5,
      referral_code: null,
      device_fingerprint: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      deactivated_at: null,
      career_context: {
        target_level: '',
        location_or_remote: '',
        work_auth: '',
        target_tc: '',
        walk_away_tc: '',
        non_negotiables: '',
        signature_strengths: '',
      },
    });
    vi.mocked(checkDeviceSybil).mockResolvedValue({
      allowed: true,
      mode: 'paid',
    });
    vi.mocked(canAffordReport).mockReturnValue(true);

    for (let i = 0; i < 30; i += 1) {
      await rateLimitAnalyze('rate-user', 30, 3600);
    }

    const res = await post({
      report_type: 'lite',
      jobDescription: 'Company: Acme\nTitle: Analyst\n' + 'duty '.repeat(40),
      resume: { kind: 'text', text: 'Senior analyst with SQL and stakeholder work. '.repeat(3) },
    });
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('RATE_LIMIT');
  });
});
