import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/job-url/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ allowed: true, remaining: 19 })),
  clientIpFromRequest: () => '127.0.0.1',
}));

function req(body: unknown) {
  return new NextRequest('http://localhost/api/job-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/job-url', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects LinkedIn URLs (never server-fetch)', async () => {
    const res = await POST(
      req({ url: 'https://www.linkedin.com/jobs/view/123' }),
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('HOST_NOT_ALLOWED');
  });

  it('rejects Indeed URLs', async () => {
    const res = await POST(req({ url: 'https://www.indeed.com/viewjob?jk=x' }));
    expect(res.status).toBe(403);
  });

  it('accepts Greenhouse host and returns extracted text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        '<html><head><title>Engineer at Acme</title></head><body><div>Responsibilities include shipping features. Requirements: TypeScript.</div></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      ),
    );

    const res = await POST(
      req({ url: 'https://boards.greenhouse.io/acme/jobs/1' }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toMatch(/Responsibilities/i);
    expect(json.charCount).toBeGreaterThan(40);
  });
});
