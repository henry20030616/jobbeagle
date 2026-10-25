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
    'Cover all narrative fields: score summaries, apply reasons, strengths/gaps, ATS warning summary, missing-keyword phrases, resume adjustments (gap + directional after), role/team insights, company truth, suggested answers to interview questions, negotiation scripts, citation descriptions, and any insufficient-data messages.',
    'Reported interview questions stay in the language of the source page. Do not translate them. Predicted questions, which have no source page, are written in the output language. Suggested answers are always in the output language.',
    'Keep JSON keys and machine enums unchanged (apply_decision.label enum, hard_filter.status, evidence_tier A/B/C/D, skill_kind hard|soft, predicted boolean, currency codes).',
    'Proper nouns, URLs, and dollar amounts may stay as commonly written; surrounding prose must still be in the output language.',
    language === 'en'
      ? 'Do not mix Chinese or other languages into English narrative fields. Leave a question in its source language when that page is not English.'
      : `Do not leave English UI chrome or English fallback boilerplate inside ${name} narrative fields. A question copied from an English source page is not boilerplate; leave that question in English.`,
    language === 'zh-TW'
      ? 'A job opening is 職位 / 這職位 — never 席位, 這席, 該席, 此席, 一席, or 本席. Do not change 主席, 出席, 聯席, 筵席, or 主席台.'
      : language === 'zh-CN'
        ? 'A job opening is 职位 / 这职位 — never 席位, 这席, 该席, 此席, 一席, or 本席. Do not change 主席, 出席, 联席, 筵席, or 主席台.'
        : '',
    language === 'zh-TW'
      ? 'Ban recruiter jargon 擁有權. Write 職責, 負責範圍, or 負責 — never 擁有權, 需求擁有權, or 所有权. Do not write ungrammatical fragments such as 在需求擁有權上已過門檻.'
      : language === 'zh-CN'
        ? 'Ban recruiter jargon 所有权. Write 职责, 负责范围, or 负责 — never 所有权, 需求所有权, or 擁有權. Do not write ungrammatical fragments such as 在需求所有权上已过门槛.'
        : 'Ban recruiter jargon "ownership" as a job-scope noun (e.g. "requirements ownership", "dashboard ownership"). Write responsibility, scope, or accountability.',
    fieldLabelDirective(language),
  ].filter(Boolean).join('\n');
}

/** Labeled Snapshot prefixes must match OUTPUT LANGUAGE — not leftover English keys. */
function fieldLabelDirective(language: AppLanguage): string {
  if (language === 'zh-TW') {
    return [
      'LABELED BULLET PREFIXES (CRITICAL): every "Label: detail" prefix must be Traditional Chinese. Never emit English keys.',
      'fit_score.sharp_verdict_points use 核心適配： / 職級／年資： / 主要缺口： — never "Core fit:", "Level/tenure:", or "Main gap:".',
      'role_read.hiring_signals Kind is 年資／技能／系統／領域／證照／學歷 — never Years, Skill, System, Domain, License, or Degree.',
      'role_read.responsibilities lead with a Chinese work-product keyword (需求 backlog、驗收標準、營運指標、儀表板、操作手冊、專案執行計畫) — never Deliverable, Requirements backlog, or Acceptance criteria.',
    ].join('\n');
  }
  if (language === 'zh-CN') {
    return [
      'LABELED BULLET PREFIXES (CRITICAL): every "Label: detail" prefix must be Simplified Chinese. Never emit English keys.',
      'fit_score.sharp_verdict_points use 核心适配： / 职级／年资： / 主要缺口： — never "Core fit:", "Level/tenure:", or "Main gap:".',
      'role_read.hiring_signals Kind is 年资／技能／系统／领域／证照／学历 — never Years, Skill, System, Domain, License, or Degree.',
      'role_read.responsibilities lead with a Chinese work-product keyword (需求 backlog、验收标准、运营指标、仪表板、操作手册、项目执行计划) — never Deliverable, Requirements backlog, or Acceptance criteria.',
    ].join('\n');
  }
  if (language === 'en') {
    return [
      'LABELED BULLET PREFIXES: every "Label: detail" prefix must be English.',
      'fit_score.sharp_verdict_points use "Core fit:" / "Level/tenure:" / "Main gap:".',
      'role_read.hiring_signals Kind is Years / Skill / System / Domain / License / Degree.',
      'role_read.responsibilities lead with Requirements backlog / Acceptance criteria / Ops KPI pack / Dashboard / Runbook.',
    ].join('\n');
  }
  return 'LABELED BULLET PREFIXES: write every "Label: detail" prefix in the output language. Do not leave English keys such as Core fit, Years, Skill, System, or Domain when the output language is not English.';
}
