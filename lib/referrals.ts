import type { SupabaseClient } from '@supabase/supabase-js';

/** Record referral on signup; activation happens after first lite analysis */
export async function recordReferral(
  admin: SupabaseClient,
  refereeId: string,
  referralCode: string | null | undefined,
): Promise<void> {
  if (!referralCode?.trim()) return;

  const { data: referrer } = await admin
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode.trim().toUpperCase())
    .maybeSingle();

  if (!referrer || referrer.id === refereeId) return;

  await admin.from('referrals').upsert(
    {
      referrer_id: referrer.id,
      referee_id: refereeId,
      is_activated: false,
    },
    { onConflict: 'referee_id', ignoreDuplicates: true },
  );
}

/** Called after first successful lite analysis by referee */
export async function tryActivateReferralMilestone(
  admin: SupabaseClient,
  refereeId: string,
): Promise<boolean> {
  const { data, error } = await admin.rpc('activate_referral_milestone', {
    p_referee_id: refereeId,
  });
  if (error) {
    console.warn('[Referral] activation error:', error.message);
    return false;
  }
  return data === true;
}
