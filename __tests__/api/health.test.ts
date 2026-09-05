import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns ok without secrets', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('jobbeagle');
    expect(typeof body.ts).toBe('string');
    expect(JSON.stringify(body)).not.toMatch(/KEY|SECRET|gemini|paypal/i);
  });
});
