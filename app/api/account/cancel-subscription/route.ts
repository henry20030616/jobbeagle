import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  cancelPaddleSubscription,
  getPaddleClient,
  getPaddleConfig,
  listPaddleSubscriptionsForEmail,
  pickCancellablePaddleSubscription,
  toPaddleSubscriptionBillingView,
} from '@/lib/paddle';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Cancel the signed-in user's Standard/Advanced subscription at period end.
 * Does not strip credits or membership until Paddle billing period ends.
 */
export async function POST() {
  const paddleConfig = getPaddleConfig();
  const paddle = getPaddleClient();
  const admin = getSupabaseAdmin();
  if (!paddleConfig || !paddle || !admin) {
    return NextResponse.json(
      { error: 'Billing is not configured', errorCode: 'SERVER_CONFIG' },
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

  let subscriptions;
  try {
    subscriptions = await listPaddleSubscriptionsForEmail(paddle, user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paddle error';
    console.error('[cancel-subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'PADDLE_ERROR' },
      { status: 502 },
    );
  }

  const chosen = pickCancellablePaddleSubscription(subscriptions);
  if (!chosen) {
    return NextResponse.json(
      {
        error: 'No cancellable monthly subscription found for this email.',
        errorCode: 'NO_SUBSCRIPTION',
      },
      { status: 404 },
    );
  }

  try {
    const cancelled = await cancelPaddleSubscription(paddle, chosen.id);
    return NextResponse.json({
      cancelled: true,
      current_billing_period_ends_at: cancelled.currentBillingPeriodEndsAt,
      subscription: toPaddleSubscriptionBillingView(cancelled),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paddle error';
    console.error('[cancel-subscription] update', message);
    return NextResponse.json(
      { error: message, errorCode: 'PADDLE_ERROR' },
      { status: 502 },
    );
  }
}
