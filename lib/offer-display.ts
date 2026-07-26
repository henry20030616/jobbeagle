import type { ExpectedOfferRange, SalaryEvidenceTier } from '@/types';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';

function cleanMoney(v: string | null | undefined): string {
  if (!v || !v.trim() || v.trim() === '—') return '';
  return v.trim();
}

const TIER_LABELS: Record<AppLanguage, Record<'A' | 'B' | 'C' | 'D' | 'default', string>> = {
  en: {
    A: 'From the job posting',
    B: 'From comparable public roles',
    C: 'Market estimate (not a company offer)',
    D: 'Pay data too thin',
    default: 'Pay evidence unclear',
  },
  'zh-TW': {
    A: '來自職缺刊登',
    B: '來自可比公開職缺',
    C: '市場估計（非公司報價）',
    D: '薪資資料不足',
    default: '薪資證據不明',
  },
  'zh-CN': {
    A: '来自职位刊登',
    B: '来自可比公开职位',
    C: '市场估计（非公司报价）',
    D: '薪酬数据不足',
    default: '薪酬证据不明',
  },
  es: {
    A: 'Del anuncio del puesto',
    B: 'De roles públicos comparables',
    C: 'Estimación de mercado (no oferta de la empresa)',
    D: 'Datos salariales insuficientes',
    default: 'Evidencia salarial poco clara',
  },
  hi: {
    A: 'जॉब पोस्टिंग से',
    B: 'तुलनीय सार्वजनिक भूमिकाओं से',
    C: 'बाज़ार अनुमान (कंपनी ऑफर नहीं)',
    D: 'वेतन डेटा अपर्याप्त',
    default: 'वेतन साक्ष्य अस्पष्ट',
  },
  ar: {
    A: 'من إعلان الوظيفة',
    B: 'من أدوار عامة مماثلة',
    C: 'تقدير سوقي (ليس عرض الشركة)',
    D: 'بيانات الأجر ضعيفة',
    default: 'دليل الأجر غير واضح',
  },
};

/** Localized label for evidence_tier (never show bare "Tier C" in UI). */
export function evidenceTierLabel(
  tier: SalaryEvidenceTier | string | null | undefined,
  language: AppLanguage | string = 'en',
): string {
  const lang = normalizeReportLanguage(language);
  const labels = TIER_LABELS[lang] ?? TIER_LABELS.en;
  if (tier === 'A' || tier === 'B' || tier === 'C' || tier === 'D') return labels[tier];
  return labels.default;
}

/**
 * Display Expected Offer as a single human range — never P25/P50/P75 labels.
 * Prefers posted JD range; otherwise low–high from stored percentiles.
 */
export function formatOfferRange(offer: ExpectedOfferRange | null | undefined): string | null {
  if (!offer) return null;
  const posted = cleanMoney(offer.posted_range);
  if (posted) return posted;

  const low = cleanMoney(offer.p25);
  const mid = cleanMoney(offer.p50);
  const high = cleanMoney(offer.p75);

  if (low && high) return `${low} – ${high}`;
  if (low && mid) return `${low} – ${mid}`;
  if (mid && high) return `${mid} – ${high}`;
  return mid || low || high || null;
}

export function hasOfferRange(offer: ExpectedOfferRange | null | undefined): boolean {
  return Boolean(formatOfferRange(offer));
}

/** Single-point prediction for this candidate inside the seat band. */
export function formatPredictedOffer(
  offer: ExpectedOfferRange | null | undefined,
): string | null {
  if (!offer) return null;
  return cleanMoney(offer.candidate_predicted_offer) || null;
}

/** Parse "$155K" / "$155,000" into a number for gauge positioning. */
export function parseMoneyAmount(v: string | null | undefined): number | null {
  const s = cleanMoney(v);
  if (!s) return null;
  const k = s.match(/([\d,]+(?:\.\d+)?)\s*[Kk]\b/);
  if (k) return parseFloat(k[1].replace(/,/g, '')) * 1000;
  const n = s.match(/([\d,]+(?:\.\d+)?)/);
  if (!n) return null;
  const raw = parseFloat(n[1].replace(/,/g, ''));
  return Number.isFinite(raw) ? raw : null;
}

/**
 * 0–100 fill for the predicted-land circle: where the land sits in the seat band.
 * Falls back to 55 when the band cannot be parsed.
 */
export function predictedLandGaugeValue(
  offer: ExpectedOfferRange | null | undefined,
): number {
  const land = parseMoneyAmount(offer?.candidate_predicted_offer);
  const low =
    parseMoneyAmount(offer?.p25)
    || parseMoneyAmount(offer?.posted_range?.split(/[–—-]/)[0]);
  const high =
    parseMoneyAmount(offer?.p75)
    || parseMoneyAmount(offer?.posted_range?.split(/[–—-]/).pop());
  if (land == null || low == null || high == null || high <= low) return 55;
  const pct = ((land - low) / (high - low)) * 100;
  return Math.max(8, Math.min(100, Math.round(pct)));
}

/**
 * Plain-language market value of this role for Snapshot “Range Evaluation”.
 * Not a glossary of evidence tiers.
 */
export function offerEvaluationSummary(
  offer: ExpectedOfferRange | null | undefined,
  language: AppLanguage | string = 'en',
): {
  headline: string;
  body: string;
  note: string;
} {
  const lang = normalizeReportLanguage(language);
  const unclear: Record<AppLanguage, { headline: string; emptyBody: string }> = {
    en: {
      headline: 'Market value unclear',
      emptyBody:
        'Not enough pay signal for this role yet. Ask the recruiter for the approved cash band before you decide if the economics are worth your time.',
    },
    'zh-TW': {
      headline: '市場價值不明',
      emptyBody: '此職缺薪資訊號不足。請先向招募確認核定現金區間，再決定是否投入時間。',
    },
    'zh-CN': {
      headline: '市场价值不明',
      emptyBody: '此职位薪酬信号不足。请先向招聘确认核定现金区间，再决定是否投入时间。',
    },
    es: {
      headline: 'Valor de mercado poco claro',
      emptyBody:
        'Aún no hay señal salarial suficiente. Confirma la banda aprobada con el reclutador antes de invertir tiempo.',
    },
    hi: {
      headline: 'बाज़ार मूल्य अस्पष्ट',
      emptyBody:
        'इस भूमिका के लिए पर्याप्त वेतन संकेत नहीं। समय लगाने से पहले रिक्रूटर से स्वीकृत बैंड पूछें।',
    },
    ar: {
      headline: 'قيمة السوق غير واضحة',
      emptyBody:
        'لا توجد إشارة أجر كافية بعد. اسأل المسؤول عن النطاق المعتمد قبل استثمار وقتك.',
    },
  };

  if (!offer) {
    return { headline: unclear[lang].headline, body: unclear[lang].emptyBody, note: '' };
  }

  const range = formatOfferRange(offer);
  const defaultRegion: Record<AppLanguage, string> = {
    en: 'this market',
    'zh-TW': '此市場',
    'zh-CN': '此市场',
    es: 'este mercado',
    hi: 'इस बाज़ार',
    ar: 'هذا السوق',
  };
  const region = offer.region?.trim() || defaultRegion[lang];
  const currency = offer.currency?.trim() || 'USD';
  const posted = cleanMoney(offer.posted_range);
  const tier = offer.evidence_tier || 'D';
  const position = offer.candidate_position_label?.trim() || '';
  const gap = offer.target_gap?.trim() || '';
  const note = position || gap;

  if (!range || tier === 'D') {
    const thin: Record<AppLanguage, string> = {
      en: `Public pay data for this role in ${region} is too thin to price the seat. Confirm the approved ${currency} band with the recruiter before investing interview time.`,
      'zh-TW': `此職缺在 ${region} 的公開薪資資料過薄，難以定價。投入面試前請向招募確認核定 ${currency} 區間。`,
      'zh-CN': `此职位在 ${region} 的公开薪酬数据过薄，难以定价。投入面试前请向招聘确认核定 ${currency} 区间。`,
      es: `Los datos públicos de pago para este rol en ${region} son demasiado escasos. Confirma la banda ${currency} aprobada con el reclutador antes de invertir tiempo.`,
      hi: `${region} में इस भूमिका के सार्वजनिक वेतन डेटा बहुत पतले हैं। इंटरव्यू समय लगाने से पहले रिक्रूटर से स्वीकृत ${currency} बैंड पुष्टि करें।`,
      ar: `بيانات الأجر العامة لهذا الدور في ${region} ضعيفة جدًا لتسعير المقعد. أكّد نطاق ${currency} المعتمد مع المسؤول قبل استثمار وقت المقابلة.`,
    };
    return { headline: unclear[lang].headline, body: thin[lang], note };
  }

  if (posted) {
    const postedCopy: Record<AppLanguage, { headline: string; body: string }> = {
      en: {
        headline: `This role is posted at ${range}`,
        body: `The employer disclosed ${range} (${currency}) for this seat in ${region}. That is the clearest signal of what the job is worth on the open market.`,
      },
      'zh-TW': {
        headline: `此職缺刊登薪資為 ${range}`,
        body: `雇主在 ${region} 為此職位揭露 ${range}（${currency}）。這是公開市場上最清楚的價值訊號。`,
      },
      'zh-CN': {
        headline: `此职位刊登薪酬为 ${range}`,
        body: `雇主在 ${region} 为此职位披露 ${range}（${currency}）。这是公开市场上最清楚的价值信号。`,
      },
      es: {
        headline: `Este rol se publica a ${range}`,
        body: `El empleador divulgó ${range} (${currency}) para este puesto en ${region}. Es la señal más clara del valor de mercado.`,
      },
      hi: {
        headline: `यह भूमिका ${range} पर पोस्टेड है`,
        body: `नियोक्ता ने ${region} में इस सीट के लिए ${range} (${currency}) बताया। यह खुले बाज़ार का सबसे स्पष्ट संकेत है।`,
      },
      ar: {
        headline: `هذا الدور منشور عند ${range}`,
        body: `أفصح صاحب العمل عن ${range} (${currency}) لهذا المقعد في ${region}. هذه أوضح إشارة لقيمة السوق المفتوحة.`,
      },
    };
    return { ...postedCopy[lang], note };
  }

  if (tier === 'B') {
    const b: Record<AppLanguage, { headline: string; body: string }> = {
      en: {
        headline: `Comparable seats pay about ${range}`,
        body: `Public pay data for similar level and location in ${region} clusters around ${range} (${currency}). Treat this as the market value of the seat — confirm the company’s approved band before you negotiate.`,
      },
      'zh-TW': {
        headline: `相近職位約落在 ${range}`,
        body: `${region} 相近職級與地點的公開薪資約落在 ${range}（${currency}）。可視為座位市值，談判前請再確認公司核定區間。`,
      },
      'zh-CN': {
        headline: `相近职位约落在 ${range}`,
        body: `${region} 相近职级与地点的公开薪酬约落在 ${range}（${currency}）。可视为座位市值，谈判前请再确认公司核定区间。`,
      },
      es: {
        headline: `Puestos comparables pagan cerca de ${range}`,
        body: `Datos públicos de nivel y ubicación similares en ${region} se agrupan en torno a ${range} (${currency}). Trátalo como valor de mercado — confirma la banda aprobada antes de negociar.`,
      },
      hi: {
        headline: `तुलनीय सीटें लगभग ${range} देती हैं`,
        body: `${region} में समान स्तर/स्थान के सार्वजनिक वेतन ${range} (${currency}) के आसपास हैं। इसे सीट का बाज़ार मूल्य मानें — बातचीत से पहले कंपनी बैंड पुष्टि करें।`,
      },
      ar: {
        headline: `المقاعد المماثلة تدفع حوالي ${range}`,
        body: `بيانات الأجر العامة لمستوى وموقع مشابه في ${region} تتجمع حول ${range} (${currency}). اعتبرها قيمة السوق — أكّد النطاق المعتمد قبل التفاوض.`,
      },
    };
    return { ...b[lang], note };
  }

  const c: Record<AppLanguage, { headline: string; body: string }> = {
    en: {
      headline: `Market value ≈ ${range}`,
      body: `For this level in ${region}, comparable roles typically land around ${range} (${currency}). Use that as the market price of the job when deciding whether to apply — it is not a promised company offer.`,
    },
    'zh-TW': {
      headline: `市場價值 ≈ ${range}`,
      body: `在 ${region} 此職級，相近職位通常落在 ${range}（${currency}）。決定是否投遞時可作為市價參考 — 並非公司保證報價。`,
    },
    'zh-CN': {
      headline: `市场价值 ≈ ${range}`,
      body: `在 ${region} 此职级，相近职位通常落在 ${range}（${currency}）。决定是否投递时可作为市价参考 — 并非公司保证报价。`,
    },
    es: {
      headline: `Valor de mercado ≈ ${range}`,
      body: `Para este nivel en ${region}, roles comparables suelen situarse en torno a ${range} (${currency}). Úsalo como precio de mercado al decidir postular — no es una oferta prometida.`,
    },
    hi: {
      headline: `बाज़ार मूल्य ≈ ${range}`,
      body: `${region} में इस स्तर पर तुलनीय भूमिकाएँ आमतौर पर ${range} (${currency}) के आसपास आती हैं। आवेदन तय करते समय इसे बाज़ार कीमत मानें — यह वादा किया ऑफर नहीं।`,
    },
    ar: {
      headline: `قيمة السوق ≈ ${range}`,
      body: `لهذا المستوى في ${region}، الأدوار المماثلة تقع عادةً حول ${range} (${currency}). استخدمها كسعر سوق عند قرار التقديم — وليست عرضًا مضمونًا من الشركة.`,
    },
  };
  return { ...c[lang], note };
}
