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
    expect(report.role_team_insights?.career_path_basis).toMatch(/Levels\.fyi|LinkedIn|market/i);
    expect(report.company_truth?.company_overview).toMatch(/fintech|Payments|merchant|清算|支付/i);
    expect(report.company_truth?.company_overview).not.toMatch(/Wikipedia|encyclopedic|百科|維基/i);
    expect(report.company_truth?.recent_developments?.length).toBe(5);
    expect(report.company_truth?.recent_developments?.[0]?.headline).toBeTruthy();
    expect(report.company_truth?.recent_developments?.[0]?.category).toMatch(
      /leadership|product|award|funding|other/,
    );
    expect(report.company_truth?.competitors[0]?.name).toMatch(/Stripe|Adyen|Block/i);
    expect(report.company_truth?.competitors[0]?.name).not.toMatch(/peers|pipelines|同儕|管線/i);
    expect(report.company_truth?.current_strategy).not.toMatch(/Wikipedia|encyclopedic|百科|維基/i);
    expect(report.offer_strategy.tc_breakdown?.sign_on).toBeTruthy();
    const playbookQs = [
      ...report.interview_playbook.reported,
      ...report.interview_playbook.predicted,
    ];
    const behavioral = playbookQs.filter((q) => q.category === 'behavioral');
    const technical = playbookQs.filter((q) => q.category === 'technical');
    expect(behavioral).toHaveLength(5);
    expect(technical).toHaveLength(5);
    for (const q of playbookQs) {
      expect(q.interviewer_intent?.trim().length).toBeGreaterThan(5);
      expect((q.star_blueprint || q.star_outline || '').trim().length).toBeGreaterThan(5);
      expect(q.dos_donts?.trim().length).toBeGreaterThan(5);
      expect(q.resume_anchor?.trim().length).toBeGreaterThan(3);
      // STAR coaching must cite resume-specific facts, not bare generic templates
      expect(q.star_blueprint || '').not.toMatch(/^S\s*→\s*T\s*→\s*A\s*→\s*R/i);
    }
    const reported = report.interview_playbook.reported[0];
    expect(reported?.source_url).toMatch(/^https?:\/\//);
    expect(reported?.source_name || reported?.source_url).toBeTruthy();
    expect(reported?.source_date).toBeTruthy();
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
    expect(report.role_team_insights?.career_path_basis).toMatch(/Levels|LinkedIn|職涯|推估/);
    expect(report.company_truth?.company_overview).toMatch(/金融科技|清算|商戶|Northstar/);
    expect(report.company_truth?.recent_developments?.[0]?.headline).toMatch(/清算|AI|可靠度|ACH/);
    expect(report.company_truth?.current_strategy).toMatch(/清算|自動化|ACH/);
    expect(report.company_truth?.current_strategy).not.toMatch(/百科|維基/);
    expect(report.company_truth?.competitors.some((c) => /Stripe|Adyen|Block/.test(c.name))).toBe(
      true,
    );
    expect(report.interview_playbook.predicted[0]?.question).toMatch(/改善|流程/);
  });
});

describe('guide page copy', () => {
  it('uses plain-language Page 2–3 labels (no internal model jargon)', async () => {
    const { getGuideUiCopy } = await import('@/lib/report-ui-copy');
    const zh = getGuideUiCopy('zh-TW');
    expect(zh.roleContent).toBe('這份工作在做什麼');
    expect(zh.requirements).toBe('錄取關鍵條件');
    expect(zh.roleContent).not.toMatch(/重構|精練|精炼/);
    expect(zh.requirements).not.toMatch(/重構|精練|精炼/);
    expect(zh.nextTitleBasisFallback).toMatch(/Levels|LinkedIn|市場|就業/);
    expect(zh.currentStrategy).toBe('公司現在在拚什麼');
    expect(zh.currentStrategy).not.toMatch(/維基|百科|wiki/i);
    expect(zh.competitors).toMatch(/產業競爭對手/);
    expect(zh.competitorsHint).toMatch(/具名企業|求職者/);
    expect(zh.companyOverview).toBe('公司現況');
    expect(zh.companyOverviewHint).toMatch(/怎樣的一間公司|產業/);
    expect(zh.recentDevelopments).toBe('公司最近發展');
    expect(zh.newsCatLeadership).toMatch(/經營層/);
    expect(zh.resumeAnchorLabel).toMatch(/履歷錨點/);
    expect(zh.starLabel).toMatch(/履歷/);
    expect(zh.page4Badge).toBe('準備最划算');
    expect(zh.page4Badge).not.toMatch(/ROI|HIGH/i);
    expect(zh.page5Badge).toBe('來源可查證');
    expect(zh.behavioralTitle).toMatch(/（5）/);
    expect(zh.technicalTitle).toMatch(/（5）/);
    expect(zh.predictedBadge).toBe('系統分析');
    expect(zh.extraReportedTitle).toBe('');
    expect(zh.noExtraReported).toBe('');
    expect(zh.offerRangeTitle).toMatch(/區間|薪資/);
    expect(zh.offerMedianLabel).toMatch(/中位/);
    expect(zh.predictedLandLabel).toMatch(/落點|預測/);
    expect(zh.questionSourceLabel).toBe('來源');
    expect(zh.categoryBehavioral).toMatch(/行為/);
    expect(zh.systemAnalysisSourceNote).toMatch(/系統分析/);
  });
});

