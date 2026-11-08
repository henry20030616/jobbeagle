import { describe, expect, it } from 'vitest';
import {
  analyzeBodyTooLarge,
  readAnalyzeResponseJson,
} from '@/lib/analyze-client';
import { MAX_ANALYZE_BODY_CHARS } from '@/constants/models';

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
