'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Gift,
  Loader2,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { useLanguage, type AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import ReferralCard from '@/components/ReferralCard';
import BrandLogo from '@/components/BrandLogo';
import CreditsBadge from '@/components/CreditsBadge';
import { startCheckout } from '@/lib/checkout-client';
import {
  ACTIVE_CHECKOUT_PLAN_TYPES,
  CHECKOUT_PLANS,
  parseSponsorAmountCents,
  type CheckoutPlanType,
} from '@/constants/checkout-plans';
import type { CareerContext, MembershipTier, UserProfile } from '@/types';
import { careerContextHasSignal } from '@/lib/career-context';
import { FitStage } from '@/components/FitStage';
import { ACCOUNT_DESIGN_WIDTH } from '@/constants/fit-stage';
import { PAGE_SHELL_GUTTER, SAMPLE_RAIL_ROW } from '@/constants/report-frame';
import AccountSectionNav from '@/components/AccountSectionNav';
import {
  ACCOUNT_HASH_IDS,
  getAccountNavCopy,
  isAccountHashId,
  type AccountHashId,
} from '@/constants/account-nav';

const ACCOUNT_CARD =
  'scroll-mt-4 rounded-xl border border-blue-500 bg-blue-950/40 p-7 space-y-4';
const ACCOUNT_HEADING = 'text-xl font-semibold tracking-wide text-zinc-100';
const PRIMARY_BTN =
  'px-5 py-2.5 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors';
const SECONDARY_BTN =
  'px-5 py-2.5 text-lg font-bold rounded-lg border border-blue-500 bg-blue-950/40 text-zinc-100 hover:bg-blue-900 disabled:opacity-50 transition-colors';

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

type BillingView = {
  id: string;
  status: string;
  planType: string | null;
  membershipTier: 'standard_sub' | 'advanced_sub' | null;
  renewsAt: string | null;
  endsAt: string | null;
  cancelled: boolean;
  canCancel: boolean;
  canManage: boolean;
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
    manageBilling: string;
    managingBilling: string;
    cancelSub: string;
    cancelling: string;
    cancelConfirm: string;
    cancelOk: string;
    cancelOkNoDate: string;
    cancelNone: string;
    manageNone: string;
    subRenews: string;
    subEnds: string;
    subCancelledNote: string;
    subUnmatched: string;
    buy: string;
    buying: string;
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
    loadError: string;
    actionError: string;
    careerContextTitle: string;
    careerContextSubtitle: string;
    careerContextBlurb: string;
    careerContextCta: string;
    careerContextEdit: string;
    sponsorTitle: string;
    sponsorNote: string;
    sponsorAmount: string;
    sponsorCta: string;
    sponsorInvalid: string;
  }
> = {
  en: {
    title: 'Account management',
    back: 'Back to home',
    needLogin: 'Sign in to manage your account.',
    overview: 'Overview',
    email: 'Email',
    tier: 'Membership',
    snapshotCredits: 'Fit Snapshot credits',
    strategyCredits: 'Interview Guide credits',
    remainingCredits: 'Remaining credits',
    statusActive: 'Active',
    statusDeactivated: 'Deactivated',
    subscription: 'Subscription & credits',
    subscriptionNote:
      'Buy or upgrade below. Cancel a monthly plan here with one click — you keep access until the current period ends.',
    manageBilling: 'Manage billing',
    managingBilling: 'Opening portal…',
    cancelSub: 'Cancel subscription',
    cancelling: 'Cancelling…',
    cancelConfirm:
      'Cancel your monthly subscription? You keep access until the current billing period ends. You can subscribe again below anytime.',
    cancelOk: 'Billing stopped. You keep access until {date}.',
    cancelOkNoDate: 'Billing stopped. You keep access until the current period ends.',
    cancelNone: 'No monthly subscription on this account.',
    manageNone: 'Could not open the billing portal. Try again in a moment.',
    subRenews: 'Renews {date}',
    subEnds: 'Access until {date}',
    subCancelledNote: 'Billing has stopped.',
    subUnmatched:
      'No active subscription found. If your plan looks wrong, buy again below.',
    buy: 'Buy',
    buying: 'Redirecting…',
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
    loadError: 'Could not load account.',
    actionError: 'Something went wrong. Try again.',
    careerContextTitle: 'Personalize',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      'Optional personal floors for location, salary, and work authorization. Every Job Fit Snapshot and Interview Strategy Guide uses these settings to align fit and pay.',
    careerContextCta: 'Personalize Career Context →',
    careerContextEdit: 'Edit personal floors →',
    sponsorTitle: 'Sponsor JobBeagle',
    sponsorNote:
      'Any amount from $0.50 to $1,000. Does not add credits — a thank-you only.',
    sponsorAmount: 'USD amount',
    sponsorCta: 'Sponsor',
    sponsorInvalid: 'Enter an amount between $0.50 and $1,000.00.',
  },
  'zh-TW': {
    title: '帳戶管理',
    back: '返回首頁',
    needLogin: '請登入以管理帳戶。',
    overview: '總覽',
    email: '信箱',
    tier: '會員等級',
    snapshotCredits: '適配快照額度',
    strategyCredits: '面試指南額度',
    remainingCredits: '剩餘額度',
    statusActive: '啟用中',
    statusDeactivated: '已停用',
    subscription: '訂閱與額度',
    subscriptionNote:
      '可在下方購買或升級。月費可在本頁一鍵取消；本期結束前仍可使用。',
    manageBilling: '管理帳單',
    managingBilling: '開啟中…',
    cancelSub: '取消訂閱',
    cancelling: '取消中…',
    cancelConfirm:
      '確定取消月費訂閱？本期結束前仍可使用。之後可再從下方重新訂閱。',
    cancelOk: '已停止扣款。你可使用至 {date}。',
    cancelOkNoDate: '已停止扣款。本期結束前仍可使用。',
    cancelNone: '目前沒有月費訂閱。',
    manageNone: '無法開啟帳單入口，請稍後再試。',
    subRenews: '下次續訂 {date}',
    subEnds: '可用至 {date}',
    subCancelledNote: '已停止扣款。',
    subUnmatched:
      '目前看不到有效的訂閱。若方案顯示不正確，請在下方重新購買。',
    buy: '購買',
    buying: '跳轉中…',
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
    loadError: '無法載入帳戶資料。',
    actionError: '操作失敗，請稍後再試。',
    careerContextTitle: '個人化職涯條件',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      '可選填地點、薪酬下限、工作權等個人化條件。產生適配快照與面試指南時，會納入這些底線來對齊匹配度與薪資建議。',
    careerContextCta: '設定個人化職涯條件 →',
    careerContextEdit: '編輯個人化職涯條件 →',
    sponsorTitle: '贊助 JobBeagle',
    sponsorNote: '金額 $0.50–$1,000，不會增加額度，僅作為支持。',
    sponsorAmount: '美元金額',
    sponsorCta: '贊助',
    sponsorInvalid: '請輸入 $0.50 到 $1,000.00 之間的金額。',
  },
  'zh-CN': {
    title: '账户管理',
    back: '返回首页',
    needLogin: '请登录以管理账户。',
    overview: '总览',
    email: '邮箱',
    tier: '会员等级',
    snapshotCredits: '适配快照额度',
    strategyCredits: '面试指南额度',
    remainingCredits: '剩余额度',
    statusActive: '启用中',
    statusDeactivated: '已停用',
    subscription: '订阅与额度',
    subscriptionNote: '可在下方购买或升级。月费可在本页一键取消；本期结束前仍可使用。',
    manageBilling: '管理账单',
    managingBilling: '打开中…',
    cancelSub: '取消订阅',
    cancelling: '取消中…',
    cancelConfirm: '确定取消月费订阅？本期结束前仍可使用。之后可再从下方重新订阅。',
    cancelOk: '已停止扣款。你可使用至 {date}。',
    cancelOkNoDate: '已停止扣款。本期结束前仍可使用。',
    cancelNone: '目前没有月费订阅。',
    manageNone: '无法打开账单入口，请稍后再试。',
    subRenews: '下次续订 {date}',
    subEnds: '可用至 {date}',
    subCancelledNote: '已停止扣款。',
    subUnmatched:
      '目前看不到有效的订阅。若方案显示不正确，请在下方重新购买。',
    buy: '购买',
    buying: '跳转中…',
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
    loadError: '无法加载账户数据。',
    actionError: '操作失败，请稍后再试。',
    careerContextTitle: '个性化职涯条件',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      '可选填地点、薪酬下限、工作权等个性化条件。生成适配快照与面试指南时，会纳入这些底线来对齐匹配度与薪酬建议。',
    careerContextCta: '设置个性化职涯条件 →',
    careerContextEdit: '编辑个性化职涯条件 →',
    sponsorTitle: '赞助 JobBeagle',
    sponsorNote: '金额 $0.50–$1,000，不会增加额度，仅作为支持。',
    sponsorAmount: '美元金额',
    sponsorCta: '赞助',
    sponsorInvalid: '请输入 $0.50 到 $1,000.00 之间的金额。',
  },
  es: {
    title: 'Gestión de cuenta',
    back: 'Volver al inicio',
    needLogin: 'Inicia sesión para gestionar tu cuenta.',
    overview: 'Resumen',
    email: 'Email',
    tier: 'Membresía',
    snapshotCredits: 'Créditos Fit Snapshot',
    strategyCredits: 'Créditos Interview Guide',
    remainingCredits: 'Créditos restantes',
    statusActive: 'Activa',
    statusDeactivated: 'Desactivada',
    subscription: 'Suscripción y créditos',
    subscriptionNote:
      'Compra o mejora abajo. Cancela el plan mensual aquí con un clic — sigues teniendo acceso hasta el fin del periodo.',
    manageBilling: 'Gestionar facturación',
    managingBilling: 'Abriendo…',
    cancelSub: 'Cancelar suscripción',
    cancelling: 'Cancelando…',
    cancelConfirm:
      '¿Cancelar la suscripción mensual? Conservas el acceso hasta el fin del periodo. Puedes volver a suscribirte abajo.',
    cancelOk: 'Se detuvo el cobro. Conservas el acceso hasta {date}.',
    cancelOkNoDate: 'Se detuvo el cobro. Conservas el acceso hasta el fin del periodo.',
    cancelNone: 'No hay una suscripción mensual en esta cuenta.',
    manageNone: 'No se pudo abrir el portal de facturación. Inténtalo de nuevo.',
    subRenews: 'Se renueva {date}',
    subEnds: 'Acceso hasta {date}',
    subCancelledNote: 'El cobro se detuvo.',
    subUnmatched:
      'No hay una suscripción activa. Si el plan no se ve bien, vuelve a comprar abajo.',
    buy: 'Comprar',
    buying: 'Redirigiendo…',
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
    loadError: 'No se pudo cargar la cuenta.',
    actionError: 'Algo falló. Inténtalo de nuevo.',
    careerContextTitle: 'Personalizar',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      'Pisos personales opcionales de ubicación, salario y autorización de trabajo. Cada Fit Snapshot e Interview Guide los usa para alinear adecuación y pago.',
    careerContextCta: 'Personalizar Career Context →',
    careerContextEdit: 'Editar pisos personales →',
    sponsorTitle: 'Patrocinar JobBeagle',
    sponsorNote:
      'Cualquier monto de $0.50 a $1,000. No suma créditos — solo un agradecimiento.',
    sponsorAmount: 'Monto en USD',
    sponsorCta: 'Patrocinar',
    sponsorInvalid: 'Ingresa un monto entre $0.50 y $1,000.00.',
  },
  hi: {
    title: 'खाता प्रबंधन',
    back: 'होम पर वापस',
    needLogin: 'खाता प्रबंधित करने के लिए साइन इन करें।',
    overview: 'अवलोकन',
    email: 'ईमेल',
    tier: 'सदस्यता',
    snapshotCredits: 'Fit Snapshot क्रेडिट',
    strategyCredits: 'Interview Guide क्रेडिट',
    remainingCredits: 'शेष क्रेडिट',
    statusActive: 'सक्रिय',
    statusDeactivated: 'निष्क्रिय',
    subscription: 'सदस्यता और क्रेडिट',
    subscriptionNote:
      'नीचे खरीदें या अपग्रेड करें। मासिक योजना यहाँ एक क्लिक में रद्द करें — अवधि खत्म होने तक ऐक्सेस रहेगा।',
    manageBilling: 'बिलिंग प्रबंधित करें',
    managingBilling: 'खुल रहा है…',
    cancelSub: 'सदस्यता रद्द करें',
    cancelling: 'रद्द हो रहा है…',
    cancelConfirm:
      'मासिक सदस्यता रद्द करें? वर्तमान अवधि खत्म होने तक ऐक्सेस रहेगा। बाद में नीचे फिर से ले सकते हैं।',
    cancelOk: 'बिलिंग बंद। आप {date} तक उपयोग कर सकते हैं।',
    cancelOkNoDate: 'बिलिंग बंद। वर्तमान अवधि खत्म होने तक ऐक्सेस रहेगा।',
    cancelNone: 'इस खाते पर मासिक सदस्यता नहीं है।',
    manageNone: 'बिलिंग पोर्टल नहीं खुल सका। बाद में प्रयास करें।',
    subRenews: 'नवीनीकरण {date}',
    subEnds: '{date} तक ऐक्सेस',
    subCancelledNote: 'बिलिंग बंद हो गई।',
    subUnmatched:
      'कोई सक्रिय सदस्यता नहीं दिख रही। अगर प्लान गलत दिखे, तो नीचे फिर से खरीदें।',
    buy: 'खरीदें',
    buying: 'रीडायरेक्ट…',
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
    loadError: 'खाता लोड नहीं हो सका।',
    actionError: 'त्रुटि। पुनः प्रयास करें।',
    careerContextTitle: 'व्यक्तिगत करियर शर्तें',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      'स्थान, न्यूनतम वेतन और कार्य अनुमति जैसी व्यक्तिगत सेटिंग। हर Job Fit Snapshot और Interview Strategy Guide मैच और वेतन सुझाव इन्हीं के अनुरूप रखता है।',
    careerContextCta: 'व्यक्तिगत करियर शर्तें सेट करें →',
    careerContextEdit: 'व्यक्तिगत करियर शर्तें संपादित करें →',
    sponsorTitle: 'JobBeagle को स्पॉन्सर करें',
    sponsorNote: '$0.50 से $1,000 तक। क्रेडिट नहीं मिलते — सिर्फ़ समर्थन।',
    sponsorAmount: 'USD राशि',
    sponsorCta: 'स्पॉन्सर',
    sponsorInvalid: '$0.50 से $1,000.00 के बीच राशि दर्ज करें।',
  },
  ar: {
    title: 'إدارة الحساب',
    back: 'العودة للرئيسية',
    needLogin: 'سجّل الدخول لإدارة حسابك.',
    overview: 'نظرة عامة',
    email: 'البريد',
    tier: 'العضوية',
    snapshotCredits: 'رصيد Fit Snapshot',
    strategyCredits: 'رصيد Interview Guide',
    remainingCredits: 'الرصيد المتبقي',
    statusActive: 'نشط',
    statusDeactivated: 'معطّل',
    subscription: 'الاشتراك والرصيد',
    subscriptionNote:
      'اشترِ أو رقِّ أدناه. ألغِ الخطة الشهرية من هنا بنقرة واحدة — يبقى الوصول حتى نهاية الفترة.',
    manageBilling: 'إدارة الفوترة',
    managingBilling: 'جارٍ الفتح…',
    cancelSub: 'إلغاء الاشتراك',
    cancelling: 'جارٍ الإلغاء…',
    cancelConfirm:
      'إلغاء الاشتراك الشهري؟ يبقى الوصول حتى نهاية الفترة الحالية. يمكنك الاشتراك مجددًا أدناه.',
    cancelOk: 'توقف الفوترة. يمكنك الاستخدام حتى {date}.',
    cancelOkNoDate: 'توقف الفوترة. يبقى الوصول حتى نهاية الفترة الحالية.',
    cancelNone: 'لا يوجد اشتراك شهري على هذا الحساب.',
    manageNone: 'تعذر فتح بوابة الفوترة. حاول لاحقًا.',
    subRenews: 'يتجدد {date}',
    subEnds: 'الوصول حتى {date}',
    subCancelledNote: 'توقفت الفوترة.',
    subUnmatched:
      'لا يظهر اشتراك فعّال. إذا كانت الخطة غير صحيحة، اشترِ من جديد أدناه.',
    buy: 'شراء',
    buying: 'جارٍ التحويل…',
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
    loadError: 'تعذر تحميل الحساب.',
    actionError: 'حدث خطأ. حاول مجددًا.',
    careerContextTitle: 'تخصيص شروط المسار المهني',
    careerContextSubtitle: 'Career Context',
    careerContextBlurb:
      'حدود شخصية اختيارية للموقع والراتب وتصريح العمل. كل Fit Snapshot وInterview Guide يُوائم التقييم وتوصيات الراتب وفق هذه الحدود.',
    careerContextCta: 'تعيين شروط المسار المهني المخصصة →',
    careerContextEdit: 'تعديل شروط المسار المهني المخصصة →',
    sponsorTitle: 'ادعم JobBeagle',
    sponsorNote: 'أي مبلغ من $0.50 إلى $1,000. لا يضيف رصيدًا — شكر فقط.',
    sponsorAmount: 'المبلغ بالدولار',
    sponsorCta: 'ادعم',
    sponsorInvalid: 'أدخل مبلغًا بين $0.50 و $1,000.00.',
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

function fillDate(template: string, iso: string | null, language: AppLanguage): string {
  if (!iso) return template.replace('{date}', '').replace(/\s{2,}/g, ' ').trim();
  return template.replace('{date}', formatDate(iso, language));
}

/** Visible billing-history data rows before the list scrolls. Header stays sticky. */
const BILLING_HISTORY_VISIBLE_ROWS = 5;

export default function AccountPage() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [data, setData] = useState<AccountPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<CheckoutPlanType | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState('0.50');
  const [billing, setBilling] = useState<BillingView | null>(null);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [activeSection, setActiveSection] = useState<AccountHashId>('overview');
  const navCopy = getAccountNavCopy(language);

  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/account/subscription');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBilling(null);
        setBillingLoaded(true);
        return;
      }
      const sub = body.subscription;
      setBilling(
        sub && typeof sub === 'object' && typeof sub.id === 'string'
          ? {
              id: sub.id,
              status: typeof sub.status === 'string' ? sub.status : '',
              planType: typeof sub.planType === 'string' ? sub.planType : null,
              membershipTier:
                sub.membershipTier === 'standard_sub' || sub.membershipTier === 'advanced_sub'
                  ? sub.membershipTier
                  : null,
              renewsAt: typeof sub.currentBillingPeriodEndsAt === 'string' 
                ? sub.currentBillingPeriodEndsAt 
                : (typeof sub.renewsAt === 'string' ? sub.renewsAt : null),
              endsAt: typeof sub.currentBillingPeriodEndsAt === 'string'
                ? sub.currentBillingPeriodEndsAt
                : (typeof sub.endsAt === 'string' ? sub.endsAt : null),
              cancelled: Boolean(sub.cancelled || sub.scheduledForCancellation),
              canCancel: Boolean(sub.canCancel),
              canManage: Boolean(sub.canManage),
            }
          : null,
      );
    } catch {
      setBilling(null);
    } finally {
      setBillingLoaded(true);
    }
  }, []);

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
      void loadBilling();
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError, loadBilling]);

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

  useEffect(() => {
    const sync = () => {
      const next = window.location.hash.replace(/^#/, '');
      if (next === 'subscription-actions' || next === 'sponsor') {
        setActiveSection('plans');
        return;
      }
      if (isAccountHashId(next)) setActiveSection(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!data) return;
    const nodes = ACCOUNT_HASH_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id && isAccountHashId(id)) setActiveSection(id);
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0.15, 0.35, 0.6] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [data]);

  const handleCheckout = async (plan: CheckoutPlanType, amountUsd?: string) => {
    setBusyPlan(plan);
    setError(null);
    const result = await startCheckout(plan, undefined, amountUsd);
    if (!result.ok) setError(result.error);
    setBusyPlan(null);
  };

  const handleSponsor = async () => {
    if (parseSponsorAmountCents(sponsorAmount) == null) {
      setError(t.sponsorInvalid);
      return;
    }
    await handleCheckout('author_sponsor', sponsorAmount);
  };

  const handleManageBilling = async () => {
    setPortalBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/billing-portal');
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.url !== 'string') {
        setError(typeof body.error === 'string' ? body.error : t.manageNone);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError(t.manageNone);
    } finally {
      setPortalBusy(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t.cancelConfirm)) return;
    setCancelBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/cancel-subscription', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : t.cancelNone);
        return;
      }
      const endsAt = typeof body.ends_at === 'string' ? body.ends_at : null;
      const sub = body.subscription;
      if (sub && typeof sub === 'object' && typeof sub.id === 'string') {
        setBilling({
          id: sub.id,
          status: typeof sub.status === 'string' ? sub.status : 'cancelled',
          planType: typeof sub.planType === 'string' ? sub.planType : null,
          membershipTier:
            sub.membershipTier === 'standard_sub' || sub.membershipTier === 'advanced_sub'
              ? sub.membershipTier
              : null,
          renewsAt: typeof sub.renewsAt === 'string' ? sub.renewsAt : null,
          endsAt,
          cancelled: true,
          canCancel: false,
          canManage: Boolean(sub.canManage),
        });
      } else {
        await loadBilling();
      }
    } catch {
      setError(t.actionError);
    } finally {
      setCancelBusy(false);
    }
  };

  const deactivated = Boolean(data?.profile.deactivated_at);

  return (
    <div className="account-font-large flex min-h-screen w-full flex-col items-stretch bg-slate-950 text-zinc-100">
      <FitStage
        designWidth={ACCOUNT_DESIGN_WIDTH}
        minScale={1}
        maxScale={1}
        mode="fill"
        className="w-full min-h-screen !justify-start !items-start"
      >
      <main
        className={`mx-0 w-full max-w-full ${PAGE_SHELL_GUTTER} py-6 sm:py-10 space-y-8 sm:space-y-10`}
        data-fit-ref="account"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo size="nav" showIcon />
          <div className="account-header-controls flex flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher variant="dark" size="lg" />
            <LoginButton redirectTo="/account" />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-lg text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-[1em] h-[1em]" />
            {t.back}
          </button>
          <h1 className="text-4xl font-bold text-white">{t.title}</h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 py-12 justify-center">
            <Loader2 className="w-[1em] h-[1em] animate-spin" />
          </div>
        )}

        {!loading && signedIn === false && (
          <div className={`${ACCOUNT_CARD} text-center`}>
            <p className="text-xl text-zinc-200">{t.needLogin}</p>
            <LoginButton redirectTo="/account" />
          </div>
        )}

        {!loading && signedIn && data && (
          <>
            {error && (
              <p className="text-lg text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className={SAMPLE_RAIL_ROW}>
            <AccountSectionNav language={language} activeId={activeSection} />
            <div className="min-w-0 flex-1 space-y-8 sm:space-y-10">

            <section id="overview" className={ACCOUNT_CARD}>
              <h2 className={ACCOUNT_HEADING}>{navCopy.overview}</h2>
              <dl className="grid gap-3 text-lg sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-400">{t.email}</dt>
                  <dd className="text-white">{data.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-400">{t.tier}</dt>
                  <dd className="text-white">{tierLabel(data.profile.membership_tier)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-zinc-400 mb-1.5">{t.remainingCredits}</dt>
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
                  <dt className="text-zinc-400">Status</dt>
                  <dd className="text-zinc-100 font-medium">
                    {deactivated ? t.statusDeactivated : t.statusActive}
                  </dd>
                </div>
              </dl>
            </section>

            <section id="career-context" className={ACCOUNT_CARD}>
              <div className="flex items-start gap-3">
                <Target className="w-[1em] h-[1em] text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className={ACCOUNT_HEADING}>{navCopy.careerContext}</h2>
                  {t.careerContextSubtitle ? (
                    <p className="text-sm font-medium tracking-wide text-zinc-400 mt-0.5">
                      {t.careerContextSubtitle}
                    </p>
                  ) : null}
                  <p className="text-lg text-zinc-400 mt-1 leading-snug">{t.careerContextBlurb}</p>
                </div>
              </div>
              <Link href="/career-context" className={`inline-flex items-center ${PRIMARY_BTN}`}>
                {careerContextHasSignal(data.profile.career_context)
                  ? t.careerContextEdit
                  : t.careerContextCta}
              </Link>
            </section>

            <section id="plans" className={`${ACCOUNT_CARD} space-y-5`}>
              <div className="flex items-start gap-3">
                <CreditCard className="w-[1em] h-[1em] text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className={ACCOUNT_HEADING}>{navCopy.plans}</h2>
                  <p className="text-lg text-zinc-400 mt-1 leading-snug">{t.subscriptionNote}</p>
                </div>
              </div>
              {billingLoaded
                && !billing
                && (data.profile.membership_tier === 'standard_sub'
                  || data.profile.membership_tier === 'advanced_sub') ? (
                <p className="text-lg text-zinc-200">{t.subUnmatched}</p>
              ) : null}
              <ul className="space-y-3">
                {ACTIVE_CHECKOUT_PLAN_TYPES.map((planType) => {
                  const plan = CHECKOUT_PLANS[planType];
                  const label =
                    language === 'zh-TW' || language === 'zh-CN' ? plan.labelZhTW : plan.labelEn;
                  return (
                    <li
                      key={planType}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-500/40 bg-slate-950/50 px-5 py-3.5"
                    >
                      <span className="text-lg text-zinc-100">{label}</span>
                      <button
                        type="button"
                        disabled={Boolean(busyPlan) || deactivated}
                        onClick={() => void handleCheckout(planType)}
                        className={PRIMARY_BTN}
                      >
                        {busyPlan === planType ? t.buying : t.buy}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-3 border-t border-blue-500/30 pt-5">
                <div className="flex flex-wrap items-center gap-3">
                  {billing?.canManage ? (
                    <button
                      type="button"
                      disabled={portalBusy || deactivated}
                      onClick={() => void handleManageBilling()}
                      className={SECONDARY_BTN}
                    >
                      {portalBusy ? t.managingBilling : t.manageBilling}
                    </button>
                  ) : null}
                  {billing?.canCancel ? (
                    <button
                      type="button"
                      disabled={cancelBusy || deactivated}
                      onClick={() => void handleCancelSubscription()}
                      className={SECONDARY_BTN}
                    >
                      {cancelBusy ? t.cancelling : t.cancelSub}
                    </button>
                  ) : null}
                  {billingLoaded && !billing?.canManage && !billing?.canCancel ? (
                    <p className="text-lg text-zinc-400">{t.cancelNone}</p>
                  ) : null}
                </div>
                {billingLoaded && billing ? (
                  <p className="text-lg text-zinc-400">
                    {billing.cancelled || billing.status === 'cancelled'
                      ? `${t.subCancelledNote} ${fillDate(t.subEnds, billing.endsAt, language)}`.trim()
                      : fillDate(t.subRenews, billing.renewsAt ?? billing.endsAt, language)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-blue-500/30 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 sm:flex-1">
                  <h3 className={ACCOUNT_HEADING}>{t.sponsorTitle}</h3>
                  <p className="text-base text-zinc-400 mt-1">{t.sponsorNote}</p>
                </div>
                <div className="flex flex-wrap items-end gap-3 shrink-0">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-zinc-400">{t.sponsorAmount}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-zinc-300">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.50"
                        max="1000"
                        step="0.01"
                        value={sponsorAmount}
                        disabled={Boolean(busyPlan) || deactivated}
                        onChange={(e) => setSponsorAmount(e.target.value)}
                        className="w-[8em] min-w-[8em] shrink-0 rounded-lg border border-blue-500/50 bg-slate-950 px-3 py-2 text-lg tabular-nums text-zinc-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  </label>
                  <button
                    type="button"
                    disabled={Boolean(busyPlan) || deactivated}
                    onClick={() => void handleSponsor()}
                    className="px-5 py-2.5 text-lg font-bold rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
                  >
                    {busyPlan === 'author_sponsor' ? t.buying : t.sponsorCta}
                  </button>
                </div>
              </div>
            </section>

            <section id="billing" className={ACCOUNT_CARD}>
              <h2 className={ACCOUNT_HEADING}>{navCopy.billing}</h2>
              {data.orders.length === 0 ? (
                <p className="text-lg text-zinc-400">{t.billingEmpty}</p>
              ) : (
                <div
                  className="overflow-x-auto overflow-y-auto overscroll-contain"
                  data-billing-history-visible-rows={BILLING_HISTORY_VISIBLE_ROWS}
                >
                  <table className="w-full border-separate border-spacing-0 text-lg text-left">
                    <thead className="sticky top-0 z-10 bg-blue-950 text-zinc-400 shadow-[0_1px_0_0_rgb(59_130_246)]">
                      <tr>
                        <th className="py-3 pr-4 font-medium">{t.date}</th>
                        <th className="py-3 pr-4 font-medium">{t.plan}</th>
                        <th className="py-3 pr-4 font-medium">{t.amount}</th>
                        <th className="py-3 pr-3 font-medium">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id}>
                          <td className="border-b border-blue-500/20 py-3 pr-4 text-zinc-300 whitespace-nowrap">
                            {formatDate(o.created_at, language)}
                          </td>
                          <td className="border-b border-blue-500/20 py-3 pr-4 text-zinc-100 whitespace-nowrap">
                            {o.plan_type}
                          </td>
                          <td className="border-b border-blue-500/20 py-3 pr-4 text-zinc-100 whitespace-nowrap">
                            {formatMoney(Number(o.amount), o.currency)}
                          </td>
                          <td className="border-b border-blue-500/20 py-3 pr-3 text-zinc-400 whitespace-nowrap">
                            {o.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section id="referrals" className={`${ACCOUNT_CARD} space-y-5`}>
              <div className="flex items-start gap-3">
                <Gift className="w-[1em] h-[1em] text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className={ACCOUNT_HEADING}>{navCopy.referrals}</h2>
                  <p className="text-lg text-zinc-400 mt-1">
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
                <p className="text-lg text-zinc-400">{t.referralEmpty}</p>
              ) : (
                <ul className="space-y-2 text-lg">
                  {data.referrals.map((r) => (
                    <li
                      key={r.id}
                      className="flex justify-between gap-2 rounded-lg border border-blue-500/40 px-4 py-3"
                    >
                      <span className="text-zinc-400 font-mono text-base truncate">
                        {r.referee_id.slice(0, 8)}…
                      </span>
                      <span className="text-zinc-200 whitespace-nowrap">
                        {formatDate(r.created_at, language)} ·{' '}
                        {r.is_activated ? t.activated : t.pending}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            </div>
            </div>
          </>
        )}
      </main>
      </FitStage>
    </div>
  );
}
