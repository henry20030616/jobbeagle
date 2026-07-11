import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const SHORTS_BUCKET = 'shorts-videos';

async function purgeUserStorageFolder(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  folder: string,
) {
  const { data: entries, error } = await admin.storage.from(SHORTS_BUCKET).list(folder, {
    limit: 1000,
  });
  if (error || !entries?.length) return;

  const paths = entries
    .filter((e) => e.name && !e.name.endsWith('/'))
    .map((e) => `${folder}/${e.name}`);

  if (paths.length) {
    await admin.storage.from(SHORTS_BUCKET).remove(paths);
  }
}

/**
 * Hard-delete user account (CCPA right to erasure).
 * Clears Storage objects, then relies on FK CASCADE + auth.admin.deleteUser.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
  }

  try {
    // Explicit report wipe (also cascades via FK when auth user is deleted)
    await admin.from('analysis_reports').delete().eq('user_id', user.id);

    // Shorts uploads scoped under uploads/{uid} and logos/{uid}
    await purgeUserStorageFolder(admin, `uploads/${user.id}`);
    await purgeUserStorageFolder(admin, `logos/${user.id}`);
  } catch (e) {
    console.error('[account/delete] pre-delete cleanup failed:', e);
    // Continue — auth delete + FK cascade is still required
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ deleted: true });
}
