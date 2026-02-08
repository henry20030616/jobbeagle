import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'shorts-videos';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const index = formData.get('index') as string | null;
    const type = (formData.get('type') as string | null) || 'video';

    if (!file) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
    }

    const isLogo = type === 'logo';
    const maxSize = isLogo ? MAX_LOGO_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isLogo ? 'Logo 請勿超過 5MB' : `影片請勿超過 ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || (isLogo ? 'png' : 'mp4');
    const safeName = isLogo
      ? `logos/logo-${index ?? Date.now()}.${ext}`
      : `video-${index ?? Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return NextResponse.json(
          {
            error: '尚未建立 Storage 空間。請到 Supabase Dashboard → Storage → 新增 bucket 名稱為「shorts-videos」並設為公開，再執行 supabase-shorts-storage.sql 的權限設定。',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || '上傳失敗' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (e: unknown) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '上傳失敗' },
      { status: 500 }
    );
  }
}
