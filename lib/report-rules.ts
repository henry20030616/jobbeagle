import type {
  ApplyDecision,
  ApplyDecisionLabel,
  EvidenceCoverage,
  FitBand,
  HardFilterStatus,
  LiteReport,
} from '@/types';

export function fitBandFromScore(score: number): FitBand {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Viable';
  if (score >= 45) return 'Stretch';
  return 'Mismatch';
}

export function deriveApplyDecision(input: {
  hardStatus: HardFilterStatus;
  score: number;
  evidenceCoverage: EvidenceCoverage;
  completeness: string;
}): ApplyDecisionLabel {
  if (input.hardStatus === 'Blocked') return 'Skip';
  if (input.completeness === 'Low' || input.evidenceCoverage === 'Low') return 'Clarify first';
  if (input.hardStatus === 'Risk' || input.score < 55) return 'Apply after fixes';
  if (input.score >= 65) return 'Apply now';
  return 'Apply after fixes';
}

/** Prefer model decision if valid; otherwise derive. */
export function resolveApplyDecision(
  report: {
    hard_filter?: LiteReport['hard_filter'] | null;
    fit_score?: LiteReport['fit_score'] | null;
    data_completeness?: LiteReport['data_completeness'] | null;
    apply_decision?: ApplyDecision | null;
    match_score?: number;
  },
): ApplyDecision {
  const allowed: ApplyDecisionLabel[] = [
    'Apply now',
    'Apply after fixes',
    'Clarify first',
    'Skip',
  ];
  const label =
    report.apply_decision?.label && allowed.includes(report.apply_decision.label)
      ? report.apply_decision.label
      : deriveApplyDecision({
          hardStatus: report.hard_filter?.status ?? 'Unknown',
          score: report.fit_score?.score ?? report.match_score ?? 50,
          evidenceCoverage: report.fit_score?.evidence_coverage ?? 'Low',
          completeness: report.data_completeness?.level ?? 'Low',
        });

  return {
    label,
    reason:
      report.apply_decision?.reason?.trim()
      || `Decision based on fit ${report.fit_score?.score ?? '—'} and hard filter ${report.hard_filter?.status ?? 'Unknown'}.`,
    next_best_action:
      report.apply_decision?.next_best_action?.trim()
      || 'Confirm the largest hard-filter risk or gap with the recruiter before you invest more time.',
  };
}
