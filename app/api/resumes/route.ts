import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { upsertResumeForUser } from '@/lib/resumes';
import type { ResumeInput } from '@/types';
import { extractResumeText, isPdfResume } from '@/lib/resume-parser';
import { RESUME_LIBRARY_LIMIT } from '@/constants/resumes';

/**
 * POST /api/resumes — upsert resume into the user's library (manual pin / save).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server configuration error', code: 'SERVER_CONFIG' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const resume = body?.resume as ResumeInput | undefined;
  if (!resume?.content) {
    return NextResponse.json({ error: 'Resume is required', code: 'MISSING_RESUME' }, { status: 400 });
  }

  try {
    let contentText: string;
    let hashMaterial: string;

    if (isPdfResume(resume)) {
      contentText = `[PDF resume: ${resume.fileName || 'resume.pdf'}]\n[Resume provided as PDF attachment]`;
      hashMaterial = `pdf:${resume.content.slice(0, 64)}:${resume.content.length}`;
    } else {
      contentText = await extractResumeText(resume);
      hashMaterial = contentText;
    }

    const result = await upsertResumeForUser(admin, user.id, {
      contentText,
      hashMaterial,
      fileName: resume.fileName ?? null,
      mimeType: resume.mimeType ?? null,
      type: resume.type === 'file' ? 'file' : 'text',
      source: 'manual_save',
      pin: true,
    });

    return NextResponse.json({
      id: result.id,
      reused: result.reused,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Resume save failed';
    return NextResponse.json({ error: message, code: 'RESUME_SAVE_FAILED' }, { status: 500 });
  }
}

/**
 * GET /api/resumes — list active (non-soft-deleted) resumes for the signed-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('resume_history')
    .select('id, type, content, mime_type, file_name, label, source, is_pinned, last_used_at, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .limit(RESUME_LIBRARY_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resumes: data ?? [] });
}

/**
 * DELETE /api/resumes?id= — soft-delete a resume version.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('resume_history')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, soft: true });
}
