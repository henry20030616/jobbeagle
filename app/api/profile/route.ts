import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  ensureProfile,
  profileToUserProfile,
  updateCareerContext,
} from '@/lib/profiles';
import { normalizeCareerContext } from '@/lib/career-context';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }

  const profile = await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  });

  return NextResponse.json({
    profile: profileToUserProfile(profile),
    email: user.email,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const careerRaw =
    body && typeof body === 'object' && 'career_context' in body
      ? (body as { career_context: unknown }).career_context
      : null;

  if (!careerRaw || typeof careerRaw !== 'object') {
    return NextResponse.json({ error: 'career_context required' }, { status: 400 });
  }

  await ensureProfile(admin, user.id, {
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  });

  try {
    const career_context = await updateCareerContext(
      admin,
      user.id,
      normalizeCareerContext(careerRaw),
    );
    return NextResponse.json({ career_context });
  } catch (err) {
    console.error('[profile PATCH]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 },
    );
  }
}
