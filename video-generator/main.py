"""
JobBeagle 自动化影音引擎 - FastAPI Main Entry
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
import os
from dotenv import load_dotenv
from video_engine import VideoEngine

# 加载环境变量
load_dotenv()

app = FastAPI(title="JobBeagle Video Generator API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://www.jobbeagle.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class VideoGenerationRequest(BaseModel):
    job_description: str
    company_logo_url: HttpUrl
    office_video_url: Optional[HttpUrl] = None
    manager_photo_url: HttpUrl

# 响应模型
class VideoGenerationResponse(BaseModel):
    status: str
    video_url: Optional[str] = None
    job_id: Optional[str] = None
    message: str

# 初始化视频引擎
video_engine = VideoEngine()

@app.get("/")
async def root():
    return {"message": "JobBeagle Video Generator API", "status": "running"}

@app.post("/generate-recruitment-video", response_model=VideoGenerationResponse)
async def generate_recruitment_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    生成招聘视频的主接口
    
    工作流程：
    1. Script Engine: Gemini API 生成脚本
    2. Audio Engine: ElevenLabs API 生成语音
    3. Avatar Engine: HeyGen API 生成对嘴视频
    4. B-Roll Logic: Kling AI 生成背景（如果需要）
    5. Final Editor: Creatomate API 合成最终视频
    """
    try:
        # 启动后台任务生成视频
        job_id = video_engine.create_job_id()
        
        # 添加后台任务
        background_tasks.add_task(
            video_engine.generate_video_pipeline,
            job_id=job_id,
            job_description=request.job_description,
            company_logo_url=str(request.company_logo_url),
            office_video_url=str(request.office_video_url) if request.office_video_url else None,
            manager_photo_url=str(request.manager_photo_url)
        )
        
        return VideoGenerationResponse(
            status="processing",
            job_id=job_id,
            message="视频生成任务已启动，请稍后查询结果"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video-status/{job_id}")
async def get_video_status(job_id: str):
    """查询视频生成状态"""
    try:
        status = await video_engine.get_job_status(job_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
