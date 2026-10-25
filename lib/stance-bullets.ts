/**
 * Split Interview Guide company / candidate stance copy into scannable bullets.
 * Model field is still one string (`salary_land.buyer_seller`): four titled lines
 * (company ×2, then candidate ×2), same 'Short title: gist' shape as pay_strategy.
 * Older reports used two unlabeled lines; those still sentence-split. Arrays are
 * not in the JSON schema.
 */

import { splitLabeledFact } from '@/lib/score-summary';

const SENTENCE_SPLIT = /(?<=[。！？؟।])\s*|(?<=[.!?])(?:\s+|$)/;

function stripBulletPrefix(line: string): string {
  return line.replace(/^[-*•●]\s+/, '').trim();
}

function isTitledBullet(line: string): boolean {
  return splitLabeledFact(line).detail.length > 0;
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
    if (isTitledBullet(chunk)) {
      bullets.push(chunk);
      continue;
    }
    const sentences = chunk
      .split(SENTENCE_SPLIT)
      .map((item) => item.trim())
      .filter(Boolean);
    if (sentences.length > 0) bullets.push(...sentences);
  }
  return bullets;
}

function stanceLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => stripBulletPrefix(line))
    .filter(Boolean);
}

/** Titled 4-line reports: first half company, second half candidate. Older 2-line unlabeled reports: line 1 vs the rest, then sentence-split. */
export function splitBuyerSellerStances(text: string): {
  company: string[];
  candidate: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) return { company: [], candidate: [] };
  const lined = stanceLines(trimmed);
  if (lined.length >= 2 && lined.every(isTitledBullet)) {
    const mid = Math.ceil(lined.length / 2);
    return { company: lined.slice(0, mid), candidate: lined.slice(mid) };
  }
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
