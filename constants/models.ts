/**
 * Gemini 模型配置
 * 集中管理所有 Gemini API 模型名稱，方便未來升級維護
 * 
 * 📌 更新歷史：
 * - 2026-03-08: 升級至 gemini-3.1-flash-lite-preview
 * - 2025-XX-XX: 升級至 gemini-2.5-flash-lite
 * - 2024-XX-XX: 初始版本 gemini-2.0-flash-lite
 */

// 主要分析模型（用於職缺分析、面試準備等）
export const GEMINI_ANALYSIS_MODEL = 'gemini-3.1-flash-lite-preview';

// 影片生成模型（用於短影片生成）
export const GEMINI_VIDEO_MODEL = 'gemini-3.1-flash-lite-preview';

// 預設模型（當沒有特別指定時使用）
export const GEMINI_DEFAULT_MODEL = 'gemini-3.1-flash-lite-preview';

/**
 * 模型配置說明：
 * 
 * gemini-3.1-flash-lite-preview (當前版本)
 * - 速度快、成本低
 * - 適合高頻次調用的場景
 * - 支援多模態輸入
 * - 更強的推理能力
 */

// 導出便於導入使用
export default {
  analysis: GEMINI_ANALYSIS_MODEL,
  video: GEMINI_VIDEO_MODEL,
  default: GEMINI_DEFAULT_MODEL,
};
