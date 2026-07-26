import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateClient = vi.fn();
const mockGetAdmin = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetAdmin(),
}));

import { POST } from '@/app/api/account/delete/route';

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not signed in', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: vi.fn(),
      },
    });
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 503 when admin unavailable', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u-del' } },
          error: null,
        }),
        signOut: vi.fn(),
      },
    });
    mockGetAdmin.mockReturnValue(null);
    const res = await POST();
    expect(res.status).toBe(503);
  });

  it('hard-deletes auth user and returns deleted:true', async () => {
    const signOut = vi.fn();
    const deleteUser = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
    }));
    const storageFrom = vi.fn(() => ({
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ error: null }),
    }));

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u-del' } },
          error: null,
        }),
        signOut,
      },
    });
    mockGetAdmin.mockReturnValue({
      from,
      storage: { from: storageFrom },
      auth: { admin: { deleteUser } },
    });

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(deleteUser).toHaveBeenCalledWith('u-del');
    expect(signOut).toHaveBeenCalled();
  });
});
