import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fulfillPaidOrderById } from '@/lib/fulfill-order';
import {
  captureOrLoadPayPalOrder,
  getPayPalConfig,
  getPayPalSubscription,
} from '@/lib/paypal';
import { clientIpFromRequest, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function redirectHome(request: NextRequest, checkout: 'success' | 'cancel' | 'error') {
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = `?checkout=${checkout}`;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!getPayPalConfig()) {
    return redirectHome(request, 'error');
  }

  const { allowed } = await rateLimit('paypal-return', clientIpFromRequest(request), 60, 60);
  if (!allowed) {
    return redirectHome(request, 'error');
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return redirectHome(request, 'error');
  }

  const subscriptionId = request.nextUrl.searchParams.get('subscription_id')?.trim() ?? '';
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';

  try {
    if (subscriptionId) {
      const sub = await getPayPalSubscription(subscriptionId);
      if (sub.status !== 'ACTIVE' && sub.status !== 'APPROVED') {
        return redirectHome(request, 'error');
      }
      const orderId = sub.customId;
      if (!orderId) return redirectHome(request, 'error');
      const result = await fulfillPaidOrderById(admin, orderId, sub.id, 'paypal');
      if (result === 'missing') return redirectHome(request, 'error');
      return redirectHome(request, 'success');
    }

    if (!token) {
      return redirectHome(request, 'cancel');
    }

    const captured = await captureOrLoadPayPalOrder(token);
    const orderId = captured.customId;
    if (!orderId) return redirectHome(request, 'error');
    const externalId = captured.captureId ?? token;
    const result = await fulfillPaidOrderById(admin, orderId, externalId, 'paypal');
    if (result === 'missing') return redirectHome(request, 'error');
    return redirectHome(request, 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'paypal return failed';
    console.error('[paypal-return]', message);
    return redirectHome(request, 'error');
  }
}
