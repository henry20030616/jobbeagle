import { splitLabeledFact } from '@/lib/score-summary';
import type { AppLanguage } from '@/lib/report-language';

/** Live Guide summaries are process + two analysis blocks, not three short labels. */
export const QUESTIONS_SUMMARY_MAX = 2500;

export type QuestionsSummaryParts = {
  process: string;
  professional: string[];
  behavioral: string[];
  locale: AppLanguage;
};

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

export function detectQuestionsSummaryLocale(text: string): AppLanguage {
  if (/招聘流程|专业题/.test(text)) return 'zh-CN';
  if (/招募流程|專業題/.test(text)) return 'zh-TW';
  if (/Proceso de contratación|Análisis profesional|Análisis conductual/.test(text)) return 'es';
  if (/भर्ती प्रक्रिया|पेशेवर विश्लेषण|व्यवहारिक विश्लेषण/.test(text)) return 'hi';
  if (/عملية التوظيف|التحليل المهني|التحليل السلوكي/.test(text)) return 'ar';
  return 'en';
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
  const professional: string[] = [];
  const behavioral: string[] = [];
  let process = '';

  for (const rawLine of trimmed.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const split = splitLabeledFact(line);
    const headerLabel = split.detail
      ? split.label
      : line.replace(/[:：]\s*$/, '').trim();
    const kind = classifyLabel(headerLabel);
    if (kind) {
      current = kind;
      if (kind === 'process') {
        process = line;
      } else if (split.detail) {
        (kind === 'professional' ? professional : behavioral).push(split.detail);
      }
      continue;
    }
    if (current === 'professional') professional.push(line);
    else if (current === 'behavioral') behavioral.push(line);
    else if (current === 'process' && !process) process = line;
  }

  return { process, professional, behavioral, locale };
}

export function composeQuestionsSummary(parts: {
  process?: string;
  professional?: string[] | string;
  behavioral?: string[] | string;
  locale?: AppLanguage;
}): string {
  const locale = parts.locale ?? 'en';
  const labels = SECTION_LABELS[locale];
  const sep = locale === 'en' || locale === 'es' ? ': ' : '：';
  const professional = Array.isArray(parts.professional)
    ? parts.professional
    : bodyLines(parts.professional ?? '');
  const behavioral = Array.isArray(parts.behavioral)
    ? parts.behavioral
    : bodyLines(parts.behavioral ?? '');
  const lines: string[] = [];
  const process = (parts.process ?? '').trim();
  if (process) lines.push(process);
  if (professional.length > 0) {
    lines.push(`${labels.professional}${sep}`);
    lines.push(...professional);
  }
  if (behavioral.length > 0) {
    lines.push(`${labels.behavioral}${sep}`);
    lines.push(...behavioral);
  }
  return lines.join('\n').slice(0, QUESTIONS_SUMMARY_MAX);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Prefer writing-module analysis; keep the hiring-process line from retrieval. */
export function mergeInterviewSummary(
  existing: string,
  raw: { summary?: unknown; professional_analysis?: unknown; behavioral_analysis?: unknown },
): string {
  const professional = asText(raw.professional_analysis);
  const behavioral = asText(raw.behavioral_analysis);
  if (professional || behavioral) {
    const parsed = parseQuestionsSummary(existing);
    return composeQuestionsSummary({
      process: parsed.process,
      professional: professional || parsed.professional,
      behavioral: behavioral || parsed.behavioral,
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
