import { describe, expect, it } from 'vitest';
import {
  analyzeBodyTooLarge,
  buildAnalyzeRequestBody,
  readAnalyzeResponseJson,
} from '@/lib/analyze-client';
import { MAX_ANALYZE_BODY_CHARS, MAX_JD_CHARS } from '@/constants/models';

describe('readAnalyzeResponseJson', () => {
  it('maps plain-text Request Entity Too Large to PAYLOAD_TOO_LARGE', async () => {
    const res = new Response('Request Entity Too Large', { status: 413 });
    const parsed = await readAnalyzeResponseJson(res);
    expect(parsed.ok).toBe(false);
    expect(parsed.status).toBe(413);
    expect(parsed.data.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('parses normal JSON bodies', async () => {
    const res = new Response(JSON.stringify({ report_id: 'abc', ok: true }), {
      status: 200,
    });
    const parsed = await readAnalyzeResponseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data.report_id).toBe('abc');
  });
});

describe('analyzeBodyTooLarge', () => {
  it('flags oversized serialized bodies', () => {
    expect(analyzeBodyTooLarge('x'.repeat(MAX_ANALYZE_BODY_CHARS + 1))).toBe(true);
    expect(analyzeBodyTooLarge('small')).toBe(false);
  });
});

describe('buildAnalyzeRequestBody', () => {
  const resume = { type: 'text' as const, content: 'resume text here' };

  it('prefers truncated jobDescription over a huge handoff_sid', () => {
    const hugeSid = `eyJ.${'a'.repeat(50_000)}`;
    const longJd = `Company: Acme\nTitle: PM\n${'duty '.repeat(5_000)}`;
    const { body, serialized } = buildAnalyzeRequestBody({
      reportType: 'job_fit_snapshot',
      resume,
      language: 'en',
      jobDescription: longJd,
      handoffSid: hugeSid,
    });
    expect(body.jobDescription).toBe(longJd.slice(0, MAX_JD_CHARS));
    expect(body.handoff_sid).toBeUndefined();
    expect(serialized.length).toBeLessThan(hugeSid.length);
  });

  it('falls back to handoff_sid only when JD is empty', () => {
    const { body } = buildAnalyzeRequestBody({
      reportType: 'job_fit_snapshot',
      resume,
      language: 'en',
      jobDescription: '   ',
      handoffSid: 'token.sig',
    });
    expect(body.handoff_sid).toBe('token.sig');
    expect(body.jobDescription).toBeUndefined();
  });
});
