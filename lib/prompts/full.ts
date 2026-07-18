/** Interview Strategy Guide — Spec v3 (Pro + optional Search grounding) */

export const FULL_SYSTEM_PROMPT = `You are a CHRO-level interview strategist producing an Interview Strategy Guide.
You receive a locked Job Fit Snapshot (fit score + expected offer already computed). Do NOT change numeric scores or compensation percentiles.

Produce strategy that turns the two hero numbers into actionable interview/offer outcomes:

1) strategy_fit_salary — what the locked fit score and expected offer imply for interview odds and negotiation posture. If evidence is weak, give recruiter validation questions instead of false precision.

2) hiring_context — 3–5 dated tactical insights from PUBLIC web sources only (IR, trusted news, company blogs). Attach source_url + date. If insufficient public data, return limitations + validation_questions (this is NOT a failure). Never claim paywalled or login-walled content.

3) concerns_defenses — EXACTLY 3 recruiter concerns for THIS candidate vs THIS JD. Each: concern, why, resume evidence, missing_proof, answer_guide, do_not_claim. Direct and respectful — no humiliation; never invent experience.

4) interview_playbook — SEPARATE reported questions (citation required: source_url, source_date) from predicted questions (predicted=true). Include EXACTLY 3–4 star_templates: each is a copy-ready practice template with title, for_question, situation, task, action, result, and resume_anchor. STAR content ONLY from supplied resume facts — never invent projects, metrics, or titles. Also put a one-line star_outline on each predicted/reported question. Include reverse_questions and validate_before_join hypotheses (not culture "truth scores"). If no citable reported questions, reported=[].

5) offer_strategy — target / acceptable / walk_away aligned to any career context provided; levers; a reusable negotiation script template the candidate can copy. If expected_offer.evidence_tier is D or weak, prioritize discovery_questions over aggressive anchoring. Never invent compensation numbers.

Output valid JSON only. No markdown fences.`;

export const FULL_INTEL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    strategy_fit_salary: {
      type: 'object',
      properties: {
        score_implications: { type: 'string' },
        offer_implications: { type: 'string' },
        validate_with_recruiter: { type: 'array', items: { type: 'string' } },
      },
      required: ['score_implications', 'offer_implications', 'validate_with_recruiter'],
    },
    hiring_context: {
      type: 'object',
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string' },
              why_it_matters: { type: 'string' },
              source_url: { type: 'string' },
              date: { type: 'string' },
            },
            required: ['claim', 'why_it_matters', 'source_url', 'date'],
          },
        },
        limitations: { type: 'array', items: { type: 'string' } },
        validation_questions: { type: 'array', items: { type: 'string' } },
      },
      required: ['insights', 'limitations', 'validation_questions'],
    },
    concerns_defenses: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          concern: { type: 'string' },
          why: { type: 'string' },
          evidence: { type: 'string' },
          missing_proof: { type: 'string' },
          answer_guide: { type: 'string' },
          do_not_claim: { type: 'string' },
        },
        required: [
          'concern',
          'why',
          'evidence',
          'missing_proof',
          'answer_guide',
          'do_not_claim',
        ],
      },
    },
    interview_playbook: {
      type: 'object',
      properties: {
        reported: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              source_url: { type: 'string' },
              source_date: { type: 'string' },
              evidence: { type: 'string' },
              star_outline: { type: 'string' },
            },
            required: ['question'],
          },
        },
        predicted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              predicted: { type: 'boolean' },
              evidence: { type: 'string' },
              star_outline: { type: 'string' },
              missing_facts: { type: 'string' },
            },
            required: ['question'],
          },
        },
        star_templates: {
          type: 'array',
          minItems: 3,
          maxItems: 4,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              for_question: { type: 'string' },
              situation: { type: 'string' },
              task: { type: 'string' },
              action: { type: 'string' },
              result: { type: 'string' },
              resume_anchor: { type: 'string' },
            },
            required: [
              'title',
              'situation',
              'task',
              'action',
              'result',
              'resume_anchor',
            ],
          },
        },
        star_outlines: { type: 'array', items: { type: 'string' } },
        reverse_questions: { type: 'array', items: { type: 'string' } },
        validate_before_join: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'reported',
        'predicted',
        'star_templates',
        'reverse_questions',
        'validate_before_join',
      ],
    },
    offer_strategy: {
      type: 'object',
      properties: {
        target: { type: 'string' },
        acceptable: { type: 'string' },
        walk_away: { type: 'string' },
        levers: { type: 'array', items: { type: 'string' } },
        script: { type: 'string' },
        discovery_questions: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'target',
        'acceptable',
        'walk_away',
        'levers',
        'script',
        'discovery_questions',
      ],
    },
  },
  required: [
    'strategy_fit_salary',
    'hiring_context',
    'concerns_defenses',
    'interview_playbook',
    'offer_strategy',
  ],
};

/** @deprecated alias */
export const FULL_JSON_SCHEMA = FULL_INTEL_JSON_SCHEMA;

/** Preferred public domains for grounding (not exclusive) */
export const GROUNDING_SEARCH_DOMAINS = [
  'sec.gov',
  'reuters.com',
  'bloomberg.com',
  'techcrunch.com',
  'glassdoor.com',
  'teamblind.com',
  'reddit.com',
];
