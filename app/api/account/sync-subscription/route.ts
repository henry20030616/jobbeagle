import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import { fulfillSubscriptionRenewal } from '@/lib/fulfill-order';
import {
  getLemonSqueezyConfig,
  listLemonSubscriptionsForEmail,
} from '@/lib/lemonsqueezy';

/**
 * Pull active Lemon Squeezy subscription for the signed-in user and
 * reset monthly Snapshot/Guide balances to the plan allowance.
 */
export async function POST() {
  const ls = getLemonSqueezyConfig();
  const admin = getSupabaseAdmin();
  if (!ls || !admin) {
    return NextResponse.json(
      { error: 'Billing sync is not configured', errorCode: 'SERVER_CONFIG' },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json(
      { error: 'Please log in', errorCode: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  });

  let subscriptions;
  try {
    subscriptions = await listLemonSubscriptionsForEmail(
      ls.apiKey,
      ls.storeId,
      user.email,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lemon Squeezy error';
    console.error('[sync-subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'LEMONSQUEEZY_ERROR' },
      { status: 502 },
    );
  }

  const active = subscriptions.filter(
    (s) =>
      (s.status === 'active' || s.status === 'on_trial')
      && (s.membershipTier === 'standard_sub' || s.membershipTier === 'advanced_sub'),
  );

  if (active.length === 0) {
    return NextResponse.json({
      synced: false,
      reason: 'no_active_subscription',
      message:
        'No active Standard/Advanced subscription found for this email on Lemon Squeezy.',
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        status: s.status,
        planType: s.planType,
        renewsAt: s.renewsAt,
      })),
    });
  }

  // Prefer Advanced if both somehow present
  const chosen =
    active.find((s) => s.membershipTier === 'advanced_sub') ?? active[0]!;

  await fulfillSubscriptionRenewal(admin, user.id, chosen.membershipTier!);

  const { data: profile } = await admin
    .from('profiles')
    .select(
      'membership_tier, available_job_fit_snapshot_credits, available_interview_strategy_guide_credits, available_lite_credits, available_full_credits',
    )
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    synced: true,
    membership_tier: chosen.membershipTier,
    plan_type: chosen.planType,
    lemon_subscription_id: chosen.id,
    renews_at: chosen.renewsAt,
    credits: {
      job_fit_snapshot:
        profile?.available_job_fit_snapshot_credits
        ?? profile?.available_lite_credits
        ?? null,
      interview_strategy_guide:
        profile?.available_interview_strategy_guide_credits
        ?? profile?.available_full_credits
        ?? null,
    },
  });
}
