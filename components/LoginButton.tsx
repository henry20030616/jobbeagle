'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { LogIn, LogOut, User, Github } from 'lucide-react';

const LoginButton: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 獲取當前用戶
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (provider: 'github' | 'google') => {
    try {
      const supabase = createClient();
      
      // 檢查環境變數
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase 環境變數未設定');
        alert('配置錯誤：Supabase 環境變數未設定。請檢查 .env.local 文件。');
        return;
      }

      console.log('🔐 開始登入流程...', {
        provider,
        redirectTo: `${window.location.origin}/auth/callback`,
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ 登入錯誤:', {
          error,
          message: error.message,
          status: error.status,
          provider,
        });
        
        // 提供更友善的錯誤訊息
        let errorMessage = error.message;
        if (error.message?.includes('provider is not enabled') || 
            error.message?.includes('Unsupported provider') ||
            error.status === 400) {
          errorMessage = `${provider === 'google' ? 'Google' : 'GitHub'} 登入尚未啟用。\n\n請按照以下步驟設定：\n\n1. 前往 Supabase Dashboard\n2. 選擇您的專案\n3. 前往 Authentication → Providers\n4. 找到 ${provider === 'google' ? 'Google' : 'GitHub'} 並點擊\n5. 啟用該 Provider\n6. 設定 OAuth 憑證（Client ID 和 Secret）\n\n詳細步驟請參考 GOOGLE_OAUTH_SETUP.md 文件`;
        }
        
        alert(`登入失敗：${errorMessage}`);
      } else if (data) {
        console.log('✅ 登入請求成功，正在跳轉...', data);
        // OAuth 會自動跳轉，不需要手動處理
      }
    } catch (err: any) {
      console.error('❌ 登入時發生例外錯誤:', err);
      alert(`登入時發生錯誤：${err.message || '未知錯誤'}\n\n請檢查瀏覽器控制台以獲取更多信息。`);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('登出錯誤:', error);
      alert('登出失敗：' + error.message);
    } else {
      setUser(null);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">載入中...</span>
      </div>
    );
  }

  if (user) {
    // 獲取用戶頭像（優先使用 avatar_url，否則使用 user_metadata 中的頭像）
    const avatarUrl = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     user.app_metadata?.avatar_url;
    const displayName = user.user_metadata?.name || 
                       user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 
                       '用戶';
    const displayEmail = user.email || '';

    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-slate-300 group relative">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName}
              className="w-8 h-8 rounded-full border-2 border-slate-600 object-cover hover:border-indigo-500 transition-colors"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-slate-600 hover:border-indigo-500 transition-colors">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{displayName}</span>
            {displayEmail && (
              <span className="text-xs text-slate-400">{displayEmail}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>登出</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLogin('github')}
        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium border border-slate-600"
      >
        <Github className="w-4 h-4" />
        <span>GitHub</span>
      </button>
      <button
        onClick={() => handleLogin('google')}
        className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium border border-gray-300"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Google</span>
      </button>
    </div>
  );
};

export default LoginButton;
