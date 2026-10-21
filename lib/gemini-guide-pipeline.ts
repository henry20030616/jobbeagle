import { GoogleGenAI } from '@google/genai';
import { GEMINI_FULL_MODEL } from '@/constants/models';
import type { GuideModules } from '@/types';
import {
  applyInterviewAnswers,
  emptyGuideModules,
  parseCompanyEval,
  parseGuideQuestions,
  parseNegotiation,
  parseRewrites,
  parseSalaryLand,
  selectInterviewBank,
} from '@/lib/guide-modules';
import {
  COMPANY_MODULE_PROMPT,
  NEGOTIATION_MODULE_PROMPT,
  QUESTION_ANSWER_PROMPT,
  QUESTION_RETRIEVAL_PROMPT,
  REWRITE_MODULE_PROMPT,
  SALARY_MODULE_PROMPT,
} from '@/lib/prompts/guide-modules';
import { parseJsonResponse } from '@/lib/parse-gemini-json';
import {
  withUntrustedContentPolicy,
  wrapUntrusted,
} from '@/lib/prompt-injection-guard';
import {
  geminiLanguageDirective,
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';

type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface PaidGuideInput {
  parts: ContentPart[];
  language: AppLanguage | string;
  companyName: string;
  jobTitle: string;
}

function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenAI({ apiKey: key });
}

function withTask(parts: ContentPart[], task: string): ContentPart[] {
  const [first, ...rest] = parts;
  if (!first || !('text' in first)) return [{ text: task }, ...parts];
  return [{ text: `${task}\n\n${first.text}` }, ...rest];
}

async function generateJson(options: {
  system: string;
  parts: ContentPart[];
  search: boolean;
}): Promise<unknown> {
  const ai = getAI();
  const run = async (search: boolean) => {
    const response = await ai.models.generateContent({
      model: GEMINI_FULL_MODEL,
      contents: [{ parts: options.parts }],
      config: {
        systemInstruction: options.system,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        ...(search ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
    if (!response.text) throw new Error('Empty module response');
    return parseJsonResponse<unknown>(response.text);
  };

  try {
    return await run(options.search);
  } catch (firstErr) {
    console.warn(
      '[Guide module] retry:',
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
    try {
      return await run(options.search);
    } catch (secondErr) {
      if (!options.search) throw secondErr;
      console.warn('[Guide module] search failed, retrying without search');
      return run(false);
    }
  }
}

/**
 * Paid modules after the Flash-Lite snapshot.
 * Items 4, 5, and 6-retrieval run together with Search.
 * Item 6 answers wait for retrieval. Item 7 waits for the salary module.
 * Item 3 rewrite runs with them and does not search.
 */
export async function runPaidGuideModules(input: PaidGuideInput): Promise<GuideModules> {
  const lang = normalizeReportLanguage(input.language);
  const languageBlock = geminiLanguageDirective(lang);
  const system = (prompt: string) =>
    withUntrustedContentPolicy(`${prompt}\n\n${languageBlock}`);
  const hints = [
    input.companyName ? wrapUntrusted('company_hint', input.companyName) : '',
    input.jobTitle ? wrapUntrusted('job_title_hint', input.jobTitle) : '',
  ].filter(Boolean).join('\n');
  const limitations: string[] = [];

  const settled = await Promise.allSettled([
    generateJson({
      system: system(REWRITE_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nRewrite the hard gaps only. Do not search.`),
      search: false,
    }),
    generateJson({
      system: system(SALARY_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch for this candidate's pay landing.`),
      search: true,
    }),
    generateJson({
      system: system(COMPANY_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch company and role reputation, including H-1B.`),
      search: true,
    }),
    generateJson({
      system: system(QUESTION_RETRIEVAL_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch interview questions from the last three years.`),
      search: true,
    }),
  ]);

  const [rewriteRes, salaryRes, companyRes, retrievalRes] = settled;
  const modules = emptyGuideModules();

  if (rewriteRes.status === 'fulfilled') {
    const row = rewriteRes.value;
    const list = row && typeof row === 'object' ? (row as { rewrites?: unknown }).rewrites : undefined;
    modules.resume_rewrites = parseRewrites(list);
  } else {
    limitations.push('Resume rewrite module failed.');
  }

  if (salaryRes.status === 'fulfilled') {
    modules.salary_land = parseSalaryLand(salaryRes.value) ?? modules.salary_land;
  } else {
    limitations.push('Salary landing module failed.');
  }

  if (companyRes.status === 'fulfilled') {
    modules.company_eval = parseCompanyEval(companyRes.value) ?? modules.company_eval;
  } else {
    limitations.push('Company evaluation module failed.');
  }

  let retrievedQuestions: ReturnType<typeof parseGuideQuestions> = [];
  let process = '';
  let questionSummary = '';
  if (retrievalRes.status === 'fulfilled' && retrievalRes.value && typeof retrievalRes.value === 'object') {
    const row = retrievalRes.value as { questions?: unknown; process?: unknown; summary?: unknown };
    retrievedQuestions = parseGuideQuestions(row.questions);
    process = typeof row.process === 'string' ? row.process : '';
    questionSummary = typeof row.summary === 'string' ? row.summary : '';
  } else {
    limitations.push('Interview question retrieval failed.');
  }
  modules.interview_bank = selectInterviewBank(retrievedQuestions, process, questionSummary);

  const answerTask = wrapUntrusted(
    'web_retrieval',
    JSON.stringify({
      professional: modules.interview_bank.professional.map((item) => item.question),
      behavioral: modules.interview_bank.behavioral.map((item) => item.question),
    }),
  );
  const salaryTask = wrapUntrusted('web_retrieval', JSON.stringify(modules.salary_land));

  const writing = await Promise.allSettled([
    generateJson({
      system: system(QUESTION_ANSWER_PROMPT),
      parts: withTask(input.parts, `Answer only these questions.\n${answerTask}`),
      search: false,
    }),
    generateJson({
      system: system(NEGOTIATION_MODULE_PROMPT),
      parts: withTask(input.parts, `Salary land already estimated:\n${salaryTask}`),
      search: false,
    }),
  ]);

  if (writing[0].status === 'fulfilled') {
    modules.interview_bank = applyInterviewAnswers(modules.interview_bank, writing[0].value);
  } else {
    limitations.push('Interview answer module failed.');
  }

  if (writing[1].status === 'fulfilled') {
    modules.negotiation = parseNegotiation(writing[1].value) ?? modules.negotiation;
  } else {
    limitations.push('Negotiation module failed.');
  }

  modules.limitations = limitations;
  return modules;
}
