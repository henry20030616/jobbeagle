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
  onDismiss: () => void;
}

type PaywallCopy = {
  thanks: string;
  subtitle: string;
  loginHint: string;
  loginBtn: string;
  singleLite: string;
  singleFull: string;
  standard: string;
  advanced: string;
  footnote: string;
  checkoutError: string;
  loggingIn: string;
};

const copy: Record<AppLanguage, PaywallCopy> = {
  'zh-TW': {
    thanks: '感謝您使用 JobBeagle！',
    subtitle: '您的終身 3 次 Job Fit Snapshot 額度已用完。訂閱可解鎖每月 100 Snapshot + 5 Interview Strategy Guide。',
    loginHint: '請先 Google 登入 — 註冊即送 3 次 Job Fit Snapshot。',
    loginBtn: 'Google 登入',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: '標準版 · $19.99/月',
    advanced: '高級版 · $39.99/月',
    footnote: '免費額度為終身固定，不會每日重置',
    checkoutError: '無法啟動付款，請稍後再試。',
    loggingIn: '正在跳轉登入…',
  },
  'zh-CN': {
    thanks: '感谢您使用 JobBeagle！',
    subtitle: '您的终身 3 次 Job Fit Snapshot 额度已用完。订阅可解锁每月 100 Snapshot + 5 Interview Strategy Guide。',
    loginHint: '请先 Google 登录 — 注册即送 3 次 Job Fit Snapshot。',
    loginBtn: 'Google 登录',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: '标准版 · $19.99/月',
    advanced: '高级版 · $39.99/月',
    footnote: '免费额度为终身固定，不会每日重置',
    checkoutError: '无法启动付款，请稍后再试。',
    loggingIn: '正在跳转登录…',
  },
  en: {
    thanks: 'Thanks for using JobBeagle!',
    subtitle: 'Your lifetime 3 Job Fit Snapshot credits are used up. Subscribe for 100 Snapshot + 5 Interview Strategy Guide reports per month.',
    loginHint: 'Sign in with Google — 3 free Job Fit Snapshot analyses on signup.',
    loginBtn: 'Sign in with Google',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: 'Standard · $19.99/mo',
    advanced: 'Advanced · $39.99/mo',
    footnote: 'Free credits are lifetime-fixed — no daily reset',
    checkoutError: 'Could not start checkout.',
    loggingIn: 'Redirecting to sign in…',
  },
  es: {
    thanks: '¡Gracias por usar JobBeagle!',
    subtitle: 'Has agotado tus 3 créditos Job Fit Snapshot de por vida. Suscríbete para 100 Snapshot + 5 Strategy Guide al mes.',
    loginHint: 'Inicia sesión con Google — 3 análisis Job Fit Snapshot gratis al registrarte.',
    loginBtn: 'Iniciar sesión con Google',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: 'Estándar · $19.99/mes',
    advanced: 'Avanzado · $39.99/mes',
    footnote: 'Los créditos gratis son de por vida',
    checkoutError: 'No se pudo iniciar el pago.',
    loggingIn: 'Redirigiendo…',
  },
  hi: {
    thanks: 'JobBeagle उपयोग के लिए धन्यवाद!',
    subtitle: 'आपके जीवनभर के 3 Job Fit Snapshot क्रेडिट समाप्त। सदस्यता लें।',
    loginHint: 'Google से साइन इन करें।',
    loginBtn: 'Google से साइन इन',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: 'Standard · $19.99/mo',
    advanced: 'Advanced · $39.99/mo',
    footnote: 'मुफ़्त क्रेडिट जीवनभर के लिए',
    checkoutError: 'चेकआउट शुरू नहीं हो सका।',
    loggingIn: 'साइन इन…',
  },
  ar: {
    thanks: 'شكرًا لاستخدام JobBeagle!',
    subtitle: 'لقد استنفدت رصيد Snapshot المجاني (3). اشترك للمزيد.',
    loginHint: 'سجّل الدخول عبر Google.',
    loginBtn: 'تسجيل الدخول عبر Google',
    singleLite: 'Job Fit Snapshot · $3',
    singleFull: 'Interview Strategy Guide · $9.99',
    standard: 'قياسي · $19.99/شهر',
    advanced: 'متقدم · $39.99/شهر',
    footnote: 'الرصيد المجاني مدى الحياة',
    checkoutError: 'تعذر بدء الدفع.',
    loggingIn: 'جارٍ التحويل…',
  },
};

const PLANS: Array<{ type: CheckoutPlanType; labelKey: keyof Pick<PaywallCopy, 'singleLite' | 'singleFull' | 'standard' | 'advanced'>; primary?: boolean }> = [
  { type: 'single_job_fit_snapshot', labelKey: 'singleLite' },
  { type: 'single_interview_strategy_guide', labelKey: 'singleFull' },
  { type: 'standard_subscription', labelKey: 'standard', primary: true },
  { type: 'advanced_subscription', labelKey: 'advanced' },
];

export default function QuotaPaywallCard({
  language,
  message,
  isLoggedIn,
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
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      callbackUrl.searchParams.set('redirect', window.location.pathname);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
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
    const result = await startCheckout(planType);
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

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogin}
            disabled={busy === 'login'}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          >
            {busy === 'login' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {busy === 'login' ? t.loggingIn : t.loginBtn}
          </button>
        ) : (
          PLANS.map(({ type, labelKey, primary }) => (
            <CheckoutBtn
              key={type}
              label={t[labelKey]}
              loading={busy === type}
              onClick={() => handleCheckout(type)}
              variant={primary ? 'primary' : 'secondary'}
            />
          ))
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">{t.footnote}</p>

      {err && <p className="mt-3 text-center text-xs text-red-400">{err}</p>}
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
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60';
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
