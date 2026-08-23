import { describe, it, expect } from 'vitest';
import {
  decodeBase64Utf8,
  formatCapturedJd,
  payloadToPreFlightData,
} from '@/lib/payload';
import type { ExtensionJobPayload } from '@/types';
import { getExtensionScrapeError } from '@/constants/extension-scrape-errors';

function encodePayload(obj: unknown): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json, 'utf-8').toString('base64');
}

describe('payload decode', () => {
  it('decodes UTF-8 Chinese titles', () => {
    const encoded = encodePayload({
      pageTitle: '資深工程師 | Acme Corp | LinkedIn',
      pageUrl: 'https://www.linkedin.com/jobs/view/123',
      rawText: '職位：資深工程師\n\n公司：Acme Corp\n\n'.repeat(10),
      jobId: '123',
    });
    const json = decodeBase64Utf8(encoded);
    const parsed = JSON.parse(json) as ExtensionJobPayload;
    const pf = payloadToPreFlightData(parsed);
    expect(pf.job_title).toBe('資深工程師');
    expect(pf.company_name).toBe('Acme Corp');
    expect(pf.raw_jd.length).toBeGreaterThan(40);
  });

  it('rejects LinkedIn collection page titles without company', () => {
    const pf = payloadToPreFlightData({
      pageTitle: '精選職缺 | LinkedIn',
      pageUrl: 'https://www.linkedin.com/jobs/collections/recommended/',
      rawText: 'x'.repeat(50),
      jobId: 'unknown',
    });
    expect(pf.company_name).toBe('Unknown Company');
    expect(pf.job_title).toBe('Unknown Role');
  });

  it('parses English "Title at Company" format', () => {
    const pf = payloadToPreFlightData({
      pageTitle: 'Staff Engineer at Meta',
      pageUrl: 'https://www.linkedin.com/jobs/view/1',
      rawText: '職位：Staff Engineer\n公司：Meta\n' + 'desc '.repeat(20),
      jobId: '1',
    });
    expect(pf.job_title).toBe('Staff Engineer');
    expect(pf.company_name).toBe('Meta');
  });

  it('prefers structured jobTitle/companyName from scrape', () => {
    const pf = payloadToPreFlightData({
      pageTitle: '精選職缺 | LinkedIn',
      pageUrl: 'https://www.linkedin.com/jobs/view/99',
      rawText: '職位：AI Engineer\n公司：OpenAI\n' + 'y'.repeat(40),
      jobId: '99',
      jobTitle: 'AI Engineer',
      companyName: 'OpenAI',
    });
    expect(pf.job_title).toBe('AI Engineer');
    expect(pf.company_name).toBe('OpenAI');
  });

  it('parses GovernmentJobs department label from rawText', () => {
    const pf = payloadToPreFlightData({
      pageTitle: 'Analyst | State of Colorado',
      pageUrl: 'https://www.governmentjobs.com/careers/colorado/jobs/4611796/x',
      rawText:
        '職位：ACSES Financial Operations Analyst\n\n公司：Colorado Department of Human Services\n\n'
        + 'Description of Job\n' + 'duty '.repeat(20),
      jobId: '4611796',
      jobTitle: 'ACSES Financial Operations Analyst',
      companyName: 'Colorado Department of Human Services',
    });
    expect(pf.job_title).toContain('Financial Operations');
    expect(pf.company_name).toContain('Human Services');
  });
});

describe('formatCapturedJd', () => {
  it('returns raw JD when company or title already appears in the body', () => {
    const raw = 'Company: Acme\nTitle: Engineer\n\nBuild APIs.';
    expect(
      formatCapturedJd({
        company_name: 'Acme',
        job_title: 'Engineer',
        raw_jd: raw,
      }),
    ).toBe(raw);
  });

  it('prepends Company/Title when the body has neither', () => {
    const raw = 'Own the roadmap and ship weekly.'.repeat(2);
    expect(
      formatCapturedJd({
        company_name: 'Acme',
        job_title: 'PM',
        raw_jd: raw,
      }),
    ).toBe(`Company: Acme\nTitle: PM\n\n${raw}`);
  });
});

describe('getExtensionScrapeError', () => {
  it('returns English copy for unknown language codes', () => {
    expect(getExtensionScrapeError('no_job_page', 'en')).toContain('LinkedIn');
    expect(getExtensionScrapeError('no_job_page', 'es')).toContain('LinkedIn');
  });

  it('returns null for unknown keys', () => {
    expect(getExtensionScrapeError('not_a_real_key', 'en')).toBeNull();
  });
});
