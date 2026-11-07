import { describe, expect, it, vi } from 'vitest';
import type { GuideQuestion } from '@/types';
import {
  auditQuestions,
  auditSources,
  findDeadSourceUrls,
  isSourceUrlDead,
  type SourceFetch,
} from '@/lib/guide-source-audit';

const reported: GuideQuestion = {
  question: 'Walk me through a SQL reconciliation.',
  track: 'professional',
  origin: 'reported',
  proximity: 'same_company_role',
  source_url: 'https://www.glassdoor.com/Interview/real',
  source_date: '2025',
  answer: '',
};

function statusFetch(statusByUrl: Record<string, number>): SourceFetch {
  return async (url) => ({ status: statusByUrl[url] ?? 200, body: null });
}

describe('isSourceUrlDead', () => {
  it('treats 404 and 410 as dead', async () => {
    expect(await isSourceUrlDead('https://a.test/x', statusFetch({ 'https://a.test/x': 404 }))).toBe(true);
    expect(await isSourceUrlDead('https://a.test/x', statusFetch({ 'https://a.test/x': 410 }))).toBe(true);
  });

  it('keeps pages that block bots or rate-limit', async () => {
    for (const status of [200, 301, 401, 403, 429, 500]) {
      expect(await isSourceUrlDead('https://a.test/x', statusFetch({ 'https://a.test/x': status }))).toBe(false);
    }
  });

  it('keeps the link when the request errors or times out', async () => {
    const failing: SourceFetch = async () => {
      throw new Error('ENOTFOUND');
    };
    expect(await isSourceUrlDead('https://a.test/x', failing)).toBe(false);

    const hanging: SourceFetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    expect(await isSourceUrlDead('https://a.test/x', hanging, 5)).toBe(false);
  });
});

describe('findDeadSourceUrls', () => {
  it('checks each unique URL once', async () => {
    const fetchImpl = vi.fn(statusFetch({ 'https://a.test/gone': 404 }));
    const dead = await findDeadSourceUrls(
      ['https://a.test/gone', 'https://a.test/gone', 'https://a.test/ok', ''],
      fetchImpl,
    );
    expect([...dead]).toEqual(['https://a.test/gone']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('auditQuestions', () => {
  it('keeps reported questions when search ran and the page exists', () => {
    expect(auditQuestions([reported], new Set(), true)).toEqual([reported]);
  });

  it('downgrades reported questions with a dead link to predicted', () => {
    const [row] = auditQuestions([reported], new Set([reported.source_url ?? '']), true);
    expect(row).toMatchObject({ origin: 'predicted', source_url: null, proximity: null, source_date: null });
    expect(row.question).toBe(reported.question);
  });

  it('downgrades every reported question when search did not run', () => {
    const [row] = auditQuestions([reported], new Set(), false);
    expect(row.origin).toBe('predicted');
  });
});

describe('auditSources', () => {
  const sources = [
    { title: 'Live', url: 'https://a.test/live' },
    { title: 'Gone', url: 'https://a.test/gone' },
  ];

  it('drops dead links', () => {
    expect(auditSources(sources, new Set(['https://a.test/gone']), true)).toEqual([sources[0]]);
  });

  it('drops all sources when search did not run', () => {
    expect(auditSources(sources, new Set(), false)).toEqual([]);
  });
});
