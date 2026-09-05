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
    loadError: string;
    actionError: string;
    careerContextTitle: string;
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
    snapshotCredits: 'Job Fit Snapshot credits',
    strategyCredits: 'Interview Strategy Guide credits',
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
    cancelNone: 'No cancellable monthly subscription found for this email.',
    manageNone: 'Could not open the billing portal. Try again in a moment.',
    subRenews: 'Renews {date}',
    subEnds: 'Access until {date}',
    subCancelledNote: 'Billing has stopped.',
    subUnmatched:
      'No Lemon Squeezy subscription matched this email. If you still pay monthly, use the cancel link in your receipt.',
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
    loadError: 'Could not load account.',
    actionError: 'Something went wrong. Try again.',
    careerContextTitle: 'Career Context',
    careerContextBlurb:
      'Optional floors for fit and offer targeting. Lives on its own page — not mixed with billing.',
    careerContextCta: 'Set Career Context →',
    careerContextEdit: 'Edit Career Context →',
    sponsorTitle: 'Sponsor the author',
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
    snapshotCredits: 'Job Fit Snapshot 額度',
    strategyCredits: 'Interview Strategy Guide 額度',
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
    cancelNone: '此信箱沒有可取消的月費訂閱。',
    manageNone: '無法開啟帳單入口，請稍後再試。',
    subRenews: '下次續訂 {date}',
    subEnds: '可用至 {date}',
    subCancelledNote: '已停止扣款。',
    subUnmatched:
      '找不到與此信箱對應的 Lemon Squeezy 訂閱。若仍在扣款，請用訂單確認信中的取消連結。',
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
    loadError: '無法載入帳戶資料。',
    actionError: '操作失敗，請稍後再試。',
    careerContextTitle: 'Career Context',
    careerContextBlurb: '選填底線，用來對齊 fit 與薪資目標。獨立頁設定，不跟買額度混在一起。',
    careerContextCta: '設定 Career Context →',
    careerContextEdit: '編輯 Career Context →',
    sponsorTitle: '贊助作者',
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
    snapshotCredits: 'Job Fit Snapshot 额度',
    strategyCredits: 'Interview Strategy Guide 额度',
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
    cancelNone: '此邮箱没有可取消的月费订阅。',
    manageNone: '无法打开账单入口，请稍后再试。',
    subRenews: '下次续订 {date}',
    subEnds: '可用至 {date}',
    subCancelledNote: '已停止扣款。',
    subUnmatched:
      '找不到与此邮箱对应的 Lemon Squeezy 订阅。若仍在扣款，请用订单确认信中的取消链接。',
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
    loadError: '无法加载账户数据。',
    actionError: '操作失败，请稍后再试。',
    careerContextTitle: 'Career Context',
    careerContextBlurb: '可选底线，用于对齐 fit 与薪酬目标。在独立页设置，不和买额度混在一起。',
    careerContextCta: '设置 Career Context →',
    careerContextEdit: '编辑 Career Context →',
    sponsorTitle: '赞助作者',
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
    snapshotCredits: 'Créditos Job Fit Snapshot',
    strategyCredits: 'Créditos Interview Strategy Guide',
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
    cancelNone: 'No hay una suscripción mensual cancelable para este email.',
    manageNone: 'No se pudo abrir el portal de facturación. Inténtalo de nuevo.',
    subRenews: 'Se renueva {date}',
    subEnds: 'Acceso hasta {date}',
    subCancelledNote: 'El cobro se detuvo.',
    subUnmatched:
      'No hay una suscripción de Lemon Squeezy para este email. Si aún te cobran, usa el enlace del recibo.',
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
    loadError: 'No se pudo cargar la cuenta.',
    actionError: 'Algo falló. Inténtalo de nuevo.',
    careerContextTitle: 'Career Context',
    careerContextBlurb:
      'Pisos opcionales para fit y compensación. En su propia página, no mezclado con facturación.',
    careerContextCta: 'Configurar Career Context →',
    careerContextEdit: 'Editar Career Context →',
    sponsorTitle: 'Patrocinar al autor',
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
    snapshotCredits: 'Job Fit Snapshot क्रेडिट',
    strategyCredits: 'Interview Strategy Guide क्रेडिट',
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
    cancelNone: 'इस ईमेल पर रद्द करने योग्य मासिक सदस्यता नहीं मिली।',
    manageNone: 'बिलिंग पोर्टल नहीं खुल सका। बाद में प्रयास करें।',
    subRenews: 'नवीनीकरण {date}',
    subEnds: '{date} तक ऐक्सेस',
    subCancelledNote: 'बिलिंग बंद हो गई।',
    subUnmatched:
      'इस ईमेल से Lemon Squeezy सदस्यता नहीं मिली। अगर अभी भी शुल्क कट रहा है तो रसीद वाला लिंक उपयोग करें।',
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
    loadError: 'खाता लोड नहीं हो सका।',
    actionError: 'त्रुटि। पुनः प्रयास करें।',
    careerContextTitle: 'Career Context',
    careerContextBlurb:
      'Fit और ऑफर के लिए वैकल्पिक floors। अलग पेज पर सेट करें — बिलिंग के साथ नहीं।',
    careerContextCta: 'Career Context सेट करें →',
    careerContextEdit: 'Career Context संपादित करें →',
    sponsorTitle: 'लेखक को स्पॉन्सर करें',
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
    snapshotCredits: 'رصيد Job Fit Snapshot',
    strategyCredits: 'رصيد Interview Strategy Guide',
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
    cancelNone: 'لا يوجد اشتراك شهري قابل للإلغاء لهذا البريد.',
    manageNone: 'تعذر فتح بوابة الفوترة. حاول لاحقًا.',
    subRenews: 'يتجدد {date}',
    subEnds: 'الوصول حتى {date}',
    subCancelledNote: 'توقفت الفوترة.',
    subUnmatched:
      'لا يوجد اشتراك Lemon Squeezy لهذا البريد. إن استمر الخصم فاستخدم رابط رسالة الطلب.',
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
    loadError: 'تعذر تحميل الحساب.',
    actionError: 'حدث خطأ. حاول مجددًا.',
    careerContextTitle: 'Career Context',
    careerContextBlurb:
      'حدود اختيارية للملاءمة والعرض. صفحة مستقلة — ليست مع الفوترة.',
    careerContextCta: 'تعيين Career Context →',
    careerContextEdit: 'تعديل Career Context →',
    sponsorTitle: 'ادعم المؤلف',
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <FitStage designWidth={ACCOUNT_DESIGN_WIDTH} minScale={1} maxScale={2} className="w-full">
      <main className="mx-auto w-full px-8 py-10 space-y-10" data-fit-ref="account">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo size="nav" showIcon />
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dark" size="lg" />
            <LoginButton redirectTo="/account" />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-lg text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.back}
          </button>
          <h1 className="text-4xl font-bold text-white">{t.title}</h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && signedIn === false && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center space-y-4">
            <p className="text-xl text-slate-300">{t.needLogin}</p>
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

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-7 space-y-4">
              <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
                {t.overview}
              </h2>
              <dl className="grid gap-3 text-lg sm:grid-cols-2">
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

            <section className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-7 space-y-4">
              <div className="flex items-start gap-3">
                <Target className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-semibold uppercase tracking-wide text-emerald-200/90">
                    {t.careerContextTitle}
                  </h2>
                  <p className="text-lg text-slate-400 mt-1 leading-snug">{t.careerContextBlurb}</p>
                </div>
              </div>
              <Link
                href="/career-context"
                className="inline-flex items-center px-5 py-2.5 text-lg font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {careerContextHasSignal(data.profile.career_context)
                  ? t.careerContextEdit
                  : t.careerContextCta}
              </Link>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-7 space-y-5">
              <div className="flex items-start gap-3">
                <CreditCard className="w-7 h-7 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
                    {t.subscription}
                  </h2>
                  <p className="text-lg text-slate-500 mt-1 leading-snug">{t.subscriptionNote}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {billing?.canManage ? (
                  <button
                    type="button"
                    disabled={portalBusy || deactivated}
                    onClick={() => void handleManageBilling()}
                    className="px-5 py-2.5 text-lg font-bold rounded-lg border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {portalBusy ? t.managingBilling : t.manageBilling}
                  </button>
                ) : null}
                {billing?.canCancel ? (
                  <button
                    type="button"
                    disabled={cancelBusy || deactivated}
                    onClick={() => void handleCancelSubscription()}
                    className="px-5 py-2.5 text-lg font-bold rounded-lg border border-rose-400/60 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                  >
                    {cancelBusy ? t.cancelling : t.cancelSub}
                  </button>
                ) : null}
              </div>
              {billingLoaded && billing ? (
                <p className="text-lg text-slate-400">
                  {billing.cancelled || billing.status === 'cancelled'
                    ? `${t.subCancelledNote} ${fillDate(t.subEnds, billing.endsAt, language)}`.trim()
                    : fillDate(t.subRenews, billing.renewsAt ?? billing.endsAt, language)}
                </p>
              ) : null}
              {billingLoaded
                && !billing
                && (data.profile.membership_tier === 'standard_sub'
                  || data.profile.membership_tier === 'advanced_sub') ? (
                <p className="text-lg text-amber-200/80">{t.subUnmatched}</p>
              ) : null}
              <ul className="space-y-3">
                {ACTIVE_CHECKOUT_PLAN_TYPES.map((planType) => {
                  const plan = CHECKOUT_PLANS[planType];
                  const label =
                    language === 'zh-TW' || language === 'zh-CN' ? plan.labelZhTW : plan.labelEn;
                  return (
                    <li
                      key={planType}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-slate-950/50 px-5 py-3.5"
                    >
                      <span className="text-lg text-slate-200">{label}</span>
                      <button
                        type="button"
                        disabled={Boolean(busyPlan) || deactivated}
                        onClick={() => void handleCheckout(planType)}
                        className="px-5 py-2.5 text-lg font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
                      >
                        {busyPlan === planType ? t.buying : t.buy}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-5 py-4 space-y-3">
                <div>
                  <p className="text-lg font-semibold text-amber-100">{t.sponsorTitle}</p>
                  <p className="text-base text-slate-400 mt-1">{t.sponsorNote}</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-slate-400">{t.sponsorAmount}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-slate-300">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.50"
                        max="1000"
                        step="0.01"
                        value={sponsorAmount}
                        disabled={Boolean(busyPlan) || deactivated}
                        onChange={(e) => setSponsorAmount(e.target.value)}
                        className="w-32 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-lg text-slate-100"
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

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-7 space-y-4">
              <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
                {t.billing}
              </h2>
              {data.orders.length === 0 ? (
                <p className="text-lg text-slate-500">{t.billingEmpty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-lg text-left">
                    <thead className="text-slate-500 border-b border-slate-700">
                      <tr>
                        <th className="py-3 pr-4 font-medium">{t.date}</th>
                        <th className="py-3 pr-4 font-medium">{t.plan}</th>
                        <th className="py-3 pr-4 font-medium">{t.amount}</th>
                        <th className="py-3 font-medium">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id} className="border-b border-slate-800/80">
                          <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                            {formatDate(o.created_at, language)}
                          </td>
                          <td className="py-3 pr-4 text-slate-200">{o.plan_type}</td>
                          <td className="py-3 pr-4 text-slate-200">
                            {formatMoney(Number(o.amount), o.currency)}
                          </td>
                          <td className="py-3 text-slate-400">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-7 space-y-5">
              <div className="flex items-start gap-3">
                <Gift className="w-7 h-7 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
                    {t.referrals}
                  </h2>
                  <p className="text-lg text-slate-500 mt-1">
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
                <p className="text-lg text-slate-500">{t.referralEmpty}</p>
              ) : (
                <ul className="space-y-2 text-lg">
                  {data.referrals.map((r) => (
                    <li
                      key={r.id}
                      className="flex justify-between gap-2 rounded-lg border border-slate-700/60 px-4 py-3"
                    >
                      <span className="text-slate-400 font-mono text-base truncate">
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
          </>
        )}
      </main>
      </FitStage>
    </div>
  );
}
