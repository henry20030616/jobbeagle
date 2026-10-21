import type { ExpectedOfferRange, SalaryEvidenceTier } from '@/types';
import {
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';

function cleanMoney(v: string | null | undefined): string {
  if (!v || !v.trim() || v.trim() === '—') return '';
  return v.trim();
}

export type PayEstimateScope = {
  where: string;
  role: string;
  level: string;
};

const PAY_SCOPE_MISSING: Record<AppLanguage, { where: string; role: string; level: string }> = {
  en: {
    where: 'Location not stated on the posting',
    role: 'Job title not stated',
    level: 'Level or years not stated',
  },
  'zh-TW': {
    where: '職缺沒有寫明地點',
    role: '職缺沒有寫明職位',
    level: '職缺沒有寫明職級或年資',
  },
  'zh-CN': {
    where: '职位没有写明地点',
    role: '职位没有写明职位名称',
    level: '职位没有写明职级或年资',
  },
  es: {
    where: 'El anuncio no indica el lugar',
    role: 'El anuncio no indica el puesto',
    level: 'El anuncio no indica nivel ni años',
  },
  hi: {
    where: 'पोस्टिंग में जगह नहीं है',
    role: 'पोस्टिंग में पद नहीं है',
    level: 'पोस्टिंग में स्तर या वर्षों का उल्लेख नहीं',
  },
  ar: {
    where: 'الإعلان لا يذكر المكان',
    role: 'الإعلان لا يذكر المسمى',
    level: 'الإعلان لا يذكر المستوى أو سنوات الخبرة',
  },
};

const YEAR_SIGNAL = /年|years?|yoe|\byrs\b/i;

/** Place, job title, and level or years the market band is about. */
export function payEstimateScope(
  report: {
    job_title?: string | null;
    expected_offer?: ExpectedOfferRange | null;
    hard_filter?: { items?: Array<{ requirement?: string; evidence?: string }> } | null;
    market_positioning?: { rationale?: string | null } | null;
  },
  language: AppLanguage | string = 'en',
): PayEstimateScope {
  const lang = normalizeReportLanguage(language);
  const missing = PAY_SCOPE_MISSING[lang];
  const where = report.expected_offer?.region?.trim() || missing.where;
  const role = report.job_title?.trim() || missing.role;
  const yearItem = (report.hard_filter?.items ?? []).find((item) =>
    YEAR_SIGNAL.test(`${item.requirement ?? ''} ${item.evidence ?? ''}`),
  );
  const fromFilter = [yearItem?.requirement?.trim(), yearItem?.evidence?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' — ');
  const level = fromFilter || report.market_positioning?.rationale?.trim() || missing.level;
  return { where, role, level };
}

export function marketBandDisclaimer(
  offer: ExpectedOfferRange | null | undefined,
  scope: PayEstimateScope,
  language: AppLanguage | string = 'en',
): { nature: string; method: string } {
  const lang = normalizeReportLanguage(language);
  const tier = offer?.evidence_tier === 'A' || offer?.evidence_tier === 'B'
    || offer?.evidence_tier === 'C' || offer?.evidence_tier === 'D'
    ? offer.evidence_tier
    : 'C';
  const source = (offer?.sources ?? []).map((item) => item.trim()).filter(Boolean)[0] ?? '';
  const nature: Record<AppLanguage, string> = {
    en: 'This is not company pay data. It is a market salary level.',
    'zh-TW': '非公司數據，為市場薪資水準。',
    'zh-CN': '非公司数据，为市场薪资水准。',
    es: 'No son datos salariales de la empresa. Es un nivel salarial de mercado.',
    hi: 'यह कंपनी का वेतन डेटा नहीं है। यह बाज़ार वेतन स्तर है।',
    ar: 'هذه ليست بيانات أجر الشركة. هذا مستوى أجور السوق.',
  };
  const method: Record<AppLanguage, Record<'A' | 'B' | 'C' | 'D', string>> = {
    en: {
      A: `The figure comes from the salary field on this posting. Role: ${scope.role}. Location: ${scope.where}.`,
      B: `The posting does not give this employer’s internal pay. The figure comes from public compensation for similar title, location, and level. Role: ${scope.role}. Location: ${scope.where}. Level or years: ${scope.level}.`,
      C: `The posting does not list an employer range. The band is estimated from the posting’s title (${scope.role}), location (${scope.where}), and level or years (${scope.level}), against the market total-comp level for comparable seats.`,
      D: 'The posting does not give enough title, location, or level signal for a reliable market band.',
    },
    'zh-TW': {
      A: `數字取自這則職缺刊登的薪資欄。職位：${scope.role}。地點：${scope.where}。`,
      B: `職缺沒有這家公司的內部薪資。數字取自職稱、地點與職級相近的公開薪酬資料。職位：${scope.role}。地點：${scope.where}。職級或年資：${scope.level}。`,
      C: `職缺未刊登公司薪資。依職稱（${scope.role}）、地點（${scope.where}）與職級或年資（${scope.level}），對照同類職位的市場總薪酬帶估計。`,
      D: '職缺的職稱、地點或職級訊號不足，無法形成可靠的市場區間。',
    },
    'zh-CN': {
      A: `数字取自这则职位刊登的薪酬栏。职位：${scope.role}。地点：${scope.where}。`,
      B: `职位没有这家公司的内部薪酬。数字取自职称、地点与职级相近的公开薪酬资料。职位：${scope.role}。地点：${scope.where}。职级或年资：${scope.level}。`,
      C: `职位未刊登公司薪酬。依职称（${scope.role}）、地点（${scope.where}）与职级或年资（${scope.level}），对照同类职位的市场总薪酬带估计。`,
      D: '职位的职称、地点或职级信号不足，无法形成可靠的市场区间。',
    },
    es: {
      A: `La cifra sale del campo salarial de este anuncio. Puesto: ${scope.role}. Lugar: ${scope.where}.`,
      B: `El anuncio no da la retribución interna de esta empresa. La cifra sale de compensación pública de título, lugar y nivel similares. Puesto: ${scope.role}. Lugar: ${scope.where}. Nivel o años: ${scope.level}.`,
      C: `El anuncio no publica una banda de la empresa. La banda se estima con el título (${scope.role}), el lugar (${scope.where}) y el nivel o años (${scope.level}), frente al total de mercado de puestos comparables.`,
      D: 'El anuncio no da título, lugar o nivel suficientes para una banda de mercado fiable.',
    },
    hi: {
      A: `आंकड़ा इस पोस्टिंग के वेतन फ़ील्ड से है। पद: ${scope.role}। जगह: ${scope.where}।`,
      B: `पोस्टिंग इस नियोक्ता का आंतरिक वेतन नहीं देती। आंकड़ा समान पद, जगह और स्तर के सार्वजनिक मुआवज़े से है। पद: ${scope.role}। जगह: ${scope.where}। स्तर या वर्ष: ${scope.level}।`,
      C: `पोस्टिंग में नियोक्ता रेंज नहीं है। पट्टी पद (${scope.role}), जगह (${scope.where}) और स्तर या वर्षों (${scope.level}) से, तुलनीय सीटों के बाज़ार कुल मुआवज़े के सापेक्ष अनुमानित है।`,
      D: 'विश्वसनीय बाज़ार पट्टी के लिए पद, जगह या स्तर का संकेत पर्याप्त नहीं।',
    },
    ar: {
      A: `الرقم من حقل الأجر في هذا الإعلان. المسمى: ${scope.role}. المكان: ${scope.where}.`,
      B: `الإعلان لا يعطي أجر هذه الشركة الداخلي. الرقم من تعويض علني لمسمى ومكان ومستوى مشابه. المسمى: ${scope.role}. المكان: ${scope.where}. المستوى أو السنوات: ${scope.level}.`,
      C: `الإعلان لا ينشر نطاقاً لصاحب العمل. يُقدَّر النطاق من المسمى (${scope.role}) والمكان (${scope.where}) والمستوى أو السنوات (${scope.level}) مقابل إجمالي السوق لمقاعد مماثلة.`,
      D: 'الإعلان لا يعطي إشارة كافية للمسمى أو المكان أو المستوى لنطاق سوق موثوق.',
    },
  };
  const sourceLead: Record<AppLanguage, string> = {
    en: 'Benchmark basis',
    'zh-TW': '對照依據',
    'zh-CN': '对照依据',
    es: 'Base de comparación',
    hi: 'तुलना आधार',
    ar: 'أساس المقارنة',
  };
  const methodLine = method[lang][tier];
  const withSource = source && (tier === 'B' || tier === 'C')
    ? `${methodLine} ${sourceLead[lang]}: ${source}.`
    : methodLine;
  return { nature: nature[lang], method: withSource };
}

export function payEstimateSentence(
  scope: PayEstimateScope,
  range: string,
  currency: string,
  language: AppLanguage | string = 'en',
  offer?: ExpectedOfferRange | null,
): string {
  const lang = normalizeReportLanguage(language);
  const money = currency.trim() || 'USD';
  const disclaimer = marketBandDisclaimer(offer, scope, language);
  const copy: Record<AppLanguage, string> = {
    en: `Where: ${scope.where}. Role: ${scope.role}. Level or years: ${scope.level}. The market total for that scope is about ${range} (${money}). ${disclaimer.nature} ${disclaimer.method}`,
    'zh-TW': `地點：${scope.where}。職位：${scope.role}。職級或年資：${scope.level}。這個範圍的市場總薪酬大約是 ${range}（${money}）。${disclaimer.nature}${disclaimer.method}`,
    'zh-CN': `地点：${scope.where}。职位：${scope.role}。职级或年资：${scope.level}。这个范围的市场总薪酬大约是 ${range}（${money}）。${disclaimer.nature}${disclaimer.method}`,
    es: `Lugar: ${scope.where}. Puesto: ${scope.role}. Nivel o años: ${scope.level}. El total de mercado para ese alcance ronda ${range} (${money}). ${disclaimer.nature} ${disclaimer.method}`,
    hi: `जगह: ${scope.where}. पद: ${scope.role}. स्तर या वर्ष: ${scope.level}. इस दायरे का बाज़ार कुल लगभग ${range} (${money}) है। ${disclaimer.nature} ${disclaimer.method}`,
    ar: `المكان: ${scope.where}. المسمى: ${scope.role}. المستوى أو السنوات: ${scope.level}. إجمالي السوق لهذا النطاق حوالي ${range} (${money}). ${disclaimer.nature} ${disclaimer.method}`,
  };
  return copy[lang];
}

const TIER_LABELS: Record<AppLanguage, Record<'A' | 'B' | 'C' | 'D' | 'default', string>> = {
  en: {
    A: 'From the job posting',
    B: 'From comparable public roles',
    C: 'Market salary level (not company data)',
    D: 'Pay data too thin',
    default: 'Pay evidence unclear',
  },
  'zh-TW': {
    A: '來自職缺刊登',
    B: '來自可比公開職缺',
    C: '市場薪資水準（非公司數據）',
    D: '薪資資料不足',
    default: '薪資證據不明',
  },
  'zh-CN': {
    A: '来自职位刊登',
    B: '来自可比公开职位',
    C: '市场薪资水准（非公司数据）',
    D: '薪酬数据不足',
    default: '薪酬证据不明',
  },
  es: {
    A: 'Del anuncio del puesto',
    B: 'De roles públicos comparables',
    C: 'Nivel salarial de mercado (no datos de la empresa)',
    D: 'Datos salariales insuficientes',
    default: 'Evidencia salarial poco clara',
  },
  hi: {
    A: 'जॉब पोस्टिंग से',
    B: 'तुलनीय सार्वजनिक भूमिकाओं से',
    C: 'बाज़ार वेतन स्तर (कंपनी डेटा नहीं)',
    D: 'वेतन डेटा अपर्याप्त',
    default: 'वेतन साक्ष्य अस्पष्ट',
  },
  ar: {
    A: 'من إعلان الوظيفة',
    B: 'من أدوار عامة مماثلة',
    C: 'مستوى أجور السوق (ليست بيانات الشركة)',
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
        body: `For this level in ${region}, comparable roles typically land around ${range} (${currency}). That is a market salary level, not this company’s pay data — estimated from title, location, and level on the posting.`,
    },
    'zh-TW': {
      headline: `市場價值 ≈ ${range}`,
        body: `在 ${region} 此職級，相近職位通常落在 ${range}（${currency}）。這是市場薪資水準，非公司數據；依職缺的職稱、地點與職級估計。`,
    },
    'zh-CN': {
      headline: `市场价值 ≈ ${range}`,
        body: `在 ${region} 此职级，相近职位通常落在 ${range}（${currency}）。这是市场薪资水准，非公司数据；依职位的职称、地点与职级估计。`,
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
