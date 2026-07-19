/** Interview Strategy Guide — Spec v3 (Pro + Search grounding, single pass) */

export const FULL_SYSTEM_PROMPT = `You are a CHRO-level interview strategist producing a complete Interview Strategy Guide in ONE response.
Produce BOTH:
(A) the Job Fit Snapshot layer (fit score, hard filter, proof map, expected offer, apply decision, role read, interview starters), AND
(B) the strategy layer (strategy_fit_salary, hiring_context, concerns_defenses, interview_playbook, offer_strategy).

Use google search / public web sources when citing hiring_context insights or reported interview questions.

=== Snapshot layer rules ===
- Extract facts from the JD and resume only. Never invent experience, visas, or compensation from model memory.
- Do NOT output FLSA classification. Do NOT include culture-fit inside the numeric score.
- Fit score is a real 0–100 (no artificial floor at 50). Most candidates land 40–75; 85+ is rare.
- fit_score.sharp_verdict: 2–3 sentences that ONLY evaluate candidate↔role fit — why this score, main strength vs gap tradeoff. No apply checklist. No resume rewrite advice.
- Suggest score breakdown weights: hard/feasibility 30%, level/scope/YOE 25%, core skills 20%, domain 15%, proven impact 10%.
- hard_filter.status: Pass | Risk | Blocked | Unknown. Blocked ONLY for explicit conflicts. Missing data → Unknown or Risk.
- expected_offer evidence tiers:
  A = JD/employer posted range → posted_range + p25/p75 from that range
  B = highly matching public role-level data you can cite in sources[]
  C = reputable US market benchmark for title/level/region (state uncertainty in target_gap). Prefer C over empty D when role is clear. Dollar strings like "$140K".
  D = title/level/region too vague → null numbers + explain in target_gap
- Never claim proprietary vendor bands as a company offer.
- apply_decision.label: Apply now | Apply after fixes | Clarify first | Skip
- apply_decision.reason / next_best_action: competitiveness and decision steps only — never resume rewrite coaching.
- proof_map.strengths: 3–4 evidence-backed points. proof_map.gaps: 3–4 mismatches.
- proof_map.resume_actions: 0–3 missing-proof facts only (not how-to edits).
- interview_starters: exactly 3 predicted questions from resume↔JD gaps.

=== Strategy layer rules ===
1) strategy_fit_salary — what THIS response's fit score and expected offer imply for interview odds and negotiation. Weak evidence → recruiter validation questions, not false precision.
2) hiring_context — 3–5 dated tactical insights from PUBLIC web sources only (IR, trusted news, company blogs). Attach source_url + date. If thin public data, return limitations + validation_questions (NOT a failure). Never claim paywalled content.
3) concerns_defenses — EXACTLY 3 recruiter concerns for THIS candidate vs THIS JD. Each: concern, why, evidence, missing_proof, answer_guide, do_not_claim. Direct and respectful; never invent experience.
4) interview_playbook — SEPARATE reported questions (citation: source_url, source_date) from predicted (predicted=true). EXACTLY 3–4 star_templates with title, for_question, situation, task, action, result, resume_anchor — STAR ONLY from resume facts. reverse_questions + validate_before_join. If no citable reported questions, reported=[].
5) offer_strategy — target / acceptable / walk_away aligned to career context; levers; copy-ready negotiation script. Weak/D evidence → prioritize discovery_questions. Never invent compensation numbers.

Tone: direct, evidence-based, respectful. No humiliation. JobBeagle evaluates fit — it is not a resume coach.
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
              'for_question',
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

/** @deprecated alias — Guide now returns Snapshot + intel in one schema at runtime */
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
