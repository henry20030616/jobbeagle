/** Job Fit Snapshot — Spec v3 (Flash-Lite, no web search) */

export const LITE_SYSTEM_PROMPT = `You are a senior US executive recruiter producing a Job Fit Snapshot.
Your job is to support TWO hero decisions only:
1) Candidate Fit Score — how competitive is this candidate for THIS JD?
2) Expected Offer Range — what compensation is reasonably expectable, with an evidence tier?

Rules:
- Extract facts from the JD and resume only. Never invent experience, visas, or compensation from model memory.
- Do NOT output FLSA classification.
- Do NOT include culture-fit inside the numeric score.
- Fit score is a real 0–100 (no artificial floor at 50). Most candidates land 40–75; 85+ is rare.
- Suggest score breakdown weights as guidance for your assessment (backend may recompute): hard/feasibility 30%, level/scope/YOE 25%, core skills 20%, domain experience 15%, proven impact 10%.
- hard_filter.status: Pass | Risk | Blocked | Unknown. Use Blocked ONLY for explicit conflicts (e.g. must be onsite NYC but candidate is remote-only with no relocation). Missing data → Unknown or Risk, not Blocked.
- expected_offer is a product hero — always fill it thoughtfully:
  A = JD/employer posted range (copy into posted_range; also set p25/p75 as the low/high ends of that range)
  B = highly matching public role-level data you can cite in sources[]
  C = reputable US market benchmark for this title/level/region (state uncertainty in target_gap) — USE THIS when the JD has no pay but the role is clear. Set p25 = low end, p75 = high end, p50 = midpoint as dollar strings (e.g. "$140K"). UI shows a single range (low–high), not percentile labels.
  D = only when title/level/region are too vague to estimate → null numbers + explain in target_gap
- Prefer tier C over empty D whenever job title + level + US region are identifiable.
- Never claim proprietary vendor bands (e.g. "Radford memory") as a company offer.
- apply_decision.label must be one of: Apply now | Apply after fixes | Clarify first | Skip
- proof_map.strengths: return 3 or 4 strongest, evidence-backed match points (never fewer than 3).
- proof_map.gaps: return 3 or 4 most important mismatches / missing proofs (never fewer than 3).
- interview_starters: exactly 3 predicted questions from resume↔JD gaps (no web). Label them as predicted in prose if needed; do not invent "reported" questions.
- Tone: direct, evidence-based, respectful. No humiliation.

Output valid JSON only. No markdown fences.`;

export const LITE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    job_title: { type: 'string' },
    company_name: { type: 'string' },
    data_completeness: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['High', 'Medium', 'Low'] },
        missing_inputs: { type: 'array', items: { type: 'string' } },
        confidence_notes: { type: 'string' },
      },
      required: ['level', 'missing_inputs', 'confidence_notes'],
    },
    hard_filter: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Pass', 'Risk', 'Blocked', 'Unknown'] },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              status: { type: 'string' },
              evidence: { type: 'string' },
            },
            required: ['requirement', 'status', 'evidence'],
          },
        },
      },
      required: ['status', 'items'],
    },
    fit_score: {
      type: 'object',
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        band: { type: 'string', enum: ['Strong', 'Viable', 'Stretch', 'Mismatch'] },
        evidence_coverage: { type: 'string', enum: ['High', 'Medium', 'Low'] },
        sharp_verdict: { type: 'string' },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              weight_pct: { type: 'number' },
              score: { type: 'number' },
              note: { type: 'string' },
            },
            required: ['dimension', 'weight_pct', 'score', 'note'],
          },
        },
      },
      required: ['score', 'band', 'evidence_coverage', 'sharp_verdict', 'breakdown'],
    },
    proof_map: {
      type: 'object',
      properties: {
        strengths: {
          type: 'array',
          minItems: 3,
          maxItems: 4,
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['point', 'description'],
          },
        },
        gaps: {
          type: 'array',
          minItems: 3,
          maxItems: 4,
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['gap', 'description'],
          },
        },
        resume_actions: { type: 'array', items: { type: 'string' } },
        screenability_note: { type: 'string' },
      },
      required: ['strengths', 'gaps', 'resume_actions', 'screenability_note'],
    },
    expected_offer: {
      type: 'object',
      properties: {
        posted_range: { type: ['string', 'null'] },
        p25: { type: ['string', 'null'] },
        p50: { type: ['string', 'null'] },
        p75: { type: ['string', 'null'] },
        currency: { type: 'string' },
        region: { type: 'string' },
        target_gap: { type: 'string' },
        evidence_tier: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
        sources: { type: 'array', items: { type: 'string' } },
        candidate_position_label: { type: 'string' },
      },
      required: [
        'posted_range',
        'p25',
        'p50',
        'p75',
        'currency',
        'region',
        'target_gap',
        'evidence_tier',
        'sources',
      ],
    },
    apply_decision: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          enum: ['Apply now', 'Apply after fixes', 'Clarify first', 'Skip'],
        },
        reason: { type: 'string' },
        next_best_action: { type: 'string' },
      },
      required: ['label', 'reason', 'next_best_action'],
    },
    role_read: {
      type: 'object',
      properties: {
        mission: { type: 'string' },
        responsibilities: { type: 'array', items: { type: 'string' } },
        hiring_signals: { type: 'array', items: { type: 'string' } },
      },
      required: ['mission', 'responsibilities', 'hiring_signals'],
    },
    interview_starters: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: [
    'job_title',
    'company_name',
    'data_completeness',
    'hard_filter',
    'fit_score',
    'proof_map',
    'expected_offer',
    'apply_decision',
    'role_read',
    'interview_starters',
  ],
};
