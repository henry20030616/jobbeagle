import { isCitableSourceUrl } from '@/lib/provenance';
import type { AppLanguage } from '@/lib/report-language';
import {
  composeQuestionsSummary,
  parseAnalysisInput,
  parseQuestionsSummary,
  type AnalysisPoint,
} from '@/lib/questions-summary';

export type GroundedAnalysisPoint = AnalysisPoint & { question?: string };

export type InterviewSummaryBank = {
  professional?: Array<{ question?: string; origin?: string | null; source_url?: string | null }>;
  behavioral?: Array<{ question?: string; origin?: string | null; source_url?: string | null }>;
};

const EMPTY_TRACK_COPY: Record<AppLanguage, { professional: string; behavioral: string }> = {
  en: {
    professional:
      'No citable professional questions were found this time. Public search did not return a real question with a citeable URL, so this side has no topic analysis. Predicted questions stay labeled as predictions and are not analyzed as real questions.',
    behavioral:
      'No citable behavioral questions were found this time. Public search did not return a real question with a citeable URL, so this side has no topic analysis. Predicted questions stay labeled as predictions and are not analyzed as real questions.',
  },
  'zh-TW': {
    professional:
      '這次沒有找到可引用的專業題。公開搜尋沒有帶出可引用網址的真題，因此不做主題分析。預測題另標為預測，不會當成真實題目來分析。',
    behavioral:
      '這次沒有找到可引用的行為題。公開搜尋沒有帶出可引用網址的真題，因此不做主題分析。預測題另標為預測，不會當成真實題目來分析。',
  },
  'zh-CN': {
    professional:
      '这次没有找到可引用的专业题。公开搜索没有带出可引用网址的真题，因此不做主题分析。预测题另标为预测，不会当成真实题目来分析。',
    behavioral:
      '这次没有找到可引用的行为题。公开搜索没有带出可引用网址的真题，因此不做主题分析。预测题另标为预测，不会当成真实题目来分析。',
  },
  es: {
    professional:
      'Esta vez no hay preguntas profesionales citables. La búsqueda pública no devolvió una pregunta real con URL citable, así que este lado no tiene análisis temático. Las preguntas predichas se etiquetan aparte y no se analizan como preguntas reales.',
    behavioral:
      'Esta vez no hay preguntas conductuales citables. La búsqueda pública no devolvió una pregunta real con URL citable, así que este lado no tiene análisis temático. Las preguntas predichas se etiquetan aparte y no se analizan como preguntas reales.',
  },
  hi: {
    professional:
      'इस बार कोई उद्धरण योग्य पेशेवर प्रश्न नहीं मिला। सार्वजनिक खोज में उद्धरण योग्य URL वाली असली प्रश्न नहीं आई, इसलिए इस ओर विषय विश्लेषण नहीं है। अनुमानित प्रश्न अलग लेबल रहते हैं और असली प्रश्नों की तरह विश्लेषित नहीं होते।',
    behavioral:
      'इस बार कोई उद्धरण योग्य व्यवहारिक प्रश्न नहीं मिला। सार्वजनिक खोज में उद्धरण योग्य URL वाली असली प्रश्न नहीं आई, इसलिए इस ओर विषय विश्लेषण नहीं है। अनुमानित प्रश्न अलग लेबल रहते हैं और असली प्रश्नों की तरह विश्लेषित नहीं होते।',
  },
  ar: {
    professional:
      'لم يُعثر هذه المرة على أسئلة مهنية قابلة للاقتباس. البحث العلني لم يُرجع سؤالاً حقيقياً برابط قابل للاستشهاد، لذلك لا تحليل موضوعياً لهذا الجانب. الأسئلة المتوقعة تبقى موسومة كذلك ولا تُحلَّل كأسئلة حقيقية.',
    behavioral:
      'لم يُعثر هذه المرة على أسئلة سلوكية قابلة للاقتباس. البحث العلني لم يُرجع سؤالاً حقيقياً برابط قابل للاستشهاد، لذلك لا تحليل موضوعياً لهذا الجانب. الأسئلة المتوقعة تبقى موسومة كذلك ولا تُحلَّل كأسئلة حقيقية.',
  },
};

const QUESTION_LEAD_IN =
  /^(walk me through(?: how)?|tell me about(?: a time)?|how do you|how would you|how have you|describe(?: a time)?|what would you|what sql|which ops|when have you|a stakeholder|請說明你|請說明|請分享你|請分享|请说明你|请说明|请分享你|请分享|explícame|cuéntame|describe|¿cómo|اشرح|صف)\s+/i;

function foldStem(value: string): string {
  return value.trim().toLowerCase();
}

export function emptyTrackAnalysisCopy(
  locale: AppLanguage,
  track: 'professional' | 'behavioral',
): string {
  return EMPTY_TRACK_COPY[locale][track];
}

export function reportedQuestionStems(
  items: Array<{ question?: string; origin?: string | null; source_url?: string | null }> | undefined,
): string[] {
  if (!items) return [];
  const stems: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const question = (item.question ?? '').trim();
    if (!question || item.origin !== 'reported') continue;
    if (!isCitableSourceUrl(item.source_url)) continue;
    const key = foldStem(question);
    if (seen.has(key)) continue;
    seen.add(key);
    stems.push(question);
  }
  return stems;
}

function matchSnippets(stem: string): string[] {
  const compact = stem.replace(/\s+/g, ' ').trim();
  const stripped = compact.replace(QUESTION_LEAD_IN, '').replace(/[?？]/g, '').trim();
  const snippets = new Set<string>();
  if (compact.length >= 16) snippets.add(compact);
  if (stripped.length >= 16) snippets.add(stripped);
  if (stripped.length >= 16) snippets.add(stripped.slice(0, Math.min(24, stripped.length)));
  return [...snippets];
}

function haystackOf(point: GroundedAnalysisPoint): string {
  return [point.question, point.title, point.gist, point.body].filter(Boolean).join('\n');
}

export function matchAnalysisQuestion(point: GroundedAnalysisPoint, stems: string[]): string | null {
  const hayFold = haystackOf(point).toLowerCase();
  for (const stem of stems) {
    const fold = stem.toLowerCase();
    if (point.question && foldStem(point.question) === foldStem(stem)) return stem;
    if (fold.length >= 12 && hayFold.includes(fold)) return stem;
    for (const snippet of matchSnippets(stem)) {
      if (snippet.length >= 16 && hayFold.includes(snippet.toLowerCase())) return stem;
    }
  }
  return null;
}

export function groundAnalysisPoints(
  points: GroundedAnalysisPoint[],
  stems: string[],
): GroundedAnalysisPoint[] {
  const used = new Set<string>();
  const out: GroundedAnalysisPoint[] = [];
  for (const point of points) {
    const matched = matchAnalysisQuestion(point, stems);
    if (!matched) continue;
    const key = foldStem(matched);
    if (used.has(key)) continue;
    used.add(key);
    out.push({ ...point, question: matched });
  }
  return out;
}

function fallbackTitle(stem: string): string {
  const stripped = stem.replace(QUESTION_LEAD_IN, '').replace(/[?？]/g, '').trim();
  if (!stripped) return stem.slice(0, 24);
  if (/[\u4e00-\u9fff]/.test(stripped)) return stripped.slice(0, 8);
  const words = stripped.replace(/^(how you|how to|a time you|a time)\s+/i, '').split(/\s+/);
  return words.slice(0, 5).join(' ').slice(0, 48);
}

export function fallbackAnalysisFromQuestions(stems: string[]): GroundedAnalysisPoint[] {
  return stems.slice(0, 3).map((stem) => ({
    title: fallbackTitle(stem),
    gist: stem,
    body: '',
    question: stem,
  }));
}

export function resolveTrackAnalysis(
  points: GroundedAnalysisPoint[],
  reportedStems: string[],
): { points: GroundedAnalysisPoint[]; empty: boolean } {
  if (reportedStems.length === 0) return { points: [], empty: true };
  const grounded = groundAnalysisPoints(points, reportedStems);
  if (grounded.length > 0) return { points: grounded, empty: false };
  return { points: fallbackAnalysisFromQuestions(reportedStems), empty: false };
}

function pointsFromRaw(raw: unknown): GroundedAnalysisPoint[] {
  const parsed = parseAnalysisInput(raw);
  if (!Array.isArray(raw)) return parsed;
  return parsed.map((point, index) => {
    const item = raw[index];
    if (!item || typeof item !== 'object') return point;
    const question = typeof (item as { question?: unknown }).question === 'string'
      ? (item as { question: string }).question.trim()
      : '';
    return question ? { ...point, question } : point;
  });
}

/** Ground writing-module analysis to reported stems; keep the hiring-process line. */
export function groundInterviewSummary(
  existing: string,
  raw: { summary?: unknown; professional_analysis?: unknown; behavioral_analysis?: unknown },
  bank: InterviewSummaryBank,
): string {
  const parsed = parseQuestionsSummary(existing);
  let professional = pointsFromRaw(raw.professional_analysis);
  let behavioral = pointsFromRaw(raw.behavioral_analysis);
  if (professional.length === 0) professional = parsed.professional;
  if (behavioral.length === 0) behavioral = parsed.behavioral;
  const proResolved = resolveTrackAnalysis(professional, reportedQuestionStems(bank.professional));
  const behResolved = resolveTrackAnalysis(behavioral, reportedQuestionStems(bank.behavioral));
  return composeQuestionsSummary({
    process: parsed.process,
    professional: proResolved.empty
      ? [{ title: '', gist: '', body: emptyTrackAnalysisCopy(parsed.locale, 'professional') }]
      : proResolved.points,
    behavioral: behResolved.empty
      ? [{ title: '', gist: '', body: emptyTrackAnalysisCopy(parsed.locale, 'behavioral') }]
      : behResolved.points,
    locale: parsed.locale,
  });
}
