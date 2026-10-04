import type { ApplyDecision, FitScoreBreakdownItem, LiteReport, RiskAssessmentItem } from '@/types';

/**
 * Deterministic consistency guards applied after normalization.
 * Prompts ask the model to stay calibrated; these guards make the
 * contradictions the model still produces impossible to ship.
 * They never change the fit score (Spec v3: no backend score recompute).
 */

const COACHING_VERB = /^\s*(?:(?:explicitly|clearly|also|please|simply|be sure to|make sure to|try to)\s+)*(highlight|mention|add|include|emphasi[sz]e|consider|update|rewrite|reword|reorder|quantify|tailor|showcase|list|ensure)\b/i;
const BARE_NEXT_STEP = /^\s*(apply( now)?|go for it|proceed)\W*$/i;
const CONTRADICTORY_ATS = /highly screenable|no ats risk|passes? ats/i;

/** Models sometimes return 0.3 instead of 30. Rescale only when every weight is a fraction. */
export function rescaleBreakdownWeights(
  breakdown: FitScoreBreakdownItem[],
): FitScoreBreakdownItem[] {
  const total = breakdown.reduce((sum, b) => sum + b.weight_pct, 0);
  if (breakdown.length === 0 || total <= 0 || total > 1.5) return breakdown;
  return breakdown.map((b) => ({ ...b, weight_pct: Math.round(b.weight_pct * 100) }));
}

export function stripCoachingActions(actions: string[]): string[] {
  return actions.filter((a) => !COACHING_VERB.test(a));
}

function firstWeakCoreCompetency(report: LiteReport) {
  return report.competency_map?.find(
    (c) => c.weight === 'core' && c.proficiency !== 'demonstrated',
  );
}

function ensureCompetencyRisk(report: LiteReport): RiskAssessmentItem[] | undefined {
  const weak = report.competency_map?.filter(
    (c) => c.weight === 'core' && c.proficiency !== 'demonstrated',
  );
  if (!weak || weak.length === 0) return report.risk_assessment;
  const existing = report.risk_assessment ?? [];
  const covered = existing.some(
    (r) => r.category === 'competency' && (r.severity === 'high' || r.severity === 'medium'),
  );
  if (covered) return existing;
  const worst = weak.find((c) => c.proficiency === 'absent') ?? weak[0];
  const derived: RiskAssessmentItem = {
    category: 'competency',
    severity: worst.proficiency === 'absent' ? 'high' : 'medium',
    statement: `${worst.competency} is a core requirement with only ${worst.proficiency} evidence on the resume.`,
    basis: 'resume',
    source_url: null,
  };
  return [derived, ...existing.filter((r) => !(r.category === 'competency' && r.severity === 'low'))].slice(0, 5);
}

export function calibrateLiteReport(report: LiteReport): LiteReport {
  const weak = firstWeakCoreCompetency(report);
  let apply: ApplyDecision = report.apply_decision;

  if (weak && apply.label === 'Apply now') {
    apply = { ...apply, label: 'Apply after fixes' };
  }
  if (BARE_NEXT_STEP.test(apply.next_best_action)) {
    apply = {
      ...apply,
      next_best_action: weak
        ? `Ask the recruiter whether ${weak.competency} is required or preferred before investing a full application.`
        : 'Confirm the approved cash range and leveling with the recruiter before you invest interview time.',
    };
  }

  const ats =
    report.ats_warning && CONTRADICTORY_ATS.test(report.ats_warning.summary)
      ? null
      : report.ats_warning;

  return {
    ...report,
    apply_decision: apply,
    ats_warning: ats,
    proof_map: {
      ...report.proof_map,
      resume_actions: stripCoachingActions(report.proof_map.resume_actions),
    },
    risk_assessment: ensureCompetencyRisk(report),
  };
}
