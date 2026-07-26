import { describe, it, expect, beforeAll } from 'vitest';
import { createHmac } from 'crypto';
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

  it('rejects tampered handoff signature', () => {
    const sid = createHandoffToken({
      pageTitle: 'Role',
      pageUrl: 'https://www.linkedin.com/jobs/view/1',
      rawText: 'Enough job description text for validation. '.repeat(3),
      jobId: '1',
    });
    const [payload] = sid.split('.');
    expect(() => verifyHandoffToken(`${payload}.bad-signature-padding-xxx`)).toThrow(
      /signature/i,
    );
  });

  it('rejects expired handoff token', () => {
    const secret = process.env.CRON_SECRET as string;
    const payload = {
      pageTitle: 'Role',
      pageUrl: 'https://www.linkedin.com/jobs/view/1',
      rawText: 'Enough job description text for validation. '.repeat(3),
      jobId: '1',
      exp: Date.now() - 1000,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    expect(() => verifyHandoffToken(`${payloadB64}.${signature}`)).toThrow(/expired/i);
  });
});
