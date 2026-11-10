-- Guest Fit Snapshot hardening (optional while runtime uses usage_limits).
-- Runtime already claims via usage_limits (ip_hash=guest_fp:… / guest_gid:…,
-- date=1970-01-01). Apply this when Management API / DB access is available
-- so guest reports can persist with nullable user_id + a dedicated ledger.

CREATE TABLE IF NOT EXISTS public.guest_fit_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_key TEXT NOT NULL UNIQUE,
  guest_id TEXT,
  fingerprint TEXT,
  ip_hash TEXT,
  report_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_fit_claims_fingerprint_unique
  ON public.guest_fit_claims (fingerprint)
  WHERE fingerprint IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_fit_claims_guest_id_unique
  ON public.guest_fit_claims (guest_id)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_fit_claims_created
  ON public.guest_fit_claims (created_at DESC);

ALTER TABLE public.analysis_reports
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.analysis_reports
  ADD COLUMN IF NOT EXISTS guest_key TEXT;

CREATE INDEX IF NOT EXISTS idx_analysis_reports_guest_key
  ON public.analysis_reports (guest_key)
  WHERE guest_key IS NOT NULL;

-- Service role only for guest claims (no client write policies).
ALTER TABLE public.guest_fit_claims ENABLE ROW LEVEL SECURITY;
