import { describe, it, expect, beforeAll } from 'vitest';
import {
  createHandoffToken,
  verifyHandoffToken,
  validateCaptureInput,
} from '@/lib/extension-handoff';

beforeAll(() => {
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-handoff-secret';
});

describe('extension handoff', () => {
  it('round-trips capture data in signed sid', () => {
    const input = {
      pageTitle: 'AI Analyst | MediaTek',
      pageUrl: 'https://www.linkedin.com/jobs/search/?currentJobId=123',
      rawText: '職位：AI Analyst\n\n公司：MediaTek\n\n' + '描述 '.repeat(30),
      jobId: '123',
      jobTitle: 'AI Analyst',
      companyName: 'MediaTek',
    };
    const sid = createHandoffToken(input);
    const payload = verifyHandoffToken(sid);
    expect(payload.rawText).toContain('MediaTek');
    expect(payload.jobId).toBe('123');
    expect(payload.jobTitle).toBe('AI Analyst');
    expect(payload.companyName).toBe('MediaTek');
  });

  it('rejects short job text on capture', () => {
    expect(() =>
      validateCaptureInput({
        pageTitle: 'x',
        pageUrl: 'https://linkedin.com/jobs/view/1',
        rawText: 'too short',
        jobId: '1',
      }),
    ).toThrow(/too short/i);
  });
});
