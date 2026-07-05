import { MAX_JD_CHARS } from '@/constants/models';

export type JdValidationCode =
  | 'JD_EMPTY'
  | 'JD_TOO_SHORT'
  | 'JD_URL_ONLY'
  | 'JD_REPEATING_CHARS'
  | 'JD_LOW_READABLE_RATIO'
  | 'JD_UNRELATED_CONTENT'
  | 'JD_PROMPT_INJECTION'
  | 'JD_TOO_LONG';

export interface JdValidationResult {
  valid: boolean;
  code?: JdValidationCode;
  message: string;
}

type Lang = 'zh' | 'en';

function msg(lang: Lang, zh: string, en: string): string {
  return lang === 'zh' ? zh : en;
}

const JOB_SIGNAL_PATTERNS = [
  /responsibilit/i,
  /requirement/i,
  /qualification/i,
  /experience/i,
  /salary|compensation|pay range/i,
  /職務|職責|要求|條件|資格|薪資|待遇|工作內容|職缺/,
  /full[- ]?time|part[- ]?time|remote|hybrid/i,
  /\b(engineer|manager|analyst|developer|designer|director)\b/i,
];

const UNRELATED_PRODUCT_PATTERNS = [
  /jobbeagle/i,
  /米格魯/,
  /戰略引擎/,
  /strategic engine/i,
  /職位分析米格魯/,
  /expert-level ai job/i,
  /unlock premium report/i,
];

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /disregard (the )?(above|system)/i,
  /you are now (a|an)/i,
  /<\s*script/i,
  /javascript:/i,
  /\{\{.*\}\}/,
  /忽略(以上|先前|所有)指令/,
  /你現在是/,
];

export function validateJobDescription(
  text: string,
  language: string = 'en',
): JdValidationResult {
  const lang: Lang = language === 'zh-TW' || language === 'zh-CN' ? 'zh' : 'en';
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      valid: false,
      code: 'JD_EMPTY',
      message: msg(
        lang,
        '⚠️ 職缺描述不可為空白，請貼上完整 JD 內容。',
        '⚠️ Job description cannot be empty. Paste the full job posting.',
      ),
    };
  }

  if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
    return {
      valid: false,
      code: 'JD_URL_ONLY',
      message: msg(
        lang,
        '⚠️ 請勿只貼網址。請到職缺頁複製「完整職缺內容」後貼上。',
        '⚠️ URL only is not accepted. Copy the full job text from the posting page.',
      ),
    };
  }

  if (trimmed.length < 40) {
    return {
      valid: false,
      code: 'JD_TOO_SHORT',
      message: msg(
        lang,
        '⚠️ 職缺描述太短（至少 40 字），請貼上完整 JD。',
        '⚠️ Job description is too short (min 40 characters). Paste the full posting.',
      ),
    };
  }

  if (trimmed.length > MAX_JD_CHARS) {
    return {
      valid: false,
      code: 'JD_TOO_LONG',
      message: msg(
        lang,
        '⚠️ 職缺描述過長，請刪除無關段落後再試（上限 8000 字）。',
        `⚠️ Job description is too long. Trim unrelated text (max ${MAX_JD_CHARS} characters).`,
      ),
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        code: 'JD_PROMPT_INJECTION',
        message: msg(
          lang,
          '⚠️ 偵測到可疑指令內容，請只貼上真實職缺描述。',
          '⚠️ Suspicious instruction-like content detected. Paste only the real job description.',
        ),
      };
    }
  }

  const noSpace = trimmed.replace(/\s+/g, '');
  if (/(.)\1{9,}/.test(noSpace)) {
    return {
      valid: false,
      code: 'JD_REPEATING_CHARS',
      message: msg(
        lang,
        '⚠️ 偵測到無效內容（重複字元／亂碼），請貼上真實職缺描述。',
        '⚠️ Invalid content (repeating characters / gibberish). Paste a real job description.',
      ),
    };
  }

  const meaningful = (trimmed.match(/[a-zA-Z\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  if (meaningful / trimmed.length < 0.15) {
    return {
      valid: false,
      code: 'JD_LOW_READABLE_RATIO',
      message: msg(
        lang,
        '⚠️ 內容幾乎沒有可讀文字（符號或亂碼過多），請確認已貼上正確 JD。',
        '⚠️ Very little readable text (mostly symbols). Please check your input.',
      ),
    };
  }

  const hasJobSignals = JOB_SIGNAL_PATTERNS.some((p) => p.test(trimmed));
  const hasProductNoise = UNRELATED_PRODUCT_PATTERNS.some((p) => p.test(trimmed));

  if (hasProductNoise && !hasJobSignals) {
    return {
      valid: false,
      code: 'JD_UNRELATED_CONTENT',
      message: msg(
        lang,
        '⚠️ 這看起來不是職缺描述（疑似產品介紹或無關內容）。請貼上 104 / LinkedIn 的完整 JD。',
        '⚠️ This does not look like a job posting (product copy or unrelated text). Paste the full JD from LinkedIn or a job board.',
      ),
    };
  }

  if (!hasJobSignals && trimmed.length < 120) {
    return {
      valid: false,
      code: 'JD_UNRELATED_CONTENT',
      message: msg(
        lang,
        '⚠️ 內容不像職缺描述。請包含職責、要求或薪資等 JD 資訊。',
        '⚠️ Content does not resemble a job posting. Include responsibilities, requirements, or compensation.',
      ),
    };
  }

  return { valid: true, message: '' };
}
