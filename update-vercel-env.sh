#!/bin/bash
# 更新 Vercel 環境變數的腳本

echo "🔧 準備更新 Vercel 環境變數..."
echo ""

# 讀取本地環境變數
if [ -f .env.local ]; then
    source .env.local
    API_KEY="$GOOGLE_GEMINI_API_KEY"
    
    if [ -z "$API_KEY" ]; then
        echo "❌ 在 .env.local 中找不到 GOOGLE_GEMINI_API_KEY"
        exit 1
    fi
    
    echo "✅ 找到本地 API Key: ${API_KEY:0:10}...${API_KEY: -10}"
    echo ""
    echo "📋 請執行以下命令來更新 Vercel 環境變數："
    echo ""
    echo "npx vercel env add GOOGLE_GEMINI_API_KEY production"
    echo "（當提示輸入值時，貼上：$API_KEY）"
    echo ""
    echo "或者使用以下命令一次性設定："
    echo "echo '$API_KEY' | npx vercel env add GOOGLE_GEMINI_API_KEY production"
    echo ""
else
    echo "❌ 找不到 .env.local 檔案"
    exit 1
fi
