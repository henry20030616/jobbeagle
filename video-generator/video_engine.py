"""
JobBeagle 视频生成引擎
处理完整的视频生成流程
"""
import os
import asyncio
import aiohttp
import uuid
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class VideoEngine:
    def __init__(self):
        # API Keys
        self.gemini_key = os.getenv("GEMINI_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY")
        self.elevenlabs_key = os.getenv("ELEVENLABS_KEY")
        self.heygen_key = os.getenv("HEYGEN_KEY")
        self.creatomate_key = os.getenv("CREATOMATE_KEY")
        self.kling_key = os.getenv("KLING_KEY")
        
        # API Endpoints
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        self.elevenlabs_url = "https://api.elevenlabs.io/v1/text-to-speech"
        self.heygen_url = "https://api.heygen.com/v1/video.generate"
        self.creatomate_url = "https://rest.creatomate.com/v1/renders"
        self.kling_url = "https://api.klingai.com/v1/video/generate"
        
        # 存储任务状态（生产环境应使用 Redis 或数据库）
        self.job_status: Dict[str, Dict[str, Any]] = {}
    
    def create_job_id(self) -> str:
        """创建任务 ID"""
        return str(uuid.uuid4())
    
    async def generate_video_pipeline(
        self,
        job_id: str,
        job_description: str,
        company_logo_url: str,
        office_video_url: Optional[str],
        manager_photo_url: str
    ):
        """
        完整的视频生成流程
        """
        try:
            self.update_job_status(job_id, "processing", "开始生成脚本...")
            
            # Step 1: Script Engine - Gemini API
            script = await self.generate_script(job_description)
            self.update_job_status(job_id, "processing", "脚本生成完成，开始生成语音...")
            
            # Step 2: Audio Engine - ElevenLabs API
            audio_url = await self.generate_audio(script)
            self.update_job_status(job_id, "processing", "语音生成完成，开始生成对嘴视频...")
            
            # Step 3: Avatar Engine - HeyGen API
            avatar_video_url = await self.generate_avatar_video(manager_photo_url, audio_url)
            self.update_job_status(job_id, "processing", "对嘴视频生成完成，开始生成背景...")
            
            # Step 4: B-Roll Logic - Kling AI (如果需要)
            if not office_video_url:
                office_video_url = await self.generate_office_background()
                self.update_job_status(job_id, "processing", "背景生成完成，开始合成最终视频...")
            else:
                self.update_job_status(job_id, "processing", "使用提供的背景视频，开始合成最终视频...")
            
            # Step 5: Final Editor - Creatomate API
            final_video_url = await self.compose_final_video(
                office_video_url=office_video_url,
                avatar_video_url=avatar_video_url,
                company_logo_url=company_logo_url,
                script=script
            )
            
            self.update_job_status(job_id, "completed", "视频生成完成！", final_video_url)
            
        except Exception as e:
            self.update_job_status(job_id, "failed", f"生成失败: {str(e)}")
            raise
    
    async def generate_script(self, job_description: str) -> str:
        """
        Script Engine: 使用 Gemini API 生成 50 秒对话式脚本
        分为 Hook, Value, CTA 三段
        """
        if not self.gemini_key:
            raise ValueError("GEMINI_KEY not found")
        
        prompt = f"""请将以下职位描述转换为一段约 50 秒的对话式招聘视频脚本。

职位描述：
{job_description}

要求：
1. 脚本分为三段：Hook（开头吸引，10秒）、Value（核心价值，30秒）、CTA（行动号召，10秒）
2. 语言要自然、口语化，适合视频口播
3. 总时长约 50 秒（约 150-200 字）
4. 使用第二人称"你"，让观众有代入感

请直接输出脚本内容，不要包含其他说明文字。"""

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.gemini_url}?key={self.gemini_key}",
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Gemini API error: {error_text}")
                
                data = await response.json()
                script = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                
                if not script:
                    raise Exception("Failed to generate script from Gemini")
                
                return script.strip()
    
    async def generate_audio(self, script: str) -> str:
        """
        Audio Engine: 使用 ElevenLabs API 生成 MP3 语音
        """
        if not self.elevenlabs_key:
            raise ValueError("ELEVENLABS_KEY not found")
        
        # 使用稳定的真人音色（默认使用 Rachel）
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel - 稳定、专业的女性声音
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.elevenlabs_url}/{voice_id}",
                headers={
                    "xi-api-key": self.elevenlabs_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": script,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.75,
                        "similarity_boost": 0.75
                    }
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"ElevenLabs API error: {error_text}")
                
                # 保存音频文件（实际应用中应上传到云存储）
                audio_data = await response.read()
                audio_filename = f"/tmp/audio_{uuid.uuid4()}.mp3"
                with open(audio_filename, "wb") as f:
                    f.write(audio_data)
                
                # 返回音频 URL（实际应用中应返回云存储 URL）
                # 这里返回本地文件路径，生产环境应上传到 S3/Cloud Storage
                return audio_filename
    
    async def generate_avatar_video(self, manager_photo_url: str, audio_url: str) -> str:
        """
        Avatar Engine: 使用 HeyGen API 生成绿幕背景的对嘴视频
        """
        if not self.heygen_key:
            raise ValueError("HEYGEN_KEY not found")
        
        # 读取音频文件
        with open(audio_url, "rb") as f:
            audio_data = f.read()
        
        async with aiohttp.ClientSession() as session:
            # Step 1: 上传图片和音频
            # 注意：HeyGen API 可能需要先上传资源，这里简化处理
            form_data = aiohttp.FormData()
            form_data.add_field('photo_url', manager_photo_url)
            form_data.add_field('audio', audio_data, filename='audio.mp3', content_type='audio/mpeg')
            form_data.add_field('background_type', 'green_screen')
            
            async with session.post(
                self.heygen_url,
                headers={"X-Api-Key": self.heygen_key},
                data=form_data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"HeyGen API error: {error_text}")
                
                data = await response.json()
                video_url = data.get("video_url")
                
                if not video_url:
                    raise Exception("Failed to generate avatar video from HeyGen")
                
                return video_url
    
    async def generate_office_background(self) -> str:
        """
        B-Roll Logic: 使用 Kling AI 生成 5 秒现代化办公室背景
        """
        if not self.kling_key:
            raise ValueError("KLING_KEY not found")
        
        prompt = "Modern office environment, professional workspace, clean and bright, 5 seconds"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.kling_url,
                headers={
                    "Authorization": f"Bearer {self.kling_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "prompt": prompt,
                    "duration": 5,
                    "aspect_ratio": "16:9"
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Kling AI API error: {error_text}")
                
                data = await response.json()
                video_url = data.get("video_url")
                
                if not video_url:
                    raise Exception("Failed to generate background from Kling AI")
                
                return video_url
    
    async def compose_final_video(
        self,
        office_video_url: str,
        avatar_video_url: str,
        company_logo_url: str,
        script: str
    ) -> str:
        """
        Final Editor: 使用 Creatomate API 合成最终视频
        
        Layer 1 (底层): 办公室视频
        Layer 2 (中层): HeyGen 绿幕视频（去背，右下角）
        Layer 3 (顶层): Logo（左上角）+ 动态字幕
        """
        if not self.creatomate_key:
            raise ValueError("CREATOMATE_KEY not found")
        
        # Creatomate JSON 模板
        template = {
            "width": 1920,
            "height": 1080,
            "duration": 50,
            "elements": [
                # Layer 1: 办公室背景视频（底层）
                {
                    "type": "video",
                    "source": office_video_url,
                    "x": "0%",
                    "y": "0%",
                    "width": "100%",
                    "height": "100%",
                    "time": 0,
                    "duration": 50
                },
                # Layer 2: 绿幕视频（中层，右下角，去背）
                {
                    "type": "video",
                    "source": avatar_video_url,
                    "x": "60%",
                    "y": "20%",
                    "width": "35%",
                    "height": "60%",
                    "time": 0,
                    "duration": 50,
                    "chroma_key": {
                        "color": "#00ff00",  # 绿色
                        "tolerance": 0.3
                    }
                },
                # Layer 3: Logo（顶层，左上角）
                {
                    "type": "image",
                    "source": company_logo_url,
                    "x": "5%",
                    "y": "5%",
                    "width": "15%",
                    "height": "auto",
                    "time": 0,
                    "duration": 50
                },
                # Layer 4: 动态字幕（顶层）
                {
                    "type": "text",
                    "text": script,
                    "x": "5%",
                    "y": "75%",
                    "width": "50%",
                    "font_family": "Arial",
                    "font_size": "48px",
                    "font_weight": "bold",
                    "fill_color": "#ffffff",
                    "stroke_color": "#000000",
                    "stroke_width": "2px",
                    "time": 0,
                    "duration": 50,
                    "animations": [
                        {
                            "type": "fade",
                            "start_time": 0,
                            "duration": 1
                        }
                    ]
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.creatomate_url,
                headers={
                    "Authorization": f"Bearer {self.creatomate_key}",
                    "Content-Type": "application/json"
                },
                json={"template": template}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Creatomate API error: {error_text}")
                
                data = await response.json()
                video_url = data.get("url")
                
                if not video_url:
                    raise Exception("Failed to compose final video from Creatomate")
                
                return video_url
    
    def update_job_status(self, job_id: str, status: str, message: str, video_url: Optional[str] = None):
        """更新任务状态"""
        self.job_status[job_id] = {
            "status": status,
            "message": message,
            "video_url": video_url
        }
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """获取任务状态"""
        return self.job_status.get(job_id, {
            "status": "not_found",
            "message": "Job not found"
        })
