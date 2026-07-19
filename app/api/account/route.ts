import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
  }

  const profile = await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
  });

  const row = profile;

  const { data: orders } = await admin
    .from('orders')
    .select('id, plan_type, amount, currency, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: referrals } = await admin
    .from('referrals')
    .select('id, referee_id, is_activated, created_at')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const activatedCount = (referrals ?? []).filter((r) => r.is_activated).length;

  return NextResponse.json({
    email: user.email ?? null,
    profile: {
      id: row.id,
      full_name: row.full_name,
      membership_tier: row.membership_tier,
      available_job_fit_snapshot_credits: row.available_job_fit_snapshot_credits,
      available_interview_strategy_guide_credits:
        row.available_interview_strategy_guide_credits,
      referral_code: row.referral_code,
      deactivated_at: row.deactivated_at,
      career_context: row.career_context,
    },
    orders: orders ?? [],
    referrals: (referrals ?? []).map((r) => ({
      id: r.id,
      referee_id: r.referee_id,
      is_activated: r.is_activated,
      created_at: r.created_at,
    })),
    referral_activated_count: activatedCount,
    referral_earned_snapshot_credits: activatedCount,
  });
}
