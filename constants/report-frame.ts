/**
 * Page chrome (outside ReportFitStage zoom). Sized to stay readable
 * next to a zoomed Snapshot/Guide slide — not compact header chips.
 */
export const REPORT_ACTION_TEXT = 'text-6xl font-bold tracking-tight leading-none';

export const REPORT_ACTION_ICON = 'w-16 h-16 shrink-0';

/** Back to Home / New Analysis / language chrome */
export const REPORT_ACTION_BTN =
  `inline-flex min-h-28 items-center gap-4 rounded-xl border-2 border-slate-400 bg-slate-900/70 px-8 py-5 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors`;

/**
 * “View sample” chip on the homepage report-type cards.
 * Size with em so padding tracks homepage-font-large (rem padding stayed tiny).
 * text-2xl matches the card blurb / Saved Resumes pill; max-w-full keeps the grid from shoving.
 */
export const SAMPLE_LINK_BTN =
  `inline-flex w-fit max-w-full items-center gap-[0.4em] rounded-xl border-2 border-indigo-400/50 bg-indigo-500/15 px-[0.9em] py-[0.45em] text-2xl font-bold leading-snug text-indigo-200 underline underline-offset-[0.18em] hover:bg-indigo-500/25 hover:border-indigo-300 transition-colors`;

/**
 * Samples left-rail — ONE size for SAMPLE notice / Snapshot / Guide / Compare.
 * Keep in sync across all four boxes.
 */
export const SAMPLE_RAIL_TEXT = 'text-6xl font-bold leading-snug tracking-tight';
export const SAMPLE_RAIL_ICON = 'w-16 h-16 shrink-0';
export const SAMPLE_HEADER_TEXT = SAMPLE_RAIL_TEXT;
export const SAMPLE_HEADER_ICON = SAMPLE_RAIL_ICON;
/** Base shell only — active/inactive border style set by caller (solid vs dashed) */
export const SAMPLE_HEADER_BTN =
  `inline-flex items-center justify-center gap-5 rounded-xl border-2 px-8 py-6 ${SAMPLE_RAIL_TEXT} transition-colors shrink-0`;

/**
 * Snapshot / Guide large frames — same thickness (border-2), clear blue (not white).
 */
export const REPORT_FRAME_BORDER = 'border-2 border-blue-500';

/**
 * Guide inner section cards (總結分析, 公司評價, 談判區塊, 面試真題 groups).
 * Same chrome as ItemBlock on the interview-questions page.
 */
export const GUIDE_SECTION_FRAME = `rounded-xl ${REPORT_FRAME_BORDER} bg-slate-900/55 p-5`;

/**
 * Snapshot + Guide item heading scale. All blue family on navy
 * (homepage / report-frame blue-500). Different size AND hue so
 * readers see L1 → L2 → L3 order. Do not use green / purple / gold.
 * Visuals live on `.report-h1/h2/h3` in `app/globals.css`.
 */
export const REPORT_H1 = 'report-h1';
export const REPORT_H2 = 'report-h2';
export const REPORT_H3 = 'report-h3';

/**
 * Guide in-report tab labels (職位核心 | 薪資落點 | …).
 * Same type SIZE as REPORT_H1 / 職位核心解析 (1.5rem = text-2xl).
 * Chip selected/idle colors stay on the button, not this class.
 */
export const REPORT_GUIDE_TAB_TYPE =
  'text-2xl font-black tracking-tight leading-tight';

/**
 * Homepage report-type cards (step 3).
 * Dark blue fill (blue-900 / #1e3a8a family) — not indigo/purple.
 * Selected card keeps the same fill plus the white 2px box (border-2 + border-white).
 * Step-4 launch inner box must reuse these classes — no indigo, glow, or blue-800 fill.
 */
export const REPORT_TYPE_CARD_FILL = 'bg-blue-900';
export const REPORT_TYPE_CARD_IDLE =
  `border-solid border-blue-700 ${REPORT_TYPE_CARD_FILL} text-white hover:bg-blue-800`;
export const REPORT_TYPE_CARD_ACTIVE =
  `border-solid border-white ${REPORT_TYPE_CARD_FILL} text-white ring-4 ring-white/90`;

/**
 * Step-4 launch inner 方匡 — same opaque fill + white 2px box as the selected Snapshot card.
 * Idle homepage is disabled (no JD/resume); do not dim with opacity — that mixes the slate
 * column through bg-blue-900 and reads as a different/duller blue.
 */
export const REPORT_TYPE_LAUNCH_BOX =
  `border-2 ${REPORT_TYPE_CARD_ACTIVE} text-white hover:text-white disabled:text-white`;

/**
 * Shared homepage title type: 四大優點 feature titles, step 1–4 headings,
 * and the three step-header pills. Desktop `.homepage-font-large` maps this
 * to `var(--type-rest)` so the three surfaces stay in sync.
 */
export const HOMEPAGE_TITLE_TYPE =
  'homepage-title-type text-lg sm:text-xl lg:text-2xl xl:text-3xl';

/**
 * Step-header pill type (Chrome / saved resumes / credits).
 * Same size as 四大優點 titles (`HOMEPAGE_TITLE_TYPE` / `--type-rest`).
 * Icons must stay 1em so they track the text.
 */
export const HOMEPAGE_STEP_PILL_TYPE =
  `step-header-pill ${HOMEPAGE_TITLE_TYPE}`;

/**
 * Homepage step pills (Chrome extension / saved resumes / credits).
 * Same dark-blue fill as step 3 cards and the step 4 launch box.
 */
export const HOMEPAGE_STEP_PILL =
  `${HOMEPAGE_STEP_PILL_TYPE} text-zinc-100 ${REPORT_TYPE_CARD_FILL} hover:bg-blue-800 border-blue-700`;

/**
 * Homepage step column shell (steps 1–4). White 2px outline lives on the
 * step-4 launch inner box (REPORT_TYPE_LAUNCH_BOX), not on this column.
 */
export const HOMEPAGE_STEP_COL_SURFACE =
  'rounded-2xl border border-slate-500/70 bg-gradient-to-b from-slate-500/45 to-slate-600/70 shadow-xl';

/** /samples Fit Snapshot + Interview Guide — same dark-blue fill as step 3 cards / step-4 Launch */
export const SAMPLE_REPORT_TAB_IDLE =
  `rounded-2xl border border-blue-700 ${REPORT_TYPE_CARD_FILL} text-white hover:bg-blue-800`;
export const SAMPLE_REPORT_TAB_ACTIVE =
  `rounded-2xl border border-white ${REPORT_TYPE_CARD_FILL} text-white ring-4 ring-white/90`;

/**
 * Type-switcher card layout (padding, type, gap). Used by /samples left rail
 * and /account function nav so both stay the same size.
 */
export const SAMPLE_REPORT_TAB_LAYOUT =
  `inline-flex h-full w-full items-center justify-center gap-5 px-8 py-6 ${SAMPLE_RAIL_TEXT} shrink-0 text-center leading-snug whitespace-normal transition-colors`;

/** Desktop left-rail width for /samples type-switcher and /account function nav. */
export const SAMPLE_RAIL_WIDTH = 'w-[42rem]';

/** Sample notice (← Analyze) — same shell as Compare the two reports */
export const SAMPLE_NOTICE_SURFACE =
  'rounded-xl border-2 border-slate-400 bg-slate-900/80';

export const REPORT_SLIDE_SURFACE = `rounded-2xl ${REPORT_FRAME_BORDER} bg-slate-950`;

/**
 * Shared Snapshot / Guide shell width.
 * Use viewport width only — do NOT cap with rem (e.g. 100rem ≈ 1600px),
 * or large monitors show a centered “island” with huge empty margins.
 */
export const REPORT_SHELL_WIDTH = 'w-full max-w-full';

/**
 * Homepage `<main>` horizontal gutters (`app/page.tsx`).
 * vw padding so left AND right stay inset on any monitor — not rem-capped,
 * not a centered 1024px island.
 */
export const PAGE_SHELL_GUTTER =
  'px-[3.5vw] sm:px-[4vw] lg:px-[4vw] xl:px-[4.5vw]';

/**
 * Fixed presentation canvas width (px). ReportFitStage lays out at this width,
 * then scales uniformly to fill the stage width — proportions stay fixed.
 * Wider canvas = less empty side margin on desktop monitors.
 */
export const REPORT_SLIDE_DESIGN_WIDTH = 1680;
