import { describe, it, expect } from 'vitest';
import {
  detectVideoSourceType,
  isSocialEmbedUrl,
  toYouTubeEmbedUrl,
  toFacebookEmbedUrl,
  normalizeInstagramUrl,
  sourceTypeLabel,
  sourceTypeIcon,
} from '@/lib/video-embed';

// ──────────────────────────────────────────────
// detectVideoSourceType
// ──────────────────────────────────────────────
describe('detectVideoSourceType', () => {
  it('detects youtube.com/watch URLs', () => {
    expect(detectVideoSourceType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
  });

  it('detects youtu.be short URLs', () => {
    expect(detectVideoSourceType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
  });

  it('detects YouTube Shorts URLs', () => {
    expect(detectVideoSourceType('https://www.youtube.com/shorts/abc123')).toBe('youtube');
  });

  it('detects instagram.com URLs', () => {
    expect(detectVideoSourceType('https://www.instagram.com/reel/abc123/')).toBe('instagram');
  });

  it('detects facebook.com URLs', () => {
    expect(detectVideoSourceType('https://www.facebook.com/video/123456')).toBe('facebook');
  });

  it('detects fb.watch short URLs', () => {
    expect(detectVideoSourceType('https://fb.watch/abc123/')).toBe('facebook');
  });

  it('detects direct .mp4 as upload', () => {
    expect(detectVideoSourceType('https://cdn.example.com/video.mp4')).toBe('upload');
  });

  it('detects direct .webm as upload', () => {
    expect(detectVideoSourceType('https://cdn.example.com/video.webm')).toBe('upload');
  });

  it('returns external for unknown domains', () => {
    expect(detectVideoSourceType('https://vimeo.com/123456')).toBe('external');
  });

  it('returns external for empty string', () => {
    expect(detectVideoSourceType('')).toBe('external');
  });

  it('returns external for non-URL garbage', () => {
    expect(detectVideoSourceType('not-a-url')).toBe('external');
  });
});

// ──────────────────────────────────────────────
// isSocialEmbedUrl
// ──────────────────────────────────────────────
describe('isSocialEmbedUrl', () => {
  it('returns true for YouTube', () => {
    expect(isSocialEmbedUrl('https://youtu.be/abc')).toBe(true);
  });

  it('returns true for Instagram', () => {
    expect(isSocialEmbedUrl('https://www.instagram.com/reel/abc/')).toBe(true);
  });

  it('returns true for Facebook', () => {
    expect(isSocialEmbedUrl('https://www.facebook.com/video/123')).toBe(true);
  });

  it('returns false for .mp4 direct link', () => {
    expect(isSocialEmbedUrl('https://cdn.example.com/video.mp4')).toBe(false);
  });

  it('returns false for Vimeo', () => {
    expect(isSocialEmbedUrl('https://vimeo.com/123456')).toBe(false);
  });
});

// ──────────────────────────────────────────────
// toYouTubeEmbedUrl
// ──────────────────────────────────────────────
describe('toYouTubeEmbedUrl', () => {
  it('converts watch?v= URL', () => {
    const result = toYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toContain('autoplay=1');
    expect(result).toContain('mute=1');
  });

  it('converts youtu.be short URL', () => {
    const result = toYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converts YouTube Shorts URL', () => {
    const result = toYouTubeEmbedUrl('https://www.youtube.com/shorts/abc123');
    expect(result).toContain('youtube.com/embed/abc123');
  });

  it('returns already-embed URL as-is', () => {
    const embedUrl = 'https://www.youtube.com/embed/abc?autoplay=1';
    expect(toYouTubeEmbedUrl(embedUrl)).toBe(embedUrl);
  });

  it('returns null for non-YouTube URL', () => {
    expect(toYouTubeEmbedUrl('https://vimeo.com/123')).toBeNull();
  });

  it('returns null for YouTube URL with no video ID', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/channel/UCxxx')).toBeNull();
  });

  it('includes loop and playlist params for seamless looping', () => {
    const result = toYouTubeEmbedUrl('https://youtu.be/abc123') ?? '';
    expect(result).toContain('loop=1');
    expect(result).toContain('playlist=abc123');
  });
});

// ──────────────────────────────────────────────
// toFacebookEmbedUrl
// ──────────────────────────────────────────────
describe('toFacebookEmbedUrl', () => {
  it('returns a facebook plugins/video.php URL', () => {
    const result = toFacebookEmbedUrl('https://www.facebook.com/video/123456');
    expect(result).toContain('facebook.com/plugins/video.php');
    expect(result).toContain(encodeURIComponent('https://www.facebook.com/video/123456'));
  });

  it('includes autoplay and mute params', () => {
    const result = toFacebookEmbedUrl('https://www.facebook.com/video/123456') ?? '';
    expect(result).toContain('autoplay=true');
    expect(result).toContain('mute=true');
  });

  it('never returns null for a valid URL', () => {
    expect(toFacebookEmbedUrl('https://www.facebook.com/reel/123')).not.toBeNull();
  });
});

// ──────────────────────────────────────────────
// normalizeInstagramUrl
// ──────────────────────────────────────────────
describe('normalizeInstagramUrl', () => {
  it('strips query string', () => {
    const result = normalizeInstagramUrl('https://www.instagram.com/reel/abc123/?igsh=xxx');
    expect(result).not.toContain('igsh');
    expect(result).toContain('instagram.com/reel/abc123/');
  });

  it('ensures trailing slash', () => {
    const result = normalizeInstagramUrl('https://www.instagram.com/reel/abc123');
    expect(result.endsWith('/')).toBe(true);
  });

  it('returns input unchanged if URL is invalid', () => {
    const bad = 'not-a-url';
    expect(normalizeInstagramUrl(bad)).toBe(bad);
  });

  it('strips www subdomain in path sense', () => {
    const result = normalizeInstagramUrl('https://www.instagram.com/p/abc123/');
    // Should still be instagram.com
    expect(result).toContain('instagram.com/p/abc123/');
  });
});

// ──────────────────────────────────────────────
// sourceTypeLabel / sourceTypeIcon
// ──────────────────────────────────────────────
describe('sourceTypeLabel', () => {
  it('returns correct labels for all types (English default)', () => {
    expect(sourceTypeLabel('youtube')).toBe('YouTube');
    expect(sourceTypeLabel('instagram')).toBe('Instagram');
    expect(sourceTypeLabel('facebook')).toBe('Facebook');
    expect(sourceTypeLabel('upload')).toBe('Uploaded Video');
    expect(sourceTypeLabel('external')).toBe('External Link');
  });

  it('returns Chinese labels when lang is zh-TW', () => {
    expect(sourceTypeLabel('upload', 'zh-TW')).toBe('上傳影片');
    expect(sourceTypeLabel('external', 'zh-TW')).toBe('外部連結');
  });
});

describe('sourceTypeIcon', () => {
  it('returns emoji icons for all types', () => {
    expect(sourceTypeIcon('youtube')).toBe('▶');
    expect(sourceTypeIcon('instagram')).toBe('📸');
    expect(sourceTypeIcon('facebook')).toBe('📘');
    expect(sourceTypeIcon('upload')).toBe('🎬');
    expect(sourceTypeIcon('external')).toBe('🔗');
  });
});
