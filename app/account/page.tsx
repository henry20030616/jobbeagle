'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Gift,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useLanguage, type AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import ReferralCard from '@/components/ReferralCard';
import BrandLogo from '@/components/BrandLogo';
import CreditsBadge from '@/components/CreditsBadge';
import { startCheckout } from '@/lib/checkout-client';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  CHECKOUT_PLANS,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import type { CareerContext, MembershipTier, UserProfile } from '@/types';
import CareerContextForm from '@/components/CareerContextForm';

type AccountOrder = {
  id: string;
  plan_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

type AccountReferral = {
  id: string;
  referee_id: string;
  is_activated: boolean;
  created_at: string;
};

type AccountPayload = {
  email: string | null;
  profile: {
    id: string;
    full_name: string | null;
    membership_tier: string;
    available_job_fit_snapshot_credits: number;
    available_interview_strategy_guide_credits: number;
    referral_code: string | null;
    deactivated_at: string | null;
    career_context?: CareerContext | null;
  };
  orders: AccountOrder[];
  referrals: AccountReferral[];
  referral_activated_count: number;
  referral_earned_snapshot_credits: number;
};

const copy: Record<
  AppLanguage,
  {
    title: string;
    back: string;
    needLogin: string;
    overview: string;
    email: string;
    tier: string;
    snapshotCredits: string;
    strategyCredits: string;
    remainingCredits: string;
    statusActive: string;
    statusDeactivated: string;
    subscription: string;
    subscriptionNote: string;
    buy: string;
    buying: string;
    syncSub: string;
    syncing: string;
    syncOk: string;
    syncNone: string;
    billing: string;
    billingEmpty: string;
    date: string;
    plan: string;
    amount: string;
    status: string;
    referrals: string;
    earned: string;
    referralEmpty: string;
    activated: string;
    pending: string;
    danger: string;
    deactivate: string;
    deactivateHint: string;
    reactivate: string;
    reactivateHint: string;
    deleteHint: string;
    confirmDeactivate: string;
    loadError: string;
    actionError: string;
  }
> = {
  en: {
    title: 'Account management',
    back: 'Back to home',
    needLogin: 'Sign in to manage your account.',
    overview: 'Overview',
    email: 'Email',
    tier: 'Membership',
    snapshotCredits: 'Job Fit Snapshot credits',
    strategyCredits: 'Interview Strategy Guide credits',
    remainingCredits: 'Remaining credits',
    statusActive: 'Active',
    statusDeactivated: 'Deactivated',
    subscription: 'Subscription & credits',
    subscriptionNote:
      'Buy or upgrade below. To cancel a Lemon Squeezy subscription, use the link in your order receipt email until a customer portal is available.',
    buy: 'Buy',
    buying: 'Redirecting…',
    syncSub: 'Sync subscription credits',
    syncing: 'Syncing…',
    syncOk: 'Subscription synced — monthly credits refreshed.',
    syncNone: 'No active Standard/Advanced subscription found for this email.',
    billing: 'Billing history',
    billingEmpty: 'No orders yet.',
    date: 'Date',
    plan: 'Plan',
    amount: 'Amount',
    status: 'Status',
    referrals: 'Referrals',
    earned: 'Earned Snapshot credits from referrals',
    referralEmpty: 'No referrals yet.',
    activated: 'Activated',
    pending: 'Pending',
    danger: 'Danger zone',
    deactivate: 'Deactivate account',
    deactivateHint:
      'Temporarily pause analyze and checkout. Your data stays; you can reactivate anytime.',
    reactivate: 'Reactivate account',
    reactivateHint: 'Restore access to analyze and checkout.',
    deleteHint: 'Permanently erase your account and all reports (CCPA). Cannot be undone.',
    confirmDeactivate: 'Deactivate your account? You can reactivate later from this page.',
    loadError: 'Could not load account.',
    actionError: 'Something went wrong. Try again.',
  },
  'zh-TW': {
    title: '帳戶管理',
    back: '返回首頁',
    needLogin: '請登入以管理帳戶。',
    overview: '總覽',
    email: '信箱',
    tier: '會員等級',
    snapshotCredits: 'Job Fit Snapshot 額度',
    strategyCredits: 'Interview Strategy Guide 額度',
    remainingCredits: '剩餘額度',
    statusActive: '啟用中',
    statusDeactivated: '已停用',
    subscription: '訂閱與額度',
    subscriptionNote:
      '可在下方購買或升級。若需取消 Lemon Squeezy 訂閱，請先使用訂單確認信中的連結；客戶入口稍後會開放。',
    buy: '購買',
    buying: '跳轉中…',
    syncSub: '同步訂閱額度',
    syncing: '同步中…',
    syncOk: '已同步訂閱，月額度已刷新。',
    syncNone: '此信箱沒有進行中的 Standard／Advanced 訂閱。',
    billing: '帳單紀錄',
    billingEmpty: '尚無訂單。',
    date: '日期',
    plan: '方案',
    amount: '金額',
    status: '狀態',
    referrals: '推薦紀錄',
    earned: '推薦已賺取的 Snapshot 額度',
    referralEmpty: '尚無推薦。',
    activated: '已啟動',
    pending: '待完成',
    danger: '危險操作',
    deactivate: '停用帳戶',
    deactivateHint: '暫時無法分析與結帳；資料保留，可隨時重新啟用。',
    reactivate: '重新啟用',
    reactivateHint: '恢復分析與結帳權限。',
    deleteHint: '永久刪除帳戶與所有報告（CCPA），無法復原。',
    confirmDeactivate: '確定停用帳戶？之後可在此頁重新啟用。',
    loadError: '無法載入帳戶資料。',
    actionError: '操作失敗，請稍後再試。',
  },
  'zh-CN': {
    title: '账户管理',
    back: '返回首页',
    needLogin: '请登录以管理账户。',
    overview: '总览',
    email: '邮箱',
    tier: '会员等级',
    snapshotCredits: 'Job Fit Snapshot 额度',
    strategyCredits: 'Interview Strategy Guide 额度',
    remainingCredits: '剩余额度',
    statusActive: '启用中',
    statusDeactivated: '已停用',
    subscription: '订阅与额度',
    subscriptionNote:
      '可在下方购买或升级。取消 Lemon Squeezy 订阅请先使用订单确认信中的链接。',
    buy: '购买',
    buying: '跳转中…',
    syncSub: '同步订阅额度',
    syncing: '同步中…',
    syncOk: '已同步订阅，月额度已刷新。',
    syncNone: '此邮箱没有进行中的 Standard／Advanced 订阅。',
    billing: '账单记录',
    billingEmpty: '暂无订单。',
    date: '日期',
    plan: '方案',
    amount: '金额',
    status: '状态',
    referrals: '推荐记录',
    earned: '推荐已赚取的 Snapshot 额度',
    referralEmpty: '暂无推荐。',
    activated: '已激活',
    pending: '待完成',
    danger: '危险操作',
    deactivate: '停用账户',
    deactivateHint: '暂时无法分析与结账；数据保留，可随时重新启用。',
    reactivate: '重新启用',
    reactivateHint: '恢复分析与结账权限。',
    deleteHint: '永久删除账户与所有报告（CCPA），无法恢复。',
    confirmDeactivate: '确定停用账户？之后可在此页重新启用。',
    loadError: '无法加载账户数据。',
    actionError: '操作失败，请稍后再试。',
  },
  es: {
    title: 'Gestión de cuenta',
    back: 'Volver al inicio',
    needLogin: 'Inicia sesión para gestionar tu cuenta.',
    overview: 'Resumen',
    email: 'Email',
    tier: 'Membresía',
    snapshotCredits: 'Créditos Job Fit Snapshot',
    strategyCredits: 'Créditos Interview Strategy Guide',
    remainingCredits: 'Créditos restantes',
    statusActive: 'Activa',
    statusDeactivated: 'Desactivada',
    subscription: 'Suscripción y créditos',
    subscriptionNote:
      'Compra o mejora abajo. Para cancelar en Lemon Squeezy, usa el enlace del email del pedido.',
    buy: 'Comprar',
    buying: 'Redirigiendo…',
    syncSub: 'Sincronizar créditos de suscripción',
    syncing: 'Sincronizando…',
    syncOk: 'Suscripción sincronizada — créditos mensuales actualizados.',
    syncNone: 'No hay suscripción Standard/Advanced activa para este email.',
    billing: 'Historial de facturación',
    billingEmpty: 'Sin pedidos aún.',
    date: 'Fecha',
    plan: 'Plan',
    amount: 'Importe',
    status: 'Estado',
    referrals: 'Referidos',
    earned: 'Créditos Snapshot ganados',
    referralEmpty: 'Sin referidos aún.',
    activated: 'Activado',
    pending: 'Pendiente',
    danger: 'Zona de peligro',
    deactivate: 'Desactivar cuenta',
    deactivateHint: 'Pausa análisis y checkout. Tus datos se conservan.',
    reactivate: 'Reactivar cuenta',
    reactivateHint: 'Restaura el acceso a análisis y checkout.',
    deleteHint: 'Borra permanentemente tu cuenta e informes (CCPA).',
    confirmDeactivate: '¿Desactivar tu cuenta? Puedes reactivarla después.',
    loadError: 'No se pudo cargar la cuenta.',
    actionError: 'Algo falló. Inténtalo de nuevo.',
  },
  hi: {
    title: 'खाता प्रबंधन',
    back: 'होम पर वापस',
    needLogin: 'खाता प्रबंधित करने के लिए साइन इन करें।',
    overview: 'अवलोकन',
    email: 'ईमेल',
    tier: 'सदस्यता',
    snapshotCredits: 'Job Fit Snapshot क्रेडिट',
    strategyCredits: 'Interview Strategy Guide क्रेडिट',
    remainingCredits: 'शेष क्रेडिट',
    statusActive: 'सक्रिय',
    statusDeactivated: 'निष्क्रिय',
    subscription: 'सदस्यता और क्रेडिट',
    subscriptionNote:
      'नीचे खरीदें या अपग्रेड करें। Lemon Squeezy रद्द करने के लिए ऑर्डर ईमेल लिंक उपयोग करें।',
    buy: 'खरीदें',
    buying: 'रीडायरेक्ट…',
    syncSub: 'सदस्यता क्रेडिट सिंक करें',
    syncing: 'सिंक हो रहा है…',
    syncOk: 'सदस्यता सिंक हो गई — मासिक क्रेडिट रिफ्रेश।',
    syncNone: 'इस ईमेल पर सक्रिय Standard/Advanced सदस्यता नहीं मिली।',
    billing: 'बिलिंग इतिहास',
    billingEmpty: 'अभी कोई ऑर्डर नहीं।',
    date: 'तारीख',
    plan: 'योजना',
    amount: 'राशि',
    status: 'स्थिति',
    referrals: 'रेफरल',
    earned: 'रेफरल से Snapshot क्रेडिट',
    referralEmpty: 'अभी कोई रेफरल नहीं।',
    activated: 'सक्रिय',
    pending: 'लंबित',
    danger: 'खतरनाक क्षेत्र',
    deactivate: 'खाता निष्क्रिय करें',
    deactivateHint: 'विश्लेषण और चेकआउट रोकें। डेटा सुरक्षित रहता है।',
    reactivate: 'पुनः सक्रिय करें',
    reactivateHint: 'विश्लेषण और चेकआउट बहाल करें।',
    deleteHint: 'खाता और रिपोर्ट स्थायी रूप से हटाएं (CCPA)।',
    confirmDeactivate: 'खाता निष्क्रिय करें? बाद में पुनः सक्रिय कर सकते हैं।',
    loadError: 'खाता लोड नहीं हो सका।',
    actionError: 'त्रुटि। पुनः प्रयास करें।',
  },
  ar: {
    title: 'إدارة الحساب',
    back: 'العودة للرئيسية',
    needLogin: 'سجّل الدخول لإدارة حسابك.',
    overview: 'نظرة عامة',
    email: 'البريد',
    tier: 'العضوية',
    snapshotCredits: 'رصيد Job Fit Snapshot',
    strategyCredits: 'رصيد Interview Strategy Guide',
    remainingCredits: 'الرصيد المتبقي',
    statusActive: 'نشط',
    statusDeactivated: 'معطّل',
    subscription: 'الاشتراك والرصيد',
    subscriptionNote:
      'اشترِ أو رقِّ أدناه. لإلغاء Lemon Squeezy استخدم رابط رسالة الطلب.',
    buy: 'شراء',
    buying: 'جارٍ التحويل…',
    syncSub: 'مزامنة رصيد الاشتراك',
    syncing: 'جارٍ المزامنة…',
    syncOk: 'تمت مزامنة الاشتراك — تم تحديث الرصيد الشهري.',
    syncNone: 'لا يوجد اشتراك Standard/Advanced نشط لهذا البريد.',
    billing: 'سجل الفوترة',
    billingEmpty: 'لا طلبات بعد.',
    date: 'التاريخ',
    plan: 'الخطة',
    amount: 'المبلغ',
    status: 'الحالة',
    referrals: 'الإحالات',
    earned: 'رصيد Snapshot من الإحالات',
    referralEmpty: 'لا إحالات بعد.',
    activated: 'مفعّل',
    pending: 'قيد الانتظار',
    danger: 'منطقة خطر',
    deactivate: 'تعطيل الحساب',
    deactivateHint: 'إيقاف التحليل والدفع مؤقتًا مع الاحتفاظ بالبيانات.',
    reactivate: 'إعادة التفعيل',
    reactivateHint: 'استعادة التحليل والدفع.',
    deleteHint: 'حذف الحساب والتقارير نهائيًا (CCPA).',
    confirmDeactivate: 'تعطيل الحساب؟ يمكنك إعادة التفعيل لاحقًا.',
    loadError: 'تعذر تحميل الحساب.',
    actionError: 'حدث خطأ. حاول مجددًا.',
  },
};

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    free: 'Free',
    standard_sub: 'Standard',
    advanced_sub: 'Advanced',
  };
  return map[tier] ?? tier;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function formatDate(iso: string, language: AppLanguage): string {
  try {
    return new Date(iso).toLocaleDateString(language === 'zh-TW' || language === 'zh-CN' ? language : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AccountPage() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [data, setData] = useState<AccountPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<CheckoutPlanType | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account');
      if (res.status === 401) {
        setSignedIn(false);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(t.loadError);
        return;
      }
      setSignedIn(true);
      setData(await res.json());
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      void load();
    });
  }, [load]);

  const handleCheckout = async (plan: CheckoutPlanType) => {
    setBusyPlan(plan);
    setError(null);
    const result = await startCheckout(plan);
    if (!result.ok) setError(result.error);
    setBusyPlan(null);
  };

  const handleSyncSubscription = async () => {
    setSyncBusy(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/account/sync-subscription', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : t.actionError);
        return;
      }
      if (body.synced) {
        setSyncMessage(t.syncOk);
        await load();
      } else {
        setSyncMessage(t.syncNone);
      }
    } catch {
      setError(t.actionError);
    } finally {
      setSyncBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(t.confirmDeactivate)) return;
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/deactivate', { method: 'POST' });
      if (!res.ok) {
        setError(t.actionError);
        return;
      }
      await load();
    } catch {
      setError(t.actionError);
    } finally {
      setActionBusy(false);
    }
  };

  const handleReactivate = async () => {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/reactivate', { method: 'POST' });
      if (!res.ok) {
        setError(t.actionError);
        return;
      }
      await load();
    } catch {
      setError(t.actionError);
    } finally {
      setActionBusy(false);
    }
  };

  const deactivated = Boolean(data?.profile.deactivated_at);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo size="nav" showIcon />
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="dark" />
            <LoginButton redirectTo="/account" />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && signedIn === false && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center space-y-4">
            <p className="text-slate-300">{t.needLogin}</p>
            <LoginButton redirectTo="/account" />
          </div>
        )}

        {!loading && signedIn && data && (
          <>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t.overview}
              </h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">{t.email}</dt>
                  <dd className="text-white">{data.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t.tier}</dt>
                  <dd className="text-white">{tierLabel(data.profile.membership_tier)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500 mb-1.5">{t.remainingCredits}</dt>
                  <dd>
                    <CreditsBadge
                      profile={{
                        id: data.profile.id,
                        full_name: data.profile.full_name,
                        avatar_url: null,
                        membership_tier: data.profile.membership_tier as MembershipTier,
                        available_job_fit_snapshot_credits:
                          data.profile.available_job_fit_snapshot_credits,
                        available_interview_strategy_guide_credits:
                          data.profile.available_interview_strategy_guide_credits,
                        referral_code: data.profile.referral_code,
                        device_fingerprint: null,
                      } satisfies UserProfile}
                      language={language}
                    />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Status</dt>
                  <dd
                    className={
                      deactivated ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'
                    }
                  >
                    {deactivated ? t.statusDeactivated : t.statusActive}
                  </dd>
                </div>
              </dl>
            </section>

            <CareerContextForm initial={data.profile.career_context} />

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-start gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {t.subscription}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{t.subscriptionNote}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={syncBusy || deactivated}
                  onClick={() => void handleSyncSubscription()}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-400/50 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
                >
                  {syncBusy ? t.syncing : t.syncSub}
                </button>
                {syncMessage ? (
                  <p className="text-xs text-slate-400">{syncMessage}</p>
                ) : null}
              </div>
              <ul className="space-y-2">
                {ACTIVE_CHECKOUT_PLAN_TYPES.map((planType) => {
                  const plan = CHECKOUT_PLANS[planType];
                  const label =
                    language === 'zh-TW' || language === 'zh-CN' ? plan.labelZhTW : plan.labelEn;
                  return (
                    <li
                      key={planType}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-200">{label}</span>
                      <button
                        type="button"
                        disabled={Boolean(busyPlan) || deactivated}
                        onClick={() => void handleCheckout(planType)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
                      >
                        {busyPlan === planType ? t.buying : t.buy}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t.billing}
              </h2>
              {data.orders.length === 0 ? (
                <p className="text-sm text-slate-500">{t.billingEmpty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 border-b border-slate-700">
                      <tr>
                        <th className="py-2 pr-3 font-medium">{t.date}</th>
                        <th className="py-2 pr-3 font-medium">{t.plan}</th>
                        <th className="py-2 pr-3 font-medium">{t.amount}</th>
                        <th className="py-2 font-medium">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id} className="border-b border-slate-800/80">
                          <td className="py-2 pr-3 text-slate-300 whitespace-nowrap">
                            {formatDate(o.created_at, language)}
                          </td>
                          <td className="py-2 pr-3 text-slate-200">{o.plan_type}</td>
                          <td className="py-2 pr-3 text-slate-200">
                            {formatMoney(Number(o.amount), o.currency)}
                          </td>
                          <td className="py-2 text-slate-400">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-start gap-2">
                <Gift className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {t.referrals}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.earned}: {data.referral_earned_snapshot_credits}
                  </p>
                </div>
              </div>
              <ReferralCard
                referralCode={data.profile.referral_code}
                language={language}
                userProfile={{
                  id: data.profile.id,
                  full_name: data.profile.full_name,
                  avatar_url: null,
                  membership_tier: data.profile.membership_tier as MembershipTier,
                  available_job_fit_snapshot_credits:
                    data.profile.available_job_fit_snapshot_credits,
                  available_interview_strategy_guide_credits:
                    data.profile.available_interview_strategy_guide_credits,
                  referral_code: data.profile.referral_code,
                  device_fingerprint: null,
                } satisfies UserProfile}
              />
              {data.referrals.length === 0 ? (
                <p className="text-sm text-slate-500">{t.referralEmpty}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.referrals.map((r) => (
                    <li
                      key={r.id}
                      className="flex justify-between gap-2 rounded-lg border border-slate-700/60 px-3 py-2"
                    >
                      <span className="text-slate-400 font-mono text-xs truncate">
                        {r.referee_id.slice(0, 8)}…
                      </span>
                      <span className="text-slate-300 whitespace-nowrap">
                        {formatDate(r.created_at, language)} ·{' '}
                        {r.is_activated ? t.activated : t.pending}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-red-900/50 bg-red-950/20 p-5 space-y-4">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-red-300/90">
                  {t.danger}
                </h2>
              </div>

              {deactivated ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">{t.reactivateHint}</p>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleReactivate()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {t.reactivate}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">{t.deactivateHint}</p>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleDeactivate()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-700/60 text-amber-200 hover:bg-amber-950/40 text-sm font-medium disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" />
                    {t.deactivate}
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-red-900/40 space-y-2">
                <p className="text-sm text-slate-400">{t.deleteHint}</p>
                <DeleteAccountButton language={language} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
