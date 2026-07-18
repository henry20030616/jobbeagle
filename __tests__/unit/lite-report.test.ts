import { describe, it, expect } from 'vitest';
import type { LiteReport } from '@/types';
import {
  normalizeLiteReport,
  normalizeFullReport,
  isFullReport,
  isLiteReport,
  isEnrichedLiteReport,
} from '@/lib/normalize-lite-report';
import { fitBandFromScore, deriveApplyDecision } from '@/lib/report-rules';

describe('report-rules', () => {
  it('maps score bands per Spec v3', () => {
    expect(fitBandFromScore(85)).toBe('Strong');
    expect(fitBandFromScore(70)).toBe('Viable');
    expect(fitBandFromScore(50)).toBe('Stretch');
    expect(fitBandFromScore(30)).toBe('Mismatch');
  });

  it('derives apply decision from hard filter + score', () => {
    expect(
      deriveApplyDecision({
        hardStatus: 'Blocked',
        score: 90,
        evidenceCoverage: 'High',
        completeness: 'High',
      }),
    ).toBe('Skip');
    expect(
      deriveApplyDecision({
        hardStatus: 'Pass',
        score: 72,
        evidenceCoverage: 'High',
        completeness: 'High',
      }),
    ).toBe('Apply now');
  });
});

describe('LiteReport Spec v3', () => {
  it('normalizes v3 snapshot payload', () => {
    const report = normalizeLiteReport({
      job_title: 'Senior Business Analyst',
      company_name: 'Acme Corp',
      data_completeness: {
        level: 'High',
        missing_inputs: [],
        confidence_notes: 'JD and resume complete enough.',
      },
      hard_filter: {
        status: 'Risk',
        items: [
          {
            requirement: '5+ years BA experience',
            status: 'Pass',
            evidence: '6 YOE listed',
          },
          {
            requirement: 'SAP migration',
            status: 'Risk',
            evidence: 'Not explicit on resume',
          },
        ],
      },
      fit_score: {
        score: 68,
        band: 'Viable',
        evidence_coverage: 'Medium',
        sharp_verdict: 'Solid BA core; thin enterprise migration proof.',
        breakdown: [
          {
            dimension: 'Hard requirements / feasibility',
            weight_pct: 30,
            score: 60,
            note: 'SAP risk',
          },
        ],
      },
      proof_map: {
        strengths: [
          { point: 'AI project delivery', description: 'Led two LLM pilots with measurable ROI.' },
        ],
        gaps: [
          { gap: 'Enterprise migration', description: 'No SAP or legacy cutover ownership listed.' },
        ],
        resume_actions: ['Add one quantified migration bullet if true.'],
        screenability_note: 'Keywords for SAP missing.',
      },
      expected_offer: {
        posted_range: null,
        p25: '$145K',
        p50: '$175K',
        p75: '$210K',
        currency: 'USD',
        region: 'San Francisco Bay Area',
        target_gap: 'Push toward P50 with migration proof.',
        evidence_tier: 'C',
        sources: ['Market benchmark'],
        candidate_position_label: 'Likely P35–P45 at current evidence.',
      },
      apply_decision: {
        label: 'Apply after fixes',
        reason: 'Core fit is viable but SAP is a screen risk.',
        next_best_action: 'Add one verified migration bullet, then apply.',
      },
      role_read: {
        mission: 'Own requirements for enterprise migration programs.',
        responsibilities: ['Stakeholder alignment', 'Requirements docs'],
        hiring_signals: ['Backfill for attrition'],
      },
      interview_starters: [
        'Walk me through a requirements doc you owned end-to-end.',
        'How did you handle conflicting stakeholders?',
        'Describe a data migration you led.',
      ],
    });

    expect(report.fit_score.score).toBe(68);
    expect(report.match_score).toBe(68);
    expect(report.expected_offer.evidence_tier).toBe('C');
    expect(report.apply_decision.label).toBe('Apply after fixes');
    expect(report.proof_map.strengths).toHaveLength(1);
    expect(isLiteReport(report)).toBe(true);
    expect(isEnrichedLiteReport(report)).toBe(true);
  });

  it('maps legacy Snapshot fields into v3', () => {
    const report = normalizeLiteReport({
      match_score: 70,
      job_title: 'PM',
      company_name: 'MaiCoin',
      one_sentence_sharp_critique: 'Gap in B2B SaaS',
      matching_strengths: [{ point: 'Crypto', description: 'Exchange ops' }],
      critical_gaps: [{ gap: 'SaaS', description: 'No SaaS PM' }],
      hard_requirements_checklist: [{ requirement: '5y PM', status: 'met' }],
      interview_starters: ['Q1', 'Q2', 'Q3'],
      radford_2026_compensation_matrix: {
        tier_25th_low: '$100K',
        tier_50th_mid: '$120K',
        tier_75th_high: '$140K',
        market_region: 'Taiwan/Remote',
        compensation_rationale: 'Legacy estimate',
        candidate_position_label: 'Around mid',
      },
    });

    expect(report.fit_score.score).toBe(70);
    expect(report.fit_score.band).toBe('Viable');
    expect(report.proof_map.gaps[0].gap).toBe('SaaS');
    expect(report.expected_offer.p50).toBe('$120K');
    expect(report.expected_offer.evidence_tier).toBe('C');
    expect(report.hard_filter.status).toBe('Pass');
  });

  it('clears salary numbers on evidence tier D', () => {
    const report = normalizeLiteReport({
      fit_score: {
        score: 55,
        band: 'Stretch',
        evidence_coverage: 'Low',
        sharp_verdict: 'Thin inputs',
        breakdown: [],
      },
      expected_offer: {
        posted_range: '$90–110K',
        p25: '$90K',
        p50: '$100K',
        p75: '$110K',
        currency: 'USD',
        region: 'US',
        target_gap: 'Cannot estimate',
        evidence_tier: 'D',
        sources: [],
      },
      proof_map: {
        strengths: [{ point: 'A', description: 'a' }],
        gaps: [{ gap: 'B', description: 'b' }],
        resume_actions: [],
        screenability_note: '',
      },
    } as Partial<LiteReport>);

    expect(report.expected_offer.p25).toBeNull();
    expect(report.expected_offer.p50).toBeNull();
    expect(report.expected_offer.p75).toBeNull();
  });
});

describe('FullReport Spec v3', () => {
  it('normalizes strategy layer and mirrors legacy STAR bank', () => {
    const full = normalizeFullReport({
      fit_score: {
        score: 70,
        band: 'Viable',
        evidence_coverage: 'Medium',
        sharp_verdict: 'Viable with SaaS gap',
        breakdown: [],
      },
      job_title: 'PM',
      company_name: 'MaiCoin',
      proof_map: {
        strengths: [{ point: 'Crypto', description: 'Exchange ops' }],
        gaps: [{ gap: 'SaaS', description: 'No SaaS PM' }],
        resume_actions: [],
        screenability_note: '',
      },
      expected_offer: {
        posted_range: null,
        p25: null,
        p50: null,
        p75: null,
        currency: 'USD',
        region: 'US',
        target_gap: 'Insufficient evidence',
        evidence_tier: 'D',
        sources: [],
      },
      interview_starters: ['Q1', 'Q2', 'Q3'],
      strategy_fit_salary: {
        score_implications: 'Interview as a stretch but credible.',
        offer_implications: 'Use discovery; do not invent band.',
        validate_with_recruiter: ['Confirm level'],
      },
      hiring_context: {
        insights: [],
        limitations: ['Thin public sources'],
        validation_questions: ['Why is the role open?'],
      },
      concerns_defenses: [
        {
          concern: 'No SaaS PM',
          why: 'JD emphasizes B2B SaaS',
          evidence: 'Crypto exchange only',
          missing_proof: 'SaaS roadmap ownership',
          answer_guide: 'Bridge with transferrable discovery skills.',
          do_not_claim: 'Do not invent SaaS titles.',
        },
        {
          concern: 'Level ambiguity',
          why: 'Title mix',
          evidence: '',
          missing_proof: 'Scope clarity',
          answer_guide: 'Ask leveling questions early.',
          do_not_claim: 'Do not claim staff scope.',
        },
        {
          concern: 'Comp unknown',
          why: 'Tier D',
          evidence: '',
          missing_proof: 'Posted band',
          answer_guide: 'Ask for approved band.',
          do_not_claim: 'Do not invent TC.',
        },
      ],
      interview_playbook: {
        reported: [],
        predicted: [{ question: 'Tell me about a product tradeoff', predicted: true }],
        star_templates: [
          {
            title: 'Product tradeoff',
            for_question: 'Tell me about a product tradeoff',
            situation: 'Exchange ops backlog',
            task: 'Prioritize shipping vs risk',
            action: 'Ran a scoring rubric with eng + compliance',
            result: 'Cut 2 high-risk items; shipped on time',
            resume_anchor: 'Crypto exchange ops',
          },
        ],
        star_outlines: ['STAR: product tradeoff'],
        reverse_questions: ['What does 90-day success look like?'],
        validate_before_join: ['Team stability'],
      },
      offer_strategy: {
        target: 'Confirm mid-band',
        acceptable: 'Confirm floor',
        walk_away: 'Below documented floor',
        levers: ['Scope'],
        script: 'Lead with discovery.',
        discovery_questions: ['What is the approved band?'],
      },
    });

    expect(full.fit_score.score).toBe(70);
    expect(full.concerns_defenses).toHaveLength(3);
    expect(full.interview_playbook.predicted[0].question).toContain('tradeoff');
    expect(full.interview_playbook.star_templates.length).toBeGreaterThanOrEqual(1);
    expect(full.interview_playbook.star_templates[0].situation).toContain('Exchange');
    expect(full.custom_star_interview_bank?.length).toBeGreaterThan(0);
    expect(full.offer_strategy.script).toContain('discovery');
    expect(isFullReport(full)).toBe(true);
  });

  it('coerces legacy string STAR bank into structured templates', () => {
    const full = normalizeFullReport({
      match_score: 70,
      job_title: 'PM',
      company_name: 'MaiCoin',
      matching_strengths: [{ point: 'Crypto', description: 'Exchange ops' }],
      critical_gaps: [{ gap: 'SaaS', description: 'No SaaS PM' }],
      interview_starters: ['Q1', 'Q2', 'Q3'],
      online_intel_warning: '',
      corporate_culture_blackbox: 'Culture notes',
      custom_star_interview_bank: ['STAR 1', 'STAR 2'],
      salary_negotiation_script: 'Ask for mid-band',
    });

    expect(full.match_score).toBe(70);
    expect(full.concerns_defenses).toHaveLength(3);
    expect(full.interview_playbook.predicted.length).toBeGreaterThan(0);
    expect(full.interview_playbook.star_templates.length).toBeGreaterThanOrEqual(2);
    expect(full.interview_playbook.star_templates[0].title).toContain('STAR');
    expect(full.offer_strategy.script).toContain('mid-band');
    expect(isFullReport(full)).toBe(true);
  });
});
