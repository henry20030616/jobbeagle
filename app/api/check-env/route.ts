import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPayPalConfig, getMissingPayPalPlanIds } from '@/lib/paypal';

/**
 * Environment & Supabase health-check endpoint.
 * Available in development; in production, protected by a secret header.
 * Usage:  GET /api/check-env
 *         GET /api/check-env  (with header  x-check-secret: <CHECK_ENV_SECRET>  for production)
 */
export async function GET(request: NextRequest) {
  const isDevEnv = process.env.NODE_ENV === 'development';
  const secret = process.env.CHECK_ENV_SECRET;
  const incomingSecret = request.headers.get('x-check-secret');

  // Gate: dev always allowed; production requires matching secret
  if (!isDevEnv) {
    if (!secret || incomingSecret !== secret) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const paypal = getPayPalConfig();
  const missingPayPalPlans = getMissingPayPalPlanIds();

  // ── Supabase connectivity + table checks ─────────────────────
  let supabaseOk = false;
  let tablesFound: string[] = [];
  let tablesMissing: string[] = [];
  let storageOk = false;
  let storageError: string | null = null;

  const requiredTables = [
    'profiles',
    'orders',
    'analysis_reports',
    'shorts_videos',
    'job_applications',
    'company_profiles',
    'resume_history',
    'saved_jobs',
    'followed_companies',
  ];

  try {
    if (supabaseUrl && supabaseAnon) {
      const supabase = await createClient();

      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
        if (error) {
          tablesMissing.push(table);
        } else {
          tablesFound.push(table);
        }
      }
      supabaseOk = tablesMissing.length === 0;

      const { error: bucketError } = await supabase.storage
        .from('shorts-videos')
        .list('', { limit: 1 });
      storageOk = !bucketError;
      storageError = bucketError?.message ?? null;
    }
  } catch (e) {
    storageError = e instanceof Error ? e.message : String(e);
  }

  const checks = {
    gemini: {
      ok: !!geminiKey,
      envVars: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
      },
      preview: geminiKey ? `${geminiKey.slice(0, 6)}…${geminiKey.slice(-4)}` : null,
    },
    anthropic: {
      ok: !!anthropicKey,
      note: anthropicKey
        ? 'Guide writing uses Claude Sonnet'
        : 'Missing ANTHROPIC_API_KEY — Guide writing falls back to Gemini Pro',
    },
    paypal: {
      ok: Boolean(paypal?.clientId && paypal.clientSecret && paypal.webhookId && missingPayPalPlans.length === 0),
      configured: Boolean(paypal),
      environment: paypal?.environment ?? null,
      webhookIdSet: Boolean(paypal?.webhookId),
      missingPlans: missingPayPalPlans,
    },
    supabase: {
      ok: !!(supabaseUrl && supabaseAnon && serviceRole),
      urlSet: !!supabaseUrl,
      anonKeySet: !!supabaseAnon,
      serviceRoleSet: !!serviceRole,
    },
    supabaseTables: {
      ok: supabaseOk,
      found: tablesFound,
      missing: tablesMissing,
    },
    storage: {
      ok: storageOk,
      bucket: 'shorts-videos',
      error: storageError,
    },
    resend: {
      ok: !!resendKey,
      preview: resendKey ? `${resendKey.slice(0, 6)}…` : null,
    },
    cron: {
      ok: !!cronSecret,
    },
    checkEnvSecret: {
      ok: !!secret,
      note: secret ? 'Production gate configured' : 'Set CHECK_ENV_SECRET for production access',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV ?? 'local',
      vercelUrl: process.env.VERCEL_URL ?? 'localhost',
    },
  };

  const launchCriticalOk =
    checks.gemini.ok
    && checks.paypal.ok
    && checks.supabase.ok
    && checks.supabaseTables.ok;

  const allOk =
    launchCriticalOk
    && checks.storage.ok
    && checks.resend.ok
    && checks.cron.ok
    && checks.anthropic.ok;

  return NextResponse.json({
    status: allOk ? 'ok' : launchCriticalOk ? 'partial' : 'blocked',
    message: allOk
      ? 'All environment variables and services are configured.'
      : launchCriticalOk
        ? 'Launch-critical checks passed; some optional checks failed — see details.'
        : 'Launch-critical checks failed — see details below.',
    checks,
    timestamp: new Date().toISOString(),
  });
}
