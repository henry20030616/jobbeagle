import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { __resetMemoryRateLimitForTests } from '@/lib/rate-limit';
import { createHandoffToken } from '@/lib/extension-handoff';
import { OPTIONS, POST, GET } from '@/app/api/extension-capture/route';

beforeAll(() => {
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-ext-capture-secret';
});

const VALID_BODY = {
  pageTitle: 'Senior BA | Fintech Co',
  pageUrl: 'https://www.linkedin.com/jobs/view/999',
  rawText: '職位：Senior BA\n公司：Fintech Co\n\n' + 'Requirements and duties. '.repeat(8),
  jobId: '999',
  jobTitle: 'Senior BA',
  companyName: 'Fintech Co',
};

describe('OPTIONS /api/extension-capture', () => {
  it('returns 204 with CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('POST /api/extension-capture', () => {
  beforeEach(() => {
    __resetMemoryRateLimitForTests();
  });

  it('returns signed sid and confirm URL for valid capture', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/extension-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_BODY),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sid).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(json.preflightUrl).toContain('/?sid=');
  });

  it('returns 400 INVALID_CAPTURE for short JD text', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/extension-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...VALID_BODY, rawText: 'short' }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_CAPTURE');
  });
});

describe('GET /api/extension-capture', () => {
  beforeEach(() => {
    __resetMemoryRateLimitForTests();
  });

  it('returns job payload for valid sid', async () => {
    const sid = createHandoffToken({
      pageTitle: VALID_BODY.pageTitle,
      pageUrl: VALID_BODY.pageUrl,
      rawText: VALID_BODY.rawText,
      jobId: VALID_BODY.jobId,
      jobTitle: VALID_BODY.jobTitle,
      companyName: VALID_BODY.companyName,
    });
    const res = await GET(
      new NextRequest(
        `http://localhost:3000/api/extension-capture?sid=${encodeURIComponent(sid)}`,
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.job.company_name).toBe('Fintech Co');
    expect(json.job.char_count).toBeGreaterThan(40);
  });

  it('returns 410 INVALID_SID for tampered signature', async () => {
    const sid = createHandoffToken({
      pageTitle: VALID_BODY.pageTitle,
      pageUrl: VALID_BODY.pageUrl,
      rawText: VALID_BODY.rawText,
      jobId: VALID_BODY.jobId,
    });
    const [payload] = sid.split('.');
    const bad = `${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    const res = await GET(
      new NextRequest(
        `http://localhost:3000/api/extension-capture?sid=${encodeURIComponent(bad)}`,
      ),
    );
    expect(res.status).toBe(410);
    expect((await res.json()).errorCode).toBe('INVALID_SID');
  });

  it('returns 400 MISSING_SID without query param', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/extension-capture'),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('MISSING_SID');
  });
});
