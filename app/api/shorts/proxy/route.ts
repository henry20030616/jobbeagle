import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '') || '';

/**
 * 代理 Supabase Storage 影片，避免 CORS / 跨域導致 Video unavailable
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  // 只允許代理自己專案的 Supabase Storage，避免被濫用
  try {
    const parsed = new URL(url);
    if (!parsed.hostname?.includes('supabase.co') || !parsed.pathname?.startsWith('/storage/')) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
    if (SUPABASE_HOST && !parsed.hostname?.includes(SUPABASE_HOST.split('.')[0])) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const range = request.headers.get('range') || '';
    const res = await fetch(url, {
      headers: range ? { Range: range } : {},
      cache: 'force-cache',
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
    const contentLength = res.headers.get('content-length');
    const acceptRanges = res.headers.get('accept-ranges');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);
    const resRange = res.headers.get('content-range');
    if (resRange) headers.set('Content-Range', resRange);

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (e) {
    console.error('Video proxy error:', e);
    return new NextResponse(null, { status: 502 });
  }
}
