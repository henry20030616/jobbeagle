import type { FullReport, LiteReport } from '@/types';
import { isValidHttpUrl } from '@/lib/provenance';

export type ReportCorrectionAction = 'corrected' | 'needs_retry';

export interface ReportCorrection {
  code: string;
  action: ReportCorrectionAction;
  detail: string;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function looksLikeUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw.trim());
}

function stripBadUrl(raw: string | undefined | null): { value: string; stripped: boolean } {
  const value = (raw ?? '').trim();
  if (!value) return { value: '', stripped: false };
  if (!looksLikeUrl(value)) return { value, stripped: false };
  if (isValidHttpUrl(value)) return { value, stripped: false };
  return { value: '', stripped: true };
}

export function needsQualityRetry(corrections: ReportCorrection[]): boolean {
  return corrections.some((item) => item.action === 'needs_retry');
}

export function formatQualityRetryHint(corrections: ReportCorrection[]): string {
  const lines = corrections
    .filter((item) => item.action === 'needs_retry')
    .map((item) => `- ${item.detail}`);
  return [
    'QUALITY CORRECTION REQUIRED. Fix these issues and return complete valid JSON.',
    'Do not invent URLs, company news, salary citations, or resume facts.',
    ...lines,
  ].join('\n');
}

export function autoCorrectLiteReport(report: LiteReport): {
  report: LiteReport;
  corrections: ReportCorrection[];
} {
  const corrections: ReportCorrection[] = [];
  const next: LiteReport = { ...report };

  if (!next.job_title.trim()) {
    corrections.push({
      code: 'missing_job_title',
      action: 'needs_retry',
      detail: 'job_title is empty',
    });
  }

  const clamped = clampScore(next.fit_score.score);
  if (clamped !== next.fit_score.score) {
    next.fit_score = { ...next.fit_score, score: clamped };
    next.match_score = clamped;
    corrections.push({
      code: 'score_clamped',
      action: 'corrected',
      detail: `fit_score.score clamped to ${clamped}`,
    });
  }

  if (!next.fit_score.sharp_verdict.trim() && clamped === 0) {
    corrections.push({
      code: 'empty_fit_verdict',
      action: 'needs_retry',
      detail: 'fit_score is empty or zero with no verdict',
    });
  }

  if (!next.expected_offer.currency.trim()) {
    next.expected_offer = { ...next.expected_offer, currency: 'USD' };
    corrections.push({
      code: 'offer_currency_defaulted',
      action: 'corrected',
      detail: 'expected_offer.currency defaulted to USD',
    });
  }

  const offerSources = (next.expected_offer.sources ?? []).flatMap((source) => {
    const cleaned = stripBadUrl(source);
    if (cleaned.stripped) {
      corrections.push({
        code: 'invalid_offer_source_url',
        action: 'corrected',
        detail: `Removed invalid offer source URL: ${source}`,
      });
      return [];
    }
    return cleaned.value ? [cleaned.value] : [];
  });
  if (offerSources.length !== (next.expected_offer.sources ?? []).length) {
    next.expected_offer = { ...next.expected_offer, sources: offerSources };
  }

  return { report: next, corrections };
}

export function autoCorrectFullReport(report: FullReport): {
  report: FullReport;
  corrections: ReportCorrection[];
} {
  const lite = autoCorrectLiteReport(report);
  const corrections = [...lite.corrections];
  let next: FullReport = { ...report, ...lite.report };

  const reported = next.interview_playbook.reported.map((card) => {
    const cleaned = stripBadUrl(card.source_url);
    if (!cleaned.stripped) return card;
    corrections.push({
      code: 'invalid_interview_source_url',
      action: 'corrected',
      detail: `Cleared invalid interview source URL on: ${card.question.slice(0, 80)}`,
    });
    return { ...card, source_url: '' };
  });
  next = {
    ...next,
    interview_playbook: { ...next.interview_playbook, reported },
  };

  const questionCount =
    next.interview_playbook.reported.length + next.interview_playbook.predicted.length;
  if (questionCount === 0) {
    corrections.push({
      code: 'empty_interview_playbook',
      action: 'needs_retry',
      detail: 'interview_playbook has no reported or predicted questions',
    });
  }

  if (!next.offer_strategy.script.trim()) {
    corrections.push({
      code: 'empty_offer_script',
      action: 'needs_retry',
      detail: 'offer_strategy.script is empty',
    });
  }

  const developments = (next.company_truth?.recent_developments ?? []).map((item) => {
    const cleaned = stripBadUrl(item.source_url);
    if (!cleaned.stripped) return item;
    corrections.push({
      code: 'invalid_news_source_url',
      action: 'corrected',
      detail: `Cleared invalid news URL on: ${item.headline.slice(0, 80)}`,
    });
    return { ...item, source_url: '' };
  });
  if (next.company_truth && developments !== next.company_truth.recent_developments) {
    next = {
      ...next,
      company_truth: { ...next.company_truth, recent_developments: developments },
    };
  }

  return { report: next, corrections };
}
