'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { Mail, Building2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { BrandWordmark } from '@/components/BrandLogo';

const EL = {
  en: { title: 'Employer Login', sub: 'Unified account with the main site', desc: 'First login automatically creates your employer account.\nAfter login you can upload and manage recruitment videos.', btn: 'Sign in with Google', back: '← Back to Home', loading: 'Loading…', errLogin: 'Login error: ' },
  'zh-TW': { title: '企業會員登入', sub: '與主網站帳號互通', desc: '首次登入將自動建立企業帳號\n登入後即可上傳和管理招聘影片', btn: '使用 Google 登入', back: '← 返回首頁', loading: '載入中…', errLogin: '登入失敗：' },
  'zh-CN': { title: '企业会员登录', sub: '与主网站账号互通', desc: '首次登录将自动建立企业账号\n登录后即可上传和管理招聘视频', btn: '使用 Google 登录', back: '← 返回首页', loading: '加载中…', errLogin: '登录失败：' },
  es: { title: 'Acceso para empleadores', sub: 'Cuenta unificada con el sitio principal', desc: 'El primer inicio de sesión crea automáticamente tu cuenta.\nDespués podrás subir y gestionar videos de empleo.', btn: 'Iniciar sesión con Google', back: '← Volver al inicio', loading: 'Cargando…', errLogin: 'Error de inicio de sesión: ' },
  hi: { title: 'नियोक्ता लॉगिन', sub: 'मुख्य साइट के साथ एकीकृत खाता', desc: 'पहली बार लॉगिन करने पर स्वचालित रूप से खाता बनाया जाता है।\nलॉगिन के बाद भर्ती वीडियो अपलोड और प्रबंधित करें।', btn: 'Google से साइन इन करें', back: '← होम पर वापस', loading: 'लोड हो रहा है…', errLogin: 'लॉगिन त्रुटि: ' },
  ar: { title: 'تسجيل دخول صاحب العمل', sub: 'حساب موحد مع الموقع الرئيسي', desc: 'تسجيل الدخول لأول مرة ينشئ حسابك تلقائياً.\nبعد الدخول يمكنك رفع وإدارة فيديوهات التوظيف.', btn: 'تسجيل الدخول بـ Google', back: '← العودة للرئيسية', loading: 'جارٍ التحميل…', errLogin: 'خطأ في تسجيل الدخول: ' },
} as const;

export default function EmployerLoginPage() {
  const { language: appLanguage } = useLanguage();
  const tl = EL[appLanguage] ?? EL.en;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // 檢查是否已登入
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      
      // 如果已登入，檢查是否為企業會員，如果是則跳轉到 Dashboard
      if (user) {
        checkEmployerStatus(user.id);
      }
    });

    // 監聽認證狀態變化
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

  const checkEmployerStatus = async (_userId: string) => {
    // Dashboard auto-creates company_profile on first visit
    router.push('/shorts?shorts_view=company&open_profile=1');
  };

  const handleLogin = async () => {
    try {
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=employer`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(tl.errLogin + error.message);
      }
    } catch (err: any) {
      setError(tl.errLogin + (err.message || ''));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">{tl.loading}</div>
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
              <BrandWordmark />
            </h1>
            <p className="text-slate-400 text-sm">{tl.title}</p>
            <p className="text-slate-500 text-xs mt-2">{tl.sub}</p>
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
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition-colors shadow-lg"
            >
              <Mail className="w-5 h-5" />
              <span>{tl.btn}</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs text-center whitespace-pre-line">
              {tl.desc}
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              {tl.back}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
