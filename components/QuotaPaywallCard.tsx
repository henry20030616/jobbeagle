'use client';

import React, { useEffect, useId, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { startCheckout } from '@/lib/checkout-client';
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import type { AppLanguage } from '@/lib/language-context';
import { HOMEPAGE_TITLE_TYPE } from '@/constants/report-frame';
import CenterModalShell from '@/components/CenterModalShell';
import { LogIn, Sparkles, Loader2 } from 'lucide-react';

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
  unlockPaypal: string;
  checkoutError: string;
  loggingIn: string;
  couponLabel: string;
  close: string;
};

const copy: Record<AppLanguage, PaywallCopy> = {
  'zh-TW': {
    thanks: '感謝您使用 JobBeagle！',
    subtitle: '您的終身 3 次適配快照額度已用完。訂閱可解鎖每月 50 次適配快照 + 5 次面試指南。',
    loginHint: '請先 Google 登入 — 免登入僅 1 次完整適配快照；註冊再送 3 次終身額度。',
    loginBtn: 'Google 登入',
    singleLite: '適配快照 · $9.99',
    singleFull: '面試指南 · $14.99（更深分析＋更準落點）',
    standard: '標準版 · $19.99/月',
    advanced: '高級版 · $39.99/月',
    footnote: '免費額度為終身固定，不會每日重置',
    unlockPaypal: '用 PayPal 解鎖面試指南：更專業分析、更準個人薪資落點／TC，外加 H-1B 與 20 題真題。',
    checkoutError: '無法啟動付款，請稍後再試。',
    loggingIn: '正在跳轉登入…',
    couponLabel: '優惠碼（選填，僅單次快照／指南）',
    close: '關閉',
  },
  'zh-CN': {
    thanks: '感谢您使用 JobBeagle！',
    subtitle: '您的终身 3 次适配快照额度已用完。订阅可解锁每月 50 次适配快照 + 5 次面试指南。',
    loginHint: '请先 Google 登录 — 免登录仅 1 次完整适配快照；注册再送 3 次终身额度。',
    loginBtn: 'Google 登录',
    singleLite: '适配快照 · $9.99',
    singleFull: '面试指南 · $14.99（更深分析＋更准落点）',
    standard: '标准版 · $19.99/月',
    advanced: '高级版 · $39.99/月',
    footnote: '免费额度为终身固定，不会每日重置',
    unlockPaypal: '用 PayPal 解锁面试指南：更专业分析、更准个人薪资落点／TC，外加 H-1B 与 20 题真题。',
    checkoutError: '无法启动付款，请稍后再试。',
    loggingIn: '正在跳转登录…',
    couponLabel: '优惠码（选填，仅单次快照／指南）',
    close: '关闭',
  },
  en: {
    thanks: 'Thanks for using JobBeagle!',
    subtitle: 'Your lifetime 3 Fit Snapshot credits are used up. Subscribe for 50 Fit Snapshot + 5 Interview Guide reports per month.',
    loginHint: 'Sign in with Google — guests get 1 full Fit Snapshot; signup adds 3 lifetime credits.',
    loginBtn: 'Sign in with Google',
    singleLite: 'Fit Snapshot · $9.99',
    singleFull: 'Interview Guide · $14.99 (deeper + more accurate pay)',
    standard: 'Standard · $19.99/mo',
    advanced: 'Advanced · $39.99/mo',
    footnote: 'Free credits are lifetime-fixed — no daily reset',
    unlockPaypal: 'Unlock Interview Guide with PayPal: deeper analysis, a more accurate personal pay landing + TC, plus H-1B and 20 questions.',
    checkoutError: 'Could not start checkout.',
    loggingIn: 'Redirecting to sign in…',
    couponLabel: 'Coupon (optional — Snapshot / Guide one-time only)',
    close: 'Close',
  },
  es: {
    thanks: '¡Gracias por usar JobBeagle!',
    subtitle: 'Has agotado tus 3 créditos Fit Snapshot de por vida. Suscríbete para 50 Fit Snapshot + 5 Interview Guide al mes.',
    loginHint: 'Inicia sesión con Google — 3 análisis Fit Snapshot gratis al registrarte.',
    loginBtn: 'Iniciar sesión con Google',
    singleLite: 'Fit Snapshot · $9.99',
    singleFull: 'Interview Guide · $14.99 (más preciso en salario)',
    standard: 'Estándar · $19.99/mes',
    advanced: 'Avanzado · $39.99/mes',
    footnote: 'Los créditos gratis son de por vida',
    unlockPaypal: 'Desbloquea Interview Guide con PayPal: análisis más profundo, aterrizaje salarial personal más preciso + TC, H-1B y 20 preguntas.',
    checkoutError: 'No se pudo iniciar el pago.',
    loggingIn: 'Redirigiendo…',
    couponLabel: 'Cupón (opcional — solo Snapshot / Guide únicos)',
    close: 'Cerrar',
  },
  hi: {
    thanks: 'JobBeagle उपयोग के लिए धन्यवाद!',
    subtitle: 'आपके जीवनभर के 3 Fit Snapshot क्रेडिट समाप्त। सदस्यता लें।',
    loginHint: 'Google से साइन इन करें।',
    loginBtn: 'Google से साइन इन',
    singleLite: 'Fit Snapshot · $9.99',
    singleFull: 'Interview Guide · $14.99 (ज़्यादा सटीक वेतन)',
    standard: 'Standard · $19.99/mo',
    advanced: 'Advanced · $39.99/mo',
    footnote: 'मुफ़्त क्रेडिट जीवनभर के लिए',
    unlockPaypal: 'PayPal से Interview Guide: गहरा विश्लेषण, ज़्यादा सटीक व्यक्तिगत वेतन लैंडिंग + TC, H-1B और 20 प्रश्न।',
    checkoutError: 'चेकआउट शुरू नहीं हो सका।',
    loggingIn: 'साइन इन…',
    couponLabel: 'कूपन (वैकल्पिक — केवल एकमुश्त Snapshot / Guide)',
    close: 'बंद करें',
  },
  ar: {
    thanks: 'شكرًا لاستخدام JobBeagle!',
    subtitle: 'لقد استنفدت رصيد Snapshot المجاني (3). اشترك للمزيد.',
    loginHint: 'سجّل الدخول عبر Google.',
    loginBtn: 'تسجيل الدخول عبر Google',
    singleLite: 'Fit Snapshot · $9.99',
    singleFull: 'Interview Guide · $14.99 (deeper + more accurate pay)',
    standard: 'قياسي · $19.99/شهر',
    advanced: 'متقدم · $39.99/شهر',
    footnote: 'الرصيد المجاني مدى الحياة',
    unlockPaypal: 'Unlock Interview Guide with PayPal: deeper analysis, a more accurate personal pay landing + TC, plus H-1B and 20 questions.',
    checkoutError: 'تعذر بدء الدفع.',
    loggingIn: 'جارٍ التحويل…',
    couponLabel: 'قسيمة (اختياري — Snapshot / Guide لمرة واحدة)',
    close: 'إغلاق',
  },
};

const PLANS: Array<{
  type: CheckoutPlanType;
  labelKey: keyof Pick<PaywallCopy, 'singleLite' | 'singleFull' | 'standard' | 'advanced'>;
  primary?: boolean;
}> = [
  { type: 'single_job_fit_snapshot', labelKey: 'singleLite' },
  { type: 'single_interview_strategy_guide', labelKey: 'singleFull' },
  { type: 'standard_subscription', labelKey: 'standard', primary: true },
  { type: 'advanced_subscription', labelKey: 'advanced' },
];

const MODAL_TITLE = `${HOMEPAGE_TITLE_TYPE} font-bold leading-snug text-white`;
const MODAL_BODY =
  'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium leading-snug text-slate-200';

export default function QuotaPaywallCard({
  language,
  message,
  isLoggedIn,
  onDismiss,
}: QuotaPaywallCardProps) {
  const t = copy[language] ?? copy.en;
  const [busy, setBusy] = useState<CheckoutPlanType | 'login' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.paywallView, {
      item_list_id: 'paywall',
      item_list_name: 'Quota paywall',
      logged_in: isLoggedIn,
    });
  }, [isLoggedIn]);

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
    const oneTime =
      planType === 'single_job_fit_snapshot' || planType === 'single_interview_strategy_guide';
    const result = await startCheckout(
      planType,
      undefined,
      undefined,
      oneTime ? couponCode : undefined,
    );
    if (!result.ok) {
      setErr(result.error);
      setBusy(null);
    }
  };

  return (
    <CenterModalShell
      onDismiss={onDismiss}
      labelledBy={titleId}
      describedBy={bodyId}
      closeLabel={t.close}
    >
      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
          <div className="space-y-3 p-6 blur-md">
            <div className="h-4 w-1/3 rounded bg-indigo-400/40" />
            <div className="h-16 rounded-xl border border-zinc-700 bg-zinc-900" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 rounded bg-emerald-500/30" />
              <div className="h-10 rounded bg-amber-400/30" />
              <div className="h-10 rounded bg-indigo-400/30" />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 sm:h-16 sm:w-16">
              <Sparkles className="h-8 w-8 text-indigo-300 sm:h-9 sm:w-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className={MODAL_TITLE}>
                {t.thanks}
              </h3>
              <p id={bodyId} className={`mt-3 ${MODAL_BODY}`}>
                {message || t.subtitle}
              </p>
              <p className={`mt-3 ${MODAL_BODY} font-semibold text-indigo-200`}>
                {t.unlockPaypal}
              </p>
              {!isLoggedIn && (
                <p className={`mt-3 ${MODAL_BODY} text-amber-200`}>{t.loginHint}</p>
              )}
            </div>
          </div>

          {isLoggedIn ? (
            <label className="mt-6 flex flex-col gap-2">
              <span className={`${HOMEPAGE_TITLE_TYPE} text-slate-400`}>{t.couponLabel}</span>
              <input
                type="text"
                value={couponCode}
                disabled={busy != null}
                onChange={(e) => setCouponCode(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className={`rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 ${HOMEPAGE_TITLE_TYPE} text-slate-100`}
              />
            </label>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogin}
                disabled={busy === 'login'}
                className={`sm:col-span-2 inline-flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 ${HOMEPAGE_TITLE_TYPE} font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60`}
              >
                {busy === 'login' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <LogIn className="h-6 w-6" />
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

          <p className={`mt-5 text-center ${MODAL_BODY} text-slate-500`}>{t.footnote}</p>
          {err ? (
            <p className={`mt-3 text-center ${MODAL_BODY} text-red-400`}>
              {err || t.checkoutError}
            </p>
          ) : null}
        </div>
      </div>
    </CenterModalShell>
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
  const base = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 ${HOMEPAGE_TITLE_TYPE} font-semibold disabled:opacity-60`;
  const styles =
    variant === 'primary'
      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
      : 'border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-700';

  return (
    <button type="button" onClick={onClick} disabled={loading} className={`${base} ${styles}`}>
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      {label}
    </button>
  );
}
