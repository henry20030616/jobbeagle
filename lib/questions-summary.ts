import { splitLabeledFact } from '@/lib/score-summary';
import type { AppLanguage } from '@/lib/report-language';

/** Live Guide summaries are process + two analysis blocks, not three short labels. */
export const QUESTIONS_SUMMARY_MAX = 2500;

export type AnalysisPoint = {
  title: string;
  gist: string;
  body: string;
};

export type QuestionsSummaryParts = {
  process: string;
  professional: AnalysisPoint[];
  behavioral: AnalysisPoint[];
  locale: AppLanguage;
};

type AnalysisInput = AnalysisPoint[] | string[] | string | undefined;

const PROCESS_LABELS = [
  'Hiring process',
  'Proceso de contratación',
  'भर्ती प्रक्रिया',
  'عملية التوظيف',
  '招募流程',
  '招聘流程',
];

const PROFESSIONAL_LABELS = [
  'Professional analysis',
  'Análisis profesional',
  'पेशेवर विश्लेषण',
  'التحليل المهني',
  '專業題分析',
  '专业题分析',
  'Professional',
  'Profesional',
  'पेशेवर',
  '專業題',
  '专业题',
  'مهني',
];

const BEHAVIORAL_LABELS = [
  'Behavioral analysis',
  'Análisis conductual',
  'व्यवहारिक विश्लेषण',
  'التحليل السلوكي',
  '行為題分析',
  '行为题分析',
  'Behavioral',
  'Conductual',
  'व्यवहारिक',
  '行為題',
  '行为题',
  'سلوكي',
];

const SECTION_LABELS: Record<AppLanguage, { process: string; professional: string; behavioral: string }> = {
  en: {
    process: 'Hiring process',
    professional: 'Professional analysis',
    behavioral: 'Behavioral analysis',
  },
  'zh-TW': {
    process: '招募流程',
    professional: '專業題分析',
    behavioral: '行為題分析',
  },
  'zh-CN': {
    process: '招聘流程',
    professional: '专业题分析',
    behavioral: '行为题分析',
  },
  es: {
    process: 'Proceso de contratación',
    professional: 'Análisis profesional',
    behavioral: 'Análisis conductual',
  },
  hi: {
    process: 'भर्ती प्रक्रिया',
    professional: 'पेशेवर विश्लेषण',
    behavioral: 'व्यवहारिक विश्लेषण',
  },
  ar: {
    process: 'عملية التوظيف',
    professional: 'التحليل المهني',
    behavioral: 'التحليل السلوكي',
  },
};

/** Sentence-shaped labels that must stay body text, not inner titles. */
const TITLE_BLOCKLIST =
  /^(準備兩則|准备两则|面試在測|面试在测|這份|这份|The |This |Prepare |La ronda|Este puesto)/i;

function foldLabel(value: string): string {
  return value.trim().toLowerCase();
}

function matchLabel(label: string, known: string[]): boolean {
  const folded = foldLabel(label);
  return known.some((item) => foldLabel(item) === folded);
}

function classifyLabel(label: string): 'process' | 'professional' | 'behavioral' | null {
  if (matchLabel(label, PROCESS_LABELS)) return 'process';
  if (matchLabel(label, PROFESSIONAL_LABELS)) return 'professional';
  if (matchLabel(label, BEHAVIORAL_LABELS)) return 'behavioral';
  return null;
}

function bodyLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function pointSep(locale: AppLanguage): string {
  return locale === 'en' || locale === 'es' ? ': ' : '：';
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function detectQuestionsSummaryLocale(text: string): AppLanguage {
  if (/招聘流程|专业题/.test(text)) return 'zh-CN';
  if (/招募流程|專業題/.test(text)) return 'zh-TW';
  if (/Proceso de contratación|Análisis profesional|Análisis conductual/.test(text)) return 'es';
  if (/भर्ती प्रक्रिया|पेशेवर विश्लेषण|व्यवहारिक विश्लेषण/.test(text)) return 'hi';
  if (/عملية التوظيف|التحليل المهني|التحليل السلوكي/.test(text)) return 'ar';
  return 'en';
}

export function isAnalysisTitleLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const split = splitLabeledFact(trimmed);
  if (!split.detail || !split.label) return false;
  if (split.label.length > 24) return false;
  if (/[.。！？]/.test(split.label)) return false;
  if (TITLE_BLOCKLIST.test(split.label)) return false;
  return true;
}

export function analysisSearchText(points: AnalysisPoint[]): string {
  return points.map((point) => [point.title, point.gist, point.body].filter(Boolean).join('\n')).join('\n');
}

function splitGistFromBody(title: string, text: string): AnalysisPoint {
  const trimmed = text.trim();
  if (!trimmed) return { title, gist: '', body: '' };
  const match = trimmed.match(/^(.+?[.。！？])\s+(.+)$/s);
  if (match?.[1] && match[2]) {
    return { title, gist: match[1].trim(), body: match[2].trim() };
  }
  return { title, gist: trimmed, body: '' };
}

function parseAnalysisGroup(group: string[]): AnalysisPoint {
  const lines = group.map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return { title: '', gist: '', body: '' };
  const first = lines[0] ?? '';
  if (isAnalysisTitleLine(first)) {
    const split = splitLabeledFact(first);
    const rest = lines.slice(1).join('\n');
    if (rest) return { title: split.label, gist: split.detail, body: rest };
    return splitGistFromBody(split.label, split.detail);
  }
  return { title: '', gist: '', body: lines.join('\n') };
}

export function parseAnalysisLines(lines: string[]): AnalysisPoint[] {
  const groups: string[][] = [];
  let group: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (group.length > 0) {
        groups.push(group);
        group = [];
      }
      continue;
    }
    if (group.length > 0 && isAnalysisTitleLine(line)) {
      groups.push(group);
      group = [line];
      continue;
    }
    group.push(line);
  }
  if (group.length > 0) groups.push(group);

  const titled = groups.some((item) => isAnalysisTitleLine(item[0] ?? ''));
  if (!titled) {
    return lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((body) => ({ title: '', gist: '', body }));
  }
  return groups
    .map(parseAnalysisGroup)
    .filter((point) => point.title || point.gist || point.body);
}

function normalizePoint(point: AnalysisPoint): AnalysisPoint {
  return {
    title: point.title.trim(),
    gist: point.gist.trim(),
    body: point.body.trim(),
  };
}

export function parseAnalysisInput(raw: unknown): AnalysisPoint[] {
  if (Array.isArray(raw)) {
    const points: AnalysisPoint[] = [];
    for (const item of raw) {
      if (typeof item === 'string') {
        points.push(...parseAnalysisLines([item]));
        continue;
      }
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const title = asText(row.title);
      const gist = asText(row.gist);
      const body = asText(row.body);
      if (!title && !gist && !body) continue;
      if (gist) points.push(normalizePoint({ title, gist, body }));
      else if (title) points.push(normalizePoint(splitGistFromBody(title, body)));
      else points.push(...parseAnalysisLines([body]));
    }
    return points.filter((point) => point.title || point.gist || point.body);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return parseAnalysisLines(raw.split('\n').map((line) => line.trim()));
  }
  return [];
}

function toPoints(value: AnalysisInput): AnalysisPoint[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === 'string') {
      return parseAnalysisLines(value as string[]);
    }
    return (value as AnalysisPoint[]).map(normalizePoint).filter((point) => point.title || point.gist || point.body);
  }
  return parseAnalysisLines(bodyLines(value));
}

function formatAnalysisPoint(point: AnalysisPoint, sep: string): string {
  const normalized = normalizePoint(point);
  if (normalized.title) {
    if (normalized.gist && normalized.body) {
      return `${normalized.title}${sep}${normalized.gist}\n${normalized.body}`;
    }
    if (normalized.gist) return `${normalized.title}${sep}${normalized.gist}`;
    if (normalized.body) return `${normalized.title}${sep}${normalized.body}`;
    return normalized.title;
  }
  return normalized.body || normalized.gist;
}

export function parseQuestionsSummary(text: string): QuestionsSummaryParts {
  const locale = detectQuestionsSummaryLocale(text);
  const empty: QuestionsSummaryParts = {
    process: '',
    professional: [],
    behavioral: [],
    locale,
  };
  const trimmed = text.trim();
  if (!trimmed) return empty;

  let current: 'process' | 'professional' | 'behavioral' | null = null;
  const professionalLines: string[] = [];
  const behavioralLines: string[] = [];
  let process = '';

  for (const rawLine of trimmed.split('\n')) {
    const line = rawLine.trim();
    const split = line ? splitLabeledFact(line) : { label: '', detail: '' };
    const headerLabel = line
      ? split.detail
        ? split.label
        : line.replace(/[:：]\s*$/, '').trim()
      : '';
    const kind = line ? classifyLabel(headerLabel) : null;
    if (kind) {
      current = kind;
      if (kind === 'process') {
        process = line;
      } else if (split.detail) {
        (kind === 'professional' ? professionalLines : behavioralLines).push(split.detail);
      }
      continue;
    }
    if (current === 'professional') professionalLines.push(line);
    else if (current === 'behavioral') behavioralLines.push(line);
    else if (current === 'process' && !process && line) process = line;
  }

  return {
    process,
    professional: parseAnalysisLines(professionalLines),
    behavioral: parseAnalysisLines(behavioralLines),
    locale,
  };
}

export function composeQuestionsSummary(parts: {
  process?: string;
  professional?: AnalysisInput;
  behavioral?: AnalysisInput;
  locale?: AppLanguage;
}): string {
  const locale = parts.locale ?? 'en';
  const labels = SECTION_LABELS[locale];
  const sep = pointSep(locale);
  const professional = toPoints(parts.professional);
  const behavioral = toPoints(parts.behavioral);
  const lines: string[] = [];
  const process = (parts.process ?? '').trim();
  if (process) lines.push(process);
  if (professional.length > 0) {
    lines.push(`${labels.professional}${sep}`);
    lines.push(professional.map((point) => formatAnalysisPoint(point, sep)).join('\n\n'));
  }
  if (behavioral.length > 0) {
    lines.push(`${labels.behavioral}${sep}`);
    lines.push(behavioral.map((point) => formatAnalysisPoint(point, sep)).join('\n\n'));
  }
  return lines.join('\n').slice(0, QUESTIONS_SUMMARY_MAX);
}

/** Prefer writing-module analysis; keep the hiring-process line from retrieval. */
export function mergeInterviewSummary(
  existing: string,
  raw: { summary?: unknown; professional_analysis?: unknown; behavioral_analysis?: unknown },
): string {
  const professional = parseAnalysisInput(raw.professional_analysis);
  const behavioral = parseAnalysisInput(raw.behavioral_analysis);
  if (professional.length > 0 || behavioral.length > 0) {
    const parsed = parseQuestionsSummary(existing);
    return composeQuestionsSummary({
      process: parsed.process,
      professional: professional.length > 0 ? professional : parsed.professional,
      behavioral: behavioral.length > 0 ? behavioral : parsed.behavioral,
      locale: parsed.locale,
    });
  }

  const incoming = asText(raw.summary);
  if (incoming) {
    const parsedIncoming = parseQuestionsSummary(incoming);
    if (parsedIncoming.professional.length > 0 || parsedIncoming.behavioral.length > 0) {
      return incoming.slice(0, QUESTIONS_SUMMARY_MAX);
    }
  }

  return existing.slice(0, QUESTIONS_SUMMARY_MAX);
}
