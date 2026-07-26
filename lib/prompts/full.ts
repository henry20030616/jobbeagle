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
4) interview_playbook — SEPARATE reported (MUST include source_url + source_date + source_name e.g. Glassdoor/Blind/Levels.fyi — NEVER invent URLs; if no citable URL omit from reported) from system-analyzed (predicted=true). Tag EVERY item category "behavioral" or "technical". EVERY question — reported AND predicted — MUST include interviewer_intent + star_blueprint + dos_donts (full write-up; NEVER dump reported as title-only). EXACTLY 3–4 star_templates with title, for_question, situation, task, action, result, resume_anchor — STAR ONLY from resume facts. reverse_questions + validate_before_join. If no citable reported questions, reported=[].
5) offer_strategy — target / acceptable / walk_away aligned to Career Context floors when provided; levers + structured_levers (name+note); tc_breakdown (base/bonus/equity/total) when estimable; copy-ready negotiation script. Weak/D evidence → prioritize discovery_questions. Never invent compensation numbers. Page 4 may show TC mix; Pages 2–3 must NOT invent dollar salary ranges.
6) candidate_case — hire_thesis (2–3 sentences: why hire THIS candidate for THIS seat) + top_facts (exactly 3 resume-backed facts that most support an offer). Upgrade of the proof map — not a resume rewrite.
7) role_team_insights (Guide Page 2 / Excel B「職位與團隊現況」) — REQUIRED fields:
   - role_content_refined[] + requirements_refined[]: rewrite into short plain-language highlights for the candidate (what the job actually does + must-have hire bar). NEVER paste JD verbatim. Do NOT use internal jargon like “refined/restructured” in the string values.
   - rto_official: office days / RTO policy from JD.
   - rto_employee_reality: web employee overtime/WLB reality (Glassdoor/LinkedIn/forums). Filter official PR.
   - next_title_1_3yr: ALWAYS fill a concrete next title in 1–3 years (e.g. Senior BA → Lead BA / Payments Ops Product Owner). If the employer has no public ladder, INFER from industry career paths using authoritative market sources (Levels.fyi title ladders, LinkedIn career-path norms, BLS/Robert Half or similar employment-market reports, major job-board leveling patterns). NEVER leave blank and NEVER say “no data” as the title.
   - career_path_basis: REQUIRED short note naming the basis (company careers page vs market ladder sources). Example: “Company ladder not public — inferred from Levels.fyi / LinkedIn Senior BA→Lead BA paths in US fintech ops.”
   - promotion_skill_gaps[]: skills to close for that next title.
   - ABSOLUTELY NO dollar salary amounts on this page (salary is Page 1 + Page 4 only).
   - If no public reviews for THIS team: team_sample_insufficient=true and/or department_fallback_note; write the insufficient-sample phrase in the OUTPUT LANGUAGE. Do NOT invent team gossip. This thin-sample rule applies to team culture/WLB — NOT to next_title_1_3yr (always analyze a market path).
8) company_truth (Guide Page 3 / Excel C「公司真相與風險」) — REQUIRED:
   - current_strategy: 2–4 plain sentences on what THIS employer is pushing NOW (product bets, cost cuts, AI, expansion, reliability). Write for the candidate — never put meta instructions in the string (no “not Wikipedia”, no “not encyclopedic history”). Prefer IR / news / careers signals over founding lore.
   - competitors[2–3]: REAL industry companies that compete with THIS employer for customers/market share (named firms, e.g. Stripe / Adyen / Block for a payments company). Each needs concrete strengths + weaknesses vs THIS employer’s positioning. FORBIDDEN: candidate peer buckets like “payments-native BA peers”, “generic senior BA pipelines”, job-seeker rival categories, or vague “other fintechs”. If public competitor map is thin, still name the closest public rivals and state uncertainty in weaknesses — do not invent fake startups.
   - insider_voice[]: Glassdoor/Blind/Reddit high-frequency praise/complaints (manager style, WLB, toxic). If no posts: forum_sample_thin=true and say the thin-forum phrase in the OUTPUT LANGUAGE — never fabricate.
   - layoff_legal_flags[]: Layoff.fyi / litigation / controversy. If none: EMPTY array (UI shows the localized “no public layoff/legal flags” phrase) and fill interviewer_strategy_questions with 2–3 company strategy questions for the interviewer. NEVER invent layoffs.
9) interview_playbook Page 4 depth: EXACTLY 5 behavioral + EXACTLY 5 technical/case across reported+predicted combined (UI shows two columns of 5). Prefer putting every citable real question into reported[] WITH full STAR fields — do NOT create a separate “list-only” dump. If fewer than 5 real questions exist in a category, fill the remainder with predicted=true system-analyzed most-likely questions from resume↔JD gaps (UI labels these as system analysis, not vague “guess”). offer_strategy.tc_breakdown MUST try Base + equity/RSU + sign_on (+ total) from Levels.fyi-class sources when possible. Negotiation script = Prepare(anchor) → Pitch → Counter.
10) reference_citations (Guide Page 5 / Excel E) — RAG source list: Reddit/Blind threads, Levels.fyi, Layoff, news. If no direct URL: url="" and manual_verify_keywords set — NEVER invent URLs.

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
              source_name: { type: 'string' },
              evidence: { type: 'string' },
              star_outline: { type: 'string' },
              category: { type: 'string', enum: ['behavioral', 'technical'] },
              interviewer_intent: { type: 'string' },
              star_blueprint: { type: 'string' },
              dos_donts: { type: 'string' },
            },
            required: [
              'question',
              'source_url',
              'source_date',
              'source_name',
              'category',
              'interviewer_intent',
              'star_blueprint',
              'dos_donts',
            ],
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
            required: [
              'question',
              'category',
              'interviewer_intent',
              'star_blueprint',
              'dos_donts',
            ],
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
            sign_on: { type: ['string', 'null'] },
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
        role_content_refined: { type: 'array', items: { type: 'string' } },
        requirements_refined: { type: 'array', items: { type: 'string' } },
        rto_official: { type: 'string' },
        rto_employee_reality: { type: 'string' },
        next_title_1_3yr: { type: 'string' },
        career_path_basis: { type: 'string' },
        promotion_skill_gaps: { type: 'array', items: { type: 'string' } },
        team_sample_insufficient: { type: 'boolean' },
        department_fallback_note: { type: 'string' },
      },
      required: [
        'role_content_refined',
        'requirements_refined',
        'rto_official',
        'rto_employee_reality',
        'next_title_1_3yr',
        'career_path_basis',
        'promotion_skill_gaps',
        'team_sample_insufficient',
      ],
    },
    company_truth: {
      type: 'object',
      properties: {
        current_strategy: { type: 'string' },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strengths: { type: 'string' },
              weaknesses: { type: 'string' },
            },
            required: ['name', 'strengths', 'weaknesses'],
          },
        },
        insider_voice: { type: 'array', items: { type: 'string' } },
        forum_sample_thin: { type: 'boolean' },
        layoff_legal_flags: { type: 'array', items: { type: 'string' } },
        interviewer_strategy_questions: { type: 'array', items: { type: 'string' } },
      },
      required: [
        'current_strategy',
        'competitors',
        'insider_voice',
        'forum_sample_thin',
        'layoff_legal_flags',
        'interviewer_strategy_questions',
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
          manual_verify_keywords: { type: 'string' },
        },
        required: ['source_badge', 'description', 'evidence_tier', 'url'],
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
