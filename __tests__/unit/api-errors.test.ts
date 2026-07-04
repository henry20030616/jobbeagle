import { describe, it, expect } from 'vitest';
import { translateApiError, type ApiErrorCode } from '@/lib/api-errors';
import type { AppLanguage } from '@/lib/language-context';

const ALL_CODES: ApiErrorCode[] = [
  'AUTH_REQUIRED',
  'COMPANY_NAME_REQUIRED',
  'JOB_TITLE_REQUIRED',
  'VIDEO_URL_REQUIRED',
  'DESCRIPTION_TOO_SHORT',
  'INVALID_EMAIL',
  'INVALID_APPLY_URL',
  'VIDEO_LIMIT_REACHED',
  'MISSING_FIELDS',
  'DUPLICATE_APPLICATION',
  'RATE_LIMITED',
  'APPLICATION_FAILED',
  'SERVER_ERROR',
];

const LANGS: AppLanguage[] = ['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'];

describe('translateApiError', () => {
  it.each(ALL_CODES)('returns non-empty message for code %s in en', (code) => {
    const msg = translateApiError(code, undefined, 'en');
    expect(msg.length).toBeGreaterThan(0);
  });

  it.each(ALL_CODES)('returns zh-TW message for code %s', (code) => {
    const msg = translateApiError(code, undefined, 'zh-TW');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toBe(translateApiError(code, undefined, 'en'));
  });

  it('falls back to provided message when code unknown', () => {
    expect(translateApiError('NOT_A_REAL_CODE', 'Custom error', 'en')).toBe('Custom error');
  });

  it('falls back to SERVER_ERROR when code unknown and no fallback', () => {
    const msg = translateApiError(null, undefined, 'en');
    expect(msg).toBe(translateApiError('SERVER_ERROR', undefined, 'en'));
  });

  it.each(LANGS)('SERVER_ERROR has message for lang %s', (lang) => {
    expect(translateApiError('SERVER_ERROR', undefined, lang).length).toBeGreaterThan(0);
  });
});
