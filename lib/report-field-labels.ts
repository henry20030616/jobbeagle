import type { AppLanguage } from '@/lib/report-language';
import { splitLabeledFact } from '@/lib/score-summary';

const PAIRS: Array<[string, string, string?]> = [
  ['Core fit', '核心適配', '核心适配'],
  ['Level/tenure', '職級／年資', '职级／年资'],
  ['Main gap', '主要缺口', '主要缺口'],
  ['Years', '年資', '年资'],
  ['Skill', '技能', '技能'],
  ['System', '系統', '系统'],
  ['Domain', '領域', '领域'],
  ['License', '證照', '证照'],
  ['Degree', '學歷', '学历'],
  ['Requirements backlog', '需求 backlog', '需求 backlog'],
  ['Acceptance criteria', '驗收標準', '验收标准'],
  ['Ops KPI pack', '營運指標', '运营指标'],
  ['KPI pack', '營運指標', '运营指标'],
  ['Dashboard', '儀表板', '仪表板'],
  ['Runbook', '操作手冊', '操作手册'],
  ['Deliverable', '交付物', '交付物'],
  ['Project execution plan', '專案執行計畫', '项目执行计划'],
];

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[／⁄]/g, '/')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');
}

function variantFor(language: AppLanguage, en: string, tw: string, cn?: string): string {
  if (language === 'zh-TW') return tw;
  if (language === 'zh-CN') return cn ?? tw;
  return en;
}

const EXTRA_ALIASES: Record<string, string> = {
  'level/tenure align': 'Level/tenure',
  yoe: 'Years',
  tenure: 'Years',
  tool: 'Skill',
  cert: 'License',
  certification: 'License',
  education: 'Degree',
};

export function localizeReportFieldLabel(
  label: string,
  language: AppLanguage,
): string {
  const raw = label.trim();
  if (!raw) return raw;
  const needle = EXTRA_ALIASES[normalizeKey(raw)] ?? raw;
  const key = normalizeKey(needle);
  for (const [en, tw, cn] of PAIRS) {
    const keys = [en, tw, cn].filter((value): value is string => Boolean(value));
    if (keys.some((item) => normalizeKey(item) === key)) {
      return variantFor(language, en, tw, cn);
    }
  }
  return raw;
}

export function localizeLabeledFactParts(
  item: string,
  language: AppLanguage,
): { label: string; detail: string; separator: string } {
  const { label, detail } = splitLabeledFact(item);
  if (!detail) {
    return { label: localizeReportFieldLabel(label, language), detail: '', separator: '' };
  }
  const localized = localizeReportFieldLabel(label, language);
  const separator = language === 'zh-TW' || language === 'zh-CN' ? '：' : ': ';
  return { label: localized, detail, separator };
}

export function localizeLabeledFactLine(
  point: string,
  language: AppLanguage,
): string {
  const { label, detail, separator } = localizeLabeledFactParts(point, language);
  if (!detail) return label || point;
  return `${label}${separator}${detail}`;
}
