import { GoogleGenAI, Type } from '@google/genai';
import type { LiteReport, FullReport, StrategyIntelFields } from '@/types';
import { normalizeLiteReport, normalizeFullReport } from '@/lib/normalize-lite-report';
import { parseJsonResponse } from '@/lib/parse-gemini-json';
import {
  GEMINI_LITE_MODEL,
  GEMINI_FULL_MODEL,
  GEMINI_TOKEN_COUNT_MODEL,
  MAX_COMBINED_TOKENS,
} from '@/constants/models';
import { LITE_SYSTEM_PROMPT } from '@/lib/prompts/lite';
import { FULL_SYSTEM_PROMPT } from '@/lib/prompts/full';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return key;
}

function getAI(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

export { parseJsonResponse } from '@/lib/parse-gemini-json';

/** Zero-cost token gate before LLM call */
export async function countCombinedTokens(
  jd: string,
  resume: string,
): Promise<number> {
  const ai = getAI();
  try {
    const res = await ai.models.countTokens({
      model: GEMINI_TOKEN_COUNT_MODEL,
      contents: `${jd}\n\n${resume}`,
    });
    return res.totalTokens ?? 0;
  } catch {
    return Math.ceil((jd.length + resume.length) / 4);
  }
}

export function isTokenLimitExceeded(tokenCount: number): boolean {
  return tokenCount > MAX_COMBINED_TOKENS;
}

export interface PdfInlineAttachment {
  data: string;
  mimeType: string;
}

function buildUserParts(
  rawJd: string,
  resumeText: string,
  pdfInline?: PdfInlineAttachment,
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    {
      text: `=== JOB DESCRIPTION ===\n${rawJd}\n\n=== RESUME ===\n${
        pdfInline
          ? 'The candidate resume is attached as a PDF document below. Read it fully before scoring.'
          : resumeText
      }`,
    },
  ];
  if (pdfInline) {
    parts.push({
      inlineData: {
        mimeType: pdfInline.mimeType,
        data: pdfInline.data,
      },
    });
  }
  return parts;
}

const pointDescItem = {
  type: Type.OBJECT,
  properties: {
    point: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ['point', 'description'],
};

const gapDescItem = {
  type: Type.OBJECT,
  properties: {
    gap: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ['gap', 'description'],
};

const LITE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    job_title: { type: Type.STRING },
    company_name: { type: Type.STRING },
    data_completeness: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        missing_inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidence_notes: { type: Type.STRING },
      },
      required: ['level', 'missing_inputs', 'confidence_notes'],
    },
    hard_filter: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ['Pass', 'Risk', 'Blocked', 'Unknown'] },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              requirement: { type: Type.STRING },
              status: { type: Type.STRING },
              evidence: { type: Type.STRING },
            },
            required: ['requirement', 'status', 'evidence'],
          },
        },
      },
      required: ['status', 'items'],
    },
    fit_score: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        band: { type: Type.STRING, enum: ['Strong', 'Viable', 'Stretch', 'Mismatch'] },
        evidence_coverage: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        sharp_verdict: { type: Type.STRING },
        breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dimension: { type: Type.STRING },
              weight_pct: { type: Type.NUMBER },
              score: { type: Type.NUMBER },
              note: { type: Type.STRING },
            },
            required: ['dimension', 'weight_pct', 'score', 'note'],
          },
        },
      },
      required: ['score', 'band', 'evidence_coverage', 'sharp_verdict', 'breakdown'],
    },
    proof_map: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, minItems: 3, maxItems: 4, items: pointDescItem },
        gaps: { type: Type.ARRAY, minItems: 3, maxItems: 4, items: gapDescItem },
        resume_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        screenability_note: { type: Type.STRING },
      },
      required: ['strengths', 'gaps', 'resume_actions', 'screenability_note'],
    },
    expected_offer: {
      type: Type.OBJECT,
      properties: {
        posted_range: { type: Type.STRING, nullable: true },
        p25: { type: Type.STRING, nullable: true },
        p50: { type: Type.STRING, nullable: true },
        p75: { type: Type.STRING, nullable: true },
        currency: { type: Type.STRING },
        region: { type: Type.STRING },
        target_gap: { type: Type.STRING },
        evidence_tier: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
        sources: { type: Type.ARRAY, items: { type: Type.STRING } },
        candidate_position_label: { type: Type.STRING },
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
      type: Type.OBJECT,
      properties: {
        label: {
          type: Type.STRING,
          enum: ['Apply now', 'Apply after fixes', 'Clarify first', 'Skip'],
        },
        reason: { type: Type.STRING },
        next_best_action: { type: Type.STRING },
      },
      required: ['label', 'reason', 'next_best_action'],
    },
    role_read: {
      type: Type.OBJECT,
      properties: {
        mission: { type: Type.STRING },
        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        hiring_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['mission', 'responsibilities', 'hiring_signals'],
    },
    interview_starters: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
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

const FULL_INTEL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    strategy_fit_salary: {
      type: Type.OBJECT,
      properties: {
        score_implications: { type: Type.STRING },
        offer_implications: { type: Type.STRING },
        validate_with_recruiter: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['score_implications', 'offer_implications', 'validate_with_recruiter'],
    },
    hiring_context: {
      type: Type.OBJECT,
      properties: {
        insights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              claim: { type: Type.STRING },
              why_it_matters: { type: Type.STRING },
              source_url: { type: Type.STRING },
              date: { type: Type.STRING },
            },
            required: ['claim', 'why_it_matters', 'source_url', 'date'],
          },
        },
        limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
        validation_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['insights', 'limitations', 'validation_questions'],
    },
    concerns_defenses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concern: { type: Type.STRING },
          why: { type: Type.STRING },
          evidence: { type: Type.STRING },
          missing_proof: { type: Type.STRING },
          answer_guide: { type: Type.STRING },
          do_not_claim: { type: Type.STRING },
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
      type: Type.OBJECT,
      properties: {
        reported: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              source_url: { type: Type.STRING },
              source_date: { type: Type.STRING },
              evidence: { type: Type.STRING },
              star_outline: { type: Type.STRING },
            },
            required: ['question'],
          },
        },
        predicted: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              predicted: { type: Type.BOOLEAN },
              evidence: { type: Type.STRING },
              star_outline: { type: Type.STRING },
              missing_facts: { type: Type.STRING },
            },
            required: ['question'],
          },
        },
        star_templates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              for_question: { type: Type.STRING },
              situation: { type: Type.STRING },
              task: { type: Type.STRING },
              action: { type: Type.STRING },
              result: { type: Type.STRING },
              resume_anchor: { type: Type.STRING },
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
        star_outlines: { type: Type.ARRAY, items: { type: Type.STRING } },
        reverse_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        validate_before_join: { type: Type.ARRAY, items: { type: Type.STRING } },
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
      type: Type.OBJECT,
      properties: {
        target: { type: Type.STRING },
        acceptable: { type: Type.STRING },
        walk_away: { type: Type.STRING },
        levers: { type: Type.ARRAY, items: { type: Type.STRING } },
        script: { type: Type.STRING },
        discovery_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
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

export async function executeLiteAnalysis(
  resumeText: string,
  rawJd: string,
  pdfInline?: PdfInlineAttachment,
): Promise<{ report: LiteReport; model: string }> {
  const ai = getAI();
  const model = GEMINI_LITE_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline) }],
    config: {
      systemInstruction: LITE_SYSTEM_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: LITE_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Lite analysis returned empty response');

  let report: LiteReport;
  try {
    report = normalizeLiteReport(parseJsonResponse<LiteReport>(text));
  } catch (firstErr) {
    const retry = await ai.models.generateContent({
      model,
      contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline) }],
      config: {
        systemInstruction:
          `${LITE_SYSTEM_PROMPT}\n\nCRITICAL: Return COMPLETE valid JSON only. Keep string fields concise (1–2 sentences each). Do not truncate. Tier D → null salary numbers.`,
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: LITE_RESPONSE_SCHEMA,
      },
    });
    const retryText = retry.text;
    if (!retryText) throw firstErr;
    report = normalizeLiteReport(parseJsonResponse<LiteReport>(retryText));
  }

  return { report, model };
}

export async function executeFullAnalysis(
  resumeText: string,
  rawJd: string,
  companyName: string,
  jobTitle: string,
  pdfInline?: PdfInlineAttachment,
): Promise<{ report: FullReport; model: string }> {
  const snapshotResult = await executeLiteAnalysis(resumeText, rawJd, pdfInline);
  const snap = snapshotResult.report;

  const ai = getAI();
  const model = GEMINI_FULL_MODEL;

  const intro = `Target Company: ${companyName || snap.company_name}
Job Title: ${jobTitle || snap.job_title}

LOCKED SNAPSHOT (do not change scores or offer percentiles):
- Fit score: ${snap.fit_score.score}/100 (${snap.fit_score.band}), evidence ${snap.fit_score.evidence_coverage}
- Hard filter: ${snap.hard_filter.status}
- Sharp verdict: ${snap.fit_score.sharp_verdict}
- Expected offer tier ${snap.expected_offer.evidence_tier}: P25=${snap.expected_offer.p25 ?? 'null'} P50=${snap.expected_offer.p50 ?? 'null'} P75=${snap.expected_offer.p75 ?? 'null'} region=${snap.expected_offer.region}
- Strengths: ${snap.proof_map.strengths.map((s) => s.point).join('; ')}
- Gaps: ${snap.proof_map.gaps.map((g) => g.gap).join('; ')}
- Apply decision: ${snap.apply_decision.label}

Use public web sources only when citing hiring_context insights or reported interview questions. Prefer IR, trusted news, company blogs, Glassdoor/Blind/Reddit when accessible. If sources are thin, return limitations + validation_questions — that is success, not failure.`;

  const parts = buildUserParts(rawJd, resumeText, pdfInline);
  parts[0] = {
    text: `${intro}\n\n${(parts[0] as { text: string }).text}`,
  };

  let intel: StrategyIntelFields;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: FULL_SYSTEM_PROMPT,
        temperature: 0.4,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
        responseSchema: FULL_INTEL_RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Strategy intel returned empty response');
    intel = parseJsonResponse<StrategyIntelFields>(text);
  } catch (intelErr) {
    console.warn(
      '[Full] Intel pass failed, returning Snapshot with fallback strategy:',
      intelErr instanceof Error ? intelErr.message : intelErr,
    );
    intel = {
      strategy_fit_salary: {
        score_implications: `Fit ${snap.fit_score.score} (${snap.fit_score.band}) — treat interview odds accordingly.`,
        offer_implications: `Evidence tier ${snap.expected_offer.evidence_tier}; prefer discovery before hard anchors.`,
        validate_with_recruiter: [
          'Confirm leveling and must-haves for this req.',
          'Ask for the approved compensation band.',
        ],
      },
      hiring_context: {
        insights: [],
        limitations: [
          'Live web grounding was unavailable for this run. Re-run Interview Strategy Guide shortly.',
        ],
        validation_questions: [
          'Why is this role open now?',
          'What does success look like in 90 days?',
        ],
      },
      concerns_defenses: snap.proof_map.gaps.slice(0, 3).map((g) => ({
        concern: g.gap,
        why: g.description,
        evidence: '',
        missing_proof: g.description,
        answer_guide: 'Use one verified resume fact; acknowledge the gap without inventing experience.',
        do_not_claim: 'Do not invent tools, years, or outcomes absent from the resume.',
      })),
      interview_playbook: {
        reported: [],
        predicted: snap.interview_starters.map((question) => ({
          question,
          predicted: true,
        })),
        star_templates: snap.interview_starters.slice(0, 4).map((q, i) => ({
          title: `Practice story ${i + 1}`,
          for_question: q,
          situation: 'Use a real role/project from your resume (do not invent).',
          task: 'State the concrete goal tied to this question.',
          action: 'List 2–3 actions you personally took (tools/decisions from resume).',
          result: 'Add a verified outcome or metric from your resume; if none, say so honestly.',
          resume_anchor: snap.proof_map.strengths[i]?.point || 'Resume evidence required',
        })),
        star_outlines: snap.interview_starters.map((q) => `STAR outline for: ${q}`),
        reverse_questions: [
          'What problem is this hire meant to solve in the next two quarters?',
          'How will success be measured in the first 90 days?',
        ],
        validate_before_join: [
          'Validate team stability and scope before accepting an offer.',
        ],
      },
      offer_strategy: {
        target: snap.expected_offer.p50 ?? 'Confirm band with recruiter',
        acceptable: snap.expected_offer.p25 ?? 'Confirm floor with recruiter',
        walk_away: 'Walk away if cash + scope fall below your documented floor.',
        levers: ['Scope', 'Sign-on', 'Remote flexibility'],
        script:
          snap.expected_offer.candidate_position_label
          || 'Lead with discovery questions if evidence is weak; then anchor to verified mid-band.',
        discovery_questions: [
          'What is the approved band for this level in this location?',
          'How does total compensation split between cash, bonus, and equity?',
        ],
      },
    };
  }

  const report = normalizeFullReport({
    ...snap,
    ...intel,
  });

  return {
    report,
    model: `${snapshotResult.model}+${model}`,
  };
}
