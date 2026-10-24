import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { GUIDE_ITEM_IDS, GuideItemPage, SnapshotItemStack, guideItemNav } from '@/components/report/SevenItemPages';
import { isFullReport, isLiteReport } from '@/lib/normalize-lite-report';
import { fitBandFromScore } from '@/lib/report-rules';
import { splitBuyerSellerStances } from '@/lib/stance-bullets';

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

  it('states must-haves as keywords, years, or explicit domain items', () => {
    const zh = getSampleSnapshotReport('zh-TW');
    expect(zh.role_read.hiring_signals).toEqual([
      '年資：5 年以上 Business Analyst 或產品營運。',
      '技能：SQL — 須能獨立使用。',
      '系統：正式環境營運儀表板（須能獨立負責）。',
      '領域：支付營運 — ACH 退票、清算，或同等支付軌道。',
    ]);
    expect(zh.role_read.responsibilities).toEqual([
      '需求 backlog：把清算與 ACH 退票問題寫成可排程需求，並排處理順序（給工程）。',
      '驗收標準：與工程共同撰寫清算／ACH 退票流程的需求與驗收標準。',
      '營運指標：每月向營運主管報告對帳週期與錯誤率。',
    ]);
    const en = getSampleSnapshotReport('en');
    expect(en.role_read.hiring_signals.join('\n')).toMatch(/Years: 5\+/);
    expect(en.role_read.hiring_signals.join('\n')).toMatch(/Skill: SQL/);
    expect(en.role_read.hiring_signals.join('\n')).toMatch(/Domain:[\s\S]*ACH/);
    expect(en.role_read.responsibilities.join('\n')).toMatch(/Acceptance criteria:[\s\S]*ACH/);
  });

  it('gives each Snapshot and Guide sample section a summary paragraph', () => {
    const snapshot = getSampleSnapshotReport('zh-TW');
    expect(snapshot.role_read.mission.length).toBeGreaterThan(40);
    expect(snapshot.apply_decision.reason.length).toBeGreaterThan(40);
    expect(snapshot.expected_offer.target_gap.length).toBeGreaterThan(20);
    const guide = getSampleStrategyGuideReport('zh-TW');
    expect(guide.guide_modules?.salary_land.rationale.length).toBeGreaterThan(40);
    expect(guide.guide_modules?.company_eval.summary?.length).toBeGreaterThan(20);
    expect(guide.guide_modules?.interview_bank.summary?.length).toBeGreaterThan(20);
    expect(guide.guide_modules?.negotiation.summary?.length).toBeGreaterThan(20);
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
    expect(bank.professional_extra.length).toBeGreaterThan(2);
    expect(bank.behavioral_extra.length).toBeGreaterThan(2);
    const items = [
      ...bank.professional,
      ...bank.behavioral,
      ...bank.professional_extra,
      ...bank.behavioral_extra,
    ];
    const answers = items.map((item) => item.answer);
    expect(new Set(answers).size).toBe(answers.length);
    for (const item of items) {
      expect(item.origin).toBe('reported');
      expect(item.source_url).toMatch(/^https:\/\//);
      expect(item.source_url).not.toMatch(/example\.com/i);
      expect(item.answer.length).toBeGreaterThan(20);
    }
    expect(modules!.company_eval.h1b).toMatch(/H-1B/);
    expect(modules!.company_eval.sources[0]?.url).toMatch(/^https:\/\//);
    expect(modules!.company_eval.sources.map((s) => s.url).join('\n')).not.toMatch(/example\.com/i);
    expect(modules!.salary_land.sources.map((s) => s.url).join('\n')).not.toMatch(/example\.com/i);
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
    expect(modules!.salary_land.rationale).toMatch(/target mix/);
    expect(modules!.salary_land.rationale).not.toMatch(/resume already holds|rights the resume/i);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.salary_land.rationale).toMatch(
      /目標價：/,
    );
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.salary_land.rationale).toMatch(
      /結構拆分/,
    );
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.salary_land.rationale).not.toMatch(
      /已拿到的權利|履歷已拿到/,
    );
    expect(getSampleStrategyGuideReport('zh-CN').guide_modules?.salary_land.rationale).toMatch(
      /结构拆分/,
    );
    expect(getSampleStrategyGuideReport('zh-CN').guide_modules?.salary_land.rationale).not.toMatch(
      /已拿到的权利|简历已拿到/,
    );
    expect(
      getSampleStrategyGuideReport('zh-TW').guide_modules?.salary_land.rationale.split('\n'),
    ).toHaveLength(3);
    const stance = getSampleStrategyGuideReport('zh-TW').guide_modules!.salary_land.buyer_seller;
    expect(stance.split('\n')[0]).toMatch(/公開招募|補位/);
    expect(stance).not.toMatch(/還沒補上|也可以繼續等|需要人/);
    expect(modules!.salary_land.buyer_seller).not.toMatch(/keep waiting|need someone/i);
    expect(modules!.salary_land.buyer_seller).toMatch(/28%/);
    const stanceBullets = splitBuyerSellerStances(stance);
    expect(stanceBullets.company).toHaveLength(2);
    expect(stanceBullets.candidate).toHaveLength(2);
    expect(stanceBullets.candidate[1]).toMatch(/ACH/);
    const zhGuide = getSampleStrategyGuideReport('zh-TW').guide_modules;
    expect(zhGuide?.resume_rewrites[0]?.category).toBe('履歷缺少的關鍵項目');
    expect(zhGuide?.resume_rewrites[0]?.gap).toMatch(/ACH|清算|退票/);
    expect(zhGuide?.resume_rewrites.map((item) => item.category).join()).not.toMatch(/擁有權/);
    expect(zhGuide?.resume_rewrites[1]?.category).toBe(zhGuide?.resume_rewrites[0]?.category);
    expect(zhGuide?.resume_rewrites[0]?.before).toMatch(/支援/);
    expect(zhGuide?.resume_rewrites[0]?.before).not.toMatch(/Supported payment/);
    expect(zhGuide?.resume_rewrites[0]?.after.length).toBeGreaterThan(10);
    expect(zhGuide?.resume_rewrites[1]?.before.length).toBeGreaterThan(0);
    expect(zhGuide?.resume_rewrites[1]?.after.length).toBeGreaterThan(10);
    expect(getSampleSnapshotReport('zh-TW').proof_map.gaps.some((item) => item.gap === '美國法規關鍵字')).toBe(
      true,
    );
    expect(getSampleStrategyGuideReport('zh-TW').proof_map.gaps.some((item) => item.gap === '美國法規關鍵字')).toBe(
      true,
    );
    expect(zhGuide?.interview_bank.professional[0]?.question).toMatch(/ACH return queue/);
    expect(zhGuide?.interview_bank.professional[0]?.answer).toMatch(/履歷/);
    expect(zhGuide?.interview_bank.professional[0]?.answer).toMatch(/Looker|佇列|排序/);
    expect(zhGuide?.interview_bank.professional[1]?.answer).not.toBe(
      zhGuide?.interview_bank.professional[0]?.answer,
    );
    expect(zhGuide?.interview_bank.behavioral[0]?.answer).not.toBe(
      zhGuide?.interview_bank.professional[0]?.answer,
    );
    expect(getSampleSnapshotReport('zh-TW').ats_warning?.missing_keywords?.join(' ')).not.toMatch(
      /\breturns\b|\bsettlement\b/,
    );
    expect(modules!.negotiation.pay_strategy).toMatch(/28%/);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.pay_strategy).toMatch(
      /先報總薪酬/,
    );
    expect(modules!.negotiation.benefits_strategy.length).toBeGreaterThan(20);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.company_questions).toMatch(/ACH 退票/);
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.follow_up_email).toMatch(
      /面試結束/,
    );
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.follow_up_email).toMatch(
      /您好：/,
    );
    expect(getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.follow_up_email).toMatch(
      /此致/,
    );
    expect(modules!.resume_rewrites.length).toBeGreaterThanOrEqual(1);
    expect('guide_modules' in getSampleSnapshotReport('en')).toBe(false);
  });

  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'keeps Guide rewrite samples as category + gap + before/after bullets (%s)',
    (lang) => {
      const snapshot = getSampleSnapshotReport(lang);
      const guide = getSampleStrategyGuideReport(lang);
      const rewrites = guide.guide_modules!.resume_rewrites;
      expect(rewrites).toHaveLength(2);
      expect(rewrites[0].category).toBe(rewrites[1].category);
      expect(rewrites[0].gap).not.toBe(rewrites[1].gap);
      expect(rewrites[0].before.length).toBeGreaterThan(0);
      expect(rewrites[0].after.length).toBeGreaterThan(0);
      expect(rewrites[1].before.length).toBeGreaterThan(0);
      expect(rewrites[1].after.length).toBeGreaterThan(0);
      expect(snapshot.proof_map.gaps.length).toBeGreaterThanOrEqual(3);
      expect(guide.proof_map.gaps).toEqual(snapshot.proof_map.gaps);
    },
  );

  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'gives each sample interview question its own answer (%s)',
    (lang) => {
      const bank = getSampleStrategyGuideReport(lang).guide_modules!.interview_bank;
      const answers = [
        ...bank.professional,
        ...bank.behavioral,
        ...bank.professional_extra,
        ...bank.behavioral_extra,
      ].map((item) => item.answer);
      expect(answers.every((answer) => answer.length > 20)).toBe(true);
      expect(new Set(answers).size).toBe(answers.length);
    },
  );

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
      '薪資落點',
      '公司評價',
      '面試真題',
      '談判建議',
    ]);
  });

  it('keeps rewrite category headings on REPORT_H2 and the card outside the keyword column', () => {
    const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
    expect(source).toContain('<h3 className={`mb-2 ${REPORT_H2}`}>{title}</h3>');
    expect(source).toContain('<h3 className={`mb-2 ${REPORT_H2}`}>{group.title}</h3>');
    expect(source).toContain('className="w-full min-w-0 rounded-lg border border-emerald-400/30');
    expect(source).toContain('<h3 className={`mb-2 ${REPORT_H1}`}>{copy.apply}</h3>');
    expect(source).toContain('<h3 className={`mb-2 ${REPORT_H2}`}>{copy.keywords}</h3>');
    expect(source).toContain("apply: 'Apply advice'");
    expect(source).toContain("apply: s ? '应征建议' : '應徵建議'");
    expect(source).toContain("fit: 'Fit analysis'");
    expect(source).toContain("fit: '匹配度分析'");
    expect(source).not.toContain('匹配分數、履歷分析');
    expect(source).not.toContain('Fit score and resume');
    expect(source.indexOf('{copy.apply}')).toBeGreaterThan(source.indexOf('{scoreInfo.level}'));
    expect(source.indexOf('{copy.keywords}')).toBeGreaterThan(source.indexOf('{copy.apply}'));
    expect(source.indexOf('<RewriteGroups')).toBeGreaterThan(source.indexOf('{copy.keywords}'));
    expect(source).toContain('{beforeLabel}');
    expect(source).toContain('{afterLabel}');
    expect(source).not.toContain('${BODY} font-semibold text-emerald-100');
    expect(source).not.toContain('ui.applyLabels');
    expect(source).not.toMatch(/md:grid-cols-2[\s\S]{0,200}copy\.keywords/);
  });

  it('renders Snapshot and Guide fit samples with apply advice beside Beagle Scale', () => {
    const snapshot = getSampleSnapshotReport('zh-TW');
    const guide = getSampleStrategyGuideReport('zh-TW');
    const snapHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: snapshot,
        language: 'zh-TW',
        locked: true,
      }),
    );
    const guideHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: guide,
        language: 'zh-TW',
        locked: false,
        rewrites: guide.guide_modules?.resume_rewrites ?? [],
      }),
    );
    for (const html of [snapHtml, guideHtml]) {
      expect(html).toContain('匹配度分析');
      expect(html).not.toContain('匹配分數、履歷分析');
      expect(html).toContain('應徵建議');
      expect(html).toContain('藍寶米格魯');
      expect(html).toContain('欠缺的硬性關鍵字');
      expect(html).not.toContain('建議履歷調整後再應徵');
      expect(html.indexOf('匹配度分析')).toBeLessThan(html.indexOf('職位核心解析'));
      expect(html.indexOf('職位核心解析')).toBeLessThan(html.indexOf('市場總薪酬區間'));
      expect(html.indexOf('藍寶米格魯')).toBeLessThan(html.indexOf('應徵建議'));
      expect(html.indexOf('應徵建議')).toBeLessThan(html.indexOf('欠缺的硬性關鍵字'));
      expect(html).toContain('border-emerald-400/30');
    }
    expect(guideHtml).toContain('履歷缺少的關鍵項目');
    expect(guideHtml.indexOf('欠缺的硬性關鍵字')).toBeLessThan(
      guideHtml.indexOf('履歷缺少的關鍵項目'),
    );
    expect(snapHtml).not.toContain('履歷缺少的關鍵項目');
    expect(snapHtml).toContain(snapshot.apply_decision.next_best_action);
    expect(guideHtml).toContain(guide.apply_decision.next_best_action);
  });

  it('renders Snapshot market pay as a visual range with a short caveat', () => {
    const snapshot = getSampleSnapshotReport('zh-TW');
    const guide = getSampleStrategyGuideReport('zh-TW');
    const snapHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: snapshot,
        language: 'zh-TW',
        locked: true,
      }),
    );
    const guideHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: guide,
        language: 'zh-TW',
        locked: false,
        rewrites: guide.guide_modules?.resume_rewrites ?? [],
      }),
    );
    const caveat = '職缺未公布薪資；此區間依職稱、地點與年資對照市場水準，非該公司數據。';
    for (const html of [snapHtml, guideHtml]) {
      expect(html).toContain('data-pay-range="hero"');
      expect(html).toContain('$145K');
      expect(html).toContain('$190K');
      expect(html).toContain('市場總薪酬區間');
      expect(html).toContain(caveat);
      expect(html).not.toContain('依職稱（Senior Business Analyst）');
      expect(html).not.toContain('對照依據');
      expect(html).not.toContain('議價天花板');
      expect(html.indexOf('市場總薪酬區間')).toBeLessThan(html.indexOf('地點'));
      expect(html.indexOf('$145K')).toBeLessThan(html.indexOf(caveat));
    }
    expect(snapHtml).toContain('升級 Interview Guide 可解鎖個人化精準落點與 TC 結構拆解');
    expect(guideHtml).not.toContain('升級 Interview Guide 可解鎖個人化精準落點與 TC 結構拆解');
  });

  it('frames company, pay, questions, and negotiate inner blocks with GUIDE_SECTION_FRAME', () => {
    const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
    expect(source).toContain('GUIDE_SECTION_FRAME');
    expect(source).toContain('<SummaryCard label={copy.analysisSummary}');
    expect(source).toContain('<InnerSection title={copy.pay}>');
    expect(source).toContain('<InnerSection title={copy.benefits}>');
    expect(source).toContain('title={copy.say}');
    expect(source).toContain('<h3 className={REPORT_H3}>{title}</h3>');
    expect(source).not.toContain('<SectionCard title={copy.pay}>');
    expect(source).not.toContain('<SectionCard title={copy.benefits}>');
    expect(source).not.toContain('<SectionCard title={copy.say}');
    expect(source).toContain('<SectionCard title={copy.askCompany}>');
    expect(source).toContain('<SectionCard title={copy.professional} heading={REPORT_H1}>');
    expect(source).toContain('<SectionCard title={copy.behavioral} heading={REPORT_H1}>');
    expect(source).toContain('<h2 className={REPORT_H1}>{copy.land}</h2>');
    expect(source).toContain('<PayRangeLine');
    expect(source).toContain('targetLabel={copy.target}');
    expect(source).toContain('ceilingLabel={copy.ceiling}');
    expect(source).toContain('lg:flex-row lg:items-center lg:justify-between');
    expect(source).toContain('lg:ml-auto lg:w-[24rem] lg:shrink-0');
    expect(source).toContain('data-range-label={tone}');
    expect(source).not.toContain('lg:grid-cols-[auto_minmax(0,1fr)]');
    expect(source).toContain("sources: s ? '资料来源' : '資料來源'");
    expect(source).toContain("sources: 'Data sources'");
    expect(source).not.toContain('<SectionCard title={copy.target} heading={REPORT_H3}>');
    expect(source).not.toContain('<SectionCard title={copy.ceiling} heading={REPORT_H3}>');
    expect(source).not.toContain('framed');
    expect(source).not.toMatch(
      /<ItemBlock title=\{title\[item\]\} summaryLabel=\{copy\.analysisSummary\}/,
    );
    const zh = getSampleStrategyGuideReport('zh-TW').guide_modules!;
    expect(zh.company_eval.summary?.split('\n')).toHaveLength(3);
    expect(zh.company_eval.company_pros.length).toBeGreaterThan(0);
    expect(zh.company_eval.role_pros.length).toBeGreaterThan(0);
    expect(zh.negotiation.summary).toMatch(/開價/);
    expect(zh.negotiation.summary).toMatch(/上限/);
    expect(zh.negotiation.summary).toMatch(/禁區/);
    expect(zh.negotiation.pay_strategy.length).toBeGreaterThan(20);
    expect(zh.negotiation.benefits_strategy.length).toBeGreaterThan(20);
    expect(zh.negotiation.script.length).toBeGreaterThan(20);
    expect(zh.negotiation.company_questions.length).toBeGreaterThan(20);
  });

  it('aligns company and role review 優點 / 缺點 / 資料來源 on a shared subgrid', () => {
    const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
    expect(source).toContain('md:grid-rows-[auto_auto_auto_auto]');
    expect(source).toContain('md:grid-rows-subgrid');
    expect(source).toContain('md:row-span-4');
    expect(source).toContain('columnClass="md:col-start-1"');
    expect(source).toContain('columnClass="md:col-start-2"');
    expect(source).toContain('<h2 className={REPORT_H2}>{title}</h2>');
    expect(source).not.toContain('<SectionCard title={title} className="min-w-0">');

    const html = renderToStaticMarkup(
      createElement(GuideItemPage, {
        report: getSampleStrategyGuideReport('zh-TW'),
        item: 'company',
        language: 'zh-TW',
      }),
    );
    expect(html).toContain('grid-rows-subgrid');
    expect(html).toContain('row-span-4');
    expect(html).toContain('公司評價');
    expect(html).toContain('職位評價');
    expect(html.split('優點').length - 1).toBe(2);
    expect(html.split('缺點').length - 1).toBe(2);
    expect(html.split('資料來源').length - 1).toBe(2);
    expect(html).toContain('Blind 營運討論');
    expect(html).toContain('Glassdoor 職位評價');
    expect(html.indexOf('公司評價')).toBeLessThan(html.indexOf('職位評價'));
    expect(html.split('border-2 border-blue-500').length - 1).toBe(3);
    const company = getSampleStrategyGuideReport('zh-TW').guide_modules!.company_eval;
    expect(company.company_cons.length).toBeGreaterThan(company.role_cons.length);
  });

  it('merges Guide pay landing into one frame with range, ceiling, and unframed data sources', () => {
    const html = renderToStaticMarkup(
      createElement(GuideItemPage, {
        report: getSampleStrategyGuideReport('zh-TW'),
        item: 'land',
        language: 'zh-TW',
      }),
    );
    expect(html).toContain('個人化薪資落點');
    expect(html).toContain('市場總薪酬區間');
    expect(html).toContain('$168K');
    expect(html).toContain('$185K');
    expect(html).toContain('議價天花板');
    expect(html).toContain('個人目標');
    expect(html).toContain('data-pay-range="compact"');
    expect(html).toContain('data-range-label="target"');
    expect(html).toContain('data-range-label="ceiling"');
    expect(html).toContain('max-w-sm');
    expect(html).toContain('資料來源');
    expect(html).toContain('Levels.fyi');
    expect(html).toContain('結構拆分');
    expect(html).not.toContain('已拿到的權利');
    expect(html).not.toContain('總結分析');
    expect(html.split('border-2 border-blue-500').length - 1).toBe(3);
  });

  it('renders pay, benefits, and script as one negotiate playbook frame', () => {
    const html = renderToStaticMarkup(
      createElement(GuideItemPage, {
        report: getSampleStrategyGuideReport('zh-TW'),
        item: 'negotiate',
        language: 'zh-TW',
      }),
    );
    expect(html).toContain('薪資籌碼策略');
    expect(html).toContain('權益與福利爭取');
    expect(html).toContain('開口這樣說');
    expect(html).toContain('先報總薪酬');
    expect(html).toContain('report-h3');
    const playbook = html.slice(
      html.indexOf('薪資籌碼策略'),
      html.indexOf('開口這樣說') + '開口這樣說'.length,
    );
    expect(playbook).toContain('權益與福利爭取');
    expect(playbook).not.toContain('border-2 border-blue-500');
    expect(html).toContain('建議問公司的問題');
    expect(html.split('border-2 border-blue-500').length - 1).toBe(4);
  });

  it('lists every overflow question in 補充資料列表 and explains the ten-question rule', () => {
    const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
    expect(source).not.toMatch(/professional_extra\.slice\(\s*0\s*,\s*2\s*\)/);
    expect(source).not.toMatch(/behavioral_extra\.slice\(\s*0\s*,\s*2\s*\)/);
    expect(source).toContain('{items.map((item) => (');
    expect(source).toContain('以下十題為近期最重要的面試題；近三年其餘真題列於補充資料列表。');

    const report = getSampleStrategyGuideReport('zh-TW');
    const bank = report.guide_modules!.interview_bank;
    const extras = [...bank.professional_extra, ...bank.behavioral_extra];
    expect(extras.length).toBeGreaterThan(2);
    expect(bank.professional_extra.length).toBeGreaterThan(2);
    expect(bank.behavioral_extra.length).toBeGreaterThan(2);

    const html = renderToStaticMarkup(
      createElement(GuideItemPage, {
        report,
        item: 'questions',
        language: 'zh-TW',
      }),
    );
    expect(html).toContain('以下十題為近期最重要的面試題');
    expect(html).toContain('近三年其餘真題列於補充資料列表');
    expect(html).toContain('補充資料列表');
    for (const item of extras) {
      expect(html).toContain(item.question);
    }
  });

  it('keeps hiring-process facts in 總結分析 and does not render a duplicate process card', () => {
    const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
    const spec = readFileSync(join(process.cwd(), 'components/guide/GuideSpecModules.tsx'), 'utf8');
    expect(source).not.toContain('<SectionCard title={copy.process}>');
    expect(spec).not.toContain('{t.process}');

    const zh = getSampleStrategyGuideReport('zh-TW').guide_modules!.interview_bank;
    expect(zh.summary).toMatch(/^招募流程：/);
    expect(zh.summary).toMatch(/招募篩選/);
    expect(zh.summary).toMatch(/約三週/);
    expect(zh.summary).toMatch(/專業題/);
    expect(zh.summary).toMatch(/行為題/);
    expect(zh.process).toMatch(/招募篩選/);

    const html = renderToStaticMarkup(
      createElement(GuideItemPage, {
        report: getSampleStrategyGuideReport('zh-TW'),
        item: 'questions',
        language: 'zh-TW',
      }),
    );
    expect(html).toContain('總結分析');
    expect(html).toContain('招募流程');
    expect(html).toContain('招募篩選');
    expect(html).toContain('約三週');
    expect(html).not.toContain('面試流程');

    const labels = {
      en: 'Hiring process:',
      'zh-TW': '招募流程：',
      'zh-CN': '招聘流程：',
      es: 'Proceso de contratación:',
      hi: 'भर्ती प्रक्रिया:',
      ar: 'عملية التوظيف:',
    } as const;
    for (const lang of Object.keys(labels) as Array<keyof typeof labels>) {
      const summary = getSampleStrategyGuideReport(lang).guide_modules!.interview_bank.summary ?? '';
      expect(summary.startsWith(labels[lang])).toBe(true);
    }
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

