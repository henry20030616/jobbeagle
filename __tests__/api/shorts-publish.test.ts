import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabaseClient } from '../helpers/mock-supabase';

const mockCreateClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

import { POST } from '@/app/api/shorts/publish/route';

const VALID_BODY = {
  company_name: 'Test Co',
  job_title: 'Engineer',
  description: 'A'.repeat(50),
  video_url: 'https://example.supabase.co/storage/v1/object/public/shorts-videos/v.mp4',
  video_source_type: 'upload',
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost:3000/api/shorts/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/shorts/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('401 AUTH_REQUIRED when not logged in', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient(null));
    const res = await post(VALID_BODY);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.errorCode).toBe('AUTH_REQUIRED');
  });

  it('400 COMPANY_NAME_REQUIRED', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, company_name: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('COMPANY_NAME_REQUIRED');
  });

  it('400 JOB_TITLE_REQUIRED', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, job_title: '  ' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('JOB_TITLE_REQUIRED');
  });

  it('400 VIDEO_URL_REQUIRED', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, video_url: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('VIDEO_URL_REQUIRED');
  });

  it('400 DESCRIPTION_TOO_SHORT', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, description: 'too short' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('DESCRIPTION_TOO_SHORT');
  });

  it('400 INVALID_EMAIL for bad contact_email', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, contact_email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_EMAIL');
  });

  it('400 INVALID_APPLY_URL', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabaseClient({ id: 'user-1' }));
    const res = await post({ ...VALID_BODY, apply_url: 'ftp://bad' });
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('INVALID_APPLY_URL');
  });

  it('400 VIDEO_LIMIT_REACHED at 20 videos', async () => {
    const client = createMockSupabaseClient({ id: 'user-1' }, {
      shorts_videos: [() => ({ count: 20 })],
    });
    mockCreateClient.mockResolvedValue(client);
    const res = await post(VALID_BODY);
    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('VIDEO_LIMIT_REACHED');
  });

  it('200 success with valid payload', async () => {
    const video = { id: 'vid-1', job_title: 'Engineer' };
    const client = createMockSupabaseClient({ id: 'user-1' }, {
      shorts_videos: [
        () => ({ count: 0 }),
        () => ({ data: video, error: null }),
      ],
      company_profiles: [() => ({ error: null })],
    });
    mockCreateClient.mockResolvedValue(client);
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.video).toEqual(video);
  });
});
