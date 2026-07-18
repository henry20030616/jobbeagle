import type { ExpectedOfferRange } from '@/types';

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
