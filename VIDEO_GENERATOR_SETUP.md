# 🎬 JobBeagle 影片生成功能設置指南

## 📋 概述

JobBeagle 影片生成功能需要兩個服務同時運行：
1. **Next.js 前端服務**（端口 3000）
2. **Python FastAPI 後端服務**（端口 8000）

## 🚀 快速開始

### 步驟 1：設置 Python 後端

1. **進入 video-generator 目錄**
```bash
cd video-generator
```

2. **運行啟動腳本**
```bash
./start.sh
```

或者手動設置：
```bash
# 創建虛擬環境
python3 -m venv venv
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt

# 配置環境變數
cp env.example .env
# 編輯 .env 文件，填入 API Keys

# 啟動服務
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 步驟 2：配置 Next.js 環境變數

在專案根目錄的 `.env.local` 文件中添加：

```env
PYTHON_API_URL=http://localhost:8000
```

### 步驟 3：啟動 Next.js 服務

```bash
npm run dev
```

### 步驟 4：測試功能

1. 訪問 http://localhost:3000/shorts
2. 點擊右上角的「Video Generator」按鈕
3. 填寫表單並提交

## 🔑 必需的 API Keys

您需要以下 API Keys（至少需要前 4 個）：

1. **Gemini API Key** - 生成腳本
   - 獲取地址：https://makersuite.google.com/app/apikey
   - 設置為：`GEMINI_KEY` 或 `GOOGLE_GEMINI_API_KEY`

2. **ElevenLabs API Key** - 生成語音
   - 獲取地址：https://elevenlabs.io/
   - 設置為：`ELEVENLABS_KEY`

3. **HeyGen API Key** - 生成對嘴影片
   - 獲取地址：https://www.heygen.com/
   - 設置為：`HEYGEN_KEY`

4. **Creatomate API Key** - 合成最終影片
   - 獲取地址：https://creatomate.com/
   - 設置為：`CREATOMATE_KEY`

5. **Kling AI API Key** (可選) - 生成辦公室背景
   - 獲取地址：https://www.klingai.com/
   - 設置為：`KLING_KEY`

## 📝 環境變數配置

### Python 後端 (.env 文件在 video-generator 目錄)

```env
GEMINI_KEY=your_gemini_api_key_here
ELEVENLABS_KEY=your_elevenlabs_api_key_here
HEYGEN_KEY=your_heygen_api_key_here
CREATOMATE_KEY=your_creatomate_api_key_here
KLING_KEY=your_kling_api_key_here
```

### Next.js 前端 (.env.local 文件在專案根目錄)

```env
PYTHON_API_URL=http://localhost:8000
```

## ✅ 驗證設置

### 檢查 Python 後端

訪問 http://localhost:8000/ 應該看到：
```json
{"message": "JobBeagle Video Generator API", "status": "running"}
```

訪問 http://localhost:8000/docs 查看 API 文檔

### 檢查 Next.js 前端

訪問 http://localhost:3000/shorts，應該能看到「Video Generator」按鈕

## 🐛 常見問題

### 1. "fetch failed" 錯誤

**原因**：Python 後端服務未運行或無法連接

**解決方案**：
- 確認 Python 服務正在運行（訪問 http://localhost:8000/）
- 檢查 `.env.local` 中的 `PYTHON_API_URL` 是否正確
- 確認防火牆沒有阻止端口 8000

### 2. API Key 錯誤

**原因**：API Key 未設置或設置錯誤

**解決方案**：
- 檢查 `video-generator/.env` 文件中的 API Keys
- 確認沒有多餘的空格或引號
- 確認 API Key 有效且有足夠的額度

### 3. 端口被占用

**解決方案**：
```bash
# 使用其他端口啟動 Python 服務
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

然後更新 `.env.local` 中的 `PYTHON_API_URL=http://localhost:8001`

### 4. 模組未找到

**解決方案**：
```bash
cd video-generator
source venv/bin/activate
pip install -r requirements.txt
```

## 📚 詳細文檔

更多詳細信息請參考：
- `video-generator/SETUP.md` - Python 後端詳細設置指南
- `video-generator/README.md` - API 文檔

## 🎯 工作流程

影片生成流程：

1. **腳本生成** (Gemini API) - 將職位描述轉換為 50 秒對話式腳本
2. **語音生成** (ElevenLabs API) - 將腳本轉換為 MP3 語音檔
3. **對嘴影片** (HeyGen API) - 使用主管照片和語音生成綠幕對嘴影片
4. **背景生成** (Kling AI，可選) - 如果未提供辦公室影片，自動生成背景
5. **最終合成** (Creatomate API) - 將所有素材合成最終影片

## 🚀 生產環境部署

生產環境建議：

1. **Python 服務**：使用 Gunicorn 或 Uvicorn Workers
2. **任務狀態**：使用 Redis 或 PostgreSQL 存儲
3. **文件存儲**：使用雲存儲（S3/Cloud Storage）
4. **環境變數**：使用安全的環境變數管理服務

示例生產啟動：
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
