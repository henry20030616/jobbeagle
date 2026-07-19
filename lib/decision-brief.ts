/**
 * Split apply_decision.reason into short bullets for Snapshot UI.
 * Prefers newline / " - " lists; falls back to sentence boundaries.
 */
export function splitDecisionBrief(text: string | null | undefined): string[] {
  const raw = (text ?? '').trim();
  if (!raw) return [];

  const byLine = raw
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean);
  if (byLine.length >= 2) return byLine;

  const bySentence = raw
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (bySentence.length >= 2) return bySentence;

  return [raw];
}
