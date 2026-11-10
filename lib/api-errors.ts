import type { AppLanguage } from '@/lib/language-context';

export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'COMPANY_NAME_REQUIRED'
  | 'JOB_TITLE_REQUIRED'
  | 'VIDEO_URL_REQUIRED'
  | 'DESCRIPTION_TOO_SHORT'
  | 'INVALID_EMAIL'
  | 'INVALID_APPLY_URL'
  | 'VIDEO_LIMIT_REACHED'
  | 'MISSING_FIELDS'
  | 'DUPLICATE_APPLICATION'
  | 'RATE_LIMITED'
  | 'APPLICATION_FAILED'
  | 'SERVER_ERROR';

const MESSAGES: Record<ApiErrorCode, Partial<Record<AppLanguage, string>> & { en: string }> = {
  AUTH_REQUIRED: {
    en: 'Authentication required.',
    'zh-TW': '請先登入。',
    'zh-CN': '请先登录。',
  },
  COMPANY_NAME_REQUIRED: {
    en: 'Company name is required.',
    'zh-TW': '請填寫公司名稱。',
    'zh-CN': '请填写公司名称。',
  },
  JOB_TITLE_REQUIRED: {
    en: 'Job title is required.',
    'zh-TW': '請填寫職位名稱。',
    'zh-CN': '请填写职位名称。',
  },
  VIDEO_URL_REQUIRED: {
    en: 'Video URL is required.',
    'zh-TW': '請提供影片連結。',
    'zh-CN': '请提供视频链接。',
  },
  DESCRIPTION_TOO_SHORT: {
    en: 'Job description must be at least 50 characters (needed for AI matching).',
    'zh-TW': '職位描述至少需要 50 字（AI 匹配分析需要）。',
    'zh-CN': '职位描述至少需要 50 字（AI 匹配需要）。',
  },
  INVALID_EMAIL: {
    en: 'Invalid email address format.',
    'zh-TW': '電子信箱格式不正確。',
    'zh-CN': '电子邮箱格式不正确。',
  },
  INVALID_APPLY_URL: {
    en: 'Apply URL must be a valid http/https URL.',
    'zh-TW': '申請網址必須為有效的 http/https 連結。',
    'zh-CN': '申请网址必须为有效的 http/https 链接。',
  },
  VIDEO_LIMIT_REACHED: {
    en: 'You have reached the limit of 20 job videos. Delete some before posting new ones.',
    'zh-TW': '已達 20 支職缺影片上限，請先刪除部分影片再發布。',
    'zh-CN': '已达 20 个职位视频上限，请先删除部分视频再发布。',
  },
  MISSING_FIELDS: {
    en: 'Missing required fields.',
    'zh-TW': '請填寫所有必填欄位。',
    'zh-CN': '请填写所有必填字段。',
  },
  DUPLICATE_APPLICATION: {
    en: 'You have already applied for this position.',
    'zh-TW': '您已申請過此職缺，無法重複申請。',
    'zh-CN': '您已申请过此职位，无法重复申请。',
  },
  RATE_LIMITED: {
    en: 'Too many applications submitted. Please wait before trying again.',
    'zh-TW': '申請次數過多，請稍後再試。',
    'zh-CN': '申请次数过多，请稍后再试。',
  },
  APPLICATION_FAILED: {
    en: 'Application failed. Please try again.',
    'zh-TW': '申請失敗，請稍後再試。',
    'zh-CN': '申请失败，请稍后再试。',
  },
  SERVER_ERROR: {
    en: 'Something went wrong. Please try again.',
    'zh-TW': '發生錯誤，請稍後再試。',
    'zh-CN': '发生错误，请稍后再试。',
  },
};

export function translateApiError(
  code: string | undefined | null,
  fallback: string | undefined,
  lang: AppLanguage = 'en',
): string {
  if (code && code in MESSAGES) {
    const entry = MESSAGES[code as ApiErrorCode];
    return entry[lang] ?? entry.en;
  }
  return fallback || MESSAGES.SERVER_ERROR[lang] || MESSAGES.SERVER_ERROR.en;
}
