# JobBeagle 自动化影音引擎

使用 Python FastAPI 构建的招聘视频自动生成系统。

## 功能特性

- **Script Engine**: 使用 Gemini API 生成 50 秒对话式脚本
- **Audio Engine**: 使用 ElevenLabs API 生成真人语音
- **Avatar Engine**: 使用 HeyGen API 生成对嘴视频
- **B-Roll Logic**: 使用 Kling AI 生成办公室背景（可选）
- **Final Editor**: 使用 Creatomate API 合成最终视频

## 安装

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入各 API Key
```

## 运行

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### POST /generate-recruitment-video

生成招聘视频

**请求体：**
```json
{
  "job_description": "职位描述文本",
  "company_logo_url": "https://example.com/logo.png",
  "office_video_url": "https://example.com/office.mp4",  // 可选
  "manager_photo_url": "https://example.com/manager.jpg"
}
```

**响应：**
```json
{
  "status": "processing",
  "job_id": "uuid",
  "message": "视频生成任务已启动，请稍后查询结果"
}
```

### GET /video-status/{job_id}

查询视频生成状态

**响应：**
```json
{
  "status": "completed",
  "message": "视频生成完成！",
  "video_url": "https://example.com/final-video.mp4"
}
```

## 环境变量

参考 `.env.example` 文件配置以下 API Keys：

- `GEMINI_KEY`: Google Gemini API Key
- `ELEVENLABS_KEY`: ElevenLabs API Key
- `HEYGEN_KEY`: HeyGen API Key
- `CREATOMATE_KEY`: Creatomate API Key
- `KLING_KEY`: Kling AI API Key (可选)

## 工作流程

1. **Script Generation**: Gemini API 生成脚本（Hook + Value + CTA）
2. **Audio Generation**: ElevenLabs API 生成 MP3 语音
3. **Avatar Video**: HeyGen API 生成绿幕对嘴视频
4. **Background**: Kling AI 生成办公室背景（如果未提供）
5. **Composition**: Creatomate API 合成最终视频

## 注意事项

- 视频生成是异步任务，需要轮询状态接口获取结果
- 生产环境建议使用 Redis 或数据库存储任务状态
- 音频和视频文件应上传到云存储（S3/Cloud Storage）
- 各 API 调用可能需要付费，请注意使用量
