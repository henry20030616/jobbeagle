import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';

export type AnalyzeErrorKind =
  | 'ai_quota'
  | 'resume_pdf'
  | 'rate_limit'
  | 'generic';

type Localized = Record<AppLanguage, string>;

const AI_QUOTA: Localized = {
  'zh-TW':
    '目前系統分析請求量較大，服務暫時忙碌中。這不是您的帳號問題，系統也未扣除您的報告額度，請稍後再試。',
  'zh-CN':
    '目前系统分析请求量较大，服务暂时忙碌中。这不是您的账号问题，系统也未扣除您的报告额度，请稍后再试。',
  en: 'Analysis demand is high right now and the service is temporarily busy. This is not an issue with your account, and your report credits were not charged. Please try again shortly.',
  es: 'La demanda de análisis es alta en este momento y el servicio está temporalmente ocupado. No es un problema de tu cuenta, y no se cobró ningún crédito de informe. Inténtalo de nuevo en breve.',
  hi: 'अभी विश्लेषण अनुरोधों की संख्या अधिक है और सेवा अस्थायी रूप से व्यस्त है। यह आपके खाते की समस्या नहीं है, और कोई रिपोर्ट क्रेडिट नहीं कटा। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  ar: 'حجم طلبات التحليل مرتفع حاليًا والخدمة مشغولة مؤقتًا. هذه ليست مشكلة في حسابك، ولم يُخصم أي رصيد تقارير. حاول مرة أخرى بعد قليل.',
};

const RESUME_PDF: Localized = {
  'zh-TW':
    '我們讀不到這份履歷。請從電腦重新選一次檔案上傳（請用 PDF 或 Word），或把履歷文字貼上後再按分析。',
  'zh-CN':
    '我们读不到这份简历。请从电脑重新选一次文件上传（请用 PDF 或 Word），或把简历文字贴上后再按分析。',
  en: "We couldn't read your resume. Please choose the file again from your computer (PDF or Word), or paste the text into the resume box, then try again.",
  es: 'No pudimos leer tu currículum. Vuelve a elegir el archivo en tu ordenador (PDF o Word), o pega el texto en el cuadro y vuelve a intentarlo.',
  hi: 'हम आपका रिज़्यूमे नहीं पढ़ सके। कृपया कंप्यूटर से फ़ाइल फिर चुनें (PDF या Word), या टेक्स्ट पेस्ट करके फिर कोशिश करें।',
  ar: 'تعذّر قراءة سيرتك. اختر الملف من جهازك مرة أخرى (PDF أو Word)، أو الصق النص في المربع ثم حاول مجددًا.',
};

const RATE_LIMIT: Localized = {
  'zh-TW': '請求過於頻繁，請稍候再試。',
  'zh-CN': '请求过于频繁，请稍后再试。',
  en: 'Too many requests. Please wait a moment and try again.',
  es: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  hi: 'बहुत अधिक अनुरोध। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  ar: 'طلبات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى.',
};

const GENERIC: Localized = {
  'zh-TW':
    '這次沒能完成分析。請稍等一下再試一次；若還是不行，可重新上傳履歷（PDF 或 Word），或到頁面底部留言給我們。',
  'zh-CN':
    '这次没能完成分析。请稍等一下再试一次；若还是不行，可重新上传简历（PDF 或 Word），或到页面底部留言给我们。',
  en: "We couldn't finish this analysis. Wait a moment and try again. If it still fails, re-upload your resume as PDF or Word, or leave us a note at the bottom of the page.",
  es: 'No pudimos terminar este análisis. Espera un momento e inténtalo de nuevo. Si sigue fallando, vuelve a subir tu CV en PDF o Word, o déjanos un mensaje al final de la página.',
  hi: 'हम यह विश्लेषण पूरा नहीं कर सके। थोड़ी देर बाद पुनः प्रयास करें। अगर फिर भी न चले, तो PDF/Word फिर अपलोड करें या पेज के नीचे संदेश छोड़ें।',
  ar: 'تعذّر إكمال هذا التحليل. انتظر قليلًا ثم حاول مرة أخرى. إن استمر، أعد رفع سيرتك كـ PDF أو Word، أو اترك رسالة أسفل الصفحة.',
};

function flattenErrorText(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (raw instanceof Error) return raw.message;
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

/** Classify provider / pipeline failures so the UI never shows raw JSON. */
export function classifyAnalyzeError(raw: unknown): AnalyzeErrorKind {
  const text = flattenErrorText(raw).toLowerCase();
  if (
    text.includes('base64 decoding failed')
    || text.includes('inline_data.data')
    || text.includes('central directory')
    || text.includes('is this a zip file')
    || text.includes('word resume')
    || text.includes('word file')
    || text.includes('saved pdf resume')
    || text.includes('resume pdf')
    || text.includes('resume file could not')
    || text.includes('extract text from word')
  ) {
    return 'resume_pdf';
  }
  if (
    text.includes('resource_exhausted')
    || text.includes('prepayment credits are depleted')
    || text.includes('quota has been reached')
    || text.includes('quota exceeded')
    || text.includes('billing')
    || (text.includes('"code":402') && text.includes('quota'))
    || (text.includes('"code":429') && text.includes('resource'))
  ) {
    return 'ai_quota';
  }
  if (
    text.includes('rate limit')
    || text.includes('too many requests')
    || text.includes('429')
  ) {
    return 'rate_limit';
  }
  return 'generic';
}

export function analyzeErrorCode(kind: AnalyzeErrorKind): string {
  switch (kind) {
    case 'ai_quota':
      return 'AI_QUOTA_EXHAUSTED';
    case 'resume_pdf':
      return 'RESUME_PDF_UNREADABLE';
    case 'rate_limit':
      return 'RATE_LIMITED';
    default:
      return 'ANALYSIS_ERROR';
  }
}

function isAlreadyUserFacing(text: string): boolean {
  if (!text || text.length > 400) return false;
  if (text.includes('{') || text.includes('}')) return false;
  if (/https?:\/\//i.test(text)) return false;
  if (/RESOURCE_EXHAUSTED|UNAUTHENTICATED|PERMISSION_DENIED/i.test(text)) return false;
  if (/^Error\b/i.test(text)) return false;
  return true;
}

/**
 * Turn Gemini / pipeline exceptions into a short user-language sentence.
 * Never returns JSON blobs or AI Studio billing URLs.
 */
export function toUserFacingAnalyzeError(
  raw: unknown,
  language?: string | null,
): { message: string; kind: AnalyzeErrorKind; code: string } {
  const lang = normalizeReportLanguage(language);
  const kind = classifyAnalyzeError(raw);
  const code = analyzeErrorCode(kind);
  if (kind === 'generic') {
    const text = flattenErrorText(raw).trim();
    if (isAlreadyUserFacing(text)) {
      return { kind, code, message: text };
    }
    return { kind, code, message: GENERIC[lang] ?? GENERIC.en };
  }
  const table =
    kind === 'ai_quota'
      ? AI_QUOTA
      : kind === 'resume_pdf'
        ? RESUME_PDF
        : RATE_LIMIT;
  return {
    kind,
    code,
    message: table[lang] ?? table.en,
  };
}
