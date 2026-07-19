import type { ProvenanceEntry, ProvenanceRecord } from '@/types';

const DATE_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export function isValidHttpUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeSourceDate(raw: string | undefined | null): string {
  const s = (raw ?? '').trim();
  if (!s) return '';
  if (DATE_RE.test(s)) return s;
  // Accept "2026-06" style already; strip trailing junk
  const m = s.match(/^(\d{4}(?:-\d{2})?(?:-\d{2})?)/);
  return m ? m[1] : '';
}

export function validateProvenanceUrl(raw: string | undefined | null): {
  url: string;
  status: ProvenanceEntry['status'];
} {
  const s = (raw ?? '').trim();
  if (!s) return { url: '', status: 'unverified' };
  if (isValidHttpUrl(s)) return { url: s, status: 'valid' };
  return { url: '', status: 'invalid' };
}

export function buildProvenanceRecord(input: {
  reportVersion?: string;
  offerSources?: string[];
  insights?: Array<{ claim: string; source_url?: string; date?: string }>;
  reportedQuestions?: Array<{ question: string; source_url?: string; source_date?: string }>;
}): ProvenanceRecord {
  const entries: ProvenanceEntry[] = [];
  let invalidCount = 0;

  for (const s of input.offerSources ?? []) {
    const label = (s ?? '').trim();
    if (!label) continue;
    if (isValidHttpUrl(label)) {
      entries.push({
        label: label.slice(0, 120),
        url: label,
        date: '',
        status: 'valid',
        kind: 'offer',
      });
    } else {
      entries.push({
        label: label.slice(0, 200),
        url: '',
        date: '',
        status: 'unverified',
        kind: 'offer',
      });
    }
  }

  for (const ins of input.insights ?? []) {
    const { url, status } = validateProvenanceUrl(ins.source_url);
    if (status === 'invalid') invalidCount += 1;
    const date = normalizeSourceDate(ins.date);
    entries.push({
      label: (ins.claim || url || 'Insight').slice(0, 200),
      url,
      date,
      status: url ? status : ins.source_url?.trim() ? 'invalid' : 'unverified',
      kind: 'hiring',
    });
  }

  for (const q of input.reportedQuestions ?? []) {
    const { url, status } = validateProvenanceUrl(q.source_url);
    if (status === 'invalid') invalidCount += 1;
    entries.push({
      label: (q.question || url || 'Reported question').slice(0, 200),
      url,
      date: normalizeSourceDate(q.source_date),
      status: url ? status : q.source_url?.trim() ? 'invalid' : 'unverified',
      kind: 'interview',
    });
  }

  return {
    report_version: (input.reportVersion || 'v3').trim() || 'v3',
    validated_at: new Date().toISOString(),
    entries,
    invalid_url_count: invalidCount,
  };
}

/** Clear dead insight URLs so UI does not link junk. */
export function scrubInsightUrls<T extends { source_url?: string; date?: string }>(
  insights: T[],
): T[] {
  return insights.map((ins) => {
    const { url, status } = validateProvenanceUrl(ins.source_url);
    const date = normalizeSourceDate(ins.date);
    if (status === 'invalid') {
      return { ...ins, source_url: '', date };
    }
    return { ...ins, source_url: url || ins.source_url || '', date: date || ins.date || '' };
  });
}
