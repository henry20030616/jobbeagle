import type { FullReport, LiteReport } from '@/types';
import { normalizeFullReport, normalizeLiteReport } from '@/lib/normalize-lite-report';

/** Public demo Snapshot — fictional candidate vs fictional US role. */
const SAMPLE_SNAPSHOT_RAW: Partial<LiteReport> = {
  job_title: 'Senior Business Analyst',
  company_name: 'Northstar Payments',
  data_completeness: {
    level: 'High',
    missing_inputs: [],
    confidence_notes: 'JD and resume complete enough for a confident Snapshot.',
  },
  hard_filter: {
    status: 'Risk',
    items: [
      {
        requirement: '5+ years BA / product ops experience',
        status: 'Pass',
        evidence: '6 YOE listed across fintech ops roles',
      },
      {
        requirement: 'SQL + dashboard ownership',
        status: 'Pass',
        evidence: 'Looker + SQL called out on resume',
      },
      {
        requirement: 'Payments / ACH domain',
        status: 'Risk',
        evidence: 'Banking ops adjacent; ACH not explicit',
      },
    ],
  },
  fit_score: {
    score: 78,
    band: 'Strong',
    evidence_coverage: 'High',
    sharp_verdict:
      'Strong analytical and stakeholder story; payments-specific ACH depth is the main stretch for a senior screen.',
    breakdown: [
      {
        dimension: 'Hard requirements / feasibility',
        weight_pct: 30,
        score: 72,
        note: 'ACH domain is partial',
      },
      {
        dimension: 'Level / scope / tenure',
        weight_pct: 25,
        score: 80,
        note: 'Senior Associate → Senior BA is a clean step',
      },
      {
        dimension: 'Core skills / tools',
        weight_pct: 20,
        score: 85,
        note: 'SQL, Looker, Jira, stakeholder rituals',
      },
      {
        dimension: 'Domain / function experience',
        weight_pct: 15,
        score: 70,
        note: 'Fintech ops, thin payments rails',
      },
      {
        dimension: 'Proven outcomes',
        weight_pct: 10,
        score: 82,
        note: 'Quantified cycle-time and error-rate wins',
      },
    ],
  },
  proof_map: {
    strengths: [
      {
        point: 'Quantified ops improvements',
        description: 'Cut reconciliation cycle time 28% with a SQL + Looker workflow.',
      },
      {
        point: 'Cross-functional facilitation',
        description: 'Ran weekly triage with eng, risk, and CX for 18 months.',
      },
      {
        point: 'Requirements discipline',
        description: 'Owned PRDs and acceptance criteria for three platform launches.',
      },
      {
        point: 'Stakeholder communication',
        description: 'Executive-ready status packs used in monthly business reviews.',
      },
    ],
    gaps: [
      {
        gap: 'ACH / payments rails depth',
        description: 'JD emphasizes ACH returns and settlement; resume is adjacent banking ops.',
      },
      {
        gap: 'Vendor / processor management',
        description: 'No named processor or NACHA compliance ownership.',
      },
      {
        gap: 'US regulatory keywords',
        description: 'Screeners may miss Reg E / returns language on a keyword pass.',
      },
    ],
    resume_actions: [
      'Add one ACH/returns bullet if true — even adjacent banking ops counts.',
      'Move the 28% cycle-time win into the top third of page one.',
      'Name tools already used (SQL, Looker) next to payments-adjacent work.',
    ],
    screenability_note: 'Strong ops keywords; payments rails keywords are thin.',
  },
  expected_offer: {
    posted_range: null,
    p25: '$145K',
    p50: '$165K',
    p75: '$190K',
    currency: 'USD',
    region: 'United States · Remote-friendly',
    target_gap: 'JD does not post a range. Market band for Senior BA in fintech ops.',
    evidence_tier: 'C',
    sources: ['Market benchmark for Senior BA / fintech ops (US)'],
    candidate_position_label: 'Likely mid-band with payments domain proof; low-mid without it.',
  },
  apply_decision: {
    label: 'Apply after fixes',
    reason: 'Fit is strong, but ACH/payments evidence should land on page one before a senior screen.',
    next_best_action: 'Spend 15 minutes adding one verified payments-adjacent bullet, then apply.',
  },
  role_read: {
    mission: 'Own requirements and analytics for payments operations improvements.',
    responsibilities: [
      'Translate ops pain into prioritized backlog',
      'Partner with eng on settlement / returns workflows',
      'Publish KPIs for cycle time and error rate',
    ],
    hiring_signals: [
      'Senior ownership expected, not junior ticket triage',
      'Payments domain preferred over generic BA',
      'SQL literacy is a must-have, not a nice-to-have',
    ],
  },
  interview_starters: [
    'Walk me through a time you improved a reconciliation or settlement workflow.',
    'How do you prioritize when eng capacity is scarce?',
    'Tell me about a dashboard stakeholders actually used.',
  ],
  match_score: 78,
};

/** Public demo Strategy Guide — Snapshot + strategy layer. */
const SAMPLE_GUIDE_RAW: Partial<FullReport> = {
  ...SAMPLE_SNAPSHOT_RAW,
  strategy_fit_salary: {
    score_implications:
      'At 78 you should clear most screens if ACH adjacency is framed clearly; expect a domain deep-dive in round 2.',
    offer_implications:
      'Evidence tier C — use discovery before anchoring. Target mid-band once payments ownership is credible.',
    validate_with_recruiter: [
      'Is ACH / returns experience required or preferred?',
      'What level band is approved for this req (Senior BA vs Staff)?',
      'How does total comp split cash vs bonus for this team?',
    ],
  },
  hiring_context: {
    insights: [
      {
        claim: 'Fintech ops teams are hiring analysts who can bridge product and settlement ops.',
        why_it_matters: 'Interviewers will probe cross-functional delivery, not only SQL.',
        source_url: 'https://www.reuters.com',
        date: '2026-06',
      },
      {
        claim: 'Remote-friendly US fintech roles still expect async written clarity.',
        why_it_matters: 'Bring a crisp one-pager of your KPI wins to the interview.',
        source_url: 'https://www.bloomberg.com',
        date: '2026-05',
      },
    ],
    limitations: [
      'No company-specific IR filing was used for this demo sample.',
      'Treat hiring-context claims as public-market context, not insider intel.',
    ],
    validation_questions: [
      'Why is this role open now — backfill or new scope?',
      'What does 90-day success look like for this hire?',
    ],
  },
  concerns_defenses: [
    {
      concern: 'Thin ACH / payments rails proof',
      why: 'JD emphasizes settlement and returns ownership.',
      evidence: 'Banking ops + reconciliation cycle-time win on resume.',
      missing_proof: 'Named ACH returns or processor ownership.',
      answer_guide:
        'Bridge: “In my last role I owned reconciliation SLAs adjacent to payment settlement. Here is how I would ramp ACH returns using the same SQL + stakeholder ritual.”',
      do_not_claim: 'Do not invent NACHA or processor titles you did not hold.',
    },
    {
      concern: 'Senior scope vs IC analyst habits',
      why: 'Title mix on resume may read mid-level.',
      evidence: 'Led cross-functional triage for 18 months; executive packs.',
      missing_proof: 'Headcount or budget ownership.',
      answer_guide:
        'Lead with influence without authority: rituals you ran, decisions you unblocked, metrics you owned.',
      do_not_claim: 'Do not claim people-manager scope if you were an IC.',
    },
    {
      concern: 'Comp expectations vs unverified band',
      why: 'No posted range; candidate may over-anchor.',
      evidence: 'Tier C market band only.',
      missing_proof: 'Approved cash range from recruiter.',
      answer_guide:
        'Ask for the approved band first, then position toward mid-band with your quantified wins.',
      do_not_claim: 'Do not invent a company-specific TC number.',
    },
  ],
  interview_playbook: {
    reported: [],
    predicted: [
      {
        question: 'Walk me through improving a broken ops workflow end to end.',
        predicted: true,
        star_outline: 'S: reconciliation backlog · T: cut cycle time · A: SQL + ritual · R: −28%',
      },
      {
        question: 'How would you ramp on ACH returns in your first 60 days?',
        predicted: true,
        missing_facts: 'Candidate should prepare one learning plan without inventing past ACH titles.',
      },
      {
        question: 'Tell me about a time stakeholders ignored your dashboard.',
        predicted: true,
      },
    ],
    star_templates: [
      {
        title: 'Reconciliation cycle-time win',
        for_question: 'Walk me through improving a broken ops workflow end to end.',
        situation: 'Monthly reconciliation took 9 days and blocked finance close.',
        task: 'Cut cycle time without adding headcount.',
        action: 'Built a SQL exception queue + Looker triage board; ran 2× weekly with eng and CX.',
        result: 'Cycle time down 28% in two quarters; error escapes down 15%.',
        resume_anchor: 'Quantified ops improvements',
      },
      {
        title: 'Stakeholder conflict on priority',
        for_question: 'How do you prioritize when eng capacity is scarce?',
        situation: 'Risk and CX both claimed P0 for the same sprint.',
        task: 'Protect settlement reliability while shipping a CX win.',
        action: 'Scored impact × risk; split a thin MVP for CX and kept settlement hotfix in the same train.',
        result: 'Both teams accepted the tradeoff; no sev-1 in the following quarter.',
        resume_anchor: 'Cross-functional facilitation',
      },
      {
        title: 'Dashboard adoption',
        for_question: 'Tell me about a dashboard stakeholders actually used.',
        situation: 'Prior dashboards were ignored after week two.',
        task: 'Make one KPI pack that executives open weekly.',
        action: 'Cut to 5 metrics, added owners + next actions, attached to MBR agenda.',
        result: 'Pack cited in three consecutive monthly reviews.',
        resume_anchor: 'Stakeholder communication',
      },
    ],
    star_outlines: [],
    reverse_questions: [
      'What problem is this hire meant to solve in the next two quarters?',
      'How will success be measured in the first 90 days?',
      'Which payments workflows are most painful today — returns, settlement, or disputes?',
    ],
    validate_before_join: [
      'Confirm on-call / incident load for the ops analytics partner.',
      'Ask how often product roadmap slips affect settlement SLAs.',
    ],
  },
  offer_strategy: {
    target: 'Mid-band of the approved cash range once confirmed',
    acceptable: 'Low-mid if equity / remote flexibility is strong',
    walk_away: 'Below documented floor after discovery, or scope below Senior BA',
    levers: ['Scope', 'Sign-on', 'Remote flexibility', 'Title leveling'],
    script:
      'Thanks — before I share a number, what is the approved cash band for this level in this location? Based on similar Senior BA fintech ops roles and my cycle-time / KPI ownership, I am targeting the mid-band once we confirm scope.',
    discovery_questions: [
      'What is the approved band for this level in this location?',
      'How does total compensation split between cash, bonus, and equity?',
    ],
  },
  report_version: 'v3-sample',
};

export function getSampleSnapshotReport(): LiteReport {
  return normalizeLiteReport(SAMPLE_SNAPSHOT_RAW);
}

export function getSampleStrategyGuideReport(): FullReport {
  return normalizeFullReport(SAMPLE_GUIDE_RAW);
}
