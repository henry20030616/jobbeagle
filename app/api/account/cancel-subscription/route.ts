import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  cancelPayPalSubscription,
  findLivePayPalSubscription,
  getPayPalConfig,
} from '@/lib/paypal';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Cancel the signed-in user's Standard/Advanced subscription at period end.
 */
export async function POST() {
  const paypal = getPayPalConfig();
  const admin = getSupabaseAdmin();
  if (!paypal || !admin) {
    return NextResponse.json(
      { error: 'PayPal is not configured', errorCode: 'SERVER_CONFIG' },
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

  const { allowed } = await rateLimit('cancel-subscription', user.id, 8, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', errorCode: 'RATE_LIMITED' },
      { status: 429 },
    );
  }

  await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  });

  let live;
  try {
    live = await findLivePayPalSubscription(admin, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PayPal error';
    console.error('[cancel-subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'PAYPAL_ERROR' },
      { status: 502 },
    );
  }

  if (!live) {
    return NextResponse.json(
      {
        error: 'No cancellable monthly subscription found.',
        errorCode: 'NO_SUBSCRIPTION',
      },
      { status: 404 },
    );
  }

  try {
    await cancelPayPalSubscription(live.id);
    return NextResponse.json({
      cancelled: true,
      current_billing_period_ends_at: null,
      subscription: {
        id: live.id,
        status: 'CANCELLED',
        planType: null,
        membershipTier: null,
        currentBillingPeriodEndsAt: null,
        scheduledForCancellation: false,
        canCancel: false,
        canManage: true,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PayPal error';
    console.error('[cancel-subscription] paypal', message);
    return NextResponse.json(
      { error: message, errorCode: 'PAYPAL_ERROR' },
      { status: 502 },
    );
  }
}
