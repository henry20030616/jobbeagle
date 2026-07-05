import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureProfile } from '@/lib/profiles';
import { recordReferral } from '@/lib/referrals';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const referralCode = requestUrl.searchParams.get('ref');
  const origin = requestUrl.origin;

  if (error) {
    console.error('❌ OAuth 回調錯誤:', { error, errorDescription });
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
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ 交換 session 時發生錯誤:', exchangeError);
        const errorUrl = new URL(`${origin}/`);
        errorUrl.searchParams.set('auth_error', 'session_exchange_failed');
        errorUrl.searchParams.set('error_description', exchangeError.message);
        return NextResponse.redirect(errorUrl.toString());
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = getSupabaseAdmin();
        if (admin) {
          await ensureProfile(admin, user.id, {
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
          });
          if (referralCode) {
            await recordReferral(admin, user.id, referralCode);
          }
        }
      }

      console.log('✅ Session 交換成功');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      console.error('❌ 處理回調時發生例外:', err);
      const errorUrl = new URL(`${origin}/`);
      errorUrl.searchParams.set('auth_error', 'callback_exception');
      errorUrl.searchParams.set('error_description', message);
      return NextResponse.redirect(errorUrl.toString());
    }
  } else {
    console.warn('⚠️ 回調 URL 中沒有 code 參數');
  }

  const redirectTo = requestUrl.searchParams.get('redirect');
  const loginType = requestUrl.searchParams.get('type');

  if (!redirectTo) {
    return NextResponse.redirect(`${origin}/`);
  }

  const target = new URL(redirectTo, origin);
  if (redirectTo.includes('/shorts')) {
    if (loginType === 'employer') {
      target.searchParams.set('shorts_view', 'company');
      target.searchParams.set('account_role', 'employer');
      target.searchParams.set('open_profile', '1');
    } else if (loginType === 'talent') {
      target.searchParams.set('shorts_view', 'personal');
      target.searchParams.set('account_role', 'talent');
    }
  }
  if (loginType === 'employer' && redirectTo.includes('/employer')) {
    target.searchParams.set('account_role', 'employer');
  }

  return NextResponse.redirect(target.toString());
}
