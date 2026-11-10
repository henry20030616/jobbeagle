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
 * First 【公司】or [Company] in a blob — 104 / APAC boards often write
 * `職位：【國泰投信】數據分析師` (label + brackets on one line).
 */
const BRACKET_COMPANY =
  /【\s*([^】]{2,40}?)\s*】|\[\s*([^\]]{2,40}?)\s*\]/;

/** Full legal Chinese company names appearing in the posting body. */
const CORP_NAME =
  /([\u4e00-\u9fffA-Za-z0-9（）()]{2,48}(?:股份有限公司|有限公司|投資信託|投信))/;

function firstLineValue(raw: string): string {
  return raw.trim().split(/\n/)[0]?.trim().replace(/\s+/g, ' ') ?? '';
}

function cleanTitleTail(raw: string): string {
  return raw
    .trim()
    .replace(/[_［\[][A-Za-z]?\d{4,}.*$/u, '')
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
  // Title that is only a bracketed company is not a role title.
  if (/^[【\[]/.test(v) && /[】\]]$/.test(v)) return false;
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

function bracketCompanyFrom(blob: string): string | null {
  const m = blob.match(BRACKET_COMPANY);
  if (!m) return null;
  const company = (m[1] || m[2] || '').trim();
  return isUsableCompanyName(company) ? company : null;
}

/**
 * If `blob` contains 【公司】title…, return company + cleaned title remainder
 * after the closing bracket (same line preference).
 */
function peelBracketIdentity(blob: string): {
  company: string | null;
  title: string | null;
} {
  const m = blob.match(
    /【\s*([^】]{2,40}?)\s*】\s*(.*)|\[\s*([^\]]{2,40}?)\s*\]\s*(.*)/,
  );
  if (!m) return { company: null, title: null };
  const company = (m[1] || m[3] || '').trim();
  const rest = cleanTitleTail(m[2] || m[4] || '');
  return {
    company: isUsableCompanyName(company) ? company : null,
    title: isUsableJobTitle(rest) ? rest : null,
  };
}

/** Pull labeled / bracket / corp-suffix / "Title at Company" identity from JD text. */
export function extractJobIdentity(text: string): JobIdentity {
  const trimmed = text.trim();
  if (!trimmed) return { company: null, title: null };

  const head = trimmed.slice(0, 800);

  const companyRaw = trimmed.match(COMPANY_LINE)?.[1];
  const titleRaw = trimmed.match(TITLE_LINE)?.[1];

  let company = companyRaw ? firstLineValue(companyRaw) : null;
  let title = titleRaw ? firstLineValue(titleRaw) : null;

  if (!isUsableCompanyName(company)) company = null;
  if (!isUsableJobTitle(title)) title = null;

  // `職位：【國泰投信】數據 / AI…` — title label ate the bracketed company.
  if (title && (!company || /[【\[]/.test(title))) {
    const peeled = peelBracketIdentity(title);
    if (peeled.company) company = company ?? peeled.company;
    if (peeled.title) title = peeled.title;
  }

  if (!company || !title) {
    const first = firstContentLine(head);
    const withoutLabel = first.replace(
      /^(?:Title|Position|Role|職位|职位|職缺|岗位)\s*[：:]\s*/i,
      '',
    );
    const peeled = peelBracketIdentity(withoutLabel);
    if (!company && peeled.company) company = peeled.company;
    if (!title && peeled.title) title = peeled.title;
    if (!company) {
      const fromHead = bracketCompanyFrom(head);
      if (fromHead) company = fromHead;
    }
  }

  if (!company) {
    const corp = head.match(CORP_NAME)?.[1]?.trim();
    if (corp && isUsableCompanyName(corp)) company = corp;
  }

  if (!company || !title) {
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
