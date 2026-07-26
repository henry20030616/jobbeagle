import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { isFullReport, isLiteReport } from '@/lib/normalize-lite-report';

describe('sample reports', () => {
  it('builds a valid Snapshot sample', () => {
    const report = getSampleSnapshotReport();
    expect(isLiteReport(report)).toBe(true);
    expect(report.job_title).toContain('Business Analyst');
    expect(report.fit_score.score).toBeGreaterThan(0);
    expect(report.expected_offer.evidence_tier).toBe('C');
    expect(report.expected_offer.candidate_predicted_offer).toBe('$155K');
    expect(report.expected_offer.tc_breakdown?.base).toBe('$150K');
    expect(report.expected_offer.tc_breakdown?.total).toContain('$185K');
  });

  it('builds a valid Strategy Guide sample with STAR templates', () => {
    const report = getSampleStrategyGuideReport();
    expect(isFullReport(report)).toBe(true);
    expect(report.concerns_defenses).toHaveLength(3);
    expect(report.interview_playbook.star_templates.length).toBeGreaterThanOrEqual(3);
    expect(report.offer_strategy.script.length).toBeGreaterThan(20);
    expect(report.ats_warning?.missing_keyword_count).toBe(4);
    expect(report.role_team_insights?.career_trajectory.growth_potential_pct).toContain('%');
    expect(report.company_truth?.competitors.length).toBeGreaterThan(0);
  });
});
