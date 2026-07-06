import { describe, it, expect } from 'vitest';
import {
  decodeBase64Utf8,
  payloadToPreFlightData,
} from '@/lib/payload';
import type { ExtensionJobPayload } from '@/types';

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
});
