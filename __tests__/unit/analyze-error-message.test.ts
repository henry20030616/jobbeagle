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

  it('detects broken Word/DOCX (jszip) failures', () => {
    expect(
      classifyAnalyzeError(
        "Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html",
      ),
    ).toBe('resume_pdf');
  });
});

describe('toUserFacingAnalyzeError for resume files', () => {
  it('maps jszip Word failures to plain-language re-upload guidance', () => {
    const { message, kind, code } = toUserFacingAnalyzeError(
      "Can't find end of central directory : is this a zip file ?",
      'en',
    );
    expect(kind).toBe('resume_pdf');
    expect(code).toBe('RESUME_PDF_UNREADABLE');
    expect(message.toLowerCase()).toMatch(/couldn't read|resume|pdf|word|paste/);
    expect(message).not.toMatch(/central directory|jszip|stub|\.docx|legacy/i);
  });
});

describe('toUserFacingAnalyzeError', () => {
  it('returns Traditional Chinese without JSON or billing wording', () => {
    const { message, code, kind } = toUserFacingAnalyzeError(geminiJson, 'zh-TW');
    expect(kind).toBe('ai_quota');
    expect(code).toBe('AI_QUOTA_EXHAUSTED');
    expect(message).toContain('請求量較大');
    expect(message).toContain('未扣除您的報告額度');
    expect(message).not.toMatch(/\{|ai\.studio|RESOURCE_EXHAUSTED|402|額度已用完|AI 服務/);
  });

  it('localizes English as high load without quota wording', () => {
    const { message } = toUserFacingAnalyzeError(geminiJson, 'en');
    expect(message).toContain('temporarily busy');
    expect(message.toLowerCase()).not.toMatch(/quota|depleted|billing|ai\.studio|provider/);
  });

  it('falls back to a generic sentence for technical unknown errors', () => {
    const { message, kind } = toUserFacingAnalyzeError('Error: socket hang up', 'zh-TW');
    expect(kind).toBe('generic');
    expect(message).toContain('沒能完成分析');
    expect(message).not.toContain('socket hang up');
    expect(message).not.toMatch(/Gemini|API Key|F12|JSON|jszip/i);
  });

  it('maps Vercel 413 / JSON parse of Request Entity to resume re-upload guidance', () => {
    const raw = `Unexpected token 'R', "Request En"... is not valid JSON`;
    expect(classifyAnalyzeError(raw)).toBe('resume_pdf');
    expect(classifyAnalyzeError('Request Entity Too Large')).toBe('resume_pdf');
    const { message, kind, code } = toUserFacingAnalyzeError(raw, 'en');
    expect(kind).toBe('resume_pdf');
    expect(code).toBe('RESUME_PDF_UNREADABLE');
    expect(message.toLowerCase()).toMatch(/couldn't read|resume|pdf|word|paste/);
    expect(message).not.toMatch(/Unexpected token|Request En|valid JSON/i);
  });

  it('keeps a clean API sentence already localized for the user', () => {
    const prior =
      '目前系統分析請求量較大，服務暫時忙碌中。這不是您的帳號問題，系統也未扣除您的報告額度，請稍後再試。';
    const { message, kind } = toUserFacingAnalyzeError(prior, 'zh-TW');
    expect(kind).toBe('generic');
    expect(message).toBe(prior);
  });
});
