import { describe, expect, it } from 'vitest';
import {
  extractJobIdentity,
  isUsableCompanyName,
  isUsableJobTitle,
} from '@/lib/job-identity';
import { validateJobDescription } from '@/lib/validate-job-description';

const enoughBody = `
Responsibilities:
- Lead product roadmap and ship features with engineering.
Requirements:
- 5+ years experience as a Product Manager.
Compensation:
- Competitive salary and benefits.
`.trim();

describe('job identity', () => {
  it('extracts Company / Title labeled lines', () => {
    const id = extractJobIdentity(
      `Company: Acme Corp\nTitle: Senior PM\n\n${enoughBody}`,
    );
    expect(id.company).toBe('Acme Corp');
    expect(id.title).toBe('Senior PM');
  });

  it('treats Unknown Company / Unknown Role as unusable', () => {
    expect(isUsableCompanyName('Unknown Company')).toBe(false);
    expect(isUsableCompanyName('未知公司')).toBe(false);
    expect(isUsableCompanyName('Acme')).toBe(true);
    expect(isUsableJobTitle('Unknown Role')).toBe(false);
    expect(isUsableJobTitle('Product Manager')).toBe(true);
  });

  it('rejects a JD that has duties but no company name', () => {
    const r = validateJobDescription(
      `Title: Product Manager\n\n${enoughBody}`,
      'en',
    );
    expect(r.valid).toBe(false);
    expect(r.code).toBe('JD_MISSING_COMPANY');
    expect(r.message.toLowerCase()).toMatch(/company/);
  });

  it('rejects a JD that has company but no job title', () => {
    const r = validateJobDescription(
      `Company: Acme Corp\n\n${enoughBody}`,
      'en',
    );
    expect(r.valid).toBe(false);
    expect(r.code).toBe('JD_MISSING_TITLE');
  });

  it('rejects placeholder Company: Unknown Company', () => {
    const r = validateJobDescription(
      `Company: Unknown Company\nTitle: PM\n\n${enoughBody}`,
      'en',
    );
    expect(r.valid).toBe(false);
    expect(r.code).toBe('JD_MISSING_COMPANY');
  });

  it('accepts a complete labeled JD', () => {
    const r = validateJobDescription(
      `Company: Acme Corp\nTitle: Product Manager\n\n${enoughBody}`,
      'en',
    );
    expect(r.valid).toBe(true);
  });
});
