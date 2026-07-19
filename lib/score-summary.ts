/** Normalize "Label — detail" / "Label - detail" → "Label: detail" for parallel bullets. */
export function parallelizeVerdictPoint(point: string): string {
  const trimmed = point.trim();
  if (!trimmed) return trimmed;
  // Already "Label: detail"
  if (/^[^:]{1,48}:\s+\S/.test(trimmed)) return trimmed;
  // "Label — detail" / "Label – detail" / "Label - detail"
  const dashed = trimmed.replace(
    /^(.{1,48}?)\s*[—–-]\s+(\S.*)$/u,
    (_m, label: string, detail: string) => `${label.trim()}: ${detail.trim()}`,
  );
  return dashed;
}

/** Split "Label: detail" for UI (bold label + muted detail). */
export function splitScoreSummaryPoint(point: string): { label: string; detail: string } {
  const trimmed = parallelizeVerdictPoint(point);
  const idx = trimmed.indexOf(': ');
  if (idx > 0 && idx < 48) {
    return {
      label: trimmed.slice(0, idx).trim(),
      detail: trimmed.slice(idx + 2).trim(),
    };
  }
  return { label: trimmed, detail: '' };
}

/** Prefer model bullets; else split prose into scannable Score Summary points. */
export function scoreSummaryPoints(
  sharpVerdict: string | undefined | null,
  points?: string[] | null,
): string[] {
  if (Array.isArray(points) && points.length > 0) {
    return points
      .map((p) => (typeof p === 'string' ? parallelizeVerdictPoint(p) : ''))
      .filter(Boolean)
      .slice(0, 5);
  }

  const text = (sharpVerdict ?? '').trim();
  if (!text) return [];

  const byLine = text
    .split(/\n+/)
    .map((s) => parallelizeVerdictPoint(s.replace(/^[-•*]\s*/, '').trim()))
    .filter(Boolean);
  if (byLine.length >= 2) return byLine.slice(0, 5);

  const bySentence = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => parallelizeVerdictPoint(s.trim()))
    .filter((s) => s.length > 0);
  if (bySentence.length >= 2) return bySentence.slice(0, 5);

  return [parallelizeVerdictPoint(text)];
}
