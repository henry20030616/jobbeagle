/**
 * Split Interview Guide company / candidate stance copy into scannable bullets.
 * Model field is still one string (`salary_land.buyer_seller`): two unlabeled lines,
 * then sentences inside each line. Arrays are not in the JSON schema.
 */

const SENTENCE_SPLIT = /(?<=[。！？؟।])\s*|(?<=[.!?])(?:\s+|$)/;

function stripBulletPrefix(line: string): string {
  return line.replace(/^[-*•●]\s+/, '').trim();
}

/** Newlines win; otherwise sentence/period split. Does not split $1.2K-style decimals. */
export function splitSentenceBullets(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const chunks = trimmed
    .split(/\n+/)
    .map((line) => stripBulletPrefix(line))
    .filter(Boolean);
  const bullets: string[] = [];
  for (const chunk of chunks) {
    const sentences = chunk
      .split(SENTENCE_SPLIT)
      .map((item) => item.trim())
      .filter(Boolean);
    if (sentences.length > 0) bullets.push(...sentences);
  }
  return bullets;
}

/** Line 1 = company stance; remaining lines = candidate stance. Each side → bullets. */
export function splitBuyerSellerStances(text: string): {
  company: string[];
  candidate: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) return { company: [], candidate: [] };
  const lined = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lined.length >= 2) {
    return {
      company: splitSentenceBullets(lined[0] ?? ''),
      candidate: splitSentenceBullets(lined.slice(1).join('\n')),
    };
  }
  const sentences = splitSentenceBullets(trimmed);
  if (sentences.length >= 2) {
    return { company: sentences.slice(0, 1), candidate: sentences.slice(1) };
  }
  return { company: sentences, candidate: [] };
}
