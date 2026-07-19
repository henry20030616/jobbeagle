import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { reconcileLemonBilling } from '@/lib/billing-reconcile';

/**
 * Cron: Lemon Squeezy ↔ orders reconcile (+ optional Resend alert).
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

  try {
    const report = await reconcileLemonBilling(admin, { alert: true });
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reconcile failed';
    console.error('[cron/reconcile-billing]', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
