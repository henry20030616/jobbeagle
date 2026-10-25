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
  ['Suggested quote', '建議報價', '建议报价'],
  ['Negotiation ceiling', '議價上限', '议价上限'],
  ['Walk-away line', '談判底線', '谈判底线'],
  ['Target total', '目標總酬', '目标总酬'],
  ['Pay structure', '薪酬結構', '薪酬结构'],
  ['Lead with total', '先報總酬', '先报总酬'],
  ['Concession pace', '讓步節奏', '让步节奏'],
  ['Do not match bids', '勿跟競價', '勿跟竞价'],
  ['Lock base first', '底薪先鎖', '底薪先锁'],
  ['Ask package once', '福利一次問清', '福利一次问清'],
  ['Visa separately', '簽證另議', '签证另议'],
  ['Do not trade base', '底薪不換', '底薪不换'],
  ['Opening script', '開場講稿', '开场讲稿'],
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
  open: 'Suggested quote',
  開價: 'Suggested quote',
  开价: 'Suggested quote',
  cap: 'Negotiation ceiling',
  ceiling: 'Negotiation ceiling',
  上限: 'Negotiation ceiling',
  天花板: 'Negotiation ceiling',
  ban: 'Walk-away line',
  禁區: 'Walk-away line',
  禁区: 'Walk-away line',
  target: 'Target total',
  目標價: 'Target total',
  目标价: 'Target total',
  mix: 'Pay structure',
  結構: 'Pay structure',
  结构: 'Pay structure',
  開價結構: 'Pay structure',
  开价结构: 'Pay structure',
  'open mix': 'Pay structure',
  'name the total first': 'Lead with total',
  先報總薪酬: 'Lead with total',
  先报总薪酬: 'Lead with total',
  'counter once': 'Concession pace',
  還一次: 'Concession pace',
  还一次: 'Concession pace',
  退一次: 'Concession pace',
  一次讓步: 'Concession pace',
  一次让步: 'Concession pace',
  'no invented bid': 'Do not match bids',
  不編競爭: 'Do not match bids',
  不编竞争: 'Do not match bids',
  不隨競爭: 'Do not match bids',
  不随竞争: 'Do not match bids',
  先鎖底薪: 'Lock base first',
  先锁底薪: 'Lock base first',
  'ask once': 'Ask package once',
  一次問完: 'Ask package once',
  一次问完: 'Ask package once',
  簽證另問: 'Visa separately',
  签证另问: 'Visa separately',
  'no base trade': 'Do not trade base',
  不換底薪: 'Do not trade base',
  不换底薪: 'Do not trade base',
  開口稿: 'Opening script',
  开口稿: 'Opening script',
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
