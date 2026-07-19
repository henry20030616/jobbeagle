/** Infer board name from a job page URL. */
export function jobSourceFromUrl(url: string | null | undefined): string {
  const raw = (url ?? '').trim();
  if (!raw) return '';
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
    if (host.includes('linkedin.')) return 'LinkedIn';
    if (host.includes('indeed.')) return 'Indeed';
    if (host.includes('glassdoor.')) return 'Glassdoor';
    if (host.includes('ziprecruiter.')) return 'ZipRecruiter';
    if (host.includes('104.com') || host.includes('104.com.tw')) return '104';
    if (host.includes('greenhouse.')) return 'Greenhouse';
    if (host.includes('lever.co')) return 'Lever';
    if (host.includes('ashbyhq.')) return 'Ashby';
    if (host.includes('workday.')) return 'Workday';
    // First label of hostname, capitalized
    const label = host.split('.')[0];
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
  } catch {
    return '';
  }
}

/** UI line: "LinkedIn 2026-06-18" */
export function formatJobSourceDate(
  source: string | null | undefined,
  postedDate: string | null | undefined,
): string {
  const src = (source ?? '').trim();
  const date = (postedDate ?? '').trim();
  if (src && date) return `${src} ${date}`;
  if (src) return `${src} · date not listed`;
  if (date) return date;
  return 'Source and date not listed';
}
