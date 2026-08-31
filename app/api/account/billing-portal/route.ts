import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  getStripeClient,
  getStripeConfig,
  listStripeSubscriptionsForEmail,
  pickManageableStripeSubscription,
  createStripeBillingPortalSession,
} from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Fresh signed Stripe billing portal URL (card, invoices, cancel). */
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

  const { allowed } = await rateLimit('billing-portal', user.id, 20, 3600);
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
    console.error('[billing-portal]', message);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 502 },
    );
  }

  const chosen = pickManageableStripeSubscription(subscriptions);
  if (!chosen) {
    return NextResponse.json(
      {
        error: 'No monthly subscription found for this email.',
        errorCode: 'NO_SUBSCRIPTION',
      },
      { status: 404 },
    );
  }

  try {
    // Get fresh subscription to find customer ID
    const sub = await stripe.subscriptions.retrieve(chosen.id);
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobbeagle.com';
    const returnUrl = `${origin}/account`;
    
    const url = await createStripeBillingPortalSession(stripe, customerId, returnUrl);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[billing-portal] create session', message);
    return NextResponse.json(
      { error: message, errorCode: 'STRIPE_ERROR' },
      { status: 502 },
    );
  }
}
