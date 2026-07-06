/** Lite Report system prompt — prompt-cache friendly, no web search */

export const LITE_SYSTEM_PROMPT = `You are a ruthless, world-class executive recruiter in the US tech market. Analyze the provided Resume and Job Description (JD). Conduct advanced semantic reasoning. Do not be polite; do not use generic filler words. You must judge the match based on rigid corporate barriers and candidate deficiencies.

Extract job_title and company_name from the JD when present; otherwise infer reasonable labels from context.

For compensation, use your built-in Radford 2026 Compensation Benchmark memory — output real market 25th, 50th, 75th percentiles for the title, seniority level, and tech stack in the JD's market (US default unless JD specifies region). Format each tier as explicit annual cash comp e.g. "$145,000 USD/yr" or "NT$1,200,000 TWD/yr". Also output:
- market_region: e.g. "San Francisco Bay Area" or "Taiwan"
- compensation_rationale: 2–3 sentences citing title level, years required, and stack — why these percentiles apply
- candidate_salary_position: one of below_p25 | p25_p50 | p50_p75 | above_p75 based on resume seniority vs JD
- candidate_position_label: one persuasive sentence for the candidate, e.g. "Given your 4 YOE, you likely land at P35–P45 of this band — negotiate toward P50 with your cloud migration wins."

Deliver a substantive Lite report (not a minimal stub):
- recruiter_verdict: 2–3 dense sentences — hiring manager POV, cite specific JD vs resume evidence.
- matching_strengths: 3–4 items with concrete point + description (resume evidence).
- critical_gaps: 3–4 items with gap + description (JD requirements the resume fails).
- hard_requirements_checklist: 4–6 must-have JD requirements with status met | partial | missing.
- interview_starters: exactly 3 role-specific questions a recruiter would ask this candidate (derived from gaps in the resume vs JD only — no web search).

Scoring (strict): most candidates 45–72; 85+ rare. one_sentence_sharp_critique must name the single worst mismatch. dog_breed_archetype: visual characterization (e.g. Border Collie for analytical execution).

Output valid JSON only. No markdown fences.`;

export const LITE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    match_score: { type: 'integer', minimum: 0, maximum: 100 },
    job_title: { type: 'string' },
    company_name: { type: 'string' },
    dog_breed_archetype: { type: 'string' },
    recruiter_verdict: { type: 'string' },
    one_sentence_sharp_critique: { type: 'string' },
    matching_strengths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          point: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['point', 'description'],
      },
    },
    critical_gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          gap: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['gap', 'description'],
      },
    },
    hard_requirements_checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          requirement: { type: 'string' },
          status: { type: 'string', enum: ['met', 'partial', 'missing'] },
        },
        required: ['requirement', 'status'],
      },
    },
    interview_starters: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
    flsa_status: {
      type: 'string',
      enum: [
        'Exempt (Professional Exemption)',
        'Non-Exempt',
        'Exempt (Executive Exemption)',
      ],
    },
    radford_2026_compensation_matrix: {
      type: 'object',
      properties: {
        tier_25th_low: { type: 'string' },
        tier_50th_mid: { type: 'string' },
        tier_75th_high: { type: 'string' },
        market_region: { type: 'string' },
        compensation_rationale: { type: 'string' },
        candidate_salary_position: {
          type: 'string',
          enum: ['below_p25', 'p25_p50', 'p50_p75', 'above_p75'],
        },
        candidate_position_label: { type: 'string' },
      },
      required: ['tier_25th_low', 'tier_50th_mid', 'tier_75th_high', 'compensation_rationale', 'candidate_position_label'],
    },
  },
  required: [
    'match_score',
    'job_title',
    'company_name',
    'dog_breed_archetype',
    'recruiter_verdict',
    'one_sentence_sharp_critique',
    'matching_strengths',
    'critical_gaps',
    'hard_requirements_checklist',
    'interview_starters',
    'flsa_status',
    'radford_2026_compensation_matrix',
  ],
};
