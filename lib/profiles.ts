import type { SupabaseClient } from '@supabase/supabase-js';
import type { CareerContext, MembershipTier, ReportType, UserProfile } from '@/types';
import { SUBSCRIPTION_ALLOWANCES } from '@/constants/checkout-plans';
import { FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS } from '@/constants/credits';
import {
  REPORT_CODES,
  isInterviewStrategyGuide,
  normalizeReportType,
} from '@/constants/report-products';
import { normalizeCareerContext } from '@/lib/career-context';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_tier: MembershipTier;
  available_job_fit_snapshot_credits: number;
  available_interview_strategy_guide_credits: number;
  referral_code: string | null;
  device_fingerprint: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  deactivated_at: string | null;
  career_context: CareerContext;
}

/** Normalize DB row that may still use legacy lite/full column names. */
export function coerceProfileRow(raw: Record<string, unknown>): ProfileRow {
  const snapshot =
    Number(
      raw.available_job_fit_snapshot_credits
        ?? raw.available_lite_credits
        ?? 0,
    ) || 0;
  const strategy =
    Number(
      raw.available_interview_strategy_guide_credits
        ?? raw.available_full_credits
        ?? 0,
    ) || 0;

  return {
    id: String(raw.id),
    full_name: (raw.full_name as string | null) ?? null,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    membership_tier: (raw.membership_tier as MembershipTier) || 'free',
    available_job_fit_snapshot_credits: snapshot,
    available_interview_strategy_guide_credits: strategy,
    referral_code: (raw.referral_code as string | null) ?? null,
    device_fingerprint: (raw.device_fingerprint as string | null) ?? null,
    stripe_customer_id: (raw.stripe_customer_id as string | null) ?? null,
    stripe_subscription_id: (raw.stripe_subscription_id as string | null) ?? null,
    deactivated_at: (raw.deactivated_at as string | null) ?? null,
    career_context: normalizeCareerContext(raw.career_context),
  };
}

export async function ensureProfile(
  admin: SupabaseClient,
  userId: string,
  meta?: { full_name?: string; avatar_url?: string },
): Promise<ProfileRow> {
  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return coerceProfileRow(existing as Record<string, unknown>);

  const referralCode = generateReferralCode();
  const insertPayload: Record<string, unknown> = {
    id: userId,
    full_name: meta?.full_name ?? null,
    avatar_url: meta?.avatar_url ?? null,
    referral_code: referralCode,
    available_job_fit_snapshot_credits: FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS,
    available_interview_strategy_guide_credits: 0,
    membership_tier: 'free',
  };

  let { data: created, error } = await admin
    .from('profiles')
    .insert(insertPayload)
    .select('*')
    .single();

  // Fallback if migration 010 not applied yet
  if (error && /available_job_fit_snapshot|column/i.test(error.message)) {
    const legacy = await admin
      .from('profiles')
      .insert({
        id: userId,
        full_name: meta?.full_name ?? null,
        avatar_url: meta?.avatar_url ?? null,
        referral_code: referralCode,
        available_lite_credits: FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS,
        available_full_credits: 0,
        membership_tier: 'free',
      })
      .select('*')
      .single();
    created = legacy.data;
    error = legacy.error;
  }

  if (error || !created) throw new Error(`Failed to create profile: ${error?.message}`);
  return coerceProfileRow(created as Record<string, unknown>);
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function checkDeviceSybil(
  admin: SupabaseClient,
  userId: string,
  fingerprint: string | undefined,
  membershipTier: MembershipTier,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!fingerprint || membershipTier !== 'free') {
    return { allowed: true };
  }

  const { data: conflicts } = await admin
    .from('profiles')
    .select('id')
    .eq('device_fingerprint', fingerprint)
    .neq('id', userId)
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    return {
      allowed: false,
      reason: 'Device Limit Exceeded. Malicious Sybil Activity Blocked.',
    };
  }

  return { allowed: true };
}

export async function bindDeviceFingerprint(
  admin: SupabaseClient,
  userId: string,
  fingerprint: string,
): Promise<void> {
  if (!fingerprint) return;
  await admin
    .from('profiles')
    .update({ device_fingerprint: fingerprint, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .is('device_fingerprint', null);
}

export function hasSubscriptionCredits(tier: MembershipTier): boolean {
  return tier === 'standard_sub' || tier === 'advanced_sub';
}

export function getSubscriptionAllowance(tier: MembershipTier): {
  job_fit_snapshot: number;
  interview_strategy_guide: number;
} | null {
  if (tier === 'standard_sub') return SUBSCRIPTION_ALLOWANCES.standard_sub;
  if (tier === 'advanced_sub') return SUBSCRIPTION_ALLOWANCES.advanced_sub;
  return null;
}

export function canAffordReport(
  profile: ProfileRow,
  reportType: ReportType | string,
): boolean {
  const type = normalizeReportType(reportType);
  if (hasSubscriptionCredits(profile.membership_tier)) {
    const allowance = getSubscriptionAllowance(profile.membership_tier);
    if (!allowance) return false;
    if (type === REPORT_CODES.JOB_FIT_SNAPSHOT) {
      return (
        profile.available_job_fit_snapshot_credits > 0
        || allowance.job_fit_snapshot > 0
      );
    }
    return (
      profile.available_interview_strategy_guide_credits > 0
      || allowance.interview_strategy_guide > 0
    );
  }

  if (type === REPORT_CODES.JOB_FIT_SNAPSHOT) {
    return profile.available_job_fit_snapshot_credits > 0;
  }
  return profile.available_interview_strategy_guide_credits > 0;
}

export async function deductCredit(
  admin: SupabaseClient,
  userId: string,
  reportType: ReportType | string,
): Promise<number> {
  const type = normalizeReportType(reportType);
  const rpc = isInterviewStrategyGuide(type)
    ? 'decrement_interview_strategy_guide_credit'
    : 'decrement_job_fit_snapshot_credit';

  let { data, error } = await admin.rpc(rpc, { p_user_id: userId });

  // Legacy RPC names if 010 not applied
  if (error) {
    const legacy = isInterviewStrategyGuide(type)
      ? 'decrement_full_credit'
      : 'decrement_lite_credit';
    const retry = await admin.rpc(legacy, { p_user_id: userId });
    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(`Credit deduction failed: ${error.message}`);
  return typeof data === 'number' ? data : -1;
}

export async function refundCredit(
  admin: SupabaseClient,
  userId: string,
  reportType: ReportType | string,
): Promise<void> {
  const type = normalizeReportType(reportType);
  const snapshot = type === REPORT_CODES.JOB_FIT_SNAPSHOT ? 1 : 0;
  const strategy = type === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE ? 1 : 0;

  let { error } = await admin.rpc('increment_profile_credits', {
    p_user_id: userId,
    p_job_fit_snapshot: snapshot,
    p_interview_strategy_guide: strategy,
  });

  if (error) {
    const retry = await admin.rpc('increment_profile_credits', {
      p_user_id: userId,
      p_lite: snapshot,
      p_full: strategy,
    });
    error = retry.error;
  }

  if (error) throw new Error(`Credit refund failed: ${error.message}`);
}

export async function findCachedReport(
  admin: SupabaseClient,
  userId: string,
  linkedinJobId: string,
  reportType: ReportType | string,
): Promise<{ id: string; report_json: unknown } | null> {
  const type = normalizeReportType(reportType);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const types =
    type === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
      ? ['interview_strategy_guide', 'full']
      : ['job_fit_snapshot', 'lite'];

  const { data } = await admin
    .from('analysis_reports')
    .select('id, report_json')
    .eq('linkedin_job_id', linkedinJobId)
    .eq('user_id', userId)
    .in('report_type', types)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export function canAffordUserProfile(
  profile: {
    membership_tier: MembershipTier;
    available_job_fit_snapshot_credits?: number;
    available_interview_strategy_guide_credits?: number;
    available_lite_credits?: number;
    available_full_credits?: number;
  },
  reportType: ReportType | string,
): boolean {
  return canAffordReport(
    {
      id: '',
      full_name: null,
      avatar_url: null,
      membership_tier: profile.membership_tier,
      available_job_fit_snapshot_credits:
        profile.available_job_fit_snapshot_credits
        ?? profile.available_lite_credits
        ?? 0,
      available_interview_strategy_guide_credits:
        profile.available_interview_strategy_guide_credits
        ?? profile.available_full_credits
        ?? 0,
      referral_code: null,
      device_fingerprint: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      deactivated_at: null,
      career_context: normalizeCareerContext(null),
    },
    reportType,
  );
}

export function profileToUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    membership_tier: row.membership_tier,
    available_job_fit_snapshot_credits: row.available_job_fit_snapshot_credits,
    available_interview_strategy_guide_credits:
      row.available_interview_strategy_guide_credits,
    /** @deprecated alias */
    available_lite_credits: row.available_job_fit_snapshot_credits,
    /** @deprecated alias */
    available_full_credits: row.available_interview_strategy_guide_credits,
    career_context: row.career_context,
    referral_code: row.referral_code,
    device_fingerprint: row.device_fingerprint,
    deactivated_at: row.deactivated_at,
  };
}

export async function updateCareerContext(
  admin: SupabaseClient,
  userId: string,
  careerContext: CareerContext,
): Promise<CareerContext> {
  const normalized = normalizeCareerContext(careerContext);
  const { data, error } = await admin
    .from('profiles')
    .update({ career_context: normalized })
    .eq('id', userId)
    .select('career_context')
    .single();

  if (error) throw new Error(`Failed to save career context: ${error.message}`);
  return normalizeCareerContext(data?.career_context);
}
