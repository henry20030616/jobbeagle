'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { Github, Mail, Building2, AlertCircle } from 'lucide-react';

export default function EmployerLoginPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // 检查是否已登录
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      
      // 如果已登录，检查是否是企业会员，如果是则跳转到 Dashboard
      if (user) {
        checkEmployerStatus(user.id);
      }
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkEmployerStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEmployerStatus = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      router.push('/employer/dashboard');
    }
  };

  const handleLogin = async (provider: 'github' | 'google') => {
    try {
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/employer/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(`登录失败: ${error.message}`);
      }
    } catch (err: any) {
      setError(`登录失败: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-white">Job</span><span className="text-blue-400">beagle</span>
            </h1>
            <p className="text-slate-400 text-sm">企业会员登录</p>
            <p className="text-slate-500 text-xs mt-2">与主网站账号互通</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition-colors shadow-lg"
            >
              <Mail className="w-5 h-5" />
              <span>使用 Google 登录</span>
            </button>

            <button
              onClick={() => handleLogin('github')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              <Github className="w-5 h-5" />
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs text-center">
              首次登录将自动创建企业账号
              <br />
              登录后即可上传和管理招聘视频
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
