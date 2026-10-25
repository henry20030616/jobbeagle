import type {
  FullReport,
  GuideInterviewBank,
  GuideModules,
  GuideQuestion,
  GuideQuestionOrigin,
  GuideQuestionProximity,
  GuideQuestionTrack,
  GuideSource,
  LiteReport,
} from '@/types';
import {
  ANTHROPIC_WRITING_MODEL,
  GEMINI_FULL_MODEL,
  GEMINI_LITE_MODEL,
} from '@/constants/models';
import { isCitableSourceUrl } from '@/lib/provenance';
import { mergeInterviewSummary, QUESTIONS_SUMMARY_MAX } from '@/lib/questions-summary';

export type GuideModuleId =
  | 'snapshot'
  | 'resume_rewrite'
  | 'salary_land'
  | 'company_intel'
  | 'question_retrieval'
  | 'question_answers'
  | 'negotiation';

export type GuideModelProvider = 'gemini' | 'anthropic';

export interface GuideModuleRoute {
  id: GuideModuleId;
  provider: GuideModelProvider;
  model: string;
  search: boolean;
  /** Runs only after this module's retrieval/search result exists. */
  after?: GuideModuleId;
}

export const GUIDE_WRITING_MODULE_IDS = [
  'resume_rewrite',
  'question_answers',
  'negotiation',
] as const satisfies readonly GuideModuleId[];

export const GUIDE_INTEL_MODULE_IDS = [
  'salary_land',
  'company_intel',
  'question_retrieval',
] as const satisfies readonly GuideModuleId[];

/**
 * Canonical 1018 routes.
 * Snapshot: Flash-Lite, search off, no Anthropic.
 * Intel (items 4, 5, 6 retrieval): Gemini Pro + Search.
 * Writing (item 3 rewrite, item 6 answers, item 7): Claude Sonnet, search off.
 * Runtime: missing ANTHROPIC_API_KEY → writing falls back to Gemini Pro (search off).
 */
const GUIDE_MODULE_ROUTE_BY_ID: Record<GuideModuleId, GuideModuleRoute> = {
  snapshot: { id: 'snapshot', provider: 'gemini', model: GEMINI_LITE_MODEL, search: false },
  resume_rewrite: {
    id: 'resume_rewrite',
    provider: 'anthropic',
    model: ANTHROPIC_WRITING_MODEL,
    search: false,
  },
  salary_land: { id: 'salary_land', provider: 'gemini', model: GEMINI_FULL_MODEL, search: true },
  company_intel: { id: 'company_intel', provider: 'gemini', model: GEMINI_FULL_MODEL, search: true },
  question_retrieval: {
    id: 'question_retrieval',
    provider: 'gemini',
    model: GEMINI_FULL_MODEL,
    search: true,
  },
  question_answers: {
    id: 'question_answers',
    provider: 'anthropic',
    model: ANTHROPIC_WRITING_MODEL,
    search: false,
    after: 'question_retrieval',
  },
  negotiation: {
    id: 'negotiation',
    provider: 'anthropic',
    model: ANTHROPIC_WRITING_MODEL,
    search: false,
    after: 'salary_land',
  },
};

export const GUIDE_MODULE_ROUTES: readonly GuideModuleRoute[] = [
  GUIDE_MODULE_ROUTE_BY_ID.snapshot,
  GUIDE_MODULE_ROUTE_BY_ID.resume_rewrite,
  GUIDE_MODULE_ROUTE_BY_ID.salary_land,
  GUIDE_MODULE_ROUTE_BY_ID.company_intel,
  GUIDE_MODULE_ROUTE_BY_ID.question_retrieval,
  GUIDE_MODULE_ROUTE_BY_ID.question_answers,
  GUIDE_MODULE_ROUTE_BY_ID.negotiation,
];

/** If ANTHROPIC_API_KEY is missing, writing modules use Gemini Pro with search off. */
export function resolveGuideModuleRoute(
  id: GuideModuleId,
  anthropicKeyPresent: boolean,
): GuideModuleRoute {
  const route = GUIDE_MODULE_ROUTE_BY_ID[id];
  if (route.provider === 'anthropic' && !anthropicKeyPresent) {
    return {
      ...route,
      provider: 'gemini',
      model: GEMINI_FULL_MODEL,
      search: false,
    };
  }
  return route;
}

const PROXIMITY_RANK: Record<GuideQuestionProximity, number> = {
  same_company_role: 0,
  same_industry_role: 1,
  cross_industry: 2,
};

function asStringList(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function httpUrl(value: unknown): string | null {
  const url = asString(value);
  if (!isCitableSourceUrl(url)) return null;
  return url.slice(0, 500);
}

function asTrack(value: unknown): GuideQuestionTrack | null {
  return value === 'professional' || value === 'behavioral' ? value : null;
}

function asOrigin(value: unknown): GuideQuestionOrigin | null {
  return value === 'reported' || value === 'predicted' ? value : null;
}

function asProximity(value: unknown): GuideQuestionProximity | null {
  if (
    value === 'same_company_role'
    || value === 'same_industry_role'
    || value === 'cross_industry'
  ) {
    return value;
  }
  return null;
}

/** Year-ish sort key. Missing dates sort last within a proximity bucket. */
function dateKey(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.match(/(20\d{2})/);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = raw.match(/20\d{2}-(\d{1,2})/);
  const m = month ? Number(month[1]) : 0;
  return year * 100 + (Number.isFinite(m) ? m : 0);
}

export function emptyGuideModules(limitations: string[] = []): GuideModules {
  return {
    resume_rewrites: [],
    salary_land: {
      target: '',
      ceiling: '',
      base: null,
      equity: null,
      bonus: null,
      rationale: '',
      buyer_seller: '',
      sources: [],
    },
    company_eval: {
      summary: '',
      culture: '',
      labor_risk: '',
      layoff_risk: '',
      h1b: '',
      remote_sponsorship: '',
      role_reviews: '',
      company_pros: [],
      company_cons: [],
      role_pros: [],
      role_cons: [],
      sources: [],
      role_sources: [],
    },
    interview_bank: {
      professional: [],
      behavioral: [],
      professional_extra: [],
      behavioral_extra: [],
      process: '',
      summary: '',
    },
    negotiation: {
      summary: '',
      pay_strategy: '',
      benefits_strategy: '',
      script: '',
      company_questions: '',
      follow_up_email: '',
    },
    limitations,
  };
}

export function parseGuideQuestions(raw: unknown): GuideQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: GuideQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const question = asString(row.question);
    const track = asTrack(row.track);
    if (!question || !track) continue;
    const url = httpUrl(row.source_url);
    let origin = asOrigin(row.origin) ?? 'predicted';
    if (origin === 'reported' && !url) origin = 'predicted';
    out.push({
      question: question.slice(0, 500),
      track,
      origin,
      proximity: origin === 'reported' ? asProximity(row.proximity) : null,
      source_url: origin === 'reported' ? url : null,
      source_date: asString(row.source_date).slice(0, 40) || null,
      answer: asString(row.answer).slice(0, 1200),
    });
  }
  return out;
}

function sortReported(items: GuideQuestion[]): GuideQuestion[] {
  return [...items].sort((a, b) => {
    const rankA = a.proximity ? PROXIMITY_RANK[a.proximity] : 9;
    const rankB = b.proximity ? PROXIMITY_RANK[b.proximity] : 9;
    if (rankA !== rankB) return rankA - rankB;
    return dateKey(b.source_date) - dateKey(a.source_date);
  });
}

function bankForTrack(items: GuideQuestion[], track: GuideQuestionTrack): {
  body: GuideQuestion[];
  extra: GuideQuestion[];
} {
  const mine = items.filter((item) => item.track === track);
  const reported = sortReported(mine.filter((item) => item.origin === 'reported'));
  const predicted = mine.filter((item) => item.origin === 'predicted');
  const sameCompany = reported.filter((item) => item.proximity === 'same_company_role');

  const body = (sameCompany.length > 10 ? sameCompany : reported).slice(0, 10);
  const bodyKeys = new Set(body.map((item) => item.question));
  // Remaining cited real questions from the last ~3 years — never drop, never cap at 2.
  const extra = reported.filter((item) => !bodyKeys.has(item.question));

  for (const item of predicted) {
    if (body.length >= 10) break;
    if (body.some((kept) => kept.question === item.question)) continue;
    body.push(item);
  }

  return { body: body.slice(0, 10), extra };
}

/** Body is 10 professional + 10 behavioral (recent / highest-proximity). Remaining reported questions stay in extra. */
export function selectInterviewBank(
  questions: GuideQuestion[],
  process = '',
  summary = '',
): GuideInterviewBank {
  const professional = bankForTrack(questions, 'professional');
  const behavioral = bankForTrack(questions, 'behavioral');
  return {
    professional: professional.body,
    behavioral: behavioral.body,
    professional_extra: professional.extra,
    behavioral_extra: behavioral.extra,
    process: process.slice(0, 1500),
    summary: summary.slice(0, QUESTIONS_SUMMARY_MAX),
  };
}

function sources(raw: unknown): GuideSource[] {
  if (!Array.isArray(raw)) return [];
  const out: GuideSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const url = httpUrl(row.url);
    if (!url) continue;
    out.push({ title: asString(row.title).slice(0, 160) || url, url });
    if (out.length >= 8) break;
  }
  return out;
}

export function parseSalaryLand(raw: unknown): GuideModules['salary_land'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    target: asString(row.target).slice(0, 200),
    ceiling: asString(row.ceiling).slice(0, 200),
    base: asString(row.base).slice(0, 80) || null,
    equity: asString(row.equity).slice(0, 80) || null,
    bonus: asString(row.bonus).slice(0, 80) || null,
    rationale: asString(row.rationale).slice(0, 1200),
    buyer_seller: asString(row.buyer_seller).slice(0, 1200),
    sources: sources(row.sources),
  };
}

export function parseCompanyEval(raw: unknown): GuideModules['company_eval'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    summary: asString(row.summary).slice(0, 800),
    culture: asString(row.culture).slice(0, 800),
    labor_risk: asString(row.labor_risk).slice(0, 800),
    layoff_risk: asString(row.layoff_risk).slice(0, 800),
    h1b: asString(row.h1b).slice(0, 800),
    remote_sponsorship: asString(row.remote_sponsorship).slice(0, 800),
    role_reviews: asString(row.role_reviews).slice(0, 800),
    company_pros: asStringList(row.company_pros).map((item) => item.slice(0, 400)),
    company_cons: asStringList(row.company_cons).map((item) => item.slice(0, 400)),
    role_pros: asStringList(row.role_pros).map((item) => item.slice(0, 400)),
    role_cons: asStringList(row.role_cons).map((item) => item.slice(0, 400)),
    sources: sources(row.sources),
    role_sources: sources(row.role_sources),
  };
}

export function parseRewrites(raw: unknown): GuideModules['resume_rewrites'] {
  if (!Array.isArray(raw)) return [];
  const out: GuideModules['resume_rewrites'] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const gap = asString(row.gap);
    const before = asString(row.before);
    const after = asString(row.after);
    if (!gap || !after) continue;
    const category = asString(row.category).slice(0, 80);
    out.push({
      ...(category ? { category } : {}),
      gap: gap.slice(0, 240),
      before: before.slice(0, 400),
      after: after.slice(0, 400),
    });
    if (out.length >= 4) break;
  }
  return out;
}

export function parseNegotiation(raw: unknown): GuideModules['negotiation'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const followUp = asString(row.follow_up_email).slice(0, 2500);
  return {
    summary: asString(row.summary).slice(0, 800),
    pay_strategy: asString(row.pay_strategy).slice(0, 2000),
    benefits_strategy: asString(row.benefits_strategy).slice(0, 2000),
    script: asString(row.script).slice(0, 1500),
    company_questions: asString(row.company_questions).slice(0, 2000),
    follow_up_email: /^none$/i.test(followUp.trim()) ? '' : followUp,
  };
}

export function applyInterviewAnswers(
  bank: GuideInterviewBank,
  raw: unknown,
): GuideInterviewBank {
  if (!raw || typeof raw !== 'object') return bank;
  const row = raw as Record<string, unknown>;
  const summary = mergeInterviewSummary(bank.summary ?? '', row);
  const withSummary = { ...bank, summary };
  const answers = row.answers;
  if (!Array.isArray(answers)) return withSummary;
  const byQuestion = new Map<string, string>();
  for (const item of answers) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const question = asString(row.question);
    const answer = asString(row.answer);
    if (question && answer) byQuestion.set(question, answer.slice(0, 1200));
  }
  const values = [...byQuestion.values()];
  if (values.length >= 3) {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    const max = Math.max(...counts.values());
    if (max / values.length >= 0.5) {
      let clone = '';
      for (const [text, n] of counts) {
        if (n === max) {
          clone = text;
          break;
        }
      }
      for (const [question, answer] of byQuestion) {
        if (answer === clone) byQuestion.delete(question);
      }
      if (byQuestion.size === 0) return withSummary;
    }
  }
  const fill = (items: GuideQuestion[]) =>
    items.map((item) => ({
      ...item,
      answer: byQuestion.get(item.question) ?? item.answer,
    }));
  return {
    ...withSummary,
    professional: fill(bank.professional),
    behavioral: fill(bank.behavioral),
    professional_extra: fill(bank.professional_extra),
    behavioral_extra: fill(bank.behavioral_extra),
  };
}

export function normalizeGuideModules(raw: unknown): GuideModules | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const limitations = Array.isArray(row.limitations)
    ? row.limitations.filter((item): item is string => typeof item === 'string').slice(0, 8)
    : [];
  const bankRaw = row.interview_bank;
  const bank = bankRaw && typeof bankRaw === 'object'
    ? bankRaw as Record<string, unknown>
    : {};
  return {
    resume_rewrites: parseRewrites(row.resume_rewrites),
    salary_land: parseSalaryLand(row.salary_land) ?? emptyGuideModules().salary_land,
    company_eval: parseCompanyEval(row.company_eval) ?? emptyGuideModules().company_eval,
    interview_bank: {
      professional: parseGuideQuestions(bank.professional),
      behavioral: parseGuideQuestions(bank.behavioral),
      professional_extra: parseGuideQuestions(bank.professional_extra),
      behavioral_extra: parseGuideQuestions(bank.behavioral_extra),
      process: asString(bank.process).slice(0, 1500),
      summary: asString(bank.summary).slice(0, QUESTIONS_SUMMARY_MAX),
    },
    negotiation: parseNegotiation(row.negotiation) ?? emptyGuideModules().negotiation,
    limitations,
  };
}

/** Fold paid modules into the fields the current Guide UI already reads. */
export function overlayGuideModules(snapshot: LiteReport, modules: GuideModules): FullReport {
  const salary = modules.salary_land;
  const company = modules.company_eval;
  const bank = modules.interview_bank;
  const toCard = (item: GuideQuestion) => ({
    question: item.question,
    predicted: item.origin === 'predicted',
    source_url: item.source_url ?? undefined,
    source_date: item.source_date ?? undefined,
    category: item.track === 'behavioral' ? 'behavioral' as const : 'technical' as const,
    star_outline: item.answer || undefined,
    evidence: item.answer || undefined,
  });
  const reported = [...bank.professional, ...bank.behavioral].filter((item) => item.origin === 'reported');
  const predicted = [...bank.professional, ...bank.behavioral].filter((item) => item.origin === 'predicted');

  return {
    ...snapshot,
    expected_offer: {
      ...snapshot.expected_offer,
      candidate_predicted_offer:
        salary.target || snapshot.expected_offer.candidate_predicted_offer,
      tc_breakdown: salary.base || salary.bonus || salary.equity
        ? {
            base: salary.base,
            bonus: salary.bonus,
            equity: salary.equity,
            total: salary.target || snapshot.expected_offer.tc_breakdown?.total || null,
          }
        : snapshot.expected_offer.tc_breakdown,
    },
    strategy_fit_salary: {
      score_implications: snapshot.fit_score.sharp_verdict,
      offer_implications: salary.buyer_seller || salary.target,
      validate_with_recruiter: [],
    },
    hiring_context: {
      insights: company.sources.slice(0, 4).map((source) => ({
        claim: company.culture || company.layoff_risk || source.title,
        why_it_matters: company.h1b || company.remote_sponsorship || source.title,
        source_url: source.url,
        date: '',
      })),
      limitations: modules.limitations,
      validation_questions: [],
      macro_risk_warnings: [company.layoff_risk, company.labor_risk].filter(Boolean).join(' ') || null,
      company_current_pain_point: company.culture || null,
    },
    concerns_defenses: [],
    interview_playbook: {
      reported: reported.map(toCard),
      predicted: predicted.map(toCard),
      star_templates: [],
      star_outlines: [],
      reverse_questions: [],
      validate_before_join: [],
    },
    offer_strategy: {
      target: salary.target,
      acceptable: salary.target,
      walk_away: salary.ceiling ? `Ceiling ${salary.ceiling}` : '',
      levers: [modules.negotiation.benefits_strategy].filter(Boolean),
      script: modules.negotiation.script || modules.negotiation.pay_strategy,
      discovery_questions: [],
      tc_breakdown: salary.base || salary.bonus || salary.equity
        ? {
            base: salary.base,
            bonus: salary.bonus,
            equity: salary.equity,
            total: salary.target || null,
          }
        : undefined,
    },
    candidate_case: {
      hire_thesis: snapshot.apply_decision.reason,
      top_facts: snapshot.proof_map.strengths.slice(0, 3).map((item) => item.point),
    },
    guide_modules: modules,
  };
}
