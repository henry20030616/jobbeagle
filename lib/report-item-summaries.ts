import type { FullReport, LiteReport } from '@/types';
import { resolveCompanyEvalSummaries } from '@/lib/company-eval-summary';

function trimText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function joinSummaryParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => trimText(part)).filter(Boolean).join(' ');
}

/** Split a section overview into scannable points. Newlines win; else sentences. */
export function splitSummaryPoints(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const lined = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lined.length > 1) return lined;
  const sentences = trimmed
    .split(/(?<=[。！？.!?])(?:\s+|$)/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (sentences.length >= 3) return sentences;
  return [trimmed];
}

/**
 * Split a prose blob (職位概述, 總結分析, 應徵建議 reason) into stacked sentences.
 * Newlines win. Else split after CJK/Indic/Arabic stops, or ASCII .!? when a
 * space or end follows. Does not split mid-clause (commas / 、). Do not use on
 * bullet lists such as 關鍵條件 or Beagle bullets.
 */
export function splitProseSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const lined = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lined.length > 1) return lined;
  const sentences = trimmed
    .split(/(?<=[。！？।؟])|(?<=[.!?])(?=\s+|$)/)
    .map((line) => line.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [trimmed];
}

/** First n sentences or newline-separated lines, for a section overview. */
export function firstSummarySentences(text: string, count = 2): string {
  return splitSummaryPoints(text).slice(0, count).join(' ');
}

export function snapshotItemSummaries(report: LiteReport): {
  core: string;
  fit: string;
  market: string;
} {
  return {
    core: trimText(report.role_read?.mission),
    fit: trimText(report.apply_decision?.reason || report.fit_score?.sharp_verdict),
    market: joinSummaryParts([
      report.expected_offer?.target_gap,
      report.expected_offer?.candidate_position_label,
    ]),
  };
}

export function guideItemSummaries(report: FullReport): {
  land: string;
  company: string;
  questions: string;
  negotiate: string;
} {
  const modules = report.guide_modules;
  const company = modules?.company_eval;
  const bank = modules?.interview_bank;
  const negotiation = modules?.negotiation;
  return {
    land: trimText(modules?.salary_land?.rationale),
    company: trimText((() => {
      if (!company) return '';
      const split = resolveCompanyEvalSummaries(company);
      return split.summary || [split.summary_company, split.summary_role].filter(Boolean).join('\n') || company.culture;
    })()),
    questions: trimText(bank?.summary || bank?.process),
    negotiate: trimText(
      negotiation?.summary || firstSummarySentences(negotiation?.pay_strategy ?? '', 2),
    ),
  };
}
