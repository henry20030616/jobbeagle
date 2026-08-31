import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import { applyMembershipFromStripeSubscriptions } from '@/lib/fulfill-order';
import {
  getStripeClient,
  getStripeConfig,
  listStripeSubscriptionsForEmail,
  pickManageableStripeSubscription,
  toStripeSubscriptionBillingView,
} from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Current monthly subscription for the signed-in email (read-only view).
 * Downgrades a stale paid tier if Stripe already shows the sub expired.
 */
export async function GET() {
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

  const { allowed } = await rateLimit('account-subscription', user.id, 60, 3600);
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
    console.error('[account/subscription]', message);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 502 },
    );
  }

  try {
    await applyMembershipFromStripeSubscriptions(admin, user.id, subscriptions, {
      mode: 'downgrade-only',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile update failed';
    console.error('[account/subscription] reconcile', message);
  }

  const chosen = pickManageableStripeSubscription(subscriptions);
  return NextResponse.json({
    subscription: toStripeSubscriptionBillingView(chosen),
  });
}
