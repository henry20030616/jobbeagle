import { describe, expect, it } from 'vitest';
import { formatJobSourceDate, jobSourceFromUrl } from '@/lib/job-source';

describe('jobSourceFromUrl', () => {
  it('maps common boards', () => {
    expect(jobSourceFromUrl('https://www.linkedin.com/jobs/view/123')).toBe('LinkedIn');
    expect(jobSourceFromUrl('https://www.indeed.com/viewjob?jk=x')).toBe('Indeed');
  });
});

describe('formatJobSourceDate', () => {
  it('formats LinkedIn + date', () => {
    expect(formatJobSourceDate('LinkedIn', '2026-06-18')).toBe('LinkedIn 2026-06-18');
  });
});
