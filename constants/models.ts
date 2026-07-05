/**
 * Gemini model configuration — Unified Master Spec (2026)
 * Lite: fast reasoning, no grounding, prompt-cache friendly
 * Full: pro model + Google Search grounding for live intel
 */

/** Lite report — gemini-3.1-flash-lite (pure reasoning, no web search) */
export const GEMINI_LITE_MODEL = 'gemini-2.5-flash-lite';

/** Full report — gemini-3.1-pro with targeted grounding */
export const GEMINI_FULL_MODEL = 'gemini-2.5-pro';

/** Token count gate model */
export const GEMINI_TOKEN_COUNT_MODEL = 'gemini-2.5-flash-lite';

export const GEMINI_ANALYSIS_MODEL = GEMINI_LITE_MODEL;
export const GEMINI_VIDEO_MODEL = GEMINI_LITE_MODEL;
export const GEMINI_DEFAULT_MODEL = GEMINI_LITE_MODEL;

/** Context window safe limits */
export const MAX_JD_CHARS = 8000;
export const MAX_RESUME_CHARS = 10000;
export const MAX_COMBINED_TOKENS = 4500;

export default {
  lite: GEMINI_LITE_MODEL,
  full: GEMINI_FULL_MODEL,
  analysis: GEMINI_ANALYSIS_MODEL,
  video: GEMINI_VIDEO_MODEL,
  default: GEMINI_DEFAULT_MODEL,
};
