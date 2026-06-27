import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_name, job_title, location, salary, description,
      tags, video_url, video_source_type, logo_url, contact_email, apply_url,
    } = body;

    if (!company_name || !job_title || !video_url) {
      return NextResponse.json({ error: '公司名稱、職缺名稱及影片為必填' }, { status: 400 });
    }

    const allowedSourceTypes = ['upload', 'youtube', 'instagram', 'facebook', 'external'];
    const resolvedSourceType = allowedSourceTypes.includes(video_source_type) ? video_source_type : 'upload';

    // Upsert company_profiles
    await supabase.from('company_profiles').upsert({
      user_id: user.id,
      company_name,
      logo_url: logo_url || null,
      contact_email: contact_email || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    const { data, error } = await supabase.from('shorts_videos').insert({
      company_name,
      job_title,
      location: location || '',
      salary: salary || '',
      description: description || '',
      tags: tags || [],
      video_url,
      video_source_type: resolvedSourceType,
      logo_url: logo_url || null,
      contact_email: contact_email || null,
      apply_url: apply_url || null,
      is_published: true,
      company_user_id: user.id,
    }).select().single();

    if (error) {
      console.error('Publish error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
