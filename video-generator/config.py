"""
Gemini 模型配置
集中管理所有 Gemini API 模型名稱，方便未來升級維護

📌 更新歷史：
- 2026-03-08: 升級至 gemini-3.1-flash-lite-preview
- 2025-XX-XX: 升級至 gemini-2.5-flash-lite
- 2024-XX-XX: 初始版本 gemini-2.0-flash-lite
"""

# 主要分析模型（用於職缺分析、影片腳本生成等）
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

# API 端點基礎 URL
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

def get_gemini_url(model: str = GEMINI_MODEL) -> str:
    """
    生成完整的 Gemini API URL
    
    Args:
        model: 模型名稱，預設使用 GEMINI_MODEL
    
    Returns:
        完整的 API URL
    """
    return f"{GEMINI_API_BASE}/{model}:generateContent"

# 模型配置說明
MODEL_INFO = {
    "gemini-3.1-flash-lite-preview": {
        "description": "最新的 Flash Lite 預覽版",
        "features": ["速度快", "成本低", "多模態支援", "更強推理能力"],
        "use_cases": ["職缺分析", "影片腳本生成", "高頻調用場景"]
    }
}
