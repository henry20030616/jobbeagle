import type { GuideModules, GuideQuestion, GuideSource } from '@/types';

/**
 * Server-side source hygiene for Guide intel. We never store page bodies here;
 * we only ask whether a cited URL still exists.
 *
 * Only 404 / 410 count as dead. 401 / 403 / 429 and network errors stay, because
 * Glassdoor, Blind, LinkedIn and others routinely block server requests for real pages.
 */
export type SourceFetch = (
  url: string,
  init: { method: 'GET'; redirect: 'follow'; signal: AbortSignal; headers: Record<string, string> },
) => Promise<{ status: number; body?: { cancel?: () => Promise<void> } | null }>;

const DEAD_STATUS = new Set([404, 410]);
const DEFAULT_TIMEOUT_MS = 3500;
const MAX_URLS_CHECKED = 40;

export async function isSourceUrlDead(
  url: string,
  fetchImpl: SourceFetch = fetch,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'JobBeagleLinkCheck/1.0 (+https://www.jobbeagle.com)' },
    });
    await res.body?.cancel?.().catch(() => undefined);
    return DEAD_STATUS.has(res.status);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function findDeadSourceUrls(
  urls: readonly string[],
  fetchImpl: SourceFetch = fetch,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Set<string>> {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_URLS_CHECKED);
  const results = await Promise.all(
    unique.map(async (url) => ({ url, dead: await isSourceUrlDead(url, fetchImpl, timeoutMs) })),
  );
  return new Set(results.filter((row) => row.dead).map((row) => row.url));
}

export function downgradeQuestion(question: GuideQuestion): GuideQuestion {
  if (question.origin !== 'reported') return question;
  return { ...question, origin: 'predicted', proximity: null, source_url: null, source_date: null };
}

/** Reported questions keep their label only when search ran and the cited page still exists. */
export function auditQuestions(
  questions: readonly GuideQuestion[],
  dead: ReadonlySet<string>,
  searchUsed: boolean,
): GuideQuestion[] {
  return questions.map((question) => {
    if (question.origin !== 'reported') return question;
    if (!searchUsed || !question.source_url || dead.has(question.source_url)) {
      return downgradeQuestion(question);
    }
    return question;
  });
}

export function auditSources(
  sources: readonly GuideSource[],
  dead: ReadonlySet<string>,
  searchUsed: boolean,
): GuideSource[] {
  if (!searchUsed) return [];
  return sources.filter((source) => !dead.has(source.url));
}

export function collectGuideSourceUrls(
  questions: readonly GuideQuestion[],
  salary: GuideModules['salary_land'],
  company: GuideModules['company_eval'],
): string[] {
  return [
    ...questions.flatMap((question) => (question.source_url ? [question.source_url] : [])),
    ...salary.sources.map((source) => source.url),
    ...company.sources.map((source) => source.url),
    ...company.role_sources.map((source) => source.url),
  ];
}
