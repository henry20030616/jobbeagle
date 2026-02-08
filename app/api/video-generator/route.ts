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
    const response = await fetch(`${PYTHON_API_URL}/generate-recruitment-video`, {
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
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.detail || 'Video generation failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Video generator API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
