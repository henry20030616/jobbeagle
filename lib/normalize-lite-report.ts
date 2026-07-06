import type { LiteReport, LiteMatchPoint, LiteSkillGap } from '@/types';

export function isLiteReport(value: unknown): value is LiteReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return typeof r.match_score === 'number' && !('basic_analysis' in r);
}

/** Backfill enriched Lite fields for legacy / cached minimal reports */
export function normalizeLiteReport(raw: Partial<LiteReport> & { match_score: number }): LiteReport {
  const report = { ...raw } as LiteReport;
  report.match_score = Math.max(0, Math.min(100, Math.round(report.match_score)));
  report.job_title = report.job_title?.trim() || 'Unknown Role';
  report.company_name = report.company_name?.trim() || 'Unknown Company';
  report.dog_breed_archetype = report.dog_breed_archetype?.trim() || 'Beagle';
  report.one_sentence_sharp_critique = report.one_sentence_sharp_critique?.trim() || '';
  report.flsa_status = report.flsa_status || 'Non-Exempt';
  report.radford_2026_compensation_matrix = report.radford_2026_compensation_matrix ?? {
    tier_25th_low: '—',
    tier_50th_mid: '—',
    tier_75th_high: '—',
  };
  report.recruiter_verdict =
    report.recruiter_verdict?.trim() || report.one_sentence_sharp_critique || '';
  report.matching_strengths = Array.isArray(report.matching_strengths)
    ? report.matching_strengths.filter((s) => s?.point)
    : [];
  report.critical_gaps = Array.isArray(report.critical_gaps)
    ? report.critical_gaps.filter((g) => g?.gap)
    : [];
  report.hard_requirements_checklist = Array.isArray(report.hard_requirements_checklist)
    ? report.hard_requirements_checklist.filter((h) => h?.requirement)
    : [];
  report.interview_starters = Array.isArray(report.interview_starters)
    ? report.interview_starters.filter(Boolean).slice(0, 3)
    : [];

  if (report.matching_strengths.length === 0 && report.one_sentence_sharp_critique) {
    report.matching_strengths = [
      {
        point: 'Resume signals reviewed',
        description: report.one_sentence_sharp_critique,
      },
    ] as LiteMatchPoint[];
  }
  if (report.critical_gaps.length === 0 && report.one_sentence_sharp_critique) {
    report.critical_gaps = [
      {
        gap: 'Primary mismatch',
        description: report.one_sentence_sharp_critique,
      },
    ] as LiteSkillGap[];
  }

  return report;
}

export function isEnrichedLiteReport(raw: unknown): boolean {
  if (!isLiteReport(raw)) return false;
  return (
    Array.isArray(raw.matching_strengths)
    && raw.matching_strengths.length > 0
    && Array.isArray(raw.critical_gaps)
    && raw.critical_gaps.length > 0
  );
}

export function isFullReport(value: unknown): value is import('@/types').FullReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    Array.isArray(r.custom_star_interview_bank)
    || typeof r.corporate_culture_blackbox === 'string'
    || typeof r.salary_negotiation_script === 'string'
  );
}
