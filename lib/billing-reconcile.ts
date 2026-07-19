import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getLemonSqueezyConfig,
  listRecentLemonOrders,
} from '@/lib/lemonsqueezy';

export type BillingReconcileReport = {
  ok: boolean;
  paidLsCount: number;
  dbOrderCount: number;
  pendingStuck: Array<{ id: string; plan_type: string; created_at: string }>;
  paidMissingLocal: Array<Record<string, unknown>>;
  summary: string;
};

async function sendBillingAlert(subject: string, bodyText: string): Promise<boolean> {
  const to = process.env.ALERT_EMAIL || process.env.BILLING_ALERT_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (!to || !key) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM || 'JobBeagle Billing <onboarding@resend.dev>',
      to: [to],
      subject,
      text: bodyText,
    }),
  });
  return res.ok;
}

/** Compare recent Lemon paid orders to local `orders` rows. */
export async function reconcileLemonBilling(
  admin: SupabaseClient,
  opts?: { alert?: boolean },
): Promise<BillingReconcileReport> {
  const ls = getLemonSqueezyConfig();
  if (!ls) {
    throw new Error('Lemon Squeezy is not configured');
  }

  const lsOrders = await listRecentLemonOrders(ls.apiKey, ls.storeId, 50);
  const paidLs = lsOrders.filter((o) => o.status === 'paid');

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: dbOrders, error } = await admin
    .from('orders')
    .select('id, status, external_checkout_id, plan_type, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const byExternal = new Map(
    (dbOrders || [])
      .filter((o) => o.external_checkout_id)
      .map((o) => [String(o.external_checkout_id), o]),
  );

  const pendingStuck = (dbOrders || [])
    .filter(
      (o) =>
        o.status === 'pending'
        && Date.now() - new Date(o.created_at).getTime() > 60 * 60 * 1000,
    )
    .map((o) => ({
      id: o.id as string,
      plan_type: String(o.plan_type),
      created_at: String(o.created_at),
    }));

  const paidMissingLocal: Array<Record<string, unknown>> = [];
  for (const row of paidLs) {
    const local = byExternal.get(row.id);
    if (!local) {
      paidMissingLocal.push({
        lemon_order_id: row.id,
        email: row.userEmail,
        total: row.total,
        created_at: row.createdAt,
      });
    } else if (local.status !== 'succeeded') {
      paidMissingLocal.push({
        lemon_order_id: row.id,
        local_order_id: local.id,
        local_status: local.status,
        email: row.userEmail,
      });
    }
  }

  const summary = [
    `JobBeagle billing reconcile ${new Date().toISOString()}`,
    `Paid LS (page): ${paidLs.length}`,
    `DB orders (14d): ${(dbOrders || []).length}`,
    `Paid LS without local succeeded: ${paidMissingLocal.length}`,
    `Stuck pending (>1h): ${pendingStuck.length}`,
    '',
    paidMissingLocal.length
      ? `Sample mismatches:\n${paidMissingLocal
          .slice(0, 10)
          .map((r) => JSON.stringify(r))
          .join('\n')}`
      : 'No paid↔local mismatches on this page.',
  ].join('\n');

  const ok = paidMissingLocal.length === 0 && pendingStuck.length === 0;
  if (opts?.alert && !ok) {
    await sendBillingAlert(
      `[JobBeagle] Billing reconcile: ${paidMissingLocal.length + pendingStuck.length} issue(s)`,
      summary,
    );
  }

  return {
    ok,
    paidLsCount: paidLs.length,
    dbOrderCount: (dbOrders || []).length,
    pendingStuck,
    paidMissingLocal,
    summary,
  };
}
