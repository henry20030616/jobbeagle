import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import {
  getPaddleClient,
  getPaddleConfig,
  getPaddleCustomerPortalUrl,
  listPaddleSubscriptionsForEmail,
  pickManageablePaddleSubscription,
} from '@/lib/paddle';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Paddle customer portal URL for managing subscriptions. */
export async function GET() {
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
    subscriptions = await listPaddleSubscriptionsForEmail(paddle, user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paddle error';
    console.error('[billing-portal]', message);
    return NextResponse.json(
      { error: message, errorCode: 'PADDLE_ERROR' },
      { status: 502 },
    );
  }

  const chosen = pickManageablePaddleSubscription(subscriptions);
  if (!chosen) {
    return NextResponse.json(
      {
        error: 'No monthly subscription found for this email.',
        errorCode: 'NO_SUBSCRIPTION',
      },
      { status: 404 },
    );
  }

  // Paddle Customer Portal - users manage their subscription directly
  const url = getPaddleCustomerPortalUrl(paddleConfig.environment);
  
  return NextResponse.json({ 
    url,
    note: 'Please use your subscription email to access the Paddle Customer Portal.',
  });
}
