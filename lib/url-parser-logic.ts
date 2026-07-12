/**
 * Client-safe job-input URL classification.
 * Never send blocked-board URLs to a server scrape — classify in the browser only.
 */

export type JobInputKind = 'plain' | 'public_ats' | 'blocked_board' | 'other_url';

export type BlockedBoardId =
  | 'linkedin'
  | 'indeed'
  | 'glassdoor'
  | 'ziprecruiter'
  | 'governmentjobs';

export type PublicAtsId = 'greenhouse' | 'lever';

export interface JobInputClassification {
  kind: JobInputKind;
  /** First matching URL if any */
  url: string | null;
  boardId?: BlockedBoardId;
  atsId?: PublicAtsId;
  boardLabel?: string;
}

const URL_IN_TEXT =
  /https?:\/\/[^\s<>"')\]]+/gi;

const PUBLIC_ATS_HOSTS: Array<{ id: PublicAtsId; test: (host: string) => boolean }> = [
  {
    id: 'greenhouse',
    test: (h) =>
      h === 'boards.greenhouse.io' || h === 'job-boards.greenhouse.io',
  },
  {
    id: 'lever',
    test: (h) => h === 'jobs.lever.co',
  },
];

const BLOCKED_BOARDS: Array<{
  id: BlockedBoardId;
  label: string;
  test: (url: URL) => boolean;
}> = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    test: (u) =>
      /(^|\.)linkedin\.com$/i.test(u.hostname) &&
      /\/jobs(\/|$)/i.test(u.pathname + u.search),
  },
  {
    id: 'indeed',
    label: 'Indeed',
    test: (u) => /(^|\.)indeed\.com$/i.test(u.hostname),
  },
  {
    id: 'glassdoor',
    label: 'Glassdoor',
    test: (u) => /(^|\.)glassdoor\.com$/i.test(u.hostname),
  },
  {
    id: 'ziprecruiter',
    label: 'ZipRecruiter',
    test: (u) => /(^|\.)ziprecruiter\.com$/i.test(u.hostname),
  },
  {
    id: 'governmentjobs',
    label: 'GovernmentJobs',
    test: (u) =>
      /(^|\.)governmentjobs\.com$/i.test(u.hostname)
      || /(^|\.)schooljobs\.com$/i.test(u.hostname),
  },
];

/** Hosts allowed for server-side public ATS fetch (must match client classification). */
export function isAllowedPublicAtsHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return PUBLIC_ATS_HOSTS.some((rule) => rule.test(h));
}

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_IN_TEXT);
  if (!matches) return [];
  return matches.map((u) => u.replace(/[.,;:!?]+$/, ''));
}

function tryParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Classify pasted job input for progressive UI.
 * Priority: blocked boards > public ATS > lone other URL > plain text.
 */
export function classifyJobInput(text: string): JobInputClassification {
  const trimmed = text.trim();
  if (!trimmed) {
    return { kind: 'plain', url: null };
  }

  const urls = extractUrls(trimmed);
  if (urls.length === 0) {
    return { kind: 'plain', url: null };
  }

  for (const raw of urls) {
    const parsed = tryParseUrl(raw);
    if (!parsed) continue;

    for (const board of BLOCKED_BOARDS) {
      if (board.test(parsed)) {
        return {
          kind: 'blocked_board',
          url: raw,
          boardId: board.id,
          boardLabel: board.label,
        };
      }
    }
  }

  for (const raw of urls) {
    const parsed = tryParseUrl(raw);
    if (!parsed) continue;
    const host = parsed.hostname.toLowerCase();
    for (const ats of PUBLIC_ATS_HOSTS) {
      if (ats.test(host)) {
        return {
          kind: 'public_ats',
          url: raw,
          atsId: ats.id,
          boardLabel: ats.id === 'greenhouse' ? 'Greenhouse' : 'Lever',
        };
      }
    }
  }

  const onlyUrl = /^https?:\/\/[^\s]+$/.test(trimmed);
  if (onlyUrl) {
    return { kind: 'other_url', url: urls[0] ?? trimmed };
  }

  return { kind: 'plain', url: urls[0] ?? null };
}
