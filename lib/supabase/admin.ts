import { createClient } from '@supabase/supabase-js';

/** Service-role client for server-only operations (webhooks, quotas). */
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return null;
  return createClient(supabaseUrl, serviceKey);
}
