/** Interview Strategy Guide — Spec v3 (Pro + Search grounding, single pass) */

export const FULL_SYSTEM_PROMPT = `You are a CHRO-level interview strategist producing a complete Interview Strategy Guide in ONE response.
Produce BOTH:
(A) the Job Fit Snapshot layer (fit score, hard filter, proof map, expected offer, apply decision, role read, interview starters), AND
(B) the strategy layer (strategy_fit_salary, hiring_context, concerns_defenses, interview_playbook, offer_strategy, candidate_case).

Use google search / public web sources when citing hiring_context insights or reported interview questions.

=== Snapshot layer rules ===
- Extract facts from the JD and resume only. Never invent experience, visas, or compensation from model memory.
- Always fill company_name. Fill job_source (LinkedIn / Indeed / …) when known. Fill job_posted_date from the JD when a posting/listed date appears; else "".
- Do NOT output FLSA classification. Do NOT include culture-fit inside the numeric score.
- Fit score is a real 0–100 (no artificial floor at 50). Most candidates land 40–75; 85+ is rare.
- fit_score.sharp_verdict_points: EXACTLY 3 short bullets in parallel form "Short label: detail" (colon + space only; no em/en dash separators). Fit-only; no resume coaching.
- fit_score.sharp_verdict: join those bullets into one short prose fallback.
- Suggest score breakdown weights: hard/feasibility 30%, level/scope/YOE 25%, core skills 20%, domain 15%, proven impact 10%. Each breakdown.note = one short sentence explaining WHY that dimension got that score (what met + what capped it); never a keyword-only fragment.
- hard_filter.status: Pass | Risk | Blocked | Unknown. Blocked ONLY for explicit conflicts. Missing data → Unknown or Risk.
- expected_offer evidence tiers:
  A = JD/employer posted range → posted_range + p25/p75 from that range
  B = highly matching public role-level data you can cite in sources[]
  C = reputable US market benchmark for title/level/region (state uncertainty in target_gap). Prefer C over empty D when role is clear. Dollar strings like "$140K".
  D = title/level/region too vague → null numbers + explain in target_gap
- When tier A/B/C: set candidate_predicted_offer to a SINGLE dollar string for where THIS candidate is most likely to land (fit/gap driven). Distinct from p50 (seat midpoint). Tier D → null. Explain in candidate_position_label.
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
4) interview_playbook — SEPARATE reported questions (citation: source_url, source_date) from predicted (predicted=true). Tag each predicted question category as "behavioral" or "technical". Prefer interviewer_intent, star_blueprint, dos_donts on predicted items. EXACTLY 3–4 star_templates with title, for_question, situation, task, action, result, resume_anchor — STAR ONLY from resume facts. reverse_questions + validate_before_join. If no citable reported questions, reported=[].
5) offer_strategy — target / acceptable / walk_away aligned to Career Context floors when provided; levers + structured_levers (name+note); tc_breakdown (base/bonus/equity/total) when estimable; copy-ready negotiation script. Weak/D evidence → prioritize discovery_questions. Never invent compensation numbers. Page 4 may show TC mix; Pages 2–3 must NOT invent dollar salary ranges.
6) candidate_case — hire_thesis (2–3 sentences: why hire THIS candidate for THIS seat) + top_facts (exactly 3 resume-backed facts that most support an offer). Upgrade of the proof map — not a resume rewrite.
7) role_team_insights (Guide Page 2) — career_trajectory with growth_potential_pct as a PERCENT string only (e.g. "+20-25%"), NEVER dollar amounts. work_arrangement.mode (REMOTE/HYBRID/ONSITE/UNKNOWN). role_core + hard_requirements bullets. team_vibe + vibe_source_tag. team_highlights vs team_pain_points (2–3 each). promotion_drivers + hm_verification_questions. If web data thin → data_insufficient=true and honest unknowns (do not invent team gossip).
8) company_truth (Guide Page 3) — strategic_focus + leadership_notes; competitors[{name,note}] (2–3); culture_forum_takeaways; layoff_legal_flags (empty array if none — UI shows "No Major Public Red Flags"); company_moat vs org_risks; if small/niche company with thin news → insufficient_public_data=true + strategic_questions + suggested_search_query. NEVER invent URLs.
9) reference_citations (Guide Page 5, optional) — array of {source_badge, description, date, evidence_tier:1|2|3, url}. Prefer real URLs; if summary-only leave url="".

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
              category: { type: 'string', enum: ['behavioral', 'technical'] },
              interviewer_intent: { type: 'string' },
              star_blueprint: { type: 'string' },
              dos_donts: { type: 'string' },
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
        structured_levers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['name', 'note'],
          },
        },
        tc_breakdown: {
          type: 'object',
          properties: {
            base: { type: ['string', 'null'] },
            bonus: { type: ['string', 'null'] },
            equity: { type: ['string', 'null'] },
            total: { type: ['string', 'null'] },
          },
        },
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
    candidate_case: {
      type: 'object',
      properties: {
        hire_thesis: { type: 'string' },
        top_facts: { type: 'array', items: { type: 'string' } },
      },
      required: ['hire_thesis', 'top_facts'],
    },
    role_team_insights: {
      type: 'object',
      properties: {
        team_fit_badge: { type: 'string' },
        career_trajectory: {
          type: 'object',
          properties: {
            current_label: { type: 'string' },
            next_role: { type: 'string' },
            growth_potential_pct: { type: 'string' },
          },
          required: ['current_label', 'next_role', 'growth_potential_pct'],
        },
        work_arrangement: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            hours_per_week: { type: 'string' },
            notes: { type: 'string' },
          },
          required: ['mode'],
        },
        role_core: { type: 'array', items: { type: 'string' } },
        hard_requirements: { type: 'array', items: { type: 'string' } },
        team_vibe: { type: 'string' },
        vibe_source_tag: { type: 'string' },
        team_highlights: { type: 'array', items: { type: 'string' } },
        team_pain_points: { type: 'array', items: { type: 'string' } },
        promotion_drivers: { type: 'array', items: { type: 'string' } },
        hm_verification_questions: { type: 'array', items: { type: 'string' } },
        data_insufficient: { type: 'boolean' },
      },
      required: [
        'team_fit_badge',
        'career_trajectory',
        'work_arrangement',
        'role_core',
        'hard_requirements',
        'team_vibe',
        'team_highlights',
        'team_pain_points',
        'hm_verification_questions',
      ],
    },
    company_truth: {
      type: 'object',
      properties: {
        risk_audit_badge: { type: 'string' },
        strategic_focus: { type: 'string' },
        leadership_notes: { type: 'string' },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['name', 'note'],
          },
        },
        culture_forum_takeaways: { type: 'array', items: { type: 'string' } },
        layoff_legal_flags: { type: 'array', items: { type: 'string' } },
        company_moat: { type: 'array', items: { type: 'string' } },
        org_risks: { type: 'array', items: { type: 'string' } },
        insufficient_public_data: { type: 'boolean' },
        strategic_questions: { type: 'array', items: { type: 'string' } },
        suggested_search_query: { type: 'string' },
      },
      required: [
        'risk_audit_badge',
        'strategic_focus',
        'leadership_notes',
        'competitors',
        'culture_forum_takeaways',
        'layoff_legal_flags',
        'company_moat',
        'org_risks',
        'strategic_questions',
      ],
    },
    reference_citations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source_badge: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
          evidence_tier: { type: 'number' },
          url: { type: 'string' },
        },
        required: ['source_badge', 'description', 'evidence_tier'],
      },
    },
  },
  required: [
    'strategy_fit_salary',
    'hiring_context',
    'concerns_defenses',
    'interview_playbook',
    'offer_strategy',
    'candidate_case',
    'role_team_insights',
    'company_truth',
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
