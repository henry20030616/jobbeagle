import type { AppLanguage } from '@/lib/language-context';
import { LANGUAGE_OPTIONS } from '@/lib/language-context';

const CODES = new Set<string>(LANGUAGE_OPTIONS.map((o) => o.code));

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
    'Cover all narrative fields: score summaries, apply reasons, strengths/gaps, ATS warning summary, role/team insights, company truth, interview Q&A, STAR blueprints, negotiation scripts, citation descriptions, and any insufficient-data messages.',
    'Keep JSON keys and machine enums unchanged (apply_decision.label enum, hard_filter.status, evidence_tier A/B/C/D, skill_kind hard|soft, predicted boolean, currency codes).',
    'Proper nouns, URLs, and dollar amounts may stay as commonly written; surrounding prose must still be in the output language.',
    language === 'en'
      ? 'Do not mix Chinese or other languages into English string fields.'
      : `Do not leave English UI chrome or English fallback boilerplate inside ${name} string fields.`,
  ].join('\n');
}
