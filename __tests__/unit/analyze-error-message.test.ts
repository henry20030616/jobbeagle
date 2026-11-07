import { describe, expect, it } from 'vitest';
import {
  classifyAnalyzeError,
  toUserFacingAnalyzeError,
} from '@/lib/analyze-error-message';

const geminiJson =
  '{"error":{"code":402,"message":"Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing.","status":"RESOURCE_EXHAUSTED"}}';

describe('classifyAnalyzeError', () => {
  it('detects Gemini prepaid quota JSON', () => {
    expect(classifyAnalyzeError(geminiJson)).toBe('ai_quota');
  });

  it('detects billing quota wording', () => {
    expect(
      classifyAnalyzeError(
        '{"error":{"code":402,"message":"Your quota has been reached. Please check billing.","status":"RESOURCE_EXHAUSTED"}}',
      ),
    ).toBe('ai_quota');
  });

  it('detects resume PDF decode failures', () => {
    expect(classifyAnalyzeError('Base64 decoding failed for inline_data.data')).toBe('resume_pdf');
  });
});

describe('toUserFacingAnalyzeError', () => {
  it('returns Traditional Chinese without JSON or AI Studio links', () => {
    const { message, code, kind } = toUserFacingAnalyzeError(geminiJson, 'zh-TW');
    expect(kind).toBe('ai_quota');
    expect(code).toBe('AI_QUOTA_EXHAUSTED');
    expect(message).toContain('分析服務暫時無法回應');
    expect(message).toContain('不是您的報告額度');
    expect(message).not.toMatch(/\{|ai\.studio|RESOURCE_EXHAUSTED|402/);
  });

  it('localizes English', () => {
    const { message } = toUserFacingAnalyzeError(geminiJson, 'en');
    expect(message).toContain('temporarily unavailable');
    expect(message).not.toContain('ai.studio');
  });

  it('falls back to a generic sentence for technical unknown errors', () => {
    const { message, kind } = toUserFacingAnalyzeError('Error: socket hang up', 'zh-TW');
    expect(kind).toBe('generic');
    expect(message).toContain('分析暫時失敗');
    expect(message).not.toContain('socket hang up');
  });

  it('keeps a clean API sentence already localized for the user', () => {
    const prior = '分析服務暫時無法回應（AI 服務額度已用完）。這不是您的報告額度問題，系統也未扣除您的報告次數。請稍後再試。';
    const { message, kind } = toUserFacingAnalyzeError(prior, 'zh-TW');
    expect(kind).toBe('generic');
    expect(message).toBe(prior);
  });
});
