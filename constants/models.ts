/**
 * Gemini model configuration — keep IDs in sync with Google AI Studio availability.
 * Snapshot: flash-lite, no grounding, no Anthropic.
 * Guide intel: pro-tier + Google Search (does NOT call Lite first).
 * Guide writing: Anthropic Claude Sonnet (search off); Gemini Pro fallback if ANTHROPIC_API_KEY is missing.
 *
 * Note (2026-07): gemini-2.5-pro returns 404 for new API keys ("no longer available to new users").
 */

/** Fit Snapshot — flash-lite (pure reasoning, no web search) */
export const GEMINI_LITE_MODEL = 'gemini-3.1-flash-lite';

/**
 * Interview Guide intel modules (salary_land, company_intel, question_retrieval).
 * Always Gemini Pro + Google Search. Never Anthropic.
 */
export const GEMINI_FULL_MODEL = 'gemini-3.1-pro-preview';

/**
 * Guide writing modules (resume_rewrite, question_answers, negotiation).
 * Claude Sonnet 5.5 — Anthropic API id `claude-sonnet-5-5` (current Sonnet as of 2026-10).
 * Paid writing stays on Sonnet, never Haiku. Search is off.
 */
export const ANTHROPIC_WRITING_MODEL = 'claude-sonnet-5-5';

/** Token count gate model */
export const GEMINI_TOKEN_COUNT_MODEL = 'gemini-3.1-flash-lite';

export const GEMINI_ANALYSIS_MODEL = GEMINI_LITE_MODEL;
export const GEMINI_VIDEO_MODEL = GEMINI_LITE_MODEL;
export const GEMINI_DEFAULT_MODEL = GEMINI_LITE_MODEL;

/** Context window safe limits */
export const MAX_JD_CHARS = 8000;
export const MAX_RESUME_CHARS = 10000;
export const MAX_COMBINED_TOKENS = 4500;

/**
 * Vercel serverless request body hard cap is ~4.5MB. PDF base64 expands ~4/3,
 * so keep raw PDF under this and leave room for JD + JSON wrappers.
 * (2MB file ≈ 2.7MB base64 — stays under the cap with an 8k JD.)
 */
export const MAX_RESUME_PDF_BYTES = 2_000_000;
/** Client-side JSON body char guard before POST /api/analyze. */
export const MAX_ANALYZE_BODY_CHARS = 3_500_000;

export default {
  lite: GEMINI_LITE_MODEL,
  full: GEMINI_FULL_MODEL,
  writing: ANTHROPIC_WRITING_MODEL,
  analysis: GEMINI_ANALYSIS_MODEL,
  video: GEMINI_VIDEO_MODEL,
  default: GEMINI_DEFAULT_MODEL,
};
