import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // 處理 OAuth 錯誤
  if (error) {
    console.error('❌ OAuth 回調錯誤:', {
      error,
      errorDescription,
      url: requestUrl.toString(),
    });
    
    // 重定向到首頁並顯示錯誤
    const errorUrl = new URL(`${origin}/`);
    errorUrl.searchParams.set('auth_error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(errorUrl.toString());
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('❌ 交換 session 時發生錯誤:', exchangeError);
        const errorUrl = new URL(`${origin}/`);
        errorUrl.searchParams.set('auth_error', 'session_exchange_failed');
        errorUrl.searchParams.set('error_description', exchangeError.message);
        return NextResponse.redirect(errorUrl.toString());
      }

      console.log('✅ Session 交換成功');
    } catch (err: any) {
      console.error('❌ 處理回調時發生例外:', err);
      const errorUrl = new URL(`${origin}/`);
      errorUrl.searchParams.set('auth_error', 'callback_exception');
      errorUrl.searchParams.set('error_description', err.message || '未知錯誤');
      return NextResponse.redirect(errorUrl.toString());
    }
  } else {
    console.warn('⚠️ 回調 URL 中沒有 code 參數');
  }

  // URL to redirect to after sign in process completes
  // 检查是否有重定向参数（用于企业登录）
  const redirectTo = requestUrl.searchParams.get('redirect');
  const finalRedirect = redirectTo ? `${origin}${redirectTo}` : `${origin}/`;
  return NextResponse.redirect(finalRedirect);
}
