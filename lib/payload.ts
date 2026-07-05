import type { ExtensionJobPayload, PreFlightJobData } from '@/types';

/** Decode Base64 extension payload from Chrome extension */
export function decodeExtensionPayload(encoded: string): ExtensionJobPayload {
  const json = decodeURIComponent(
    Buffer.from(encoded, 'base64').toString('utf-8'),
  );
  const parsed = JSON.parse(json) as ExtensionJobPayload;
  if (!parsed.rawText || !parsed.jobId) {
    throw new Error('Invalid extension payload: missing rawText or jobId');
  }
  return parsed;
}

/** Parse extension payload into pre-flight job data */
export function payloadToPreFlightData(
  payload: ExtensionJobPayload,
): PreFlightJobData {
  const { pageTitle, pageUrl, rawText, jobId } = payload;

  let company_name = 'Unknown Company';
  let job_title = pageTitle || 'Unknown Role';

  if (pageTitle.includes(' at ') || pageTitle.includes(' | ')) {
    const parts = pageTitle.split(/\s+at\s+|\s+\|\s+/i);
    if (parts.length >= 2) {
      job_title = parts[0].trim();
      company_name = parts[1].replace(/\s*[-|].*$/, '').trim();
    }
  }

  const companyMatch = rawText.match(/(?:Company|公司)[：:]\s*(.+)/i);
  if (companyMatch) company_name = companyMatch[1].trim().split('\n')[0];

  const titleMatch = rawText.match(/(?:職位|Position|Title)[：:]\s*(.+)/i);
  if (titleMatch) job_title = titleMatch[1].trim().split('\n')[0];

  return {
    company_name,
    job_title,
    raw_jd: rawText.trim(),
    linkedin_job_id: jobId,
    page_url: pageUrl,
  };
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
