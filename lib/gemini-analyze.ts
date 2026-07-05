import { GoogleGenAI, Type } from '@google/genai';
import type { LiteReport, FullReport } from '@/types';
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

export function parseJsonResponse<T>(text: string): T {
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first >= 0 && last > first) {
    clean = clean.slice(first, last + 1);
  }
  clean = clean.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(clean) as T;
}

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
    // Rough estimate: ~4 chars per token
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
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          match_score: { type: Type.INTEGER },
          dog_breed_archetype: { type: Type.STRING },
          one_sentence_sharp_critique: { type: Type.STRING },
          flsa_status: {
            type: Type.STRING,
            enum: [
              'Exempt (Professional Exemption)',
              'Non-Exempt',
              'Exempt (Executive Exemption)',
            ],
          },
          radford_2026_compensation_matrix: {
            type: Type.OBJECT,
            properties: {
              tier_25th_low: { type: Type.STRING },
              tier_50th_mid: { type: Type.STRING },
              tier_75th_high: { type: Type.STRING },
            },
            required: ['tier_25th_low', 'tier_50th_mid', 'tier_75th_high'],
          },
        },
        required: [
          'match_score',
          'dog_breed_archetype',
          'one_sentence_sharp_critique',
          'flsa_status',
          'radford_2026_compensation_matrix',
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Lite analysis returned empty response');

  const report = parseJsonResponse<LiteReport>(text);
  report.match_score = Math.max(0, Math.min(100, Math.round(report.match_score)));

  return { report, model };
}

export async function executeFullAnalysis(
  resumeText: string,
  rawJd: string,
  companyName: string,
  jobTitle: string,
  pdfInline?: PdfInlineAttachment,
): Promise<{ report: FullReport; model: string }> {
  const ai = getAI();
  const model = GEMINI_FULL_MODEL;

  const intro = `Target Company: ${companyName}
Job Title: ${jobTitle}

Search teamblind.com, glassdoor.com, and reddit.com for live intel on ${companyName} regarding layoffs, culture, interview process, and ghost job signals.`;

  const parts = buildUserParts(rawJd, resumeText, pdfInline);
  parts[0] = {
    text: `${intro}\n\n${(parts[0] as { text: string }).text}`,
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction: FULL_SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      tools: [{ googleSearch: {} }],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          online_intel_warning: { type: Type.STRING },
          corporate_culture_blackbox: { type: Type.STRING },
          custom_star_interview_bank: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          salary_negotiation_script: { type: Type.STRING },
        },
        required: [
          'online_intel_warning',
          'corporate_culture_blackbox',
          'custom_star_interview_bank',
          'salary_negotiation_script',
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Full analysis returned empty response');

  const report = parseJsonResponse<FullReport>(text);

  if (!Array.isArray(report.custom_star_interview_bank)) {
    report.custom_star_interview_bank = [];
  }
  while (report.custom_star_interview_bank.length < 10) {
    report.custom_star_interview_bank.push(
      `[Placeholder ${report.custom_star_interview_bank.length + 1}] Prepare a STAR story aligned to this role.`,
    );
  }
  report.custom_star_interview_bank =
    report.custom_star_interview_bank.slice(0, 10);

  return { report, model };
}
