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
    es: 'Se requiere autenticación.',
    hi: 'प्रमाणीकरण आवश्यक है।',
    ar: 'مطلوب تسجيل الدخول.',
  },
  COMPANY_NAME_REQUIRED: {
    en: 'Company name is required.',
    'zh-TW': '請填寫公司名稱。',
    'zh-CN': '请填写公司名称。',
    es: 'El nombre de la empresa es obligatorio.',
    hi: 'कंपनी का नाम आवश्यक है।',
    ar: 'اسم الشركة مطلوب.',
  },
  JOB_TITLE_REQUIRED: {
    en: 'Job title is required.',
    'zh-TW': '請填寫職位名稱。',
    'zh-CN': '请填写职位名称。',
    es: 'El título del puesto es obligatorio.',
    hi: 'नौकरी का शीर्षक आवश्यक है।',
    ar: 'المسمى الوظيفي مطلوب.',
  },
  VIDEO_URL_REQUIRED: {
    en: 'Video URL is required.',
    'zh-TW': '請提供影片連結。',
    'zh-CN': '请提供视频链接。',
    es: 'La URL del video es obligatoria.',
    hi: 'वीडियो URL आवश्यक है।',
    ar: 'رابط الفيديو مطلوب.',
  },
  DESCRIPTION_TOO_SHORT: {
    en: 'Job description must be at least 50 characters (needed for AI matching).',
    'zh-TW': '職位描述至少需要 50 字（AI 匹配分析需要）。',
    'zh-CN': '职位描述至少需要 50 字（AI 匹配需要）。',
    es: 'La descripción debe tener al menos 50 caracteres.',
    hi: 'नौकरी विवरण कम से कम 50 अक्षर होना चाहिए।',
    ar: 'يجب أن يتضمن الوصف 50 حرفًا على الأقل.',
  },
  INVALID_EMAIL: {
    en: 'Invalid email address format.',
    'zh-TW': '電子信箱格式不正確。',
    'zh-CN': '电子邮箱格式不正确。',
    es: 'Formato de correo inválido.',
    hi: 'अमान्य ईमेल प्रारूप।',
    ar: 'تنسيق البريد الإلكتروني غير صالح.',
  },
  INVALID_APPLY_URL: {
    en: 'Apply URL must be a valid http/https URL.',
    'zh-TW': '申請網址必須為有效的 http/https 連結。',
    'zh-CN': '申请网址必须为有效的 http/https 链接。',
    es: 'La URL de solicitud debe ser http/https válida.',
    hi: 'आवेदन URL मान्य http/https होना चाहिए।',
    ar: 'يجب أن يكون رابط التقديم http/https صالحًا.',
  },
  VIDEO_LIMIT_REACHED: {
    en: 'You have reached the limit of 20 job videos. Delete some before posting new ones.',
    'zh-TW': '已達 20 支職缺影片上限，請先刪除部分影片再發布。',
    'zh-CN': '已达 20 个职位视频上限，请先删除部分视频再发布。',
    es: 'Has alcanzado el límite de 20 videos. Elimina algunos antes de publicar.',
    hi: '20 जॉब वीडियो की सीमा पूरी हो गई। नए पोस्ट करने से पहले कुछ हटाएं।',
    ar: 'وصلت إلى حد 20 فيديو. احذف بعضها قبل النشر.',
  },
  MISSING_FIELDS: {
    en: 'Missing required fields.',
    'zh-TW': '請填寫所有必填欄位。',
    'zh-CN': '请填写所有必填字段。',
    es: 'Faltan campos obligatorios.',
    hi: 'आवश्यक फ़ील्ड गायब हैं।',
    ar: 'حقول مطلوبة مفقودة.',
  },
  DUPLICATE_APPLICATION: {
    en: 'You have already applied for this position.',
    'zh-TW': '您已申請過此職缺，無法重複申請。',
    'zh-CN': '您已申请过此职位，无法重复申请。',
    es: 'Ya has solicitado este puesto.',
    hi: 'आप पहले ही इस पद के लिए आवेदन कर चुके हैं।',
    ar: 'لقد تقدمت بالفعل لهذه الوظيفة.',
  },
  RATE_LIMITED: {
    en: 'Too many applications submitted. Please wait before trying again.',
    'zh-TW': '申請次數過多，請稍後再試。',
    'zh-CN': '申请次数过多，请稍后再试。',
    es: 'Demasiadas solicitudes. Espera antes de intentar de nuevo.',
    hi: 'बहुत अधिक आवेदन। बाद में पुनः प्रयास करें।',
    ar: 'طلبات كثيرة جدًا. انتظر قبل المحاولة مرة أخرى.',
  },
  APPLICATION_FAILED: {
    en: 'Application failed. Please try again.',
    'zh-TW': '申請失敗，請稍後再試。',
    'zh-CN': '申请失败，请稍后再试。',
    es: 'Error en la solicitud. Inténtalo de nuevo.',
    hi: 'आवेदन विफल। पुनः प्रयास करें।',
    ar: 'فشل التقديم. حاول مرة أخرى.',
  },
  SERVER_ERROR: {
    en: 'Something went wrong. Please try again.',
    'zh-TW': '發生錯誤，請稍後再試。',
    'zh-CN': '发生错误，请稍后再试。',
    es: 'Algo salió mal. Inténtalo de nuevo.',
    hi: 'कुछ गलत हो गया। पुनः प्रयास करें।',
    ar: 'حدث خطأ. حاول مرة أخرى.',
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
