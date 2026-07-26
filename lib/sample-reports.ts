import type { FullReport, LiteReport } from '@/types';
import { normalizeFullReport, normalizeLiteReport } from '@/lib/normalize-lite-report';
import {
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';
import { deepMerge } from '@/lib/deep-merge';
import { SAMPLE_REPORT_LOCALES } from '@/lib/sample-report-locales';

/** Public demo Snapshot — fictional candidate vs fictional US role. */
const SAMPLE_SNAPSHOT_RAW: Partial<LiteReport> = {
  job_title: 'Senior Business Analyst',
  company_name: 'Northstar Payments',
  job_posted_date: '2026-06-18',
  job_source: 'LinkedIn',
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
      'Strong analytical and stakeholder story for this Senior BA seat. Level and tenure line up for senior ownership. Main gap is ACH/settlement depth versus adjacent banking ops.',
    sharp_verdict_points: [
      'Strong BA fit: SQL/Looker ownership, quantified ops wins, and cross-functional facilitation map to this JD’s core scope.',
      'Level/tenure align: six years of fintech ops is a natural step into senior ownership, not a stretch title.',
      'Main gap: payments ACH/settlement depth; resume is adjacent banking ops, so screeners may probe returns and rails fluency.',
    ],
    breakdown: [
      {
        dimension: 'Hard requirements / feasibility',
        weight_pct: 30,
        score: 72,
        note: '72 because YOE and SQL must-haves are met, but ACH/settlement ownership is only adjacent banking ops, so hard-feasibility stays mid-70s.',
      },
      {
        dimension: 'Level / scope / tenure',
        weight_pct: 25,
        score: 80,
        note: '80 because six years of fintech ops maps cleanly to Senior BA scope — a natural step up, not a stretch title.',
      },
      {
        dimension: 'Core skills / tools',
        weight_pct: 20,
        score: 85,
        note: '85 because SQL, Looker, Jira, and stakeholder rituals are evidenced and match this JD’s day-to-day toolkit.',
      },
      {
        dimension: 'Domain / function experience',
        weight_pct: 15,
        score: 70,
        note: '70 because fintech ops experience is solid, but payments rails / ACH depth is thin versus this JD’s settlement focus.',
      },
      {
        dimension: 'Proven outcomes',
        weight_pct: 10,
        score: 82,
        note: '82 because quantified cycle-time and error-rate wins are on the resume and transfer to this ops-analytics seat.',
      },
    ],
  },
  proof_map: {
    strengths: [
      {
        point: 'Quantified ops improvements',
        description: 'Cut reconciliation cycle time 28% with a SQL + Looker workflow.',
        skill_kind: 'hard',
      },
      {
        point: 'Cross-functional facilitation',
        description: 'Ran weekly triage with eng, risk, and CX for 18 months.',
        skill_kind: 'soft',
      },
      {
        point: 'Requirements discipline',
        description: 'Owned PRDs and acceptance criteria for three platform launches.',
        skill_kind: 'hard',
      },
      {
        point: 'Stakeholder communication',
        description: 'Executive-ready status packs used in monthly business reviews.',
        skill_kind: 'soft',
      },
    ],
    gaps: [
      {
        gap: 'ACH / payments rails depth',
        description: 'JD emphasizes ACH returns and settlement; resume is adjacent banking ops.',
        skill_kind: 'hard',
      },
      {
        gap: 'Vendor / processor management',
        description: 'No named processor or NACHA compliance ownership.',
        skill_kind: 'hard',
      },
      {
        gap: 'US regulatory keywords',
        description: 'Screeners may miss Reg E / returns language on a keyword pass.',
        skill_kind: 'hard',
      },
    ],
    resume_actions: [
      'ACH / returns ownership not evidenced on the supplied resume.',
      'Named payments-processor experience not evidenced.',
    ],
    screenability_note: 'Strong ops keywords; payments rails keywords are thin.',
  },
  ats_warning: {
    pass_rate_pct: 42,
    missing_keyword_count: 4,
    summary:
      'Resume is light on ACH / returns / settlement / NACHA keywords that this JD treats as core.',
    missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
  },
  expected_offer: {
    posted_range: null,
    p25: '$145K',
    p50: '$165K',
    p75: '$190K',
    currency: 'USD',
    region: 'United States · Remote-friendly',
    target_gap:
      'For Senior BA fintech-ops seats in the US remote market, comparable cash typically lands in this band; confirm the employer’s approved range before negotiating.',
    evidence_tier: 'C',
    sources: ['Market benchmark for Senior BA / fintech ops (US)'],
    candidate_predicted_offer: '$155K',
    candidate_position_label:
      'Lower mid-band: core BA proof is solid, but thin ACH/payments ownership likely caps cash below the seat midpoint.',
    tc_breakdown: {
      base: '$150K',
      bonus: '$15K',
      equity: '$20K / yr est.',
      sign_on: '$10K–$20K market norm',
      total: '~$185K TC',
    },
  },
  apply_decision: {
    label: 'Apply after fixes',
    reason:
      'You clear the senior BA bar on requirements ownership, quantified ops impact, and stakeholder facilitation, so this seat is worth pursuing. The main competitiveness risk is thin ACH/payments-rails proof versus a JD that treats payment operations depth as core. Apply after you confirm how hard that domain requirement is — otherwise screeners may park you below stronger payments-native peers.',
    next_best_action:
      'Clarify with the recruiter whether ACH/returns ownership is required or preferred before investing a full application cycle.',
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
    reported: [
      {
        question: 'Describe a time you disagreed with engineering on a settlement priority.',
        predicted: false,
        source_url: 'https://www.glassdoor.com/Interview/index.htm',
        source_date: '2026-05',
        source_name: 'Glassdoor',
        category: 'behavioral',
        interviewer_intent: 'Conflict resolution under settlement risk.',
        star_blueprint:
          'S: eng wanted to slip a settlement hotfix · T: protect close date · A: impact×risk scoring + thin MVP · R: hotfix shipped, no sev-1',
        dos_donts: 'Do not frame eng as the villain; stay on risk and customer impact.',
      },
    ],
    predicted: [
      {
        question: 'Walk me through improving a broken ops workflow end to end.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Tests end-to-end ownership and quantified impact.',
        star_blueprint: 'S: reconciliation backlog · T: cut cycle time · A: SQL + ritual · R: −28%',
        dos_donts: 'Do lead with metrics; do not invent ACH processor titles.',
      },
      {
        question: 'Tell me about a time stakeholders ignored your dashboard.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Tests influence without authority.',
        star_blueprint: 'S: ignored packs · T: executive adoption · A: 5 KPIs + MBR · R: cited 3 months',
        dos_donts: 'Do not claim people-manager scope.',
      },
      {
        question: 'Describe a conflict between risk and CX priorities you facilitated.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Cross-functional tradeoff judgment.',
        star_blueprint: 'S: dual P0 · T: protect settlement · A: impact×risk split · R: no sev-1',
        dos_donts: 'Do not badmouth either stakeholder group.',
      },
      {
        question: 'Tell me about a time you had to say no to a stakeholder request.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Boundary-setting without burning trust.',
        star_blueprint:
          'S: CX asked for a vanity metric · T: keep pack decision-useful · A: offered alternate KPI + owner · R: request deferred, MBR stayed crisp',
        dos_donts: 'Do not sound dismissive; show the tradeoff you protected.',
      },
      {
        question: 'How would you ramp on ACH returns in your first 60 days?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Learning plan without inventing past ACH ownership.',
        star_blueprint: 'Week 1–2 shadow · Week 3–4 SQL map · Week 5–8 own one KPI',
        dos_donts: 'Do not claim NACHA titles you did not hold.',
        missing_facts: 'Prepare a learning plan without inventing past ACH titles.',
      },
      {
        question: 'How do you design a KPI pack for settlement cycle time?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Metric design and stakeholder usability.',
        star_blueprint: 'Define numerator/denominator · owners · weekly review ritual',
        dos_donts: 'Avoid vanity metrics with no action owner.',
      },
      {
        question: 'Walk through how you would triage a spike in return exceptions.',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Ops incident structure under ambiguity.',
        star_blueprint: 'Stabilize · segment root causes · temporary control · permanent fix',
        dos_donts: 'Do not invent processor console experience.',
      },
      {
        question: 'How would you validate NACHA-related controls without owning compliance yourself?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Partnering with risk/compliance while staying in BA scope.',
        star_blueprint:
          'Map control owners · define evidence checklist · weekly exception review · escalate gaps',
        dos_donts: 'Do not claim you were the NACHA officer.',
      },
      {
        question: 'How do you size and prioritize an eng ask when settlement SLAs are at risk?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Product/ops prioritization under SLA pressure.',
        star_blueprint:
          'Quantify SLA burn · estimate eng cost · propose MVP vs full fix · socialize with risk+eng',
        dos_donts: 'Do not invent capacity numbers you cannot defend.',
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
  candidate_case: {
    hire_thesis:
      'Hire for ops analytics ownership that already ships: SQL/Looker rituals, quantified cycle-time wins, and executive-ready facilitation — then close the ACH gap with a structured 60-day ramp.',
    top_facts: [
      'Cut reconciliation cycle time 28% with SQL + Looker',
      'Ran weekly eng/risk/CX triage for 18 months',
      'Executive status packs used in monthly business reviews',
    ],
  },
  offer_strategy: {
    target: 'Mid-band of the approved cash range once confirmed',
    acceptable: 'Low-mid if equity / remote flexibility is strong',
    walk_away: 'Below documented floor after discovery, or scope below Senior BA',
    levers: ['Scope', 'Sign-on', 'Remote flexibility', 'Title leveling'],
    structured_levers: [
      { name: 'Scope', note: 'Confirm Senior BA ownership vs ticket triage' },
      { name: 'Sign-on', note: 'Bridge if cash lands low-mid while equity ramps' },
      { name: 'Remote flexibility', note: 'Trade vs onsite if location is flexible' },
      { name: 'Title leveling', note: 'Lock level before anchoring TC' },
    ],
    tc_breakdown: {
      base: '$150K',
      bonus: '$15K',
      equity: '$20K / yr est.',
      sign_on: '$10K–$20K market norm',
      total: '~$185K TC',
    },
    script:
      'Thanks — before I share a number, what is the approved cash band for this level in this location? Based on similar Senior BA fintech ops roles and my cycle-time / KPI ownership, I am targeting the mid-band once we confirm scope.',
    discovery_questions: [
      'What is the approved band for this level in this location?',
      'How does total compensation split between cash, bonus, and equity?',
    ],
  },
  report_version: 'v3-sample',
  role_team_insights: {
    role_content_refined: [
      'Own requirements for payments-ops improvements end to end',
      'Translate ops pain into a prioritized eng backlog',
      'Publish KPI packs for cycle time and error rate',
    ],
    requirements_refined: [
      'SQL literacy is a must-have',
      'Senior ownership — not junior ticket triage',
      'Payments domain preferred over generic BA',
    ],
    rto_official: 'Hybrid — 3 days onsite (per JD)',
    rto_employee_reality:
      'Forum notes cite frequent cross-functional rituals; overtime spikes near close / incident weeks.',
    next_title_1_3yr: 'Lead BA / Payments Ops Product Owner',
    career_path_basis:
      'Company ladder not public — inferred from Levels.fyi / LinkedIn Senior BA→Lead BA paths and US fintech-ops employment ladders (no $ on this page).',
    promotion_skill_gaps: [
      'Named ACH / returns ownership',
      'Processor / vendor management proof',
      'Org-level conflict navigation',
    ],
    team_sample_insufficient: false,
  },
  company_truth: {
    company_overview:
      'Northstar Payments is a US fintech focused on merchant settlement, ACH returns, and ops analytics for mid-market and growth merchants. Public positioning sits between developer-first rails (Stripe-class) and heavier enterprise acquiring — hiring Senior BAs into reliability and exception ownership, not a consumer-neobank story. Operating climate emphasizes written status packs, cross-functional triage, and measurable cycle-time KPIs.',
    recent_developments: [
      {
        headline: 'Ops leadership expands settlement reliability program',
        summary:
          'Signals that Senior BA seats will be measured on exception cycle-time and close quality, not ticket volume alone.',
        date: '2026-04',
        category: 'leadership',
        source_name: 'Company blog',
        source_url: 'https://www.reuters.com',
      },
      {
        headline: 'AI-assisted returns triage rolled into ops workflow',
        summary:
          'Product bet candidates should expect interview probes on human-in-the-loop exception design and KPI ownership.',
        date: '2026-03',
        category: 'product',
        source_name: 'Tech press',
        source_url: 'https://www.bloomberg.com',
      },
      {
        headline: 'Industry recognition for payments reliability tooling',
        summary:
          'Award narrative reinforces brand push on settlement quality — useful talking point in “why this company” answers.',
        date: '2026-02',
        category: 'award',
        source_name: 'Trade press',
        source_url: 'https://www.reuters.com',
      },
      {
        headline: 'Mid-market ACH coverage expansion announced',
        summary:
          'Growth in ACH scope often means more returns/settlement edge cases for analytics hires in the first year.',
        date: '2026-01',
        category: 'product',
        source_name: 'Company careers / newsroom',
        source_url: 'https://www.bloomberg.com',
      },
      {
        headline: 'Public fintech peers raise bar on ops automation spend',
        summary:
          'Competitive pressure context for why Northstar is hiring into automation and reliability analytics now.',
        date: '2025-11',
        category: 'other',
        source_name: 'Market news',
        source_url: 'https://www.reuters.com',
      },
    ],
    current_strategy:
      'Near-term push is settlement reliability and exception automation: fewer failed ACH returns, faster close, and AI-assisted triage so ops analysts own cycle-time KPIs instead of ticket firefighting.',
    competitors: [
      {
        name: 'Stripe',
        strengths:
          'Developer-first rails, broad US ACH/card coverage, and strong brand for product teams that want self-serve payments.',
        weaknesses:
          'Enterprise settlement / returns ownership can feel less “ops-analyst native”; complex B2B reconciliation often still needs heavy custom tooling.',
      },
      {
        name: 'Adyen',
        strengths:
          'Unified commerce stack and strong global acquiring — attractive when Northstar customers expand cross-border.',
        weaknesses:
          'Heavier enterprise sales cycle; mid-market US ACH ops teams sometimes prefer lighter US-centric processors.',
      },
      {
        name: 'Block (Square)',
        strengths:
          'SMB density and cash-flow products that compete for smaller merchant volumes Northstar also courts.',
        weaknesses:
          'Less focused on large-scale returns/settlement analytics seats; thinner enterprise BA/ops tooling narrative.',
      },
    ],
    insider_voice: [
      'Remote-friendly roles still expect crisp written status packs',
      'Interviewers probe cross-functional delivery, not only SQL puzzles',
    ],
    forum_sample_thin: false,
    layoff_legal_flags: [],
    interviewer_strategy_questions: [
      'Why is this role open now — backfill or new scope?',
      'What is the 12-month operating priority for this team?',
      'How has ops headcount changed in the last year?',
    ],
  },
};

export function getSampleSnapshotReport(
  language: AppLanguage | string = 'en',
): LiteReport {
  const lang = normalizeReportLanguage(language);
  const pack = SAMPLE_REPORT_LOCALES[lang];
  const raw = pack?.snapshot
    ? deepMerge(SAMPLE_SNAPSHOT_RAW, pack.snapshot)
    : SAMPLE_SNAPSHOT_RAW;
  return normalizeLiteReport(raw);
}

export function getSampleStrategyGuideReport(
  language: AppLanguage | string = 'en',
): FullReport {
  const lang = normalizeReportLanguage(language);
  const pack = SAMPLE_REPORT_LOCALES[lang];
  let raw: Partial<FullReport> = SAMPLE_GUIDE_RAW;
  if (pack) {
    raw = deepMerge(
      SAMPLE_GUIDE_RAW,
      deepMerge(pack.snapshot ?? {}, pack.guide ?? {}),
    );
  }
  return normalizeFullReport(raw);
}
