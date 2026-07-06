import type { SupabaseClient } from '@supabase/supabase-js';
import type { MembershipTier, ReportType, UserProfile } from '@/types';
import { SUBSCRIPTION_ALLOWANCES } from '@/constants/checkout-plans';
import { FREE_LIFETIME_LITE_CREDITS } from '@/constants/credits';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_tier: MembershipTier;
  available_lite_credits: number;
  available_full_credits: number;
  referral_code: string | null;
  device_fingerprint: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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

  if (existing) return existing as ProfileRow;

  const referralCode = generateReferralCode();
  const { data: created, error } = await admin
    .from('profiles')
    .insert({
      id: userId,
      full_name: meta?.full_name ?? null,
      avatar_url: meta?.avatar_url ?? null,
      referral_code: referralCode,
      available_lite_credits: FREE_LIFETIME_LITE_CREDITS,
      available_full_credits: 0,
      membership_tier: 'free',
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return created as ProfileRow;
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/** Sybil defense: one free-tier fingerprint cannot map to multiple accounts */
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
  lite: number;
  full: number;
} | null {
  if (tier === 'standard_sub') return SUBSCRIPTION_ALLOWANCES.standard_sub;
  if (tier === 'advanced_sub') return SUBSCRIPTION_ALLOWANCES.advanced_sub;
  return null;
}

/** Check if user can run report type */
export function canAffordReport(
  profile: ProfileRow,
  reportType: ReportType,
): boolean {
  if (hasSubscriptionCredits(profile.membership_tier)) {
    const allowance = getSubscriptionAllowance(profile.membership_tier);
    if (!allowance) return false;
    if (reportType === 'lite') {
      return profile.available_lite_credits > 0 || allowance.lite > 0;
    }
    return profile.available_full_credits > 0 || allowance.full > 0;
  }

  if (reportType === 'lite') {
    return profile.available_lite_credits > 0;
  }
  return profile.available_full_credits > 0;
}

export async function deductCredit(
  admin: SupabaseClient,
  userId: string,
  reportType: ReportType,
): Promise<number> {
  const rpc =
    reportType === 'lite' ? 'decrement_lite_credit' : 'decrement_full_credit';
  const { data, error } = await admin.rpc(rpc, { p_user_id: userId });
  if (error) throw new Error(`Credit deduction failed: ${error.message}`);
  return typeof data === 'number' ? data : -1;
}

/** Refund one credit after a failed analysis (free / single-purchase tiers only) */
export async function refundCredit(
  admin: SupabaseClient,
  userId: string,
  reportType: ReportType,
): Promise<void> {
  const lite = reportType === 'lite' ? 1 : 0;
  const full = reportType === 'full' ? 1 : 0;
  const { error } = await admin.rpc('increment_profile_credits', {
    p_user_id: userId,
    p_lite: lite,
    p_full: full,
  });
  if (error) throw new Error(`Credit refund failed: ${error.message}`);
}

export async function findCachedReport(
  admin: SupabaseClient,
  userId: string,
  linkedinJobId: string,
  reportType: ReportType,
): Promise<{ id: string; report_json: unknown } | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from('analysis_reports')
    .select('id, report_json')
    .eq('linkedin_job_id', linkedinJobId)
    .eq('user_id', userId)
    .eq('report_type', reportType)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/** Client-safe afford check from UserProfile */
export function canAffordUserProfile(
  profile: Pick<ProfileRow, 'membership_tier' | 'available_lite_credits' | 'available_full_credits'>,
  reportType: ReportType,
): boolean {
  return canAffordReport(profile as ProfileRow, reportType);
}

export function profileToUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    membership_tier: row.membership_tier,
    available_lite_credits: row.available_lite_credits,
    available_full_credits: row.available_full_credits,
    referral_code: row.referral_code,
    device_fingerprint: row.device_fingerprint,
  };
}
