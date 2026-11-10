import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type GuestFitClaimResult =
  | { ok: true; claimKey: string; claimId: string }
  | { ok: false; code: 'GUEST_FIT_USED' | 'GUEST_DEVICE_REQUIRED' };

/** Lifetime sentinel date so usage_limits (ip_hash, date) can store one-shot guest claims. */
export const GUEST_FIT_LIFETIME_DATE = '1970-01-01';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeGuestId(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return UUID_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function normalizeFingerprint(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(`jb-guest-ip:${ip}`).digest('hex').slice(0, 32);
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '23505') return true;
  return /duplicate key|unique constraint/i.test(error.message ?? '');
}

function claimKeys(fingerprint: string | null, guestId: string | null): string[] {
  const keys: string[] = [];
  if (fingerprint) keys.push(`guest_fp:${fingerprint}`);
  if (guestId) keys.push(`guest_gid:${guestId}`);
  return keys;
}

/**
 * Atomically claim the single free guest Fit Snapshot for this device/guest.
 * Uses existing `usage_limits` (no new migration required at runtime).
 * Prefer fingerprint; also bind guest_id when present so clearing one signal
 * alone cannot farm a second free run.
 */
export async function claimGuestFitSnapshot(
  admin: SupabaseClient,
  opts: {
    fingerprint?: string | null;
    guestId?: string | null;
    ip: string;
  },
): Promise<GuestFitClaimResult> {
  const fingerprint = normalizeFingerprint(opts.fingerprint);
  const guestId = normalizeGuestId(opts.guestId);
  const keys = claimKeys(fingerprint, guestId);

  if (keys.length === 0) {
    return { ok: false, code: 'GUEST_DEVICE_REQUIRED' };
  }

  const { data: existing, error: lookupError } = await admin
    .from('usage_limits')
    .select('id, ip_hash')
    .in('ip_hash', keys)
    .eq('date', GUEST_FIT_LIFETIME_DATE)
    .limit(1);

  if (lookupError) {
    console.warn('[guest-fit] lookup failed:', lookupError.message);
  }
  if (existing && existing.length > 0) {
    return { ok: false, code: 'GUEST_FIT_USED' };
  }

  const rows = keys.map((ip_hash) => ({
    ip_hash,
    date: GUEST_FIT_LIFETIME_DATE,
    count: 1,
  }));

  const { data: inserted, error: insertError } = await admin
    .from('usage_limits')
    .insert(rows)
    .select('id, ip_hash');

  if (insertError || !inserted?.length) {
    if (isUniqueViolation(insertError)) {
      return { ok: false, code: 'GUEST_FIT_USED' };
    }
    console.error('[guest-fit] insert failed:', insertError?.message);
    throw new Error(
      insertError?.message
        ? `Guest fit claim unavailable: ${insertError.message}`
        : 'Guest fit claim unavailable',
    );
  }

  const primary = inserted.find((row) => row.ip_hash === keys[0]) ?? inserted[0];
  return {
    ok: true,
    claimKey: keys[0],
    claimId: String(primary.id),
  };
}

/** Optional attach — no-op while guest reports stay session-only. */
export async function attachGuestFitReport(
  _admin: SupabaseClient,
  _claimId: string,
  _reportId: string,
): Promise<void> {
  // Guest Fit reports are returned in the analyze response and stored in
  // sessionStorage. Dedicated guest_fit_claims.report_id wiring lands with
  // migration 016 when Management API access is available.
}
