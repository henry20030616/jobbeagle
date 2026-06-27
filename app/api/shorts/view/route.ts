import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc('increment_video_view_count', {
      p_video_id: videoId,
    });

    if (error) {
      // 欄位不存在（migration 尚未跑）時靜默失敗，不影響前端
      console.warn('increment_video_view_count error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
