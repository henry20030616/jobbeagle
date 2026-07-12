import { describe, expect, it } from 'vitest';
import {
  classifyJobInput,
  extractUrls,
  isAllowedPublicAtsHost,
} from '@/lib/url-parser-logic';

describe('url-parser-logic', () => {
  it('classifies plain JD text', () => {
    const r = classifyJobInput(
      'Responsibilities include building APIs. Requirements: 3 years experience.',
    );
    expect(r.kind).toBe('plain');
    expect(r.url).toBeNull();
  });

  it('detects Greenhouse public ATS', () => {
    const r = classifyJobInput(
      'https://boards.greenhouse.io/acme/jobs/1234567',
    );
    expect(r.kind).toBe('public_ats');
    expect(r.atsId).toBe('greenhouse');
  });

  it('detects Lever public ATS', () => {
    const r = classifyJobInput('https://jobs.lever.co/acme/abcd-efgh');
    expect(r.kind).toBe('public_ats');
    expect(r.atsId).toBe('lever');
  });

  it('blocks LinkedIn job URLs', () => {
    const r = classifyJobInput(
      'https://www.linkedin.com/jobs/view/123456/?refId=abc',
    );
    expect(r.kind).toBe('blocked_board');
    expect(r.boardId).toBe('linkedin');
  });

  it('blocks Indeed URLs', () => {
    const r = classifyJobInput(
      'https://www.indeed.com/viewjob?jk=abcdef',
    );
    expect(r.kind).toBe('blocked_board');
    expect(r.boardId).toBe('indeed');
  });

  it('blocks Glassdoor URLs', () => {
    const r = classifyJobInput(
      'https://www.glassdoor.com/job-listing/software-engineer-JV_IC123.htm',
    );
    expect(r.kind).toBe('blocked_board');
    expect(r.boardId).toBe('glassdoor');
  });

  it('blocks ZipRecruiter URLs', () => {
    const r = classifyJobInput(
      'https://www.ziprecruiter.com/jobs/software-engineer-abc',
    );
    expect(r.kind).toBe('blocked_board');
    expect(r.boardId).toBe('ziprecruiter');
  });

  it('blocks GovernmentJobs URLs', () => {
    const r = classifyJobInput(
      'https://www.governmentjobs.com/careers/colorado/jobs/4611796/analyst',
    );
    expect(r.kind).toBe('blocked_board');
    expect(r.boardId).toBe('governmentjobs');
  });

  it('prefers blocked board when mixed with ATS', () => {
    const r = classifyJobInput(
      'See https://www.linkedin.com/jobs/view/1 and https://boards.greenhouse.io/x/jobs/2',
    );
    expect(r.kind).toBe('blocked_board');
  });

  it('treats lone unsupported URL as other_url', () => {
    const r = classifyJobInput('https://example.com/careers/123');
    expect(r.kind).toBe('other_url');
  });

  it('extractUrls strips trailing punctuation', () => {
    expect(extractUrls('See https://jobs.lever.co/acme/x.')).toEqual([
      'https://jobs.lever.co/acme/x',
    ]);
  });

  it('allowlists only public ATS hosts for server fetch', () => {
    expect(isAllowedPublicAtsHost('boards.greenhouse.io')).toBe(true);
    expect(isAllowedPublicAtsHost('jobs.lever.co')).toBe(true);
    expect(isAllowedPublicAtsHost('www.linkedin.com')).toBe(false);
    expect(isAllowedPublicAtsHost('www.indeed.com')).toBe(false);
  });
});
