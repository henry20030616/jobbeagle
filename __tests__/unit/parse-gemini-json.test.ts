import { describe, it, expect } from 'vitest';
import {
  parseJsonResponse,
  repairTruncatedJson,
} from '@/lib/parse-gemini-json';

describe('parse-gemini-json', () => {
  it('parses valid JSON', () => {
    const r = parseJsonResponse<{ a: number }>('{"a":1}');
    expect(r.a).toBe(1);
  });

  it('strips markdown fences', () => {
    const r = parseJsonResponse<{ ok: boolean }>('```json\n{"ok":true}\n```');
    expect(r.ok).toBe(true);
  });

  it('repairs truncated string mid-object', () => {
    const truncated =
      '{"match_score":72,"job_title":"PM","company_name":"MaiCoin","recruiter_verdict":"Strong fit but missing ';
    const repaired = repairTruncatedJson(truncated);
    expect(() => JSON.parse(repaired)).not.toThrow();
    const r = parseJsonResponse<{ match_score: number; company_name: string }>(
      truncated,
    );
    expect(r.match_score).toBe(72);
    expect(r.company_name).toBe('MaiCoin');
  });

  it('repairs truncated nested array', () => {
    const truncated =
      '{"custom_star_interview_bank":["Q1 about leadership","Q2 about conflict';
    const r = parseJsonResponse<{ custom_star_interview_bank: string[] }>(
      truncated,
    );
    expect(r.custom_star_interview_bank).toHaveLength(2);
  });
});
