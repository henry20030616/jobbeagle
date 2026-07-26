import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { isFullReport, isLiteReport } from '@/lib/normalize-lite-report';

describe('sample reports', () => {
  it('builds a valid Snapshot sample', () => {
    const report = getSampleSnapshotReport('en');
    expect(isLiteReport(report)).toBe(true);
    expect(report.job_title).toContain('Business Analyst');
    expect(report.fit_score.score).toBeGreaterThan(0);
    expect(report.expected_offer.evidence_tier).toBe('C');
    expect(report.expected_offer.candidate_predicted_offer).toBe('$155K');
    expect(report.expected_offer.tc_breakdown?.base).toBe('$150K');
    expect(report.expected_offer.tc_breakdown?.total).toContain('$185K');
  });

  it('builds a valid Strategy Guide sample with STAR templates', () => {
    const report = getSampleStrategyGuideReport('en');
    expect(isFullReport(report)).toBe(true);
    expect(report.concerns_defenses).toHaveLength(3);
    expect(report.interview_playbook.star_templates.length).toBeGreaterThanOrEqual(3);
    expect(report.offer_strategy.script.length).toBeGreaterThan(20);
    expect(report.ats_warning?.missing_keyword_count).toBe(4);
    expect(report.role_team_insights?.next_title_1_3yr).toContain('Lead BA');
    expect(report.company_truth?.competitors[0]?.strengths).toBeTruthy();
    expect(report.offer_strategy.tc_breakdown?.sign_on).toBeTruthy();
  });

  it('localizes Snapshot body + keeps English chrome-free for zh-TW', () => {
    const report = getSampleSnapshotReport('zh-TW');
    expect(report.proof_map.strengths[0]?.point).toMatch(/可量化/);
    expect(report.ats_warning?.summary).toMatch(/履歷|關鍵字/);
    expect(report.apply_decision.reason).toMatch(/職缺|投遞|補強/);
    // No leftover English ATS summary from the EN base
    expect(report.ats_warning?.summary).not.toMatch(/Resume is light/);
  });

  it('localizes Guide strategy layer for zh-TW', () => {
    const report = getSampleStrategyGuideReport('zh-TW');
    expect(report.role_team_insights?.role_content_refined[0]).toMatch(/支付|需求/);
    expect(report.company_truth?.current_strategy).toMatch(/清算|金融/);
    expect(report.interview_playbook.predicted[0]?.question).toMatch(/改善|流程/);
  });
});
