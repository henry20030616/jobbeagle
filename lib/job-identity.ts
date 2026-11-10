/**
 * Company + job title must be present before analysis.
 * Placeholder fallbacks like "Unknown Company" are treated as missing.
 */

const PLACEHOLDER_COMPANY =
  /^(unknown\s*company|未知公司|n\/?a|none|null|—+|-+|empresa\s*desconocida|अज्ञात\s*कंपनी|شركة\s*غير\s*معروفة|\.|\*+)$/i;

const PLACEHOLDER_TITLE =
  /^(unknown\s*role|未知職缺|未知职位|未知職位|n\/?a|none|null|—+|-+|\.|\*+)$/i;

const COMPANY_LINE =
  /(?:^|\n)\s*(?:Company|公司|企業|企业|雇主|Employer|Agency|Department|Organization|組織|组织)\s*[：:]\s*(.+)/i;

const TITLE_LINE =
  /(?:^|\n)\s*(?:Title|Position|Role|職位|职位|職缺|岗位)\s*[：:]\s*(.+)/i;

/** "Senior PM at Acme Corp" / "PM @ Google" near the top of a paste. */
const TITLE_AT_COMPANY =
  /(?:^|\n)\s*([^\n|]{2,80}?)\s+(?:at|@|／|\/)\s+([^\n|]{2,80})(?:\s*[|\-–]|\s*$)/i;

function firstLineValue(raw: string): string {
  return raw.trim().split(/\n/)[0]?.trim().replace(/\s+/g, ' ') ?? '';
}

export function isUsableCompanyName(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  if (v.length < 2 || v.length > 120) return false;
  return !PLACEHOLDER_COMPANY.test(v);
}

export function isUsableJobTitle(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  if (v.length < 2 || v.length > 160) return false;
  return !PLACEHOLDER_TITLE.test(v);
}

export type JobIdentity = {
  company: string | null;
  title: string | null;
};

/** Pull labeled (or "Title at Company") identity from pasted JD text. */
export function extractJobIdentity(text: string): JobIdentity {
  const trimmed = text.trim();
  if (!trimmed) return { company: null, title: null };

  const companyRaw = trimmed.match(COMPANY_LINE)?.[1];
  const titleRaw = trimmed.match(TITLE_LINE)?.[1];

  let company = companyRaw ? firstLineValue(companyRaw) : null;
  let title = titleRaw ? firstLineValue(titleRaw) : null;

  if (!isUsableCompanyName(company)) company = null;
  if (!isUsableJobTitle(title)) title = null;

  if (!company || !title) {
    const head = trimmed.slice(0, 400);
    const at = head.match(TITLE_AT_COMPANY);
    if (at) {
      const maybeTitle = firstLineValue(at[1]);
      const maybeCompany = firstLineValue(at[2])
        .replace(/\s*[|\-–].*$/, '')
        .trim();
      if (!title && isUsableJobTitle(maybeTitle)) title = maybeTitle;
      if (!company && isUsableCompanyName(maybeCompany)) company = maybeCompany;
    }
  }

  return { company, title };
}
