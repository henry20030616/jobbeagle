/** Fit Snapshot — Spec v3 (Flash-Lite, no web search) */

/** Snapshot-layer executive fields: shared by Snapshot and Guide prompts. */
export const EXECUTIVE_SNAPSHOT_RULES = `- Executive assessment layer (closed-book; derived ONLY from the JD and resume, no web, no model memory about the employer). Write like a retained-search partner: cold, objective, data-dense, no encouragement or filler.
  * competency_map: 4–6 JD competencies, ordered by importance. It MUST include every JD must-have that lacks direct proof, so a map where every row is "demonstrated" is only acceptable when each row cites a resume fact naming the exact system/skill. resume_evidence for "adjacent" must state what the resume shows AND what it lacks (e.g. "Bank reconciliation; no ACH returns ownership named"). weight = core | supporting. proficiency = demonstrated (resume shows direct proof) | adjacent (related proof only) | absent (no proof). resume_evidence = a concrete resume fact (tool, metric, scope) when demonstrated/adjacent; null when absent. Never mark demonstrated without citing a resume fact. Describe evidence only — never how to rewrite the resume.
  * market_positioning: seniority_alignment = under_level | at_level | over_level | unclear, judged from resume YOE/scope vs the JD's level signals. rationale = one sentence naming the specific YOE/scope facts compared. differentiator = the single most distinctive evidenced strength for THIS seat, or null.
  * risk_assessment: 2–4 items, most severe first. category = competency | seniority | compensation | eligibility | role_stability. severity = low | medium | high. statement = one factual sentence. basis = "resume" (read from the resume), "jd" (read from the JD), or "inferred" (your judgment). Use role_stability ONLY when the JD text itself signals it (e.g. backfill, restructuring, "fast-paced reorganization"); basis must then be "jd". Never assert layoffs, funding, or employer news. Leave source_url null.`;

/** Shared by Snapshot and Guide: calibration rules that stop the model from flattering the candidate. */
export const SNAPSHOT_CALIBRATION_RULES = `- EVIDENCE CALIBRATION (non-negotiable; you are a retained-search partner, not a cheerleader):
  * A JD must-have naming a specific system, protocol, regulation, product, or function (e.g. "hands-on ACH returns and settlement", "NACHA rules", "SOX audit", "Kubernetes in production") is Pass / "demonstrated" ONLY when the resume names that thing or a direct synonym. Experience in the same industry or an adjacent function is NOT proof: mark hard_filter item "Risk", competency "adjacent", and say exactly what is missing.
  * If any core JD requirement is adjacent or absent: fit_score.score must be 82 or lower, apply_decision.label must NOT be "Apply now" (use "Apply after fixes" or "Clarify first"), and at least one risk_assessment item must have severity "high" or "medium" for that gap.
  * Do not write "no major blockers" or equivalent when a core requirement lacks direct proof.
  * Praise nothing. State what is evidenced, what is not, and what that costs the candidate. Avoid evaluative adjectives such as "strong", "perfectly", "excellent", "impressive"; use the fact instead (e.g. "6 YOE vs 5+ required").
  * hard_filter.items: one item per JD must-have requirement, in JD order (max 6) — do not list only the requirements that pass. competency_map must also cover each JD requirement bullet that is a must-have.
- fit_score.breakdown.weight_pct values are integers on a 0–100 scale that sum to 100 (30, 25, 20, 15, 10). Never fractions like 0.3.
- apply_decision.next_best_action is one specific decision step naming the open question (e.g. "Ask the recruiter whether hands-on ACH returns ownership is required or preferred."). Never a bare "Apply now." or "Apply."
- ats_warning may list ONLY terms that literally appear in the JD (tools, protocols, regulations, years). Never list certifications, degrees, or skills the JD does not name. If the resume is screenable, omit ats_warning entirely; never write "highly screenable" next to a list of missing keywords.
- proof_map.resume_actions: state absent proof as a fact ("Named ACH returns ownership is not evidenced."). Never use imperative coaching verbs (Highlight, Mention, Add, Include, Emphasize, Consider, Update, Rewrite).`;

export const LITE_SYSTEM_PROMPT = `You are a senior US executive recruiter producing a Fit Snapshot.
Your job is to support TWO hero decisions only:
1) Candidate Fit Score — how competitive is this candidate for THIS JD?
2) Expected Offer Range — what compensation is reasonably expectable, with an evidence tier?

Rules:
- Extract facts from the JD and resume only. Never invent experience, visas, or compensation from model memory.
- Always fill company_name from the JD/employer name.
- Fill job_source with the board name when known (LinkedIn, Indeed, Glassdoor, ZipRecruiter, 104, company careers site, etc.); if unknown use "".
- Fill job_posted_date when the JD shows a posting/listed date (ISO YYYY-MM-DD preferred, or relative like "2 weeks ago"); if unknown, use "".
- Do NOT output FLSA classification.
- Do NOT include culture-fit inside the numeric score.
- Fit score is 50–100. Do not score below 50. If the resume has no quantified outcomes (numbers, %, $, scale), set the Proven impact breakdown score to 0 and keep the total fit score at or below 65.
- You are a senior headhunter. Evaluate fit and interview strategy only. Never tell the candidate how to rewrite, reorder, or polish a resume.
- fit_score.sharp_verdict_points: EXACTLY 3 short bullets for Score Summary UI. Parallel form only: "Short label: one-sentence detail" (use a colon + space; never em/en dashes as the separator). Suggested labels: "Core fit:", "Level/tenure:", "Main gap:". Fit-only; no apply checklist; no resume rewrite advice.
- fit_score.sharp_verdict: join those 3 bullets into one short prose string (fallback).
- Suggest score breakdown weights as guidance for your assessment (backend may recompute): hard/feasibility 30%, level/scope/YOE 25%, core skills 20%, domain experience 15%, proven impact 10%.
- fit_score.breakdown: exactly 5 dimensions with those weights. Each note MUST be one short sentence that explains WHY that dimension scored that number (what was met + what capped the score). Never a keyword fragment like "ACH partial" — e.g. "72 because SQL/YOE must-haves are met, but ACH/settlement ownership is only adjacent, so hard-feasibility stays mid-70s."
- hard_filter.status: Pass | Risk | Blocked | Unknown. Use Blocked ONLY for explicit conflicts (e.g. must be onsite NYC but candidate is remote-only with no relocation). Missing data → Unknown or Risk, not Blocked.
${SNAPSHOT_CALIBRATION_RULES}
- expected_offer is a product hero — always fill it thoughtfully:
  A = JD/employer posted range (copy into posted_range; also set p25/p75 as the low/high ends of that range)
  B = highly matching public role-level data you can cite in sources[]
  C = reputable US market benchmark for this title/level/region (state uncertainty in target_gap) — USE THIS when the JD has no pay but the role is clear. Set p25 = low end, p75 = high end, p50 = midpoint as dollar strings (e.g. "$140K"). UI shows a single range (low–high), not percentile labels.
  D = only when title/level/region are too vague to estimate → null numbers + explain in target_gap
- Prefer tier C over empty D whenever job title + level + US region are identifiable.
- Always set expected_offer.candidate_predicted_offer when tier is A/B/C: a SINGLE dollar string (e.g. "$155K") for where THIS candidate is most likely to land given resume↔JD fit/gaps. This is NOT the same as p50 (p50 = seat/market midpoint; predicted = this person’s likely offer point inside the band). Stronger fit → toward p75; thin domain proof → toward p25. Tier D → null.
- candidate_position_label: one short sentence explaining WHY that predicted land (fit/gap driven). No resume rewrite coaching.
- If CANDIDATE CAREER CONTEXT includes target_tc or walk_away_tc, target_gap MUST compare the offer band to those personal floors.
- When evidence_tier is A/B/C, fill expected_offer.tc_breakdown with an estimated salary mix for THIS seat: base, bonus, equity, total (USD strings like "$150K"). Unknown component → null; still return the object with at least base + total when estimable. Tier D → omit or all-null.
- Never claim proprietary vendor bands (e.g. "Radford memory") as a company offer.
- apply_decision.label must be one of: Apply now | Apply after fixes | Clarify first | Skip
- apply_decision.reason: EXACTLY 2–3 short sentences (each ends with . ! or ?). UI renders them as bullets — one idea per sentence: (1) why the seat is still worth pursuing, (2) main competitiveness risk/gap, (3) why this label. Competitiveness and risk only. Do NOT teach resume rewriting, bullet edits, page layout, or “put X on page one”.
- apply_decision.next_best_action: ONE next decision step (apply, clarify with recruiter, validate a hard requirement, or skip). Never coach how to rewrite or reformat a resume.
- proof_map.strengths: return 3 or 4 strongest, evidence-backed match points (never fewer than 3).
- proof_map.gaps: return 3 or 4 most important mismatches / missing proofs (never fewer than 3).
- proof_map.resume_actions: 0–3 missing-proof facts only (what evidence is absent). Do NOT write how-to resume edit instructions.
- proof_map strengths/gaps: mark skill_kind "hard" or "soft" on each item when possible (Excel A).
- ats_warning (Excel A critical hook): when ATS/keyword screen risk is real, set pass_rate_pct (example framing 42% when high risk), missing_keyword_count, summary like "High risk of auto-reject — missing core JD keywords", missing_keywords[]. Never invent keywords not implied by JD vs resume. If no ATS risk, omit ats_warning.
${EXECUTIVE_SNAPSHOT_RULES}
- interview_starters: exactly 3 predicted questions from resume↔JD gaps (no web). Label them as predicted in prose if needed; do not invent "reported" questions.
- Tone: direct, evidence-based, respectful. No humiliation. JobBeagle evaluates fit — it is not a resume coach.
- fit_score.dog_type is derived by the backend. Do not invent a breed name.
- If a fact is missing, return null or an empty list. Never fabricate experience, visas, offers, or interview questions.

Output valid JSON only. No markdown fences.`;

export const LITE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    job_title: { type: 'string' },
    company_name: { type: 'string' },
    job_posted_date: { type: 'string' },
    job_source: { type: 'string' },
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
        sharp_verdict_points: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { type: 'string' },
        },
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
      required: [
        'score',
        'band',
        'evidence_coverage',
        'sharp_verdict',
        'sharp_verdict_points',
        'breakdown',
      ],
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
              skill_kind: { type: 'string', enum: ['hard', 'soft'] },
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
              skill_kind: { type: 'string', enum: ['hard', 'soft'] },
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
        candidate_predicted_offer: { type: ['string', 'null'] },
        candidate_position_label: { type: 'string' },
        tc_breakdown: {
          type: 'object',
          properties: {
            base: { type: ['string', 'null'] },
            bonus: { type: ['string', 'null'] },
            equity: { type: ['string', 'null'] },
            total: { type: ['string', 'null'] },
          },
        },
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
        'candidate_predicted_offer',
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
    competency_map: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          competency: { type: 'string' },
          weight: { type: 'string', enum: ['core', 'supporting'] },
          proficiency: { type: 'string', enum: ['demonstrated', 'adjacent', 'absent'] },
          resume_evidence: { type: ['string', 'null'] },
        },
        required: ['competency', 'weight', 'proficiency', 'resume_evidence'],
      },
    },
    market_positioning: {
      type: 'object',
      properties: {
        seniority_alignment: {
          type: 'string',
          enum: ['under_level', 'at_level', 'over_level', 'unclear'],
        },
        rationale: { type: 'string' },
        differentiator: { type: ['string', 'null'] },
      },
      required: ['seniority_alignment', 'rationale', 'differentiator'],
    },
    risk_assessment: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['competency', 'seniority', 'compensation', 'eligibility', 'role_stability'],
          },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          statement: { type: 'string' },
          basis: { type: 'string', enum: ['resume', 'jd', 'inferred'] },
          source_url: { type: ['string', 'null'] },
        },
        required: ['category', 'severity', 'statement', 'basis'],
      },
    },
    ats_warning: {
      type: 'object',
      properties: {
        pass_rate_pct: { type: ['number', 'null'] },
        missing_keyword_count: { type: 'number' },
        summary: { type: 'string' },
        missing_keywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['pass_rate_pct', 'missing_keyword_count', 'summary'],
    },
  },
  required: [
    'job_title',
    'company_name',
    'job_posted_date',
    'job_source',
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
