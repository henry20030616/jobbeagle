/** Shared language codes — keep free of React/client imports (used by API routes). */
export type AppLanguage = 'en' | 'zh-TW' | 'zh-CN' | 'es' | 'hi' | 'ar';

const CODES = new Set<string>(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar']);

export function normalizeReportLanguage(raw: unknown): AppLanguage {
  if (raw === 'zh') return 'zh-TW';
  if (typeof raw === 'string' && CODES.has(raw)) return raw as AppLanguage;
  return 'en';
}

const NATIVE_LABEL: Record<AppLanguage, string> = {
  en: 'English',
  'zh-TW': 'Traditional Chinese (繁體中文)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  es: 'Spanish (Español)',
  hi: 'Hindi (हिन्दी)',
  ar: 'Arabic (العربية)',
};

/**
 * Appended to Lite/Full system instructions so every narrative JSON string
 * matches the UI language button the user selected.
 */
export function geminiLanguageDirective(language: AppLanguage): string {
  const name = NATIVE_LABEL[language] ?? NATIVE_LABEL.en;
  return [
    `OUTPUT LANGUAGE (CRITICAL): Write EVERY human-readable string value in the JSON response in ${name}.`,
    'Cover all narrative fields: score summaries, apply reasons, strengths/gaps, ATS warning summary, missing-keyword phrases, resume rewrites (gap, before, after), role/team insights, company truth, suggested answers to interview questions, negotiation scripts, citation descriptions, and any insufficient-data messages.',
    'Reported interview questions stay in the language of the source page. Do not translate them. Predicted questions, which have no source page, are written in the output language. Suggested answers are always in the output language.',
    'Keep JSON keys and machine enums unchanged (apply_decision.label enum, hard_filter.status, evidence_tier A/B/C/D, skill_kind hard|soft, predicted boolean, currency codes).',
    'Proper nouns, URLs, and dollar amounts may stay as commonly written; surrounding prose must still be in the output language.',
    language === 'en'
      ? 'Do not mix Chinese or other languages into English narrative fields. Leave a question in its source language when that page is not English.'
      : `Do not leave English UI chrome or English fallback boilerplate inside ${name} narrative fields. A question copied from an English source page is not boilerplate; leave that question in English.`,
  ].join('\n');
}
