import type { ExtensionJobPayload, PreFlightJobData } from '@/types';

/** Decode base64 UTF-8 payload (works in browser + Node) */
export function decodeBase64Utf8(encoded: string): string {
  const normalized = encoded.replace(/ /g, '+');
  if (typeof Buffer !== 'undefined' && typeof window === 'undefined') {
    return decodeURIComponent(Buffer.from(normalized, 'base64').toString('utf-8'));
  }
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/** Decode Base64 extension payload from Chrome extension */
export function decodeExtensionPayload(encoded: string): ExtensionJobPayload {
  const json = decodeBase64Utf8(encoded);
  const parsed = JSON.parse(json) as ExtensionJobPayload;
  if (!parsed.rawText?.trim()) {
    throw new Error('Invalid extension payload: missing rawText');
  }
  if (!parsed.jobId) {
    parsed.jobId = 'unknown';
  }
  return parsed;
}

const LINKEDIN_NOISE_TITLES = /精選職缺|推薦職缺|jobs?\s*search|linkedin/i;

function parseTitleParts(pageTitle: string): { job_title: string; company_name: string } | null {
  if (!pageTitle || LINKEDIN_NOISE_TITLES.test(pageTitle) && !pageTitle.includes(' at ')) {
    return null;
  }

  if (pageTitle.includes(' at ')) {
    const [t, c] = pageTitle.split(/\s+at\s+/i);
    return {
      job_title: t.trim(),
      company_name: c.replace(/\s*[-|].*$/, '').replace(/\s*\|\s*LinkedIn.*$/i, '').trim(),
    };
  }

  const pipeParts = pageTitle.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    const last = pipeParts[pipeParts.length - 1];
    if (/^linkedin$/i.test(last)) {
      if (pipeParts.length >= 3) {
        return {
          job_title: pipeParts[0],
          company_name: pipeParts[1],
        };
      }
      return null;
    }
    return {
      job_title: pipeParts[0],
      company_name: pipeParts[1],
    };
  }

  return null;
}

/** Parse extension payload into pre-flight job data */
export function payloadToPreFlightData(
  payload: ExtensionJobPayload,
): PreFlightJobData {
  const { pageTitle, pageUrl, rawText, jobId } = payload;

  let company_name = 'Unknown Company';
  let job_title = pageTitle || 'Unknown Role';

  const fromTitle = parseTitleParts(pageTitle);
  if (fromTitle) {
    job_title = fromTitle.job_title;
    company_name = fromTitle.company_name;
  }

  const companyMatch = rawText.match(/(?:Company|公司|雇主)[：:]\s*(.+)/i);
  if (companyMatch) company_name = companyMatch[1].trim().split('\n')[0];

  const titleMatch = rawText.match(/(?:職位|职位|Position|Title|職缺)[：:]\s*(.+)/i);
  if (titleMatch) job_title = titleMatch[1].trim().split('\n')[0];

  return {
    company_name,
    job_title,
    raw_jd: rawText.trim(),
    linkedin_job_id: jobId,
    page_url: pageUrl,
  };
}

/** Client-safe pre-flight decode from URL query param */
export function decodePayloadParamForPreFlight(encoded: string): PreFlightJobData | null {
  try {
    const payload = decodeExtensionPayload(encoded);
    return payloadToPreFlightData(payload);
  } catch {
    return null;
  }
}

/** Extract job id from URL or generate hash key */
export function deriveJobId(
  linkedinJobId: string | undefined,
  rawJd: string,
  companyName: string,
): string {
  if (linkedinJobId && linkedinJobId !== 'unknown') {
    return linkedinJobId;
  }
  const key = `${companyName}:${rawJd.slice(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return `manual_${Math.abs(hash)}`;
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}
