'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage, type AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import BrandLogo from '@/components/BrandLogo';
import { FitStage } from '@/components/FitStage';
import { ACCOUNT_DESIGN_WIDTH } from '@/constants/fit-stage';

const copy: Record<
  AppLanguage,
  {
    title: string;
    lead: string;
    backAccount: string;
    backHome: string;
    needLogin: string;
    pauseTitle: string;
    pauseBody: string;
    pauseNote: string;
    deactivate: string;
    reactivate: string;
    reactivateHint: string;
    confirmDeactivate: string;
    deleteTitle: string;
    deleteBody: string;
    loadError: string;
    actionError: string;
    pausedBadge: string;
  }
> = {
  en: {
    title: 'Danger zone',
    lead: 'Pause or permanently close your account. Kept off the billing page so buying credits and closing the account are not mixed.',
    backAccount: 'Back to account',
    backHome: 'Back to home',
    needLogin: 'Sign in to pause or delete your account.',
    pauseTitle: 'Pause account',
    pauseBody:
      'Temporarily stop analyze and checkout. Your profile, Career Context, and reports stay. You can reactivate anytime.',
    pauseNote:
      'Pause does not cancel a paid subscription. Cancel monthly billing from Account → Subscription.',
    deactivate: 'Deactivate account',
    reactivate: 'Reactivate account',
    reactivateHint: 'Restore access to analyze and checkout.',
    confirmDeactivate: 'Deactivate your account? You can reactivate later from this page.',
    deleteTitle: 'Delete forever',
    deleteBody:
      'Permanently erase your profile, reports, and stored resume files (CCPA). This cannot be undone.',
    loadError: 'Could not load account.',
    actionError: 'Something went wrong. Try again.',
    pausedBadge: 'Currently paused',
  },
  'zh-TW': {
    title: '危險操作',
    lead: '暫停或永久關閉帳戶。獨立成頁，不跟買額度混在一起。',
    backAccount: '返回帳戶',
    backHome: '返回首頁',
    needLogin: '請登入以暫停或刪除帳戶。',
    pauseTitle: '暫停帳戶',
    pauseBody: '暫時無法分析與結帳。資料、Career Context 與報告都會保留，可隨時重新啟用。',
    pauseNote: '暫停不會取消付費訂閱。若要停扣款，請到「帳戶管理 → 訂閱與額度」一鍵取消。',
    deactivate: '停用帳戶',
    reactivate: '重新啟用',
    reactivateHint: '恢復分析與結帳權限。',
    confirmDeactivate: '確定停用帳戶？之後可在此頁重新啟用。',
    deleteTitle: '永久刪除',
    deleteBody: '永久刪除個人資料、報告與已存履歷檔（CCPA），無法復原。',
    loadError: '無法載入帳戶資料。',
    actionError: '操作失敗，請稍後再試。',
    pausedBadge: '目前已暫停',
  },
  'zh-CN': {
    title: '危险操作',
    lead: '暂停或永久关闭账户。独立成页，不和买额度混在一起。',
    backAccount: '返回账户',
    backHome: '返回首页',
    needLogin: '请登录以暂停或删除账户。',
    pauseTitle: '暂停账户',
    pauseBody: '暂时无法分析与结账。资料、Career Context 与报告都会保留，可随时重新启用。',
    pauseNote: '暂停不会取消付费订阅。若要停扣款，请到「账户管理 → 订阅与额度」一键取消。',
    deactivate: '停用账户',
    reactivate: '重新启用',
    reactivateHint: '恢复分析与结账权限。',
    confirmDeactivate: '确定停用账户？之后可在此页重新启用。',
    deleteTitle: '永久删除',
    deleteBody: '永久删除个人资料、报告与已存简历文件（CCPA），无法恢复。',
    loadError: '无法加载账户数据。',
    actionError: '操作失败，请稍后再试。',
    pausedBadge: '目前已暂停',
  },
  es: {
    title: 'Zona de peligro',
    lead: 'Pausa o cierra tu cuenta de forma permanente. Fuera de la página de facturación.',
    backAccount: 'Volver a la cuenta',
    backHome: 'Volver al inicio',
    needLogin: 'Inicia sesión para pausar o eliminar tu cuenta.',
    pauseTitle: 'Pausar cuenta',
    pauseBody:
      'Detiene análisis y checkout. Tu perfil, Career Context e informes se conservan. Puedes reactivar cuando quieras.',
    pauseNote:
      'Pausar no cancela una suscripción de pago. Cancela el cobro mensual en Cuenta → Suscripción.',
    deactivate: 'Desactivar cuenta',
    reactivate: 'Reactivar cuenta',
    reactivateHint: 'Restaura el acceso a análisis y checkout.',
    confirmDeactivate: '¿Desactivar tu cuenta? Puedes reactivarla después.',
    deleteTitle: 'Eliminar para siempre',
    deleteBody: 'Borra tu perfil, informes y currículums guardados (CCPA). No se puede deshacer.',
    loadError: 'No se pudo cargar la cuenta.',
    actionError: 'Algo falló. Inténtalo de nuevo.',
    pausedBadge: 'Actualmente pausada',
  },
  hi: {
    title: 'खतरनाक क्षेत्र',
    lead: 'खाता रोकें या स्थायी रूप से बंद करें। बिलिंग पेज से अलग।',
    backAccount: 'खाते पर वापस',
    backHome: 'होम पर वापस',
    needLogin: 'खाता रोकने या हटाने के लिए साइन इन करें।',
    pauseTitle: 'खाता रोकें',
    pauseBody:
      'विश्लेषण और चेकआउट रुकते हैं। प्रोफ़ाइल, Career Context और रिपोर्ट सुरक्षित रहती हैं।',
    pauseNote: 'रोकने से भुगतान वाली सदस्यता रद्द नहीं होती। मासिक बिलिंग खाता → सदस्यता से रद्द करें।',
    deactivate: 'खाता निष्क्रिय करें',
    reactivate: 'पुनः सक्रिय करें',
    reactivateHint: 'विश्लेषण और चेकआउट बहाल करें।',
    confirmDeactivate: 'खाता निष्क्रिय करें? बाद में पुनः सक्रिय कर सकते हैं।',
    deleteTitle: 'स्थायी रूप से हटाएं',
    deleteBody: 'प्रोफ़ाइल, रिपोर्ट और सेव किए गए रिज़्यूमे मिटाएं (CCPA)। पूर्ववत नहीं हो सकता।',
    loadError: 'खाता लोड नहीं हो सका।',
    actionError: 'त्रुटि। पुनः प्रयास करें।',
    pausedBadge: 'अभी रुका हुआ',
  },
  ar: {
    title: 'منطقة خطر',
    lead: 'إيقاف الحساب مؤقتًا أو إغلاقه نهائيًا. بعيدًا عن صفحة الفوترة.',
    backAccount: 'العودة للحساب',
    backHome: 'العودة للرئيسية',
    needLogin: 'سجّل الدخول لإيقاف أو حذف حسابك.',
    pauseTitle: 'إيقاف الحساب',
    pauseBody: 'يتوقف التحليل والدفع. تبقى بياناتك وCareer Context والتقارير. يمكنك إعادة التفعيل.',
    pauseNote: 'الإيقاف لا يلغي اشتراكًا مدفوعًا. ألغِ الفوترة الشهرية من الحساب ← الاشتراك.',
    deactivate: 'تعطيل الحساب',
    reactivate: 'إعادة التفعيل',
    reactivateHint: 'استعادة التحليل والدفع.',
    confirmDeactivate: 'تعطيل الحساب؟ يمكنك إعادة التفعيل لاحقًا.',
    deleteTitle: 'حذف نهائي',
    deleteBody: 'حذف الملف والتقارير والسير الذاتية المخزنة (CCPA). لا يمكن التراجع.',
    loadError: 'تعذر تحميل الحساب.',
    actionError: 'حدث خطأ. حاول مجددًا.',
    pausedBadge: 'متوقف حاليًا',
  },
};

export default function DangerZonePageClient() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account');
      if (res.status === 401) {
        setSignedIn(false);
        return;
      }
      if (!res.ok) {
        setError(t.loadError);
        return;
      }
      const data = (await res.json()) as { profile?: { deactivated_at?: string | null } };
      setSignedIn(true);
      setDeactivated(Boolean(data.profile?.deactivated_at));
    } catch {
      setError(t.loadError);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load({ silent: true });
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
      await load({ silent: true });
    } catch {
      setError(t.actionError);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <FitStage designWidth={ACCOUNT_DESIGN_WIDTH} minScale={1} maxScale={2} className="w-full">
        <main className="mx-auto w-full px-8 py-10 space-y-10" data-fit-ref="account-danger">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo size="nav" showIcon />
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="dark" size="lg" />
              <LoginButton redirectTo="/account/danger" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-lg text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t.backAccount}
              </Link>
              <Link
                href="/"
                className="text-lg text-slate-500 hover:text-slate-300 transition-colors"
              >
                {t.backHome}
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-sm font-semibold text-red-200">
              <ShieldAlert className="h-4 w-4" />
              {t.title}
            </div>
            <h1 className="mt-4 text-4xl font-bold text-white">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-400">{t.lead}</p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!loading && signedIn === false && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-8 text-center space-y-4">
              <p className="text-xl text-slate-300">{t.needLogin}</p>
              <LoginButton redirectTo="/account/danger" />
            </div>
          )}

          {!loading && signedIn && (
            <>
              {error && (
                <p className="text-lg text-red-400" role="alert">
                  {error}
                </p>
              )}

              <section className="rounded-xl border border-amber-700/40 bg-amber-950/15 p-7 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-amber-100">{t.pauseTitle}</h2>
                  {deactivated && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-200">
                      {t.pausedBadge}
                    </span>
                  )}
                </div>
                <p className="text-lg text-slate-400 leading-snug">
                  {deactivated ? t.reactivateHint : t.pauseBody}
                </p>
                <p className="text-base text-slate-500 leading-snug">{t.pauseNote}</p>
                {deactivated ? (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleReactivate()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-lg font-bold disabled:opacity-50"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {t.reactivate}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleDeactivate()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-amber-700/60 text-amber-200 hover:bg-amber-950/40 text-lg font-medium disabled:opacity-50"
                  >
                    <PauseCircle className="w-5 h-5" />
                    {t.deactivate}
                  </button>
                )}
              </section>

              <section className="rounded-xl border border-red-900/50 bg-red-950/20 p-7 space-y-4">
                <h2 className="text-xl font-semibold text-red-200">{t.deleteTitle}</h2>
                <p className="text-lg text-slate-400 leading-snug">{t.deleteBody}</p>
                <DeleteAccountButton language={language} />
              </section>
            </>
          )}
        </main>
      </FitStage>
    </div>
  );
}
