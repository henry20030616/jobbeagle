import { NextRequest, NextResponse } from 'next/server';

/**
 * 檢查環境變數設定的 API endpoint
 * 用於確認 Vercel 部署時的環境變數是否正確設定
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  
  const envCheck = {
    // 檢查 Gemini API Key
    geminiApiKey: {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
      suffix: apiKey ? '...' + apiKey.substring(apiKey.length - 10) : 'N/A',
      envVarNames: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
      }
    },
    // 檢查 Supabase
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    // 環境資訊
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'local',
    }
  };

  return NextResponse.json({
    status: 'ok',
    message: apiKey ? '環境變數已設定' : '⚠️ 環境變數未設定',
    checks: envCheck,
    timestamp: new Date().toISOString(),
  });
}
