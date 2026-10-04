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
      {
        requirement: 'Processor / vendor management',
        status: 'Risk',
        evidence: 'No named processor or vendor ownership on resume',
      },
    ],
  },
  fit_score: {
    score: 78,
    band: 'Viable',
    evidence_coverage: 'High',
    sharp_verdict:
      'Core fit: SQL/Looker ownership, a 28% reconciliation cycle-time cut, and cross-functional triage map to the JD’s core scope. Level/tenure: six years of fintech ops against a 5+ year requirement; no evidence of scope above Senior BA. Main gap: ACH returns and settlement ownership is a core JD requirement; the resume shows adjacent banking ops only.',
    sharp_verdict_points: [
      'Core fit: SQL/Looker ownership, a 28% reconciliation cycle-time cut, and cross-functional triage map to the JD’s core scope.',
      'Level/tenure: six years of fintech ops against a 5+ year requirement; no evidence of scope above Senior BA.',
      'Main gap: ACH returns and settlement ownership is a core JD requirement; the resume shows adjacent banking ops only.',
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
      'Six years of fintech ops and quantified reconciliation results clear the Senior BA bar on requirements ownership. The JD treats ACH returns and settlement as core, and the resume shows adjacent banking ops only. The label reflects an unconfirmed core requirement, not a weak profile.',
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
  competency_map: [
    {
      competency: 'SQL and dashboard ownership',
      weight: 'core',
      proficiency: 'demonstrated',
      resume_evidence: 'Cut reconciliation cycle time 28% with a SQL + Looker workflow.',
    },
    {
      competency: 'Requirements and PRD ownership',
      weight: 'core',
      proficiency: 'demonstrated',
      resume_evidence: 'Owned PRDs and acceptance criteria for three platform launches.',
    },
    {
      competency: 'ACH returns and settlement',
      weight: 'core',
      proficiency: 'adjacent',
      resume_evidence: 'Banking-ops reconciliation; no named ACH or returns ownership.',
    },
    {
      competency: 'Cross-functional facilitation',
      weight: 'supporting',
      proficiency: 'demonstrated',
      resume_evidence: 'Weekly eng, risk, and CX triage for 18 months.',
    },
    {
      competency: 'Processor and NACHA compliance',
      weight: 'supporting',
      proficiency: 'absent',
      resume_evidence: null,
    },
  ],
  market_positioning: {
    seniority_alignment: 'at_level',
    rationale:
      'Six years of fintech ops against a 5+ year Senior BA bar: inside the band, with no evidence of Staff-level scope.',
    differentiator:
      'Quantified reconciliation gain (28% faster cycle time) delivered with SQL and Looker rather than added headcount.',
  },
  risk_assessment: [
    {
      category: 'competency',
      severity: 'high',
      statement:
        'The JD treats ACH returns and settlement as core; the resume shows only adjacent banking ops.',
      basis: 'resume',
    },
    {
      category: 'compensation',
      severity: 'medium',
      statement:
        'No posted range, so the offer band rests on a market benchmark (tier C) and the cash floor is unconfirmed.',
      basis: 'inferred',
    },
    {
      category: 'seniority',
      severity: 'low',
      statement: 'No evidence of scope above Senior BA, so Staff-level upside is not supported.',
      basis: 'inferred',
    },
  ],
  match_score: 78,
};

/** Public demo Strategy Guide — Snapshot + strategy layer. */
const SAMPLE_GUIDE_RAW: Partial<FullReport> = {
  ...SAMPLE_SNAPSHOT_RAW,
  leverage_analysis: {
    candidate_leverage: 'moderate',
    factors: [
      {
        factor: 'Quantified ops outcomes',
        direction: 'for_candidate',
        evidence: 'Cycle time down 28% and error escapes down 15% are on the resume.',
        source_url: null,
      },
      {
        factor: 'Payments-rails gap',
        direction: 'for_employer',
        evidence: 'The JD treats ACH returns as core; the resume is adjacent banking ops.',
        source_url: null,
      },
      {
        factor: 'Unposted pay band',
        direction: 'neutral',
        evidence: 'No posted range (tier C), so the employer controls the band until it is confirmed.',
        source_url: null,
      },
      {
        factor: 'Wage filings above benchmark midpoint',
        direction: 'for_candidate',
        evidence: 'Sample: comparable Business Analyst filings sit in the upper half of the benchmark band.',
        source_url: 'https://h1bdata.info',
      },
    ],
    bargaining_posture:
      'Balanced: confirm the approved range first, anchor at mid-band, and trade scope clarity for flexibility on cash.',
  },
  insider_signals: [
    {
      source: 'h1bdata',
      finding:
        'Sample: H-1B wage filings for Business Analyst titles at comparable US payments employers cluster in the upper half of the $145K–$190K benchmark.',
      url: 'https://h1bdata.info',
      date: '2026-05',
      evidence_tier: 1,
    },
    {
      source: 'sec_filing',
      finding:
        'Sample: public payments peers cite ops-automation spend and headcount discipline in recent 10-K risk factors.',
      url: 'https://www.sec.gov',
      date: '2026-03',
      evidence_tier: 1,
    },
    {
      source: 'blind',
      finding:
        'Sample: forum posts describe a heavy written status-pack expectation for remote ops-analytics roles.',
      url: 'https://www.teamblind.com',
      date: '2026-04',
      evidence_tier: 3,
    },
  ],
  strategy_fit_salary: {
    score_implications:
      'At 78 the profile clears most screens. Expect a domain deep-dive on ACH returns in round 2, because that core requirement is adjacent on the resume, not evidenced.',
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
    company_current_pain_point:
      'This seat is posted to own ACH returns and settlement exceptions the ops team is still handling ad hoc. The posting asks for someone who can turn that queue into a weekly ritual with engineering and risk.',
    strategic_alignment_pitch:
      'I cut reconciliation cycle time 28% with SQL and Looker, and I ran a weekly eng, risk, and CX triage for 18 months. I would start by mapping your returns queue the same way: owners, the SLA, and the five metrics executives already open.',
    macro_risk_warnings:
      'This demo does not cite a layoff or a negative filing. Ask what changed in the last two quarters before you treat the seat as stable.',
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
        dos_donts:
          'Do not frame eng as the villain; stay on risk and customer impact. Anchor on your 18-month eng/risk/CX triage — do not invent ACH processor titles.',
        resume_anchor: 'Cross-functional facilitation',
      },
    ],
    predicted: [
      {
        question: 'Walk me through improving a broken ops workflow end to end.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Tests end-to-end ownership and quantified impact.',
        resume_anchor: 'Quantified ops improvements',
        star_blueprint:
          'S: On your fintech ops resume, monthly reconciliation took ~9 days and blocked close · T: cut cycle without headcount · A: SQL exception queue + Looker triage board; 2× weekly with eng/CX · R: cycle −28%, error escapes −15% (your listed win)',
        dos_donts:
          'Lead with the −28% metric on your resume; do not invent ACH processor console titles you do not have.',
      },
      {
        question: 'Tell me about a time stakeholders ignored your dashboard.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Tests influence without authority.',
        resume_anchor: 'Executive-ready communication',
        star_blueprint:
          'S: Prior packs were ignored after week two (your stakeholder story) · T: get execs to open a weekly KPI pack · A: cut to 5 metrics + owners + next actions; attach to MBR · R: cited three consecutive monthly reviews (resume)',
        dos_donts: 'Do not claim people-manager scope; stay on IC influence via MBR rituals on your resume.',
      },
      {
        question: 'Describe a conflict between risk and CX priorities you facilitated.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Cross-functional tradeoff judgment.',
        resume_anchor: 'Cross-functional facilitation',
        star_blueprint:
          'S: Dual P0 from risk + CX in the same sprint (matches your 18-month weekly triage) · T: protect settlement reliability and still ship a CX win · A: impact×risk scoring; thin CX MVP + settlement hotfix same train · R: both sides accepted; no sev-1 next quarter',
        dos_donts: 'Do not badmouth either stakeholder group; name the facilitation ritual you actually ran.',
      },
      {
        question: 'Tell me about a time you had to say no to a stakeholder request.',
        predicted: true,
        category: 'behavioral',
        interviewer_intent: 'Boundary-setting without burning trust.',
        resume_anchor: 'Requirements discipline',
        star_blueprint:
          'S: CX asked for a vanity metric outside your PRD/acceptance bar · T: keep the pack decision-useful · A: offered alternate KPI + owner using your requirements discipline · R: request deferred; MBR stayed crisp',
        dos_donts: 'Do not sound dismissive; show the tradeoff and cite a PRD/AC example from your resume.',
      },
      {
        question: 'How would you ramp on ACH returns in your first 60 days?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Learning plan without inventing past ACH ownership.',
        resume_anchor: 'Quantified ops improvements',
        star_blueprint:
          'S: Resume is banking-ops adjacent, not named ACH owner · T: ramp without fake titles · A: W1–2 shadow returns triage using your SQL/Looker muscle; W3–4 map exception queues like your −28% cycle win; W5–8 own one returns KPI · R: honest 60-day plan tied to proven ops tooling',
        dos_donts: 'Do not claim NACHA/ACH processor titles you did not hold; bridge from SQL + Looker wins.',
        missing_facts: 'No named ACH ownership on resume — use adjacent ops proof + learning plan.',
      },
      {
        question: 'How do you design a KPI pack for settlement cycle time?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Metric design and stakeholder usability.',
        resume_anchor: 'Executive-ready communication',
        star_blueprint:
          'S: Your resume already shows executive packs used in MBRs · T: design settlement cycle-time pack · A: define numerator/denominator + owners + weekly ritual (same pattern as your 5-KPI packs) · R: pack that leadership will open, not vanity charts',
        dos_donts: 'Avoid vanity metrics with no action owner; reuse your MBR pack pattern, do not invent settlement SLAs you never owned.',
      },
      {
        question: 'Walk through how you would triage a spike in return exceptions.',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Ops incident structure under ambiguity.',
        resume_anchor: 'Cross-functional facilitation',
        star_blueprint:
          'S: Spike in return exceptions (JD risk) · T: stabilize without inventing processor console past · A: reuse your weekly eng/risk/CX triage — stabilize, segment root causes, temp control, permanent fix via SQL queues · R: clear owners + cycle recovery narrative',
        dos_donts: 'Do not invent processor console experience; lean on your 18-month triage facilitation.',
      },
      {
        question: 'How would you validate NACHA-related controls without owning compliance yourself?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Partnering with risk/compliance while staying in BA scope.',
        resume_anchor: 'Cross-functional facilitation',
        star_blueprint:
          'S: JD probes NACHA; resume lacks compliance ownership · T: validate controls as BA partner · A: map control owners with risk (like your eng/risk/CX rituals); evidence checklist; weekly exception review · R: gaps escalated without claiming you were NACHA officer',
        dos_donts: 'Do not claim you were the NACHA officer; stay in BA facilitation scope on your resume.',
      },
      {
        question: 'How do you size and prioritize an eng ask when settlement SLAs are at risk?',
        predicted: true,
        category: 'technical',
        interviewer_intent: 'Product/ops prioritization under SLA pressure.',
        resume_anchor: 'Requirements discipline',
        star_blueprint:
          'S: Settlement SLA burn (JD) · T: prioritize eng ask · A: quantify impact like your cycle-time wins; estimate eng cost; MVP vs full fix; socialize with risk+eng using your PRD/AC discipline · R: shared tradeoff, no invented capacity numbers',
        dos_donts: 'Do not invent capacity numbers you cannot defend; cite your requirements/acceptance-criteria ownership.',
      },
    ],
    interviewer_profiling: {
      communication_style:
        'Written here as direct and metric-first: they will ask for the number before the story.',
      icebreaker_hooks: [
        'Which queue hurts more this quarter: returns, settlement breaks, or dispute aging?',
        'What does a good first 30 days look like for the person who owns that queue?',
      ],
    },
    assignment_blueprint: {
      likely_format:
        'A live walkthrough of a returns queue: prioritize it, name the KPI, and say what you would not automate yet.',
      hidden_grading_rubric: [
        'Names a resume fact (the 28% cycle-time cut or the weekly triage) before proposing a fix.',
        'Separates what the posting states from what still has to be confirmed with the recruiter.',
        'Gives a next step an engineer could start this week.',
      ],
    },
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
    negotiation_script: {
      prepare:
        'Before the call, write the approved-band question and your walk-away: below the documented floor, or scope below Senior BA.',
      pitch:
        'Thanks — before I share a number, what is the approved cash band for this level in this location? Based on similar Senior BA fintech ops roles and my cycle-time ownership, I am targeting the mid-band once we confirm scope.',
      counter:
        'If cash lands low-mid, I would look at sign-on or remote flexibility before moving the base. I will not anchor a company total that was not in the posting.',
    },
    timeline_leverage_templates: {
      stalling_for_time_email:
        'Subject: Timing on the Senior BA conversation\n\nHi [Name],\n\nThank you for the update. I am wrapping one other conversation this week and want to give you a clear answer. Could I come back by [day]? I remain interested in the settlement scope we discussed.\n\nBest,\n[Your name]',
      competing_offer_leverage_email:
        'Subject: Update before I decide\n\nHi [Name],\n\nAnother process is moving to a decision this week. I am not asking you to match a number I have not seen in writing. If you can confirm the approved cash band and whether sign-on is available, I can decide by [day].\n\nBest,\n[Your name]',
    },
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
    ats_critical_gaps: {
      detected_count: 2,
      gaps: [
        {
          gap_type: 'keyword_missing',
          jd_requirement: 'Experience with ACH payment reconciliation and settlement workflows',
          resume_weakness: 'Resume mentions "banking operations" but never uses the specific keyword "ACH" or "settlement"',
          fix_strategy: 'In interview: "While my resume describes banking operations, I specifically managed ACH settlement flows worth $45M monthly. Let me walk you through how I\'d apply that experience to your returns and reconciliation needs."',
          severity: 'critical',
        },
        {
          gap_type: 'quantification_weak',
          jd_requirement: '5+ years of business analysis experience in payments or fintech',
          resume_weakness: 'Resume says "extensive fintech experience" but doesn\'t state exact year count',
          fix_strategy: 'In interview: "I have 6 years of fintech operations experience across 2 companies, most recently optimizing payment reconciliation cycles that reduced errors by 28%."',
          severity: 'major',
        },
      ],
    },
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
