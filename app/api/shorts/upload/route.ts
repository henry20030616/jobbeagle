import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'shorts-videos';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_LOGO_SIZE  =   5 * 1024 * 1024; //   5 MB

const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']);
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif',
  'image/webp', 'image/svg+xml', 'image/avif',
]);

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard ──────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to upload.' },
        { status: 401 }
      );
    }

    // ── Parse form data ─────────────────────────────────────────
    const formData = await request.formData();
    const file  = formData.get('file')  as File | null;
    const index = formData.get('index') as string | null;
    const type  = (formData.get('type') as string | null) ?? 'video';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const isLogo   = type === 'logo';
    const maxSize  = isLogo ? MAX_LOGO_SIZE : MAX_VIDEO_SIZE;
    const allowed  = isLogo ? ALLOWED_IMAGE_MIME : ALLOWED_VIDEO_MIME;

    // ── Size check ──────────────────────────────────────────────
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isLogo
            ? 'Logo must be 5 MB or less.'
            : `Video must be ${MAX_VIDEO_SIZE / 1024 / 1024} MB or less.` },
        { status: 400 }
      );
    }

    // ── MIME-type check ─────────────────────────────────────────
    if (file.type && !allowed.has(file.type)) {
      return NextResponse.json(
        { error: isLogo
            ? 'Invalid image type. Please upload PNG, JPG, WEBP, GIF, or SVG.'
            : 'Invalid video type. Please upload MP4, WebM, or MOV.' },
        { status: 400 }
      );
    }

    // ── Build storage path scoped to user ───────────────────────
    const ext      = file.name.split('.').pop()?.toLowerCase() ?? (isLogo ? 'png' : 'mp4');
    const safeName = isLogo
      ? `logos/${user.id}/logo-${index ?? Date.now()}.${ext}`
      : `uploads/${user.id}/video-${index ?? Date.now()}.${ext}`;

    // ── Upload to Supabase Storage ──────────────────────────────
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(safeName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.error('Supabase storage upload error:', error);
      if (error.message?.includes('not found') || error.message?.includes('Bucket not found')) {
        return NextResponse.json(
          {
            error:
              'Storage bucket not found. Go to Supabase Dashboard → Storage → create a bucket named "shorts-videos" (public) and re-run supabase-shorts-storage.sql.',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message ?? 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (e: unknown) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
