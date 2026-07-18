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

/** Score floor for each tier (inclusive). */
export const BEAGLE_TIER_MIN_SCORE: readonly [number, number, number, number] = [90, 75, 60, 0];

export const BEAGLE_TIER_SCORE_LABEL: readonly [string, string, string, string] = [
  '90–100',
  '75–89',
  '60–74',
  '0–59',
];

export const BEAGLE_TIER_COPY: Record<string, BeagleTierCopy[]> = {
  en: [
    [
      'Diamond Beagle',
      'Exceptional Fit',
      'Score 90–100. You look like a top-tier match — must-haves are covered and evidence is recruiter-ready.',
    ],
    [
      'Sapphire Beagle',
      'Strong Fit',
      'Score 75–89. You clear most must-haves; tighten a few proof points and you are a serious final-round contender.',
    ],
    [
      'Emerald Beagle',
      'Competitive Fit',
      'Score 60–74. You have a real path in, but screeners will probe the gaps — fix those before you apply.',
    ],
    [
      'Copper Beagle',
      'Stretch Fit',
      'Score 0–59. This role is a stretch from your current evidence — apply only with a clear narrative plan, or target a closer level.',
    ],
  ],
  'zh-TW': [
    ['鑽石米格魯', '頂級契合', '分數 90–100。履歷與職缺高度對齊，屬於第一梯隊候選人。'],
    ['藍寶米格魯', '強勢契合', '分數 75–89。多數硬條件已具備，補強關鍵證據即可進入末輪。'],
    ['翡翠米格魯', '競爭契合', '分數 60–74。有機會進入流程，但篩選者會盯住缺口，建議先補強再投。'],
    ['赤銅米格魯', '挑戰契合', '分數 0–59。與職缺距離較大，需有清楚敘事再投，或改投更接近的職級。'],
  ],
  'zh-CN': [
    ['钻石米格鲁', '顶级契合', '分数 90–100。简历与职位高度对齐，属于第一梯队候选人。'],
    ['蓝宝米格鲁', '强势契合', '分数 75–89。多数硬条件已具备，补强关键证据即可进入末轮。'],
    ['翡翠米格鲁', '竞争契合', '分数 60–74。有机会进入流程，但筛选者会盯住缺口，建议先补强再投。'],
    ['赤铜米格鲁', '挑战契合', '分数 0–59。与职位距离较大，需有清楚叙事再投，或改投更接近的职级。'],
  ],
  es: [
    ['Beagle Diamante', 'Encaje excepcional', 'Puntuación 90–100. Encaje de primer nivel.'],
    ['Beagle Zafiro', 'Encaje fuerte', 'Puntuación 75–89. Cumples la mayoría de requisitos clave.'],
    ['Beagle Esmeralda', 'Encaje competitivo', 'Puntuación 60–74. Hay camino, pero habrá preguntas sobre gaps.'],
    ['Beagle Cobre', 'Encaje exigente', 'Puntuación 0–59. Es un stretch — aplica solo con narrativa clara.'],
  ],
  hi: [
    ['डायमंड बीगल', 'उत्कृष्ट फिट', 'स्कोर 90–100। शीर्ष-स्तरीय मिलान।'],
    ['सैफायर बीगल', 'मज़बूत फिट', 'स्कोर 75–89। अधिकांश ज़रूरी शर्तें पूरी।'],
    ['एमरल्ड बीगल', 'प्रतिस्पर्धी फिट', 'स्कोर 60–74। रास्ता है, लेकिन gaps पर सवाल आएंगे।'],
    ['कॉपर बीगल', 'स्ट्रेच फिट', 'स्कोर 0–59। यह भूमिका stretch है — स्पष्ट कहानी के साथ ही apply करें।'],
  ],
  ar: [
    ['بيغل ماسي', 'توافق استثنائي', 'النتيجة 90–100. توافق من الدرجة الأولى.'],
    ['بيغل ياقوتي', 'توافق قوي', 'النتيجة 75–89. تستوفي معظم المتطلبات الأساسية.'],
    ['بيغل زمردي', 'توافق تنافسي', 'النتيجة 60–74. هناك مسار، لكن الفجوات ستُسأل عنها.'],
    ['بيغل نحاسي', 'توافق طموح', 'النتيجة 0–59. الدور بعيد نسبيًا — قدّم فقط مع سرد واضح.'],
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

export interface BeagleTierLegendItem {
  index: BeagleTierIndex;
  name: string;
  label: string;
  description: string;
  scoreRange: string;
  visual: BeagleTierVisual;
  active: boolean;
}

/** All four Beagle levels for UI legend (highlights the active score band). */
export function getBeagleTierLegend(score: number, language = 'en'): BeagleTierLegendItem[] {
  const rows = BEAGLE_TIER_COPY[language] ?? BEAGLE_TIER_COPY.en;
  const active = beagleTierIndex(score);
  return ([0, 1, 2, 3] as BeagleTierIndex[]).map((index) => {
    const [name, label, description] = rows[index];
    return {
      index,
      name,
      label,
      description,
      scoreRange: BEAGLE_TIER_SCORE_LABEL[index],
      visual: BEAGLE_TIER_VISUALS[index],
      active: index === active,
    };
  });
}
