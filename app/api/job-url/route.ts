import { NextRequest, NextResponse } from 'next/server';
import { isAllowedPublicAtsHost } from '@/lib/url-parser-logic';
import { clientIpFromRequest, rateLimit } from '@/lib/rate-limit';
import { MAX_JD_CHARS } from '@/constants/models';

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;

function htmlToPlainText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const titleMatch = withoutNoise.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim()
    : '';

  const bodyMatch = withoutNoise.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : withoutNoise;

  let text = bodyHtml
    .replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ');

  text = decodeEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (title && !text.toLowerCase().includes(title.toLowerCase().slice(0, 40))) {
    text = `${title}\n\n${text}`;
  }

  if (text.length > MAX_JD_CHARS) {
    text = text.slice(0, MAX_JD_CHARS);
  }

  return text;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function assertPublicAtsUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw Object.assign(new Error('Invalid URL'), { code: 'INVALID_URL' });
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw Object.assign(new Error('Only http(s) URLs allowed'), {
      code: 'INVALID_URL',
    });
  }

  if (!isAllowedPublicAtsHost(parsed.hostname)) {
    throw Object.assign(
      new Error('Host not allowed. Only Greenhouse / Lever public job pages.'),
      { code: 'HOST_NOT_ALLOWED' },
    );
  }

  return parsed;
}

/**
 * POST /api/job-url
 * Fetch a public ATS job page (Greenhouse / Lever only) and return plain text.
 * Never accepts LinkedIn / Indeed / Glassdoor — those must stay client-blocked.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromRequest(request);
    const rl = await rateLimit('job-url', ip, 20, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMIT' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const urlRaw = typeof body?.url === 'string' ? body.url : '';
    if (!urlRaw.trim()) {
      return NextResponse.json(
        { error: 'Missing url', code: 'MISSING_URL' },
        { status: 400 },
      );
    }

    let target: URL;
    try {
      target = assertPublicAtsUrl(urlRaw);
    } catch (e) {
      const code = (e as { code?: string })?.code || 'INVALID_URL';
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : 'Invalid URL',
          code,
        },
        { status: code === 'HOST_NOT_ALLOWED' ? 403 : 400 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'JobBeagleBot/1.0 (+https://www.jobbeagle.com; public ATS job text fetch)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } finally {
      clearTimeout(timer);
    }

    const finalHost = (() => {
      try {
        if (res.url) return new URL(res.url).hostname;
      } catch {
        /* fall through */
      }
      return target.hostname;
    })();

    if (!isAllowedPublicAtsHost(finalHost)) {
      return NextResponse.json(
        {
          error: 'Redirect left allowlisted hosts',
          code: 'HOST_NOT_ALLOWED',
        },
        { status: 403 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}`, code: 'UPSTREAM_ERROR' },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: 'Page too large', code: 'TOO_LARGE' },
        { status: 413 },
      );
    }

    const html = new TextDecoder('utf-8').decode(buf);
    const text = htmlToPlainText(html);

    if (text.length < 40) {
      return NextResponse.json(
        {
          error:
            'Could not extract enough job text. Paste the JD manually or try another link.',
          code: 'EXTRACT_TOO_SHORT',
        },
        { status: 422 },
      );
    }

    const sourceUrl = res.url && res.url.startsWith('http') ? res.url : target.toString();

    return NextResponse.json({
      text,
      sourceUrl,
      charCount: text.length,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted
          ? 'Timed out fetching job page'
          : err instanceof Error
            ? err.message
            : 'Fetch failed',
        code: aborted ? 'TIMEOUT' : 'FETCH_FAILED',
      },
      { status: aborted ? 504 : 500 },
    );
  }
}
