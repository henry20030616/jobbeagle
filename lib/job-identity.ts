/**
 * Company + job title must be present before analysis.
 * Placeholder fallbacks like "Unknown Company" are treated as missing.
 */

const PLACEHOLDER_COMPANY =
  /^(unknown\s*company|未知公司|n\/?a|none|null|—+|-+|\.|\*+)$/i;

const PLACEHOLDER_TITLE =
  /^(unknown\s*role|未知職缺|未知职位|未知職位|n\/?a|none|null|—+|-+|\.|\*+)$/i;

const COMPANY_LINE =
  /(?:^|\n)\s*(?:Company|公司|企業|企业|雇主|Employer|Agency|Department|Organization|組織|组织|公司名稱|公司名称)\s*[：:]\s*(.+)/i;

const TITLE_LINE =
  /(?:^|\n)\s*(?:Title|Position|Role|職位|职位|職缺|岗位)\s*[：:]\s*(.+)/i;

/** "Senior PM at Acme Corp" / "PM @ Google" near the top of a paste. */
const TITLE_AT_COMPANY =
  /(?:^|\n)\s*([^\n|]{2,80}?)\s+(?:at|@)\s+([^\n|]{2,80})(?:\s*[|\-–]|\s*$)/i;

/**
 * Taiwan / APAC job boards often put the employer in fullwidth or square
 * brackets on the first line: 【國泰投信】數據分析師 / [Cathay] Data PM
 */
const BRACKET_COMPANY_HEAD =
  /^(?:【\s*([^】]{2,40}?)\s*】|\[\s*([^\]]{2,40}?)\s*\])\s*(.+)$/;

function firstLineValue(raw: string): string {
  return raw.trim().split(/\n/)[0]?.trim().replace(/\s+/g, ' ') ?? '';
}

function cleanTitleTail(raw: string): string {
  return raw
    .trim()
    .replace(/[_［\[][A-Za-z]?\d{4,}.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
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

function firstContentLine(text: string): string {
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (t) return t;
  }
  return '';
}

/** Pull labeled (or bracket / "Title at Company") identity from pasted JD text. */
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
    const head = firstContentLine(trimmed.slice(0, 400));
    const bracket = head.match(BRACKET_COMPANY_HEAD);
    if (bracket) {
      const maybeCompany = (bracket[1] || bracket[2] || '').trim();
      const maybeTitle = cleanTitleTail(bracket[3] || '');
      if (!company && isUsableCompanyName(maybeCompany)) company = maybeCompany;
      if (!title && isUsableJobTitle(maybeTitle)) title = maybeTitle;
    }
  }

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
