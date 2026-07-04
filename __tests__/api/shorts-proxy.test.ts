import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/shorts/proxy/route';

function get(url?: string) {
  const path = url
    ? `http://localhost:3000/api/shorts/proxy?url=${encodeURIComponent(url)}`
    : 'http://localhost:3000/api/shorts/proxy';
  return GET(new NextRequest(path));
}

describe('GET /api/shorts/proxy', () => {
  it('400 when url param missing', async () => {
    const res = await get();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Missing url');
  });

  it('400 for non-supabase hostname', async () => {
    const res = await get('https://evil.com/storage/v1/object/public/x.mp4');
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid url');
  });

  it('400 for supabase host without /storage/ path', async () => {
    const res = await get('https://abc.supabase.co/rest/v1/shorts_videos');
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid url');
  });
});
