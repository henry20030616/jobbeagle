import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  findLivePayPalSubscription,
  getPayPalConfig,
  paypalBillingPortalUrl,
} from '@/lib/paypal';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** PayPal billing portal URL for managing subscriptions. */
export async function GET() {
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

  try {
    const live = await findLivePayPalSubscription(admin, user.id);
    if (!live) {
      return NextResponse.json(
        {
          error: 'No monthly subscription found.',
          errorCode: 'NO_SUBSCRIPTION',
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ url: paypalBillingPortalUrl(paypal.environment) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PayPal error';
    console.error('[billing-portal]', message);
    return NextResponse.json(
      { error: message, errorCode: 'PAYPAL_ERROR' },
      { status: 502 },
    );
  }
}
