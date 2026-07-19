import type { ExpectedOfferRange, SalaryEvidenceTier } from '@/types';

function cleanMoney(v: string | null | undefined): string {
  if (!v || !v.trim() || v.trim() === '—') return '';
  return v.trim();
}

/** Plain-English label for evidence_tier (never show bare "Tier C" in UI). */
export function evidenceTierLabel(tier: SalaryEvidenceTier | string | null | undefined): string {
  switch (tier) {
    case 'A':
      return 'From the job posting';
    case 'B':
      return 'From comparable public roles';
    case 'C':
      return 'Market estimate (not a company offer)';
    case 'D':
      return 'Pay data too thin';
    default:
      return 'Pay evidence unclear';
  }
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

/** Single-point prediction for this candidate inside the seat band. */
export function formatPredictedOffer(
  offer: ExpectedOfferRange | null | undefined,
): string | null {
  if (!offer) return null;
  return cleanMoney(offer.candidate_predicted_offer) || null;
}

/**
 * Plain-language market value of this role for Snapshot “Range Evaluation”.
 * Not a glossary of evidence tiers.
 */
export function offerEvaluationSummary(
  offer: ExpectedOfferRange | null | undefined,
): {
  headline: string;
  body: string;
  note: string;
} {
  if (!offer) {
    return {
      headline: 'Market value unclear',
      body: 'Not enough pay signal for this role yet. Ask the recruiter for the approved cash band before you decide if the economics are worth your time.',
      note: '',
    };
  }

  const range = formatOfferRange(offer);
  const region = offer.region?.trim() || 'this market';
  const currency = offer.currency?.trim() || 'USD';
  const posted = cleanMoney(offer.posted_range);
  const tier = offer.evidence_tier || 'D';
  const position = offer.candidate_position_label?.trim() || '';
  const gap = offer.target_gap?.trim() || '';
  const note = position || gap;

  if (!range || tier === 'D') {
    return {
      headline: 'Market value unclear',
      body: `Public pay data for this role in ${region} is too thin to price the seat. Confirm the approved ${currency} band with the recruiter before investing interview time.`,
      note,
    };
  }

  if (posted) {
    return {
      headline: `This role is posted at ${range}`,
      body: `The employer disclosed ${range} (${currency}) for this seat in ${region}. That is the clearest signal of what the job is worth on the open market.`,
      note,
    };
  }

  if (tier === 'B') {
    return {
      headline: `Comparable seats pay about ${range}`,
      body: `Public pay data for similar level and location in ${region} clusters around ${range} (${currency}). Treat this as the market value of the seat — confirm the company’s approved band before you negotiate.`,
      note,
    };
  }

  // Tier C (and any other estimated band)
  return {
    headline: `Market value ≈ ${range}`,
    body: `For this level in ${region}, comparable roles typically land around ${range} (${currency}). Use that as the market price of the job when deciding whether to apply — it is not a promised company offer.`,
    note,
  };
}
