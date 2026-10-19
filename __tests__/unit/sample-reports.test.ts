import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { GUIDE_ITEM_IDS, guideItemNav } from '@/components/report/SevenItemPages';
import { isFullReport, isLiteReport } from '@/lib/normalize-lite-report';
import { fitBandFromScore } from '@/lib/report-rules';

describe('sample reports', () => {
  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'keeps band consistent with score and avoids praise wording (%s)',
    (lang) => {
      const report = getSampleSnapshotReport(lang);
      expect(report.fit_score.band).toBe(fitBandFromScore(report.fit_score.score));
      expect(report.apply_decision.reason).not.toMatch(/^Strong\b|\bnatural step\b/i);
      expect(report.fit_score.sharp_verdict).not.toMatch(/\bStrong (BA|analytical)\b/);
      const hardFilterItems = report.hard_filter?.items ?? [];
      expect(hardFilterItems.length).toBeGreaterThanOrEqual(4);
    },
  );

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
    expect(report.hiring_context?.company_current_pain_point).toMatch(/ACH/);
    expect(report.hiring_context?.strategic_alignment_pitch).toMatch(/28%/);
    expect(report.interview_playbook.assignment_blueprint?.hidden_grading_rubric).toHaveLength(3);
    expect(report.offer_strategy.negotiation_script?.pitch.length).toBeGreaterThan(20);
    expect(report.offer_strategy.timeline_leverage_templates?.stalling_for_time_email).toMatch(/Subject:/);
    expect(report.ats_warning?.missing_keyword_count).toBe(4);
    expect(report.role_team_insights?.next_title_1_3yr).toContain('Lead BA');
    expect(report.role_team_insights?.career_path_basis).toMatch(/Levels\.fyi|LinkedIn|market/i);
    expect(report.role_team_insights?.ats_critical_gaps?.detected_count).toBe(2);
    expect(report.role_team_insights?.ats_critical_gaps?.gaps).toHaveLength(2);
    expect(report.role_team_insights?.ats_critical_gaps?.gaps[0]?.gap_type).toBe(
      'keyword_missing',
    );
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

  it('shows the paid sample 20-question bank, extras, H-1B, and TC split', () => {
    const modules = getSampleStrategyGuideReport('en').guide_modules;
    expect(modules).toBeTruthy();
    const bank = modules!.interview_bank;
    expect(bank.professional).toHaveLength(10);
    expect(bank.behavioral).toHaveLength(10);
    expect(bank.professional_extra.length).toBeGreaterThan(0);
    expect(bank.behavioral_extra.length).toBeGreaterThan(0);
    for (const item of [
      ...bank.professional,
      ...bank.behavioral,
      ...bank.professional_extra,
      ...bank.behavioral_extra,
    ]) {
      expect(item.origin).toBe('reported');
      expect(item.source_url).toMatch(/^https:\/\//);
      expect(item.answer.length).toBeGreaterThan(20);
    }
    expect(modules!.company_eval.h1b).toMatch(/H-1B/);
    expect(modules!.company_eval.sources[0]?.url).toMatch(/^https:\/\//);
    expect(modules!.company_eval.company_pros.length).toBeGreaterThanOrEqual(2);
    expect(modules!.company_eval.role_cons.length).toBeGreaterThanOrEqual(2);
    expect(modules!.company_eval.role_sources[0]?.url).toMatch(/^https:\/\//);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.company_eval.company_pros[0]).toMatch(
      /公開評價/,
    );
    expect(modules!.salary_land.base).toBe('$145K');
    expect(modules!.salary_land.equity).toMatch(/\$12K/);
    expect(modules!.salary_land.bonus).toBe('$11K');
    expect(modules!.salary_land.target).toMatch(/\$168K/);
    expect(modules!.salary_land.ceiling).toMatch(/\$185K/);
    expect(modules!.salary_land.rationale).toMatch(/\$168K/);
    expect(modules!.salary_land.rationale).toMatch(/\$185K/);
    expect(modules!.salary_land.rationale).toMatch(/28%/);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.salary_land.rationale).toMatch(
      /目標價/,
    );
    const zhGuide = getSampleStrategyGuideReport('zh-TW').guide_modules;
    expect(zhGuide?.resume_rewrites[0]?.before).toMatch(/支援/);
    expect(zhGuide?.resume_rewrites[0]?.before).not.toMatch(/Supported payment/);
    expect(zhGuide?.interview_bank.professional[0]?.question).toMatch(/請說明/);
    expect(zhGuide?.interview_bank.professional[0]?.answer).toMatch(/履歷/);
    expect(getSampleSnapshotReport('zh-TW').ats_warning?.missing_keywords?.join(' ')).not.toMatch(
      /\breturns\b|\bsettlement\b/,
    );
    expect(modules!.negotiation.pay_strategy.length).toBeGreaterThan(20);
    expect(modules!.negotiation.benefits_strategy.length).toBeGreaterThan(20);
    expect(modules!.resume_rewrites.length).toBeGreaterThanOrEqual(1);
    expect('guide_modules' in getSampleSnapshotReport('en')).toBe(false);
  });

  it('localizes Snapshot body + keeps English chrome-free for zh-TW', () => {
    const report = getSampleSnapshotReport('zh-TW');
    expect(report.proof_map.strengths[0]?.point).toMatch(/可量化/);
    expect(report.ats_warning?.summary).toMatch(/履歷|關鍵字/);
    expect(report.apply_decision.reason).toMatch(/核心要求|JD/);
    // No leftover English ATS summary from the EN base
    expect(report.ats_warning?.summary).not.toMatch(/Resume is light/);
  });

  it('localizes Guide strategy layer for zh-TW', () => {
    const report = getSampleStrategyGuideReport('zh-TW');
    expect(report.role_team_insights?.role_content_refined[0]).toMatch(/支付|需求/);
    expect(report.role_team_insights?.career_path_basis).toMatch(/Levels|LinkedIn|職涯|推估/);
    expect(report.role_team_insights?.ats_critical_gaps?.gaps[0]?.jd_requirement).toMatch(
      /ACH|清算/,
    );
    expect(report.role_team_insights?.ats_critical_gaps?.gaps[0]?.fix_strategy).toMatch(
      /面試/,
    );
    expect(report.company_truth?.company_overview).toMatch(/金融科技|清算|商戶|Northstar/);
    expect(report.company_truth?.recent_developments?.[0]?.headline).toMatch(/清算|AI|可靠度|ACH/);
    expect(report.company_truth?.current_strategy).toMatch(/清算|自動化|ACH/);
    expect(report.company_truth?.current_strategy).not.toMatch(/百科|維基/);
    expect(report.company_truth?.competitors.some((c) => /Stripe|Adyen|Block/.test(c.name))).toBe(
      true,
    );
    expect(report.interview_playbook.predicted[0]?.question).toMatch(/改善|流程/);
    expect(report.hiring_context?.strategic_alignment_pitch).toMatch(/28%/);
    expect(report.hiring_context?.strategic_alignment_pitch).toMatch(/對帳/);
    expect(report.offer_strategy.negotiation_script?.counter).toMatch(/簽約金/);
  });
});

describe('seven-item report layout', () => {
  it('uses the seven spec sections as the Guide pages', () => {
    expect(GUIDE_ITEM_IDS).toEqual([
      'core',
      'market',
      'fit',
      'land',
      'company',
      'questions',
      'negotiate',
    ]);
    expect(guideItemNav('zh-TW').map((item) => item.label)).toEqual([
      '職位核心',
      '市場薪資',
      '匹配履歷',
      '薪資落點',
      '公司評價',
      '面試真題',
      '談判建議',
    ]);
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
    expect(zh.atsBoxTitle).toMatch(/ATS/);
    expect(zh.atsBoxIntro(2)).toMatch(/2/);
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

