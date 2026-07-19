/** Prefer model bullets; else split prose into scannable Score Summary points. */
export function scoreSummaryPoints(
  sharpVerdict: string | undefined | null,
  points?: string[] | null,
): string[] {
  if (Array.isArray(points) && points.length > 0) {
    return points
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean)
      .slice(0, 5);
  }

  const text = (sharpVerdict ?? '').trim();
  if (!text) return [];

  const byLine = text
    .split(/\n+/)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (byLine.length >= 2) return byLine.slice(0, 5);

  const bySentence = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (bySentence.length >= 2) return bySentence.slice(0, 5);

  return [text];
}
