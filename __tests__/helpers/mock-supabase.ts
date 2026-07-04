import { vi } from 'vitest';

export type MockUser = { id: string; email?: string } | null;

export type QueryResult = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
};

type Handler = () => QueryResult | Promise<QueryResult>;

/**
 * Chainable Supabase client mock.
 * Pass per-table handler arrays when the same table is queried multiple times.
 */
export function createMockSupabaseClient(
  user: MockUser,
  handlers: Record<string, Handler[]> = {},
) {
  const callIndex: Record<string, number> = {};

  const runHandler = async (table: string): Promise<QueryResult> => {
    const idx = callIndex[table] ?? 0;
    callIndex[table] = idx + 1;
    const list = handlers[table];
    const fn = list?.[idx] ?? (() => ({ data: null, error: null, count: 0 }));
    return fn();
  };

  const buildChain = (table: string) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const exec = () => runHandler(table);

    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.upsert = vi.fn().mockImplementation(exec);
    chain.maybeSingle = vi.fn().mockImplementation(exec);
    chain.single = vi.fn().mockImplementation(exec);

    Object.assign(chain, {
      then(
        onFulfilled: (v: QueryResult) => unknown,
        onRejected?: (e: unknown) => unknown,
      ) {
        return exec().then(onFulfilled, onRejected);
      },
    });

    return chain;
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn((table: string) => buildChain(table)),
  };
}
