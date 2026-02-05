# JobBeagle 影片生成服務設置指南

## 📋 前置需求

- Python 3.8 或更高版本
- 以下 API Keys（至少需要 Gemini 和 ElevenLabs）：
  - **Gemini API Key** (必需) - 用於生成腳本
  - **ElevenLabs API Key** (必需) - 用於生成語音
  - **HeyGen API Key** (必需) - 用於生成對嘴影片
  - **Creatomate API Key** (必需) - 用於合成最終影片
  - **Kling AI API Key** (可選) - 用於生成辦公室背景

## 🚀 快速開始

### 方法 1：使用啟動腳本（推薦）

```bash
cd video-generator
./start.sh
```

### 方法 2：手動設置

1. **進入目錄**
```bash
cd video-generator
```

2. **創建虛擬環境**
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **安裝依賴**
```bash
pip install -r requirements.txt
```

4. **配置環境變數**
```bash
cp env.example .env
# 編輯 .env 文件，填入您的 API Keys
```

5. **啟動服務**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔑 獲取 API Keys

### 1. Gemini API Key
- 前往：https://makersuite.google.com/app/apikey
- 創建新的 API Key
- 複製到 `.env` 文件的 `GEMINI_KEY` 或 `GOOGLE_GEMINI_API_KEY`

### 2. ElevenLabs API Key
- 前往：https://elevenlabs.io/
- 註冊帳號並獲取 API Key
- 複製到 `.env` 文件的 `ELEVENLABS_KEY`

### 3. HeyGen API Key
- 前往：https://www.heygen.com/
- 註冊帳號並獲取 API Key
- 複製到 `.env` 文件的 `HEYGEN_KEY`

### 4. Creatomate API Key
- 前往：https://creatomate.com/
- 註冊帳號並獲取 API Key
- 複製到 `.env` 文件的 `CREATOMATE_KEY`

### 5. Kling AI API Key (可選)
- 前往：https://www.klingai.com/
- 註冊帳號並獲取 API Key
- 複製到 `.env` 文件的 `KLING_KEY`

## ✅ 驗證設置

服務啟動後，訪問以下 URL 確認服務正常運行：

- **健康檢查**: http://localhost:8000/
- **API 文檔**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔧 配置 Next.js 連接

確保您的 `.env.local` 文件（在專案根目錄）包含：

```env
PYTHON_API_URL=http://localhost:8000
```

如果是生產環境，請設置為實際的 Python API 服務地址。

## 📝 .env 文件範例

```env
# Gemini API Key
GEMINI_KEY=your_gemini_api_key_here
# 或使用
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

# ElevenLabs API Key
ELEVENLABS_KEY=your_elevenlabs_api_key_here

# HeyGen API Key
HEYGEN_KEY=your_heygen_api_key_here

# Creatomate API Key
CREATOMATE_KEY=your_creatomate_api_key_here

# Kling AI API Key (可選)
KLING_KEY=your_kling_api_key_here
```

## 🐛 常見問題

### 1. 端口 8000 已被占用
```bash
# 使用其他端口
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

然後更新 `.env.local` 中的 `PYTHON_API_URL`。

### 2. 模組未找到錯誤
確保已啟動虛擬環境並安裝所有依賴：
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 3. API Key 錯誤
檢查 `.env` 文件中的 API Keys 是否正確，確保沒有多餘的空格或引號。

## 🎬 使用流程

1. 啟動 Python FastAPI 服務（`./start.sh`）
2. 啟動 Next.js 開發服務器（`npm run dev`）
3. 訪問 http://localhost:3000/shorts
4. 點擊「Video Generator」按鈕
5. 填寫表單並提交

## 📚 API 端點

### POST /generate-recruitment-video
生成招聘影片

**請求體：**
```json
{
  "job_description": "職位描述文字",
  "company_logo_url": "https://example.com/logo.png",
  "office_video_url": "https://example.com/office.mp4",  // 可選
  "manager_photo_url": "https://example.com/manager.jpg"
}
```

**響應：**
```json
{
  "status": "processing",
  "job_id": "uuid",
  "message": "視頻生成任務已啟動，請稍後查詢結果"
}
```

### GET /video-status/{job_id}
查詢影片生成狀態

**響應：**
```json
{
  "status": "completed",
  "message": "視頻生成完成！",
  "video_url": "https://example.com/final-video.mp4"
}
```

## 🚀 生產環境部署

生產環境建議使用：
- **Gunicorn** 或 **Uvicorn Workers** 運行 FastAPI
- **Redis** 或 **PostgreSQL** 存儲任務狀態
- **雲存儲**（S3/Cloud Storage）存儲生成的影片
- **環境變數管理**（如 Vercel、AWS Secrets Manager）

示例：
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
