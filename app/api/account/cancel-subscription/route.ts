import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  cancelStripeSubscription,
  getStripeClient,
  getStripeConfig,
  listStripeSubscriptionsForEmail,
  pickCancellableStripeSubscription,
  toStripeSubscriptionBillingView,
} from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Cancel the signed-in user's Standard/Advanced subscription at period end.
 * Does not strip credits or membership until Stripe `current_period_end`.
 */
export async function POST() {
  const stripeConfig = getStripeConfig();
  const stripe = getStripeClient();
  const admin = getSupabaseAdmin();
  if (!stripeConfig || !stripe || !admin) {
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
    subscriptions = await listStripeSubscriptionsForEmail(stripe, user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[cancel-subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 502 },
    );
  }

  const chosen = pickCancellableStripeSubscription(subscriptions);
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
    const cancelled = await cancelStripeSubscription(stripe, chosen.id);
    return NextResponse.json({
      cancelled: true,
      current_period_end: cancelled.currentPeriodEnd,
      subscription: toStripeSubscriptionBillingView(cancelled),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[cancel-subscription] update', message);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 502 },
    );
  }
}
