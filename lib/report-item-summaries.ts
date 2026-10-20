import type { FullReport, LiteReport } from '@/types';

function trimText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function joinSummaryParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => trimText(part)).filter(Boolean).join(' ');
}

/** First n sentences or newline-separated lines, for a section overview. */
export function firstSummarySentences(text: string, count = 2): string {
  const lined = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lined.length >= count) return lined.slice(0, count).join(' ');
  const sentences = text
    .split(/(?<=[。！？.!?])(?:\s+|$)/)
    .map((line) => line.trim())
    .filter(Boolean);
  return sentences.slice(0, count).join(' ');
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
    company: trimText(company?.summary || company?.culture),
    questions: trimText(bank?.summary || bank?.process),
    negotiate: trimText(
      negotiation?.summary || firstSummarySentences(negotiation?.pay_strategy ?? '', 2),
    ),
  };
}
