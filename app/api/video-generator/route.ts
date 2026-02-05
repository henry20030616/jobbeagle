import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_description, company_logo_url, office_video_url, manager_photo_url } = body;

    // 验证必填字段
    if (!job_description || !company_logo_url || !manager_photo_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 调用 Python FastAPI
    let response: Response;
    try {
      response = await fetch(`${PYTHON_API_URL}/generate-recruitment-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description,
          company_logo_url,
          office_video_url: office_video_url || null,
          manager_photo_url,
        }),
        // 添加超時設置
        signal: AbortSignal.timeout(30000), // 30秒超時
      });
    } catch (fetchError: any) {
      // 捕獲網絡錯誤
      console.error('Failed to connect to Python API:', fetchError);
      
      // 檢查是否是連接錯誤
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('fetch')) {
        return NextResponse.json(
          { 
            error: '無法連接到影片生成服務。請確認 Python FastAPI 後端服務已啟動，或聯繫管理員。',
            details: `嘗試連接到: ${PYTHON_API_URL}`
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: '影片生成服務暫時無法使用',
          details: fetchError.message || '未知錯誤'
        },
        { status: 503 }
      );
    }

    // 嘗試解析 JSON 響應
    let result: any;
    try {
      result = await response.json();
    } catch (jsonError) {
      // 如果響應不是 JSON，返回原始文本
      const text = await response.text();
      return NextResponse.json(
        { 
          error: '影片生成服務返回了無效的響應',
          details: text.substring(0, 200)
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: result.detail || result.error || '影片生成失敗',
          details: result.message || ''
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Video generator API error:', error);
    return NextResponse.json(
      { 
        error: '影片生成過程中發生錯誤',
        details: error.message || '未知錯誤'
      },
      { status: 500 }
    );
  }
}
