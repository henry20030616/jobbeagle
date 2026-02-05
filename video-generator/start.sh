#!/bin/bash

# JobBeagle 影片生成服務啟動腳本

echo "🚀 啟動 JobBeagle 影片生成服務..."

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤：未找到 Python 3，請先安裝 Python 3.8 或更高版本"
    exit 1
fi

# 檢查是否在正確的目錄
if [ ! -f "main.py" ]; then
    echo "❌ 錯誤：請在 video-generator 目錄中運行此腳本"
    exit 1
fi

# 檢查虛擬環境
if [ ! -d "venv" ]; then
    echo "📦 創建 Python 虛擬環境..."
    python3 -m venv venv
fi

# 啟動虛擬環境
echo "🔧 啟動虛擬環境..."
source venv/bin/activate

# 安裝依賴
echo "📥 安裝依賴套件..."
pip install -r requirements.txt

# 檢查環境變數文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告：未找到 .env 文件"
    echo "📝 正在從 env.example 創建 .env 文件..."
    cp env.example .env
    echo ""
    echo "⚠️  請編輯 .env 文件，填入您的 API Keys："
    echo "   - GEMINI_KEY 或 GOOGLE_GEMINI_API_KEY"
    echo "   - ELEVENLABS_KEY"
    echo "   - HEYGEN_KEY"
    echo "   - CREATOMATE_KEY"
    echo "   - KLING_KEY (可選)"
    echo ""
    read -p "按 Enter 繼續啟動服務（如果未配置 API Keys，服務可能會失敗）..."
fi

# 啟動服務
echo "🎬 啟動 FastAPI 服務..."
echo "📍 服務將運行在: http://localhost:8000"
echo "📚 API 文檔: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服務"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
