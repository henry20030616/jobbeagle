'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { startCheckout } from '@/lib/checkout-client';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import type { AppLanguage } from '@/lib/language-context';
import { LogIn, Sparkles, X, Loader2 } from 'lucide-react';

interface QuotaPaywallCardProps {
  language: AppLanguage;
  message?: string;
  isLoggedIn: boolean;
  reportId?: string | null;
  onDismiss: () => void;
}

const copy: Record<
  AppLanguage,
  {
    thanks: string;
    subtitle: string;
    loginHint: string;
    loginBtn: string;
    extra: string;
    premium: string;
    monthly: string;
    tomorrow: string;
    checkoutError: string;
    loggingIn: string;
  }
> = {
  'zh-TW': {
    thanks: '感謝您使用 JobBeagle！',
    subtitle: '您今日的 2 次免費分析已用完。登入可永久保存報告；付費可解鎖進階面試策略與薪資談判建議。',
    loginHint: '訪客報告關閉分頁後將消失 — 登入即可雲端永久保存。',
    loginBtn: 'Google 登入（免費保存報告）',
    extra: '再加 1 次分析 · $3',
    premium: '解鎖本報告進階內容 · $4.99',
    monthly: '月費專業版 · $8.99/月',
    tomorrow: '或明天再來使用免費額度',
    checkoutError: '無法啟動付款，請稍後再試或先登入。',
    loggingIn: '正在跳轉登入…',
  },
  'zh-CN': {
    thanks: '感谢您使用 JobBeagle！',
    subtitle: '您今日的 2 次免费分析已用完。登录可永久保存报告；付费可解锁进阶面试策略与薪资谈判建议。',
    loginHint: '访客报告关闭分页后将消失 — 登录即可云端永久保存。',
    loginBtn: 'Google 登录（免费保存报告）',
    extra: '再加 1 次分析 · $3',
    premium: '解锁本报告进阶内容 · $4.99',
    monthly: '月费专业版 · $8.99/月',
    tomorrow: '或明天再来使用免费额度',
    checkoutError: '无法启动付款，请稍后再试或先登录。',
    loggingIn: '正在跳转登录…',
  },
  en: {
    thanks: 'Thanks for using JobBeagle!',
    subtitle: 'You\'ve used today\'s 2 free analyses. Log in to save reports forever, or pay to unlock interview prep & salary strategy.',
    loginHint: 'Guest reports vanish when you close the tab — log in for free cloud storage.',
    loginBtn: 'Sign in with Google (save reports free)',
    extra: 'One more analysis · $3',
    premium: 'Unlock premium on this report · $4.99',
    monthly: 'Monthly Pro · $8.99/mo',
    tomorrow: 'Or come back tomorrow for free credits',
    checkoutError: 'Could not start checkout. Please log in and try again.',
    loggingIn: 'Redirecting to sign in…',
  },
  es: {
    thanks: '¡Gracias por usar JobBeagle!',
    subtitle: 'Has usado tus 2 análisis gratuitos de hoy. Inicia sesión para guardar informes o paga para desbloquear contenido premium.',
    loginHint: 'Los informes de invitado desaparecen al cerrar la pestaña.',
    loginBtn: 'Iniciar sesión con Google',
    extra: 'Un análisis más · $3',
    premium: 'Desbloquear informe premium · $4.99',
    monthly: 'Pro mensual · $8.99/mes',
    tomorrow: 'O vuelve mañana',
    checkoutError: 'No se pudo iniciar el pago.',
    loggingIn: 'Redirigiendo…',
  },
  hi: {
    thanks: 'JobBeagle उपयोग के लिए धन्यवाद!',
    subtitle: 'आज के 2 मुफ़्त विश्लेषण समाप्त। लॉग इन करें या प्रीमियम अनलॉक करें।',
    loginHint: 'अतिथि रिपोर्ट टैब बंद करने पर गायब हो जाती है।',
    loginBtn: 'Google से साइन इन',
    extra: 'एक और विश्लेषण · $3',
    premium: 'प्रीमियम रिपोर्ट · $4.99',
    monthly: 'मासिक Pro · $8.99',
    tomorrow: 'या कल फिर आएं',
    checkoutError: 'चेकआउट शुरू नहीं हो सका।',
    loggingIn: 'साइन इन…',
  },
  ar: {
    thanks: 'شكرًا لاستخدام JobBeagle!',
    subtitle: 'لقد استخدمت تحليلين مجانيين اليوم. سجّل الدخول أو ادفع لفتح المحتوى المتقدم.',
    loginHint: 'تقارير الزوار تختفي عند إغلاق التبويب.',
    loginBtn: 'تسجيل الدخول عبر Google',
    extra: 'تحليل إضافي · $3',
    premium: 'فتح التقرير المتقدم · $4.99',
    monthly: 'اشتراك شهري · $8.99',
    tomorrow: 'أو عد غدًا',
    checkoutError: 'تعذر بدء الدفع.',
    loggingIn: 'جارٍ التحويل…',
  },
};

export default function QuotaPaywallCard({
  language,
  message,
  isLoggedIn,
  reportId,
  onDismiss,
}: QuotaPaywallCardProps) {
  const t = copy[language] ?? copy.en;
  const [busy, setBusy] = useState<CheckoutPlanType | 'login' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async () => {
    setBusy('login');
    setErr(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setErr(error.message);
    } finally {
      setBusy(null);
    }
  };

  const handleCheckout = async (planType: CheckoutPlanType) => {
    if (!isLoggedIn) {
      await handleLogin();
      return;
    }
    setBusy(planType);
    setErr(null);
    const result = await startCheckout(
      planType,
      planType === 'premium_report' ? reportId : undefined,
    );
    if (!result.ok) {
      setErr(result.error);
      setBusy(null);
    }
  };

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 p-6 shadow-xl shadow-indigo-900/20">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-4 text-slate-400 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
          <Sparkles className="h-6 w-6 text-indigo-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{t.thanks}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {message || t.subtitle}
          </p>
          {!isLoggedIn && (
            <p className="mt-2 text-xs text-amber-200/90">{t.loginHint}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogin}
            disabled={busy === 'login'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          >
            {busy === 'login' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {busy === 'login' ? t.loggingIn : t.loginBtn}
          </button>
        ) : (
          <>
            <CheckoutBtn
              label={t.extra}
              loading={busy === 'basic_overage'}
              onClick={() => handleCheckout('basic_overage')}
            />
            {reportId && (
              <CheckoutBtn
                label={t.premium}
                loading={busy === 'premium_report'}
                onClick={() => handleCheckout('premium_report')}
                variant="primary"
              />
            )}
            <CheckoutBtn
              label={t.monthly}
              loading={busy === 'monthly_subscription'}
              onClick={() => handleCheckout('monthly_subscription')}
            />
          </>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">{t.tomorrow}</p>

      {(err) && (
        <p className="mt-3 text-center text-xs text-red-400">{err}</p>
      )}
    </div>
  );
}

function CheckoutBtn({
  label,
  loading,
  onClick,
  variant = 'secondary',
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 min-w-[140px]';
  const styles =
    variant === 'primary'
      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
      : 'border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-700';

  return (
    <button type="button" onClick={onClick} disabled={loading} className={`${base} ${styles}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}
