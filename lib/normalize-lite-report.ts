import type {
  ApplyDecision,
  CandidateCase,
  CareerContext,
  CompletenessLevel,
  DataCompleteness,
  EvidenceCoverage,
  ExpectedOfferRange,
  FitBand,
  FitScoreBlock,
  FitScoreBreakdownItem,
  FullReport,
  HardFilter,
  HardFilterItem,
  HardFilterStatus,
  HardRequirementStatus,
  HiringContext,
  InterviewPlaybook,
  LiteHardRequirement,
  LiteMatchPoint,
  LiteReport,
  LiteSkillGap,
  OfferLever,
  OfferStrategy,
  OfferTcBreakdown,
  ProofMap,
  RoleRead,
  SalaryEvidenceTier,
  StarTemplate,
  StrategyFitSalary,
  StrategyIntelFields,
} from '@/types';
import { fitBandFromScore, resolveApplyDecision } from '@/lib/report-rules';
import { enrichTargetGapWithCareerContext } from '@/lib/career-context';
import { buildProvenanceRecord, scrubInsightUrls } from '@/lib/provenance';
import { scoreSummaryPoints } from '@/lib/score-summary';

const HARD_STATUSES: HardFilterStatus[] = ['Pass', 'Risk', 'Blocked', 'Unknown'];
const FIT_BANDS: FitBand[] = ['Strong', 'Viable', 'Stretch', 'Mismatch'];
const COVERAGE: EvidenceCoverage[] = ['High', 'Medium', 'Low'];
const COMPLETENESS: CompletenessLevel[] = ['High', 'Medium', 'Low'];
const TIERS: SalaryEvidenceTier[] = ['A', 'B', 'C', 'D'];

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

function asStringArray(v: unknown, max?: number): string[] {
  if (!Array.isArray(v)) return [];
  const out = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim());
  return typeof max === 'number' ? out.slice(0, max) : out;
}

function mapLegacyHardStatus(status: unknown): HardFilterStatus | HardRequirementStatus {
  if (typeof status !== 'string') return 'Unknown';
  if (HARD_STATUSES.includes(status as HardFilterStatus)) return status as HardFilterStatus;
  if (status === 'met' || status === 'partial' || status === 'missing') return status;
  return 'Unknown';
}

function aggregateHardStatus(items: HardFilterItem[]): HardFilterStatus {
  const statuses = items.map((i) => String(i.status));
  if (statuses.some((s) => s === 'Blocked' || s === 'missing')) {
    if (statuses.some((s) => s === 'Blocked')) return 'Blocked';
    return 'Risk';
  }
  if (statuses.some((s) => s === 'Risk' || s === 'partial' || s === 'Unknown')) return 'Risk';
  if (items.length === 0) return 'Unknown';
  return 'Pass';
}

function normalizeHardFilter(raw: Partial<LiteReport>): HardFilter {
  if (raw.hard_filter?.status && Array.isArray(raw.hard_filter.items)) {
    const items: HardFilterItem[] = raw.hard_filter.items
      .filter((i) => i?.requirement)
      .map((i) => ({
        requirement: asString(i.requirement),
        status: mapLegacyHardStatus(i.status),
        evidence: asString(i.evidence),
      }));
    const status = HARD_STATUSES.includes(raw.hard_filter.status)
      ? raw.hard_filter.status
      : aggregateHardStatus(items);
    return { status, items };
  }

  const legacy = Array.isArray(raw.hard_requirements_checklist)
    ? raw.hard_requirements_checklist.filter((h) => h?.requirement)
    : [];
  const items: HardFilterItem[] = legacy.map((h: LiteHardRequirement) => ({
    requirement: h.requirement,
    status: mapLegacyHardStatus(h.status),
    evidence: '',
  }));
  return { status: aggregateHardStatus(items), items };
}

function defaultBreakdown(score: number): FitScoreBreakdownItem[] {
  return [
    { dimension: 'Hard requirements / feasibility', weight_pct: 30, score, note: '' },
    { dimension: 'Level / scope / YOE', weight_pct: 25, score, note: '' },
    { dimension: 'Core skills', weight_pct: 20, score, note: '' },
    { dimension: 'Domain experience', weight_pct: 15, score, note: '' },
    { dimension: 'Proven impact', weight_pct: 10, score, note: '' },
  ];
}

function normalizeFitScore(raw: Partial<LiteReport>): FitScoreBlock {
  const legacyScore =
    typeof raw.match_score === 'number'
      ? raw.match_score
      : typeof raw.fit_score?.score === 'number'
        ? raw.fit_score.score
        : 50;
  const score = Math.max(0, Math.min(100, Math.round(raw.fit_score?.score ?? legacyScore)));
  const band =
    raw.fit_score?.band && FIT_BANDS.includes(raw.fit_score.band)
      ? raw.fit_score.band
      : fitBandFromScore(score);
  const evidence_coverage =
    raw.fit_score?.evidence_coverage && COVERAGE.includes(raw.fit_score.evidence_coverage)
      ? raw.fit_score.evidence_coverage
      : 'Medium';
  const sharp_verdict =
    asString(raw.fit_score?.sharp_verdict)
    || asString(raw.one_sentence_sharp_critique)
    || asString(raw.recruiter_verdict)
    || 'Fit assessment based on available JD and resume evidence.';
  const sharp_verdict_points = scoreSummaryPoints(
    sharp_verdict,
    Array.isArray(raw.fit_score?.sharp_verdict_points)
      ? raw.fit_score!.sharp_verdict_points
      : undefined,
  );
  const breakdown =
    Array.isArray(raw.fit_score?.breakdown) && raw.fit_score!.breakdown.length > 0
      ? raw.fit_score!.breakdown.map((b) => ({
          dimension: asString(b.dimension, 'Dimension'),
          weight_pct: typeof b.weight_pct === 'number' ? b.weight_pct : 0,
          score: typeof b.score === 'number' ? b.score : score,
          note: asString(b.note),
        }))
      : defaultBreakdown(score);

  return {
    score,
    band,
    evidence_coverage,
    sharp_verdict:
      sharp_verdict_points.length > 0
        ? sharp_verdict_points.join(' ')
        : sharp_verdict,
    sharp_verdict_points,
    breakdown,
  };
}

function normalizeProofMap(raw: Partial<LiteReport>): ProofMap {
  if (raw.proof_map) {
    return {
      strengths: Array.isArray(raw.proof_map.strengths)
        ? raw.proof_map.strengths.filter((s) => s?.point)
        : [],
      gaps: Array.isArray(raw.proof_map.gaps)
        ? raw.proof_map.gaps.filter((g) => g?.gap)
        : [],
      resume_actions: asStringArray(raw.proof_map.resume_actions, 5),
      screenability_note: asString(raw.proof_map.screenability_note),
    };
  }

  const strengths: LiteMatchPoint[] = Array.isArray(raw.matching_strengths)
    ? raw.matching_strengths.filter((s) => s?.point)
    : [];
  const gaps: LiteSkillGap[] = Array.isArray(raw.critical_gaps)
    ? raw.critical_gaps.filter((g) => g?.gap)
    : [];
  const critique = asString(raw.one_sentence_sharp_critique) || asString(raw.recruiter_verdict);
  if (strengths.length === 0 && critique) {
    strengths.push({ point: 'Resume signals reviewed', description: critique });
  }
  if (gaps.length === 0 && critique) {
    gaps.push({ gap: 'Primary mismatch', description: critique });
  }
  return {
    strengths,
    gaps,
    resume_actions: [],
    screenability_note: '',
  };
}

function normalizeTcBreakdown(raw: unknown): OfferTcBreakdown | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const base = asString(o.base) || null;
  const bonus = asString(o.bonus) || null;
  const equity = asString(o.equity) || null;
  const total = asString(o.total) || null;
  if (!base && !bonus && !equity && !total) return undefined;
  return { base, bonus, equity, total };
}

function normalizeStructuredLevers(raw: unknown): OfferLever[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map((x) => ({
      name: asString(x.name),
      note: asString(x.note),
    }))
    .filter((x) => x.name)
    .slice(0, 8);
}

function normalizeExpectedOffer(
  raw: Partial<LiteReport>,
  careerContext?: CareerContext | null,
): ExpectedOfferRange {
  if (raw.expected_offer) {
    const tier = TIERS.includes(raw.expected_offer.evidence_tier)
      ? raw.expected_offer.evidence_tier
      : 'D';
    const blankNums = tier === 'D';
    return {
      posted_range: blankNums ? null : (raw.expected_offer.posted_range ?? null),
      p25: blankNums ? null : (raw.expected_offer.p25 ?? null),
      p50: blankNums ? null : (raw.expected_offer.p50 ?? null),
      p75: blankNums ? null : (raw.expected_offer.p75 ?? null),
      currency: asString(raw.expected_offer.currency, 'USD'),
      region: asString(raw.expected_offer.region, 'US'),
      target_gap: enrichTargetGapWithCareerContext(
        asString(raw.expected_offer.target_gap),
        careerContext,
      ),
      evidence_tier: tier,
      sources: asStringArray(raw.expected_offer.sources),
      candidate_position_label: asString(raw.expected_offer.candidate_position_label) || undefined,
      tc_breakdown: normalizeTcBreakdown(raw.expected_offer.tc_breakdown),
    };
  }

  const m = raw.radford_2026_compensation_matrix;
  if (m) {
    return {
      posted_range: null,
      p25: asString(m.tier_25th_low) || null,
      p50: asString(m.tier_50th_mid) || null,
      p75: asString(m.tier_75th_high) || null,
      currency: 'USD',
      region: asString(m.market_region, 'US'),
      target_gap: enrichTargetGapWithCareerContext(
        asString(m.compensation_rationale),
        careerContext,
      ),
      evidence_tier: 'C',
      sources: ['Legacy compensation estimate (pre–Spec v3)'],
      candidate_position_label: asString(m.candidate_position_label) || undefined,
    };
  }

  return {
    posted_range: null,
    p25: null,
    p50: null,
    p75: null,
    currency: 'USD',
    region: 'US',
    target_gap: enrichTargetGapWithCareerContext(
      'Insufficient salary evidence — do not invent a band.',
      careerContext,
    ),
    evidence_tier: 'D',
    sources: [],
  };
}

function normalizeDataCompleteness(raw: Partial<LiteReport>): DataCompleteness {
  if (raw.data_completeness?.level && COMPLETENESS.includes(raw.data_completeness.level)) {
    return {
      level: raw.data_completeness.level,
      missing_inputs: asStringArray(raw.data_completeness.missing_inputs, 3),
      confidence_notes: asString(raw.data_completeness.confidence_notes),
    };
  }
  return {
    level: 'Medium',
    missing_inputs: [],
    confidence_notes: 'Completeness inferred from available JD and resume fields.',
  };
}

function normalizeRoleRead(raw: Partial<LiteReport>): RoleRead {
  if (raw.role_read) {
    return {
      mission: asString(raw.role_read.mission),
      responsibilities: asStringArray(raw.role_read.responsibilities, 6),
      hiring_signals: asStringArray(raw.role_read.hiring_signals, 5),
    };
  }
  return { mission: '', responsibilities: [], hiring_signals: [] };
}

export function isLiteReport(value: unknown): value is LiteReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if ('basic_analysis' in r) return false;
  if (typeof r.match_score === 'number') return true;
  const fit = r.fit_score as Record<string, unknown> | undefined;
  return typeof fit?.score === 'number';
}

/** Backfill Spec v3 fields; map legacy Snapshot/Strategy payloads. */
export function normalizeLiteReport(
  raw: Partial<LiteReport> & { match_score?: number },
  options?: { careerContext?: CareerContext | null },
): LiteReport {
  const hard_filter = normalizeHardFilter(raw);
  const fit_score = normalizeFitScore(raw);
  const proof_map = normalizeProofMap(raw);
  const expected_offer = normalizeExpectedOffer(raw, options?.careerContext);
  const data_completeness = normalizeDataCompleteness(raw);
  const role_read = normalizeRoleRead(raw);

  const apply_decision: ApplyDecision = resolveApplyDecision({
    hard_filter,
    fit_score,
    data_completeness,
    apply_decision: raw.apply_decision,
    match_score: typeof raw.match_score === 'number' ? raw.match_score : fit_score.score,
  });

  const interview_starters = asStringArray(raw.interview_starters, 3);
  while (interview_starters.length < 3 && interview_starters.length > 0) {
    interview_starters.push(interview_starters[interview_starters.length - 1]);
  }

  const report: LiteReport = {
    job_title: asString(raw.job_title, 'Unknown Role'),
    company_name: asString(raw.company_name, 'Unknown Company'),
    job_posted_date: asString(raw.job_posted_date),
    data_completeness,
    hard_filter,
    fit_score,
    proof_map,
    expected_offer,
    apply_decision,
    role_read,
    interview_starters,
    match_score: fit_score.score,
    recruiter_verdict: asString(raw.recruiter_verdict) || fit_score.sharp_verdict,
    one_sentence_sharp_critique:
      asString(raw.one_sentence_sharp_critique) || fit_score.sharp_verdict,
    dog_breed_archetype: asString(raw.dog_breed_archetype) || undefined,
    flsa_status: raw.flsa_status,
    radford_2026_compensation_matrix: raw.radford_2026_compensation_matrix,
    matching_strengths: proof_map.strengths,
    critical_gaps: proof_map.gaps,
    hard_requirements_checklist: hard_filter.items.map((i) => ({
      requirement: i.requirement,
      status:
        i.status === 'Pass' || i.status === 'met'
          ? 'met'
          : i.status === 'Blocked' || i.status === 'missing'
            ? 'missing'
            : 'partial',
    })),
  };

  return report;
}

export function isEnrichedLiteReport(raw: unknown): boolean {
  if (!isLiteReport(raw)) return false;
  const r = raw as LiteReport;
  const strengths = r.proof_map?.strengths?.length ?? r.matching_strengths?.length ?? 0;
  const gaps = r.proof_map?.gaps?.length ?? r.critical_gaps?.length ?? 0;
  const hasFit = typeof (r.fit_score?.score ?? r.match_score) === 'number';
  // Spec v3 Snapshot must include expected_offer so salary hero is not blank from legacy cache.
  const hasOffer = Boolean(r.expected_offer?.evidence_tier || r.radford_2026_compensation_matrix);
  return strengths > 0 && gaps > 0 && hasFit && hasOffer;
}

export function isFullReport(value: unknown): value is FullReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (Array.isArray(r.concerns_defenses) && r.concerns_defenses.length > 0) return true;
  if (r.interview_playbook && typeof r.interview_playbook === 'object') return true;
  if (r.offer_strategy && typeof r.offer_strategy === 'object') return true;
  return Array.isArray(r.custom_star_interview_bank);
}

function emptyHiringContext(): HiringContext {
  return { insights: [], limitations: [], validation_questions: [] };
}

function emptyPlaybook(): InterviewPlaybook {
  return {
    reported: [],
    predicted: [],
    star_templates: [],
    star_outlines: [],
    reverse_questions: [],
    validate_before_join: [],
  };
}

function formatStarOutline(t: StarTemplate): string {
  const parts = [
    t.title,
    t.situation ? `S: ${t.situation}` : '',
    t.task ? `T: ${t.task}` : '',
    t.action ? `A: ${t.action}` : '',
    t.result ? `R: ${t.result}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

function coerceStarTemplate(item: unknown): StarTemplate | null {
  if (typeof item === 'string' && item.trim()) {
    const text = item.trim();
    return {
      title: text.slice(0, 80),
      situation: text,
      task: '',
      action: '',
      result: '',
      resume_anchor: '',
    };
  }
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const title = asString(o.title) || asString(o.for_question);
  const situation = asString(o.situation);
  const task = asString(o.task);
  const action = asString(o.action);
  const result = asString(o.result);
  if (!title && !situation && !action) return null;
  return {
    title: title || 'STAR practice template',
    for_question: asString(o.for_question) || undefined,
    situation,
    task,
    action,
    result,
    resume_anchor: asString(o.resume_anchor),
  };
}

function normalizeStarTemplates(
  playbook: Partial<InterviewPlaybook> | undefined,
  legacyBank: unknown,
  starters: string[],
  strengths: { point: string }[],
): StarTemplate[] {
  const collected: StarTemplate[] = [];
  const push = (item: unknown) => {
    const t = coerceStarTemplate(item);
    if (t) collected.push(t);
  };

  if (Array.isArray(playbook?.star_templates)) {
    for (const item of playbook!.star_templates) push(item);
  }
  if (collected.length === 0 && Array.isArray(playbook?.star_outlines)) {
    for (const item of playbook!.star_outlines) push(item);
  }
  if (collected.length === 0 && Array.isArray(legacyBank)) {
    for (const item of legacyBank) push(item);
  }

  let i = 0;
  while (collected.length < 3 && starters[i]) {
    collected.push({
      title: `Practice story ${collected.length + 1}`,
      for_question: starters[i],
      situation: 'Anchor to a real role/project on your resume.',
      task: 'State the concrete goal this question is probing.',
      action: 'Describe 2–3 actions you personally took (resume-verified).',
      result: 'Add a verified outcome or metric; if none exists, say so honestly.',
      resume_anchor: strengths[i]?.point || 'Resume evidence required',
    });
    i += 1;
  }

  return collected.slice(0, 4);
}

function emptyOffer(): OfferStrategy {
  return {
    target: '',
    acceptable: '',
    walk_away: '',
    levers: [],
    script: '',
    discovery_questions: [],
  };
}

function emptyStrategyFit(): StrategyFitSalary {
  return {
    score_implications: '',
    offer_implications: '',
    validate_with_recruiter: [],
  };
}

function normalizeStrategyIntel(raw: Partial<StrategyIntelFields>, snapshot: LiteReport): StrategyIntelFields {
  const hiring_context: HiringContext = raw.hiring_context
    ? {
        insights: scrubInsightUrls(
          Array.isArray(raw.hiring_context.insights)
            ? raw.hiring_context.insights
                .filter((i) => i?.claim)
                .map((i) => ({
                  claim: asString(i.claim),
                  why_it_matters: asString(i.why_it_matters),
                  source_url: asString(i.source_url),
                  date: asString(i.date),
                }))
            : [],
        ),
        limitations: asStringArray(raw.hiring_context.limitations),
        validation_questions: asStringArray(raw.hiring_context.validation_questions),
      }
    : {
        ...emptyHiringContext(),
        limitations: asString(raw.online_intel_warning)
          ? [asString(raw.online_intel_warning)]
          : asString(raw.corporate_culture_blackbox)
            ? [asString(raw.corporate_culture_blackbox)]
            : ['Limited public hiring-context signals for this run.'],
        validation_questions: [
          'What problem is this hire meant to solve in the next 6–12 months?',
          'How is success measured for this role in the first 90 days?',
        ],
      };

  const concerns_defenses = Array.isArray(raw.concerns_defenses)
    ? raw.concerns_defenses
        .filter((c) => c?.concern)
        .slice(0, 3)
        .map((c) => ({
          concern: asString(c.concern),
          why: asString(c.why),
          evidence: asString(c.evidence),
          missing_proof: asString(c.missing_proof),
          answer_guide: asString(c.answer_guide),
          do_not_claim: asString(c.do_not_claim),
        }))
    : [];

  while (concerns_defenses.length < 3) {
    const gap = snapshot.proof_map.gaps[concerns_defenses.length];
    concerns_defenses.push({
      concern: gap?.gap || `Gap ${concerns_defenses.length + 1} vs JD must-haves`,
      why: gap?.description || 'Recruiter may probe this area based on the JD.',
      evidence: '',
      missing_proof: gap?.description || '',
      answer_guide: 'Answer with one verified resume fact; do not invent experience.',
      do_not_claim: 'Do not claim tools, years, or outcomes not on the resume.',
    });
  }

  let interview_playbook: InterviewPlaybook = raw.interview_playbook
    ? {
        reported: Array.isArray(raw.interview_playbook.reported)
          ? scrubInsightUrls(
              raw.interview_playbook.reported
                .filter((q) => q?.question)
                .map((q) => ({
                  question: asString(q.question),
                  predicted: q.predicted,
                  source_url: asString(q.source_url),
                  source_date: asString(q.source_date),
                  evidence: asString(q.evidence),
                  star_outline: asString(q.star_outline),
                  missing_facts: asString(q.missing_facts),
                  date: asString(q.source_date),
                })),
            ).map(({ date, ...q }) => ({
              question: q.question,
              predicted: q.predicted,
              source_url: q.source_url,
              source_date: q.source_date || date,
              evidence: q.evidence || undefined,
              star_outline: q.star_outline || undefined,
              missing_facts: q.missing_facts || undefined,
            }))
          : [],
        predicted: Array.isArray(raw.interview_playbook.predicted)
          ? raw.interview_playbook.predicted.filter((q) => q?.question)
          : [],
        star_templates: [],
        star_outlines: asStringArray(raw.interview_playbook.star_outlines),
        reverse_questions: asStringArray(raw.interview_playbook.reverse_questions),
        validate_before_join: asStringArray(raw.interview_playbook.validate_before_join),
      }
    : emptyPlaybook();

  interview_playbook.star_templates = normalizeStarTemplates(
    raw.interview_playbook,
    raw.custom_star_interview_bank,
    snapshot.interview_starters,
    snapshot.proof_map.strengths,
  );
  interview_playbook.star_outlines =
    interview_playbook.star_templates.map(formatStarOutline);

  if (
    interview_playbook.predicted.length === 0
    && Array.isArray(raw.custom_star_interview_bank)
  ) {
    interview_playbook = {
      ...interview_playbook,
      predicted: raw.custom_star_interview_bank
        .filter((q) => typeof q === 'string' && q.trim())
        .slice(0, 10)
        .map((question) => ({ question, predicted: true })),
    };
  }

  if (interview_playbook.predicted.length === 0 && snapshot.interview_starters.length > 0) {
    interview_playbook.predicted = snapshot.interview_starters.map((question) => ({
      question,
      predicted: true,
    }));
  }

  if (interview_playbook.validate_before_join.length === 0 && raw.corporate_culture_blackbox) {
    interview_playbook.validate_before_join = [
      asString(raw.corporate_culture_blackbox).slice(0, 280),
    ];
  }

  const structured_levers = normalizeStructuredLevers(
    (raw.offer_strategy as OfferStrategy | undefined)?.structured_levers,
  );
  const offerTc =
    normalizeTcBreakdown((raw.offer_strategy as OfferStrategy | undefined)?.tc_breakdown)
    || snapshot.expected_offer.tc_breakdown;

  const offer_strategy: OfferStrategy = raw.offer_strategy
    ? {
        target: asString(raw.offer_strategy.target),
        acceptable: asString(raw.offer_strategy.acceptable),
        walk_away: asString(raw.offer_strategy.walk_away),
        levers:
          asStringArray(raw.offer_strategy.levers).length > 0
            ? asStringArray(raw.offer_strategy.levers)
            : structured_levers.map((l) => l.name),
        structured_levers: structured_levers.length > 0 ? structured_levers : undefined,
        tc_breakdown: offerTc,
        script: asString(raw.offer_strategy.script),
        discovery_questions: asStringArray(raw.offer_strategy.discovery_questions),
      }
    : {
        ...emptyOffer(),
        tc_breakdown: offerTc,
        script:
          asString(raw.salary_negotiation_script)
          || asString(snapshot.expected_offer.candidate_position_label)
          || 'Use discovery questions before anchoring if evidence tier is weak.',
        discovery_questions:
          snapshot.expected_offer.evidence_tier === 'D' || snapshot.expected_offer.evidence_tier === 'C'
            ? [
                'What is the approved band for this level in this location?',
                'How does total compensation split between cash, bonus, and equity?',
              ]
            : [],
      };

  let candidate_case: CandidateCase | undefined;
  const rawCase = (raw as Partial<FullReport>).candidate_case;
  if (rawCase && typeof rawCase === 'object') {
    const hire_thesis = asString(rawCase.hire_thesis);
    const top_facts = asStringArray(rawCase.top_facts, 3);
    if (hire_thesis || top_facts.length > 0) {
      candidate_case = {
        hire_thesis:
          hire_thesis
          || snapshot.proof_map.strengths
            .slice(0, 3)
            .map((s) => s.point)
            .join('; '),
        top_facts:
          top_facts.length > 0
            ? top_facts
            : snapshot.proof_map.strengths.slice(0, 3).map((s) => s.point),
      };
    }
  }
  if (!candidate_case && snapshot.proof_map.strengths.length > 0) {
    candidate_case = {
      hire_thesis: `Hire case rests on: ${snapshot.proof_map.strengths
        .slice(0, 3)
        .map((s) => s.point)
        .join('; ')}.`,
      top_facts: snapshot.proof_map.strengths.slice(0, 3).map((s) => s.point),
    };
  }

  const strategy_fit_salary: StrategyFitSalary = raw.strategy_fit_salary
    ? {
        score_implications: asString(raw.strategy_fit_salary.score_implications),
        offer_implications: asString(raw.strategy_fit_salary.offer_implications),
        validate_with_recruiter: asStringArray(raw.strategy_fit_salary.validate_with_recruiter),
      }
    : {
        ...emptyStrategyFit(),
        score_implications: `Fit score ${snapshot.fit_score.score} (${snapshot.fit_score.band}) with ${snapshot.hard_filter.status} hard-filter status.`,
        offer_implications: `Expected offer evidence tier ${snapshot.expected_offer.evidence_tier}.`,
        validate_with_recruiter: [
          'Confirm must-have requirements vs preferred.',
          'Confirm compensation band and leveling for this req.',
        ],
      };

  // Legacy mirrors for older UI / cache consumers
  const starBank =
    interview_playbook.star_templates.length > 0
      ? interview_playbook.star_templates.map((t) => t.title || formatStarOutline(t))
      : interview_playbook.predicted.map((q) => q.question);
  while (starBank.length < 3 && snapshot.interview_starters[starBank.length]) {
    starBank.push(snapshot.interview_starters[starBank.length]);
  }

  const report_version = asString(raw.report_version, 'v3') || 'v3';
  const provenance = buildProvenanceRecord({
    reportVersion: report_version,
    offerSources: snapshot.expected_offer.sources,
    insights: hiring_context.insights,
    reportedQuestions: interview_playbook.reported,
  });

  if (provenance.invalid_url_count > 0) {
    hiring_context.limitations = [
      ...hiring_context.limitations,
      `${provenance.invalid_url_count} citation URL(s) failed validation and were downgraded.`,
    ].slice(0, 8);
  }

  return {
    strategy_fit_salary,
    hiring_context,
    concerns_defenses,
    interview_playbook,
    offer_strategy,
    candidate_case,
    provenance,
    report_version,
    online_intel_warning: asString(raw.online_intel_warning),
    corporate_culture_blackbox:
      asString(raw.corporate_culture_blackbox)
      || hiring_context.limitations.join(' ')
      || '',
    custom_star_interview_bank: starBank.slice(0, 10),
    salary_negotiation_script: offer_strategy.script,
  };
}

/** Normalize merged Strategy Guide (Snapshot fields + strategy layer). */
export function normalizeFullReport(
  raw: Partial<FullReport> & { match_score?: number },
  options?: { careerContext?: CareerContext | null },
): FullReport {
  const snapshot = normalizeLiteReport(raw, options);
  const intel = normalizeStrategyIntel(raw, snapshot);
  return { ...snapshot, ...intel };
}
