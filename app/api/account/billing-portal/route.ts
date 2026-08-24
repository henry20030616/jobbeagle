import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  getLemonSqueezyConfig,
  listLemonSubscriptionsForEmail,
  pickManageableLemonSubscription,
  retrieveLemonSubscription,
} from '@/lib/lemonsqueezy';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Fresh signed Lemon Squeezy customer portal URL (card, invoices, pause). */
export async function GET() {
  const ls = getLemonSqueezyConfig();
  const admin = getSupabaseAdmin();
  if (!ls || !admin) {
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
    subscriptions = await listLemonSubscriptionsForEmail(ls.apiKey, ls.storeId, user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lemon Squeezy error';
    console.error('[billing-portal]', message);
    return NextResponse.json(
      { error: message, errorCode: 'LEMONSQUEEZY_ERROR' },
      { status: 502 },
    );
  }

  const chosen = pickManageableLemonSubscription(subscriptions);
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
    const fresh = await retrieveLemonSubscription(ls.apiKey, chosen.id);
    const url = fresh.customerPortalUrl;
    if (!url) {
      return NextResponse.json(
        {
          error: 'Billing portal URL is not available yet. Try again in a moment.',
          errorCode: 'PORTAL_UNAVAILABLE',
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lemon Squeezy error';
    console.error('[billing-portal] retrieve', message);
    return NextResponse.json(
      { error: message, errorCode: 'LEMONSQUEEZY_ERROR' },
      { status: 502 },
    );
  }
}
