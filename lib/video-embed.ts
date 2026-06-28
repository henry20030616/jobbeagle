/**
 * 社群影片連結偵測與 embed 工具
 *
 * 支援平台：YouTube / YouTube Shorts、Instagram Reels / Posts、Facebook Videos / Posts
 * 策略：不搬運、不下載，只嵌入原平台公開內容
 */

import type { VideoSourceType } from '@/types';

// ── URL 偵測 ────────────────────────────────────────────────────────────────

export function detectVideoSourceType(url: string): VideoSourceType {
  if (!url) return 'external';
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
    if (host === 'instagram.com') return 'instagram';
    if (host === 'facebook.com' || host === 'fb.watch' || host === 'fb.com') return 'facebook';
    // MP4 / WebM 直連 → 視為 upload 類型（可播放）
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov')) return 'upload';
  } catch {
    // 非合法 URL
  }
  return 'external';
}

export function isSocialEmbedUrl(url: string): boolean {
  const t = detectVideoSourceType(url);
  return t === 'youtube' || t === 'instagram' || t === 'facebook';
}

// ── YouTube embed URL ───────────────────────────────────────────────────────

/**
 * 把各種 YouTube URL 格式轉成 embed src
 *
 * 支援：
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID（本身已是 embed，直接回傳）
 */
export function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // 已是 embed URL
    if (u.pathname.startsWith('/embed/')) return url;

    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0];
    } else if (host === 'youtube.com') {
      if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.replace('/shorts/', '').split('?')[0];
      } else {
        videoId = u.searchParams.get('v');
      }
    }

    if (!videoId) return null;
    // autoplay=1 mute=1：在 iframe 裡實現類似原生短影音的自動靜音播放
    // enablejsapi=1：允許透過 postMessage 控制靜音 / 取消靜音
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
  } catch {
    return null;
  }
}

// ── Facebook embed URL ──────────────────────────────────────────────────────

/**
 * 轉成 Facebook Embedded Video Player URL
 * https://developers.facebook.com/docs/plugins/embedded-video-player/
 *
 * 注意：只有公開 FB 影片才能嵌入
 */
export function toFacebookEmbedUrl(originalUrl: string): string | null {
  try {
    // FB 官方 oEmbed/embed endpoint
    const encoded = encodeURIComponent(originalUrl);
    return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=480&autoplay=true&mute=true`;
  } catch {
    return null;
  }
}

// ── Instagram embed ─────────────────────────────────────────────────────────

/**
 * Instagram 不提供直接 iframe src URL。
 * 官方做法是用 oEmbed API 拿 HTML 或用 blockquote + 載入 embed.js。
 * 這裡回傳 embed blockquote 的 permalink，供 component 決定渲染方式。
 *
 * 確保 URL 結尾有 /
 */
export function normalizeInstagramUrl(url: string): string {
  try {
    const u = new URL(url);
    // 移除 query string，保留 pathname，確保有結尾 /
    const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
    return `https://www.instagram.com${path}`;
  } catch {
    return url;
  }
}

// ── 型別標籤 helper ──────────────────────────────────────────────────────────

export function sourceTypeLabel(type: VideoSourceType): string {
  switch (type) {
    case 'youtube':   return 'YouTube';
    case 'instagram': return 'Instagram';
    case 'facebook':  return 'Facebook';
    case 'upload':    return '上傳影片';
    case 'external':  return '外部連結';
  }
}

export function sourceTypeIcon(type: VideoSourceType): string {
  switch (type) {
    case 'youtube':   return '▶';
    case 'instagram': return '📸';
    case 'facebook':  return '📘';
    case 'upload':    return '🎬';
    case 'external':  return '🔗';
  }
}
