import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabaseClient } from '../helpers/mock-supabase';

const mockCreateClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

import { POST } from '@/app/api/shorts/apply/route';

const VALID_BODY = {
  jobId: 'job-uuid-1',
  jobTitle: 'Engineer',
  companyName: 'Test Co',
  applicantName: 'Jane Doe',
  applicantEmail: 'jane@example.com',
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost:3000/api/shorts/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/shorts/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('400 MISSING_FIELDS when name missing', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(null));
    const res = await post({ ...VALID_BODY, applicantName: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('MISSING_FIELDS');
  });

  it('400 INVALID_EMAIL', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(null));
    const res = await post({ ...VALID_BODY, applicantEmail: 'bad-email' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_EMAIL');
  });

  it('409 DUPLICATE_APPLICATION when existing row', async () => {
    const client = createMockSupabaseClient(null, {
      job_applications: [() => ({ data: { id: 'existing' }, error: null })],
    });
    mockCreateClient.mockResolvedValue(client);
    const res = await post(VALID_BODY);
    expect(res.status).toBe(409);
    expect((await res.json()).errorCode).toBe('DUPLICATE_APPLICATION');
  });

  it('429 RATE_LIMITED when 5+ recent applications', async () => {
    const client = createMockSupabaseClient(null, {
      job_applications: [
        () => ({ data: null, error: null }),
        () => ({ count: 5, error: null }),
      ],
    });
    mockCreateClient.mockResolvedValue(client);
    const res = await post(VALID_BODY);
    expect(res.status).toBe(429);
    expect((await res.json()).errorCode).toBe('RATE_LIMITED');
  });

  it('200 success without email when no RESEND_API_KEY', async () => {
    const client = createMockSupabaseClient({ id: 'user-1' }, {
      job_applications: [
        () => ({ data: null, error: null }),
        () => ({ count: 0, error: null }),
        () => ({ error: null }),
      ],
    });
    mockCreateClient.mockResolvedValue(client);
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.emailSent).toBe(false);
  });
});
