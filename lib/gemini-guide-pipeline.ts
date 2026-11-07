import { GoogleGenAI } from '@google/genai';
import { GEMINI_FULL_MODEL } from '@/constants/models';
import type { GuideModules } from '@/types';
import {
  generateAnthropicJson,
  getAnthropicApiKey,
  type GuideContentPart,
} from '@/lib/anthropic-writing';
import {
  applyInterviewAnswers,
  emptyGuideModules,
  parseCompanyEval,
  parseGuideQuestions,
  parseNegotiation,
  parseRewrites,
  parseSalaryLand,
  resolveGuideModuleRoute,
  selectInterviewBank,
  type GuideModuleId,
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
  auditQuestions,
  auditSources,
  collectGuideSourceUrls,
  findDeadSourceUrls,
  type SourceFetch,
} from '@/lib/guide-source-audit';
import {
  withUntrustedContentPolicy,
  wrapUntrusted,
} from '@/lib/prompt-injection-guard';
import {
  geminiLanguageDirective,
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';

type PaidGuideModuleId = Exclude<GuideModuleId, 'snapshot'>;

export interface PaidGuideInput {
  parts: GuideContentPart[];
  language: AppLanguage | string;
  companyName: string;
  jobTitle: string;
  /** Override for cited-link checks (tests). Defaults to global fetch. */
  sourceFetch?: SourceFetch;
}

function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenAI({ apiKey: key });
}

function withTask(parts: GuideContentPart[], task: string): GuideContentPart[] {
  const [first, ...rest] = parts;
  if (!first || !('text' in first)) return [{ text: task }, ...parts];
  return [{ text: `${task}\n\n${first.text}` }, ...rest];
}

interface ModuleResult {
  value: unknown;
  /** False when the module ran without Google Search, so nothing in it is web-sourced. */
  searchUsed: boolean;
}

async function generateGeminiJson(options: {
  system: string;
  parts: GuideContentPart[];
  search: boolean;
}): Promise<ModuleResult> {
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
    return { value: parseJsonResponse<unknown>(response.text), searchUsed: search };
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

async function generateClaudeJson(options: {
  system: string;
  parts: GuideContentPart[];
}): Promise<unknown> {
  try {
    return await generateAnthropicJson(options);
  } catch (firstErr) {
    console.warn(
      '[Guide writing] Claude retry:',
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
    return generateAnthropicJson(options);
  }
}

/**
 * Writing → Claude when ANTHROPIC_API_KEY is set; Gemini Pro (search off) if the key is missing.
 * Claude API failures also fall back to Gemini Pro so Guide does not hard-break.
 */
async function generateModuleJson(options: {
  moduleId: PaidGuideModuleId;
  system: string;
  parts: GuideContentPart[];
}): Promise<ModuleResult> {
  const route = resolveGuideModuleRoute(options.moduleId, Boolean(getAnthropicApiKey()));
  if (route.provider === 'anthropic') {
    try {
      const value = await generateClaudeJson({
        system: options.system,
        parts: options.parts,
      });
      return { value, searchUsed: false };
    } catch (err) {
      console.error(
        `[Guide writing] Claude failed for ${options.moduleId}; falling back to Gemini Pro (search off):`,
        err instanceof Error ? err.message : err,
      );
      return generateGeminiJson({
        system: options.system,
        parts: options.parts,
        search: false,
      });
    }
  }

  return generateGeminiJson({
    system: options.system,
    parts: options.parts,
    search: route.search,
  });
}

/**
 * Paid modules after the Flash-Lite snapshot.
 * Items 4, 5, and 6-retrieval run together with Search (Gemini Pro).
 * Item 6 answers wait for retrieval. Item 7 waits for the salary module.
 * Item 3 rewrite / answers / negotiation call Claude (search off).
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

  if (!getAnthropicApiKey()) {
    console.error(
      '[Guide writing] ANTHROPIC_API_KEY is missing. resume_rewrite, question_answers, and negotiation will fall back to Gemini Pro (search off).',
    );
  }

  const settled = await Promise.allSettled([
    generateModuleJson({
      moduleId: 'resume_rewrite',
      system: system(REWRITE_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nRewrite the hard gaps only. Do not search.`),
    }),
    generateModuleJson({
      moduleId: 'salary_land',
      system: system(SALARY_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch for this candidate's pay landing.`),
    }),
    generateModuleJson({
      moduleId: 'company_intel',
      system: system(COMPANY_MODULE_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch company and role reputation, including H-1B.`),
    }),
    generateModuleJson({
      moduleId: 'question_retrieval',
      system: system(QUESTION_RETRIEVAL_PROMPT),
      parts: withTask(input.parts, `${hints}\nSearch interview questions from the last three years.`),
    }),
  ]);

  const [rewriteRes, salaryRes, companyRes, retrievalRes] = settled;
  const modules = emptyGuideModules();

  if (rewriteRes.status === 'fulfilled') {
    const row = rewriteRes.value.value;
    const list = row && typeof row === 'object' ? (row as { rewrites?: unknown }).rewrites : undefined;
    modules.resume_rewrites = parseRewrites(list);
  } else {
    limitations.push('Resume rewrite module failed.');
  }

  let salarySearched = false;
  if (salaryRes.status === 'fulfilled') {
    salarySearched = salaryRes.value.searchUsed;
    modules.salary_land = parseSalaryLand(salaryRes.value.value) ?? modules.salary_land;
    if (!salarySearched) limitations.push('Salary search unavailable; pay landing is a closed-book estimate.');
  } else {
    limitations.push('Salary landing module failed.');
  }

  let companySearched = false;
  if (companyRes.status === 'fulfilled') {
    companySearched = companyRes.value.searchUsed;
    modules.company_eval = parseCompanyEval(companyRes.value.value) ?? modules.company_eval;
    if (!companySearched) limitations.push('Company search unavailable; company and role notes are not web-sourced.');
  } else {
    limitations.push('Company evaluation module failed.');
  }

  let retrievedQuestions: ReturnType<typeof parseGuideQuestions> = [];
  let retrievalSearched = false;
  let process = '';
  let questionSummary = '';
  const retrieval = retrievalRes.status === 'fulfilled' ? retrievalRes.value : null;
  if (retrieval && retrieval.value && typeof retrieval.value === 'object') {
    const row = retrieval.value as { questions?: unknown; process?: unknown; summary?: unknown };
    retrievalSearched = retrieval.searchUsed;
    retrievedQuestions = parseGuideQuestions(row.questions);
    process = typeof row.process === 'string' ? row.process : '';
    questionSummary = typeof row.summary === 'string' ? row.summary : '';
    if (!retrievalSearched) limitations.push('Interview search unavailable; all questions are predicted.');
  } else {
    limitations.push('Interview question retrieval failed.');
  }

  const dead = await findDeadSourceUrls(
    collectGuideSourceUrls(retrievedQuestions, modules.salary_land, modules.company_eval),
    input.sourceFetch,
  );
  if (dead.size > 0) limitations.push(`Dropped ${dead.size} cited link(s) that returned 404/410.`);
  retrievedQuestions = auditQuestions(retrievedQuestions, dead, retrievalSearched);
  modules.salary_land = {
    ...modules.salary_land,
    sources: auditSources(modules.salary_land.sources, dead, salarySearched),
  };
  modules.company_eval = {
    ...modules.company_eval,
    sources: auditSources(modules.company_eval.sources, dead, companySearched),
    role_sources: auditSources(modules.company_eval.role_sources, dead, companySearched),
  };
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
    generateModuleJson({
      moduleId: 'question_answers',
      system: system(QUESTION_ANSWER_PROMPT),
      parts: withTask(input.parts, `Answer only these questions.\n${answerTask}`),
    }),
    generateModuleJson({
      moduleId: 'negotiation',
      system: system(NEGOTIATION_MODULE_PROMPT),
      parts: withTask(input.parts, `Salary land already estimated:\n${salaryTask}`),
    }),
  ]);

  if (writing[0].status === 'fulfilled') {
    modules.interview_bank = applyInterviewAnswers(modules.interview_bank, writing[0].value.value);
  } else {
    limitations.push('Interview answer module failed.');
  }

  if (writing[1].status === 'fulfilled') {
    modules.negotiation = parseNegotiation(writing[1].value.value) ?? modules.negotiation;
  } else {
    limitations.push('Negotiation module failed.');
  }

  modules.limitations = limitations;
  return modules;
}
