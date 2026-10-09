import { describe, expect, it } from 'vitest';
import { validateJobDescription } from '@/lib/validate-job-description';
import {
  jdPasteSteps,
  jdTooShortMessage,
  jdUrlOnlyMessage,
  MIN_JD_CHARS,
} from '@/lib/jd-paste-help';

describe('jd paste help', () => {
  it('teaches copying the detail panel, not the URL', () => {
    const en = jdPasteSteps('en');
    expect(en).toMatch(/right-hand panel/i);
    expect(en).toMatch(/not the link/i);
    const zh = jdPasteSteps('zh-TW');
    expect(zh).toMatch(/詳情/);
    expect(zh).toMatch(/不要只貼連結/);
  });

  it('rejects URL-only with the copy recipe', () => {
    const r = validateJobDescription('https://www.example.com/jobs/1', 'en');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('JD_URL_ONLY');
    expect(r.message).toBe(jdUrlOnlyMessage('en'));
  });

  it('rejects short text with a character count', () => {
    const r = validateJobDescription('hello job', 'en');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('JD_TOO_SHORT');
    expect(r.message).toBe(jdTooShortMessage('en', 'hello job'.length));
    expect(r.message).toContain(`${'hello job'.length}/${MIN_JD_CHARS}`);
  });
});
