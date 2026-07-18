import type { ExpectedOfferRange, SalaryEvidenceTier } from '@/types';

function cleanMoney(v: string | null | undefined): string {
  if (!v || !v.trim() || v.trim() === '—') return '';
  return v.trim();
}

/**
 * Display Expected Offer as a single human range — never P25/P50/P75 labels.
 * Prefers posted JD range; otherwise low–high from stored percentiles.
 */
export function formatOfferRange(offer: ExpectedOfferRange | null | undefined): string | null {
  if (!offer) return null;
  const posted = cleanMoney(offer.posted_range);
  if (posted) return posted;

  const low = cleanMoney(offer.p25);
  const mid = cleanMoney(offer.p50);
  const high = cleanMoney(offer.p75);

  if (low && high) return `${low} – ${high}`;
  if (low && mid) return `${low} – ${mid}`;
  if (mid && high) return `${mid} – ${high}`;
  return mid || low || high || null;
}

export function hasOfferRange(offer: ExpectedOfferRange | null | undefined): boolean {
  return Boolean(formatOfferRange(offer));
}

const TIER_LABELS: Record<SalaryEvidenceTier, string> = {
  A: 'Tier A — Posted / employer-disclosed range',
  B: 'Tier B — Closely matched public role data',
  C: 'Tier C — Market benchmarks (location + level)',
  D: 'Tier D — Insufficient evidence; do not treat as an offer',
};

/** Short evaluation copy for Snapshot “Range Evaluation” (mirrors Score Summary). */
export function offerEvaluationSummary(
  offer: ExpectedOfferRange | null | undefined,
): {
  headline: string;
  basis: string;
  detail: string;
} {
  if (!offer) {
    return {
      headline: 'No evaluation yet',
      basis: 'Insufficient inputs',
      detail: 'Ask the recruiter for the approved cash range before investing interview time.',
    };
  }

  const tier = offer.evidence_tier || 'D';
  const posted = cleanMoney(offer.posted_range);
  const hasEstimate = Boolean(formatOfferRange(offer));

  let basis: string;
  if (posted) {
    basis = 'Primary source: range disclosed in the job posting.';
  } else if (tier === 'B') {
    basis = 'Primary source: public compensation data matched to role level and location.';
  } else if (tier === 'C') {
    basis = 'Primary source: market benchmarks for similar level / function / region — not a company offer.';
  } else if (tier === 'D' || !hasEstimate) {
    basis = 'No reliable band — do not anchor compensation from this report alone.';
  } else {
    basis = TIER_LABELS[tier] || TIER_LABELS.D;
  }

  const detail =
    offer.target_gap?.trim()
    || (offer.sources?.length
      ? `Sources: ${offer.sources.slice(0, 3).join(' · ')}`
      : 'Confirm the approved band and leveling with the recruiter before negotiating.');

  return {
    headline: TIER_LABELS[tier] || TIER_LABELS.D,
    basis,
    detail,
  };
}
