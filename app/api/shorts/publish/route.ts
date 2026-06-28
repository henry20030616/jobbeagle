import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VIDEOS_PER_COMPANY = 20;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard ──────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_name, job_title, location, salary, description,
      tags, video_url, video_source_type, logo_url,
      contact_email, apply_url,
    } = body;

    // ── Required fields ─────────────────────────────────────────
    if (!company_name?.trim()) {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    }
    if (!job_title?.trim()) {
      return NextResponse.json({ error: 'Job title is required.' }, { status: 400 });
    }
    if (!video_url?.trim()) {
      return NextResponse.json({ error: 'Video URL is required.' }, { status: 400 });
    }

    // ── Contact method: email OR apply_url — at least one recommended,
    //    but both are allowed to be absent (applyMethod = 'none').
    //    When contact_email IS provided, validate its format.
    //    When apply_url IS provided, it must be a valid URL.
    const hasEmail    = !!contact_email?.trim();
    const hasApplyUrl = !!apply_url?.trim();

    if (hasEmail && !EMAIL_RE.test(contact_email.trim())) {
      return NextResponse.json({ error: 'Contact email format is invalid.' }, { status: 400 });
    }
    if (hasApplyUrl && !isValidHttpUrl(apply_url.trim())) {
      return NextResponse.json(
        { error: 'Apply URL must be a valid http/https URL.' },
        { status: 400 }
      );
    }

    // ── Per-company video limit (abuse prevention) ──────────────
    const { count: videoCount } = await supabase
      .from('shorts_videos')
      .select('*', { count: 'exact', head: true })
      .eq('company_user_id', user.id);

    if ((videoCount ?? 0) >= MAX_VIDEOS_PER_COMPANY) {
      return NextResponse.json(
        {
          error: `You have reached the limit of ${MAX_VIDEOS_PER_COMPANY} job videos. Please delete some existing videos before posting new ones.`,
        },
        { status: 400 }
      );
    }

    const allowedSourceTypes = ['upload', 'youtube', 'instagram', 'facebook', 'external'];
    const resolvedSourceType = allowedSourceTypes.includes(video_source_type)
      ? video_source_type
      : 'upload';

    // ── Upsert company_profiles ─────────────────────────────────
    const { error: profileError } = await supabase.from('company_profiles').upsert(
      {
        user_id: user.id,
        company_name: company_name.trim(),
        logo_url: logo_url ?? null,
        // Only update contact_email when it's actually provided
        ...(hasEmail ? { contact_email: contact_email.trim() } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (profileError) {
      console.error('Profile upsert error:', profileError);
    }

    // ── Insert video ────────────────────────────────────────────
    const { data, error } = await supabase
      .from('shorts_videos')
      .insert({
        company_name:      company_name.trim(),
        job_title:         job_title.trim(),
        location:          location    ?? '',
        salary:            salary      ?? '',
        description:       description ?? '',
        tags:              tags        ?? [],
        video_url:         video_url.trim(),
        video_source_type: resolvedSourceType,
        logo_url:          logo_url    ?? null,
        contact_email:     hasEmail    ? contact_email.trim() : null,
        apply_url:         hasApplyUrl ? apply_url.trim()     : null,
        is_published:      true,
        moderation_status: 'approved',
        company_user_id:   user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Publish error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
