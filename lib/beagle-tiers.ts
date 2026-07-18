/**
 * JobBeagle score tiers — names + colors aligned to brand (indigo / blue / teal / copper).
 * Thresholds: 90+ / 75+ / 60+ / below.
 */

export type BeagleTierIndex = 0 | 1 | 2 | 3;

export interface BeagleTierVisual {
  /** Tailwind text class for the tier name */
  color: string;
  /** SVG body fill */
  fill: string;
  /** SVG ear / accent fill */
  spotColor: string;
  /** CSS glow color for drop-shadow */
  glow: string;
  /** Ready-to-use Tailwind drop-shadow class */
  glowClass: string;
}

export const BEAGLE_TIER_VISUALS: BeagleTierVisual[] = [
  {
    // Diamond — crystalline indigo / violet
    color: 'text-indigo-300',
    fill: '#a5b4fc',
    spotColor: '#6366f1',
    glow: 'rgba(129,140,248,0.55)',
    glowClass: 'drop-shadow-[0_0_18px_rgba(129,140,248,0.55)]',
  },
  {
    // Sapphire — clear brand blue
    color: 'text-sky-300',
    fill: '#7dd3fc',
    spotColor: '#0284c7',
    glow: 'rgba(56,189,248,0.5)',
    glowClass: 'drop-shadow-[0_0_18px_rgba(56,189,248,0.5)]',
  },
  {
    // Emerald — soft teal
    color: 'text-teal-300',
    fill: '#5eead4',
    spotColor: '#0f766e',
    glow: 'rgba(45,212,191,0.45)',
    glowClass: 'drop-shadow-[0_0_16px_rgba(45,212,191,0.45)]',
  },
  {
    // Copper — muted warm metal (not neon orange)
    color: 'text-orange-200',
    fill: '#d6a07c',
    spotColor: '#9a5b3c',
    glow: 'rgba(214,160,124,0.4)',
    glowClass: 'drop-shadow-[0_0_14px_rgba(214,160,124,0.4)]',
  },
];

/** [name, short label, description] */
export type BeagleTierCopy = [string, string, string];

export const BEAGLE_TIER_COPY: Record<string, BeagleTierCopy[]> = {
  en: [
    [
      'Diamond Beagle',
      'Exceptional Fit',
      'Your profile lines up tightly with this role — you are a top-tier contender.',
    ],
    [
      'Sapphire Beagle',
      'Strong Fit',
      'You clear most must-haves; a few targeted stories will push you into the final round.',
    ],
    [
      'Emerald Beagle',
      'Competitive Fit',
      'You have a credible path in, but expect screeners to probe the gaps below.',
    ],
    [
      'Copper Beagle',
      'Stretch Fit',
      'This role is a stretch from your current evidence — apply only with a clear narrative plan.',
    ],
  ],
  'zh-TW': [
    ['鑽石米格魯', '頂級契合', '履歷與職缺高度對齊，屬於第一梯隊候選人。'],
    ['藍寶米格魯', '強勢契合', '多數硬條件已具備，補強關鍵故事即可進入末輪。'],
    ['翡翠米格魯', '競爭契合', '有機會進入流程，但篩選者會盯住下列缺口。'],
    ['赤銅米格魯', '挑戰契合', '與職缺距離較大，需有清楚敘事再投遞。'],
  ],
  'zh-CN': [
    ['钻石米格鲁', '顶级契合', '简历与职位高度对齐，属于第一梯队候选人。'],
    ['蓝宝米格鲁', '强势契合', '多数硬条件已具备，补强关键故事即可进入末轮。'],
    ['翡翠米格鲁', '竞争契合', '有机会进入流程，但筛选者会盯住下列缺口。'],
    ['赤铜米格鲁', '挑战契合', '与职位距离较大，需有清楚叙事再投递。'],
  ],
  es: [
    ['Beagle Diamante', 'Encaje excepcional', 'Tu perfil encaja muy bien con este rol.'],
    ['Beagle Zafiro', 'Encaje fuerte', 'Cumples la mayoría de requisitos clave.'],
    ['Beagle Esmeralda', 'Encaje competitivo', 'Tienes camino, pero habrá preguntas sobre gaps.'],
    ['Beagle Cobre', 'Encaje exigente', 'Es un stretch — aplica solo con narrativa clara.'],
  ],
  hi: [
    ['डायमंड बीगल', 'उत्कृष्ट फिट', 'आपका प्रोफ़ाइल इस भूमिका से कसकर मेल खाता है।'],
    ['सैफायर बीगल', 'मज़बूत फिट', 'अधिकांश ज़रूरी शर्तें पूरी होती हैं।'],
    ['एमरल्ड बीगल', 'प्रतिस्पर्धी फिट', 'रास्ता है, लेकिन gaps पर सवाल आएंगे।'],
    ['कॉपर बीगल', 'स्ट्रेच फिट', 'यह भूमिका stretch है — स्पष्ट कहानी के साथ ही apply करें।'],
  ],
  ar: [
    ['بيغل ماسي', 'توافق استثنائي', 'ملفك يتوافق بقوة مع هذا الدور.'],
    ['بيغل ياقوتي', 'توافق قوي', 'تستوفي معظم المتطلبات الأساسية.'],
    ['بيغل زمردي', 'توافق تنافسي', 'هناك مسار، لكن الفجوات ستُسأل عنها.'],
    ['بيغل نحاسي', 'توافق طموح', 'الدور بعيد نسبيًا — قدّم فقط مع سرد واضح.'],
  ],
};

export function beagleTierIndex(score: number): BeagleTierIndex {
  if (score >= 90) return 0;
  if (score >= 75) return 1;
  if (score >= 60) return 2;
  return 3;
}

export function getBeagleTierVisual(score: number): BeagleTierVisual {
  return BEAGLE_TIER_VISUALS[beagleTierIndex(score)];
}

export function getBeagleTierCopy(score: number, language = 'en'): BeagleTierCopy {
  const rows = BEAGLE_TIER_COPY[language] ?? BEAGLE_TIER_COPY.en;
  return rows[beagleTierIndex(score)];
}
