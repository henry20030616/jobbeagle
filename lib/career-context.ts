import type { CareerContext } from '@/types';

export const EMPTY_CAREER_CONTEXT: CareerContext = {
  target_level: '',
  location_or_remote: '',
  work_auth: '',
  target_tc: '',
  walk_away_tc: '',
  non_negotiables: '',
  signature_strengths: '',
};

export function normalizeCareerContext(
  raw: unknown,
): CareerContext {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CAREER_CONTEXT };
  const o = raw as Record<string, unknown>;
  const str = (k: keyof CareerContext) =>
    typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, 500) : '';
  return {
    target_level: str('target_level'),
    location_or_remote: str('location_or_remote'),
    work_auth: str('work_auth'),
    target_tc: str('target_tc'),
    walk_away_tc: str('walk_away_tc'),
    non_negotiables: str('non_negotiables'),
    signature_strengths: str('signature_strengths'),
  };
}

export function careerContextHasSignal(ctx: CareerContext | null | undefined): boolean {
  if (!ctx) return false;
  return Object.values(ctx).some((v) => typeof v === 'string' && v.trim().length > 0);
}

/** Inject into Gemini user prompt when account Career Context exists. */
export function formatCareerContextForPrompt(ctx: CareerContext | null | undefined): string {
  if (!careerContextHasSignal(ctx)) return '';
  const lines = [
    ctx!.target_level && `Target level: ${ctx!.target_level}`,
    ctx!.location_or_remote && `Location / remote: ${ctx!.location_or_remote}`,
    ctx!.work_auth && `Work authorization: ${ctx!.work_auth}`,
    ctx!.target_tc && `Target total compensation: ${ctx!.target_tc}`,
    ctx!.walk_away_tc && `Walk-away floor: ${ctx!.walk_away_tc}`,
    ctx!.non_negotiables && `Non-negotiables: ${ctx!.non_negotiables}`,
    ctx!.signature_strengths && `Signature strengths: ${ctx!.signature_strengths}`,
  ].filter(Boolean);
  return [
    '=== CANDIDATE CAREER CONTEXT (user-provided floors — honor these) ===',
    ...lines,
    'When Career Context includes target_tc or walk_away_tc, expected_offer.target_gap MUST compare the offer band to those floors.',
    'offer_strategy target / acceptable / walk_away MUST reference the same floors when present.',
  ].join('\n');
}

/** Append personal floor lines if the model omitted them. */
export function enrichTargetGapWithCareerContext(
  targetGap: string,
  ctx: CareerContext | null | undefined,
): string {
  if (!careerContextHasSignal(ctx)) return targetGap;
  const hasPersonal =
    /your target|walk-?away|personal (target|floor)|career context/i.test(targetGap);
  if (hasPersonal) return targetGap;
  const bits = [
    ctx!.target_tc ? `Your target TC: ${ctx!.target_tc}` : null,
    ctx!.walk_away_tc ? `Your walk-away: ${ctx!.walk_away_tc}` : null,
  ].filter(Boolean);
  if (bits.length === 0) return targetGap;
  const suffix = bits.join('. ') + '.';
  return targetGap.trim()
    ? `${targetGap.trim()} ${suffix}`
    : suffix;
}
