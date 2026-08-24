import type { SupabaseClient } from '@supabase/supabase-js';

/** Resolve an Auth user id from email (webhook fallback when custom_data is missing). */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const wanted = email.trim().toLowerCase();
  if (!wanted.includes('@')) return null;
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data?.users) return null;
  const match = data.users.find((u) => u.email?.toLowerCase() === wanted);
  return match?.id ?? null;
}
