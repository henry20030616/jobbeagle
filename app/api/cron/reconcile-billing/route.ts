import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { reconcileLemonBilling, reconcilePaddleBilling } from '@/lib/billing-reconcile';

/**
 * Cron: Paddle & Lemon Squeezy ↔ orders reconcile (+ optional Resend alert).
 * Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server config' }, { status: 503 });
  }

  const results: {
    paddle?: any;
    lemonSqueezy?: any;
    errors: string[];
  } = { errors: [] };

  // Reconcile Paddle (primary payment system)
  try {
    results.paddle = await reconcilePaddleBilling(admin, { alert: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paddle reconcile failed';
    console.error('[cron/reconcile-billing] Paddle:', message);
    results.errors.push(`Paddle: ${message}`);
  }

  // Reconcile Lemon Squeezy (legacy, if configured)
  try {
    results.lemonSqueezy = await reconcileLemonBilling(admin, { alert: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lemon Squeezy reconcile failed';
    console.error('[cron/reconcile-billing] Lemon Squeezy:', message);
    results.errors.push(`Lemon Squeezy: ${message}`);
  }

  const allOk = 
    (results.paddle?.ok !== false) && 
    (results.lemonSqueezy?.ok !== false) &&
    results.errors.length === 0;

  return NextResponse.json({
    ok: allOk,
    ...results,
  });
}
