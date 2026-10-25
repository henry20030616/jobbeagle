/**
 * Company-page 總結分析: employer column vs seat column.
 * New reports emit summary_company / summary_role. Live reports may still
 * store a single 6-bullet blob in summary — split that instead of inventing.
 */

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function splitLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const COMPANY_LABELS = new Set([
  'culture',
  'ops risk',
  'visa and remote',
  '文化',
  '營運風險',
  '运营风险',
  '簽證與遠端',
  '签证与远程',
]);

const ROLE_LABELS = new Set([
  'seat vs posting',
  'delivery',
  '職位對照',
  '职位对照',
  '交付節奏',
  '交付节奏',
]);

const CONFIRM_LABELS = new Set(['confirm', '待確認', '待确认']);

const ROLE_CONFIRM =
  /promotion|on-call|day-one|day one|晉升|晋升|待命|第一天|on call/i;

function kindOf(line: string): 'company' | 'role' | 'unknown' {
  const label = (line.split(/[:：]/, 1)[0] ?? line).trim().toLowerCase();
  if (COMPANY_LABELS.has(label)) return 'company';
  if (ROLE_LABELS.has(label)) return 'role';
  if (CONFIRM_LABELS.has(label)) {
    return ROLE_CONFIRM.test(line) && !/WARN|headcount|人力|贊助|赞助|visa/i.test(line)
      ? 'role'
      : 'company';
  }
  return 'unknown';
}

function fallbackHalves(lines: string[]): { company: string[]; role: string[] } {
  if (lines.length <= 1) return { company: lines, role: [] };
  const cut = Math.max(1, Math.ceil(lines.length / 2));
  return { company: lines.slice(0, cut), role: lines.slice(cut) };
}

export function splitLegacyCompanySummary(summary: string): {
  summary_company: string;
  summary_role: string;
} {
  const lines = splitLines(summary);
  if (lines.length === 0) return { summary_company: '', summary_role: '' };

  const company: string[] = [];
  const role: string[] = [];
  const unknown: string[] = [];
  for (const line of lines) {
    const kind = kindOf(line);
    if (kind === 'company') company.push(line);
    else if (kind === 'role') role.push(line);
    else unknown.push(line);
  }

  if (company.length === 0 && role.length === 0) {
    return {
      summary_company: fallbackHalves(lines).company.join('\n'),
      summary_role: fallbackHalves(lines).role.join('\n'),
    };
  }

  if (unknown.length > 0) {
    if (company.length === 0 && role.length === 0) {
      const halves = fallbackHalves(unknown);
      return {
        summary_company: halves.company.join('\n'),
        summary_role: halves.role.join('\n'),
      };
    }
    if (company.length === 0) role.push(...unknown);
    else if (role.length === 0) company.push(...unknown);
    else if (company.length <= role.length) company.push(...unknown);
    else role.push(...unknown);
  }

  return {
    summary_company: company.join('\n'),
    summary_role: role.join('\n'),
  };
}

export function resolveCompanyEvalSummaries(row: {
  summary?: unknown;
  summary_company?: unknown;
  summary_role?: unknown;
}): {
  summary: string;
  summary_company: string;
  summary_role: string;
} {
  const summaryCompany = asText(row.summary_company);
  const summaryRole = asText(row.summary_role);
  if (summaryCompany || summaryRole) {
    return {
      summary: [summaryCompany, summaryRole].filter(Boolean).join('\n'),
      summary_company: summaryCompany,
      summary_role: summaryRole,
    };
  }

  const summary = asText(row.summary);
  const split = splitLegacyCompanySummary(summary);
  return {
    summary,
    summary_company: split.summary_company,
    summary_role: split.summary_role,
  };
}
