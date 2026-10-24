import type { AppLanguage } from '@/lib/report-language';

/**
 * Hash targets for on-page /account tab panels. Keep in sync with ids in
 * `app/account/page.tsx`. Pause/delete already lives on `/account/danger`.
 */
export const ACCOUNT_HASH_IDS = [
  'overview',
  'career-context',
  'plans',
  'subscription-actions',
  'sponsor',
  'billing',
  'referrals',
] as const;

export type AccountHashId = (typeof ACCOUNT_HASH_IDS)[number];

export function isAccountHashId(value: string): value is AccountHashId {
  return (ACCOUNT_HASH_IDS as readonly string[]).includes(value);
}

export type AccountNavItem =
  | { id: AccountHashId; href: `#${AccountHashId}` }
  | { id: 'danger'; href: '/account/danger' };

export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { id: 'overview', href: '#overview' },
  { id: 'career-context', href: '#career-context' },
  { id: 'plans', href: '#plans' },
  { id: 'subscription-actions', href: '#subscription-actions' },
  { id: 'sponsor', href: '#sponsor' },
  { id: 'billing', href: '#billing' },
  { id: 'referrals', href: '#referrals' },
  { id: 'danger', href: '/account/danger' },
];

export type AccountNavCopy = {
  ariaLabel: string;
  overview: string;
  careerContext: string;
  plans: string;
  subscriptionActions: string;
  sponsor: string;
  billing: string;
  referrals: string;
  danger: string;
};

export const ACCOUNT_NAV_COPY: Record<AppLanguage, AccountNavCopy> = {
  en: {
    ariaLabel: 'Account functions',
    overview: 'Overview',
    careerContext: 'Career Context',
    plans: 'Buy credits',
    subscriptionActions: 'Cancel subscription',
    sponsor: 'Sponsor JobBeagle',
    billing: 'Billing history',
    referrals: 'Referrals',
    danger: 'Pause / delete account',
  },
  'zh-TW': {
    ariaLabel: '帳戶功能',
    overview: '總覽',
    careerContext: '職涯條件',
    plans: '購買方案',
    subscriptionActions: '取消訂閱',
    sponsor: '贊助 JobBeagle',
    billing: '帳單紀錄',
    referrals: '推薦紀錄',
    danger: '暫停／刪除帳戶',
  },
  'zh-CN': {
    ariaLabel: '账户功能',
    overview: '总览',
    careerContext: '职涯条件',
    plans: '购买方案',
    subscriptionActions: '取消订阅',
    sponsor: '赞助 JobBeagle',
    billing: '账单记录',
    referrals: '推荐记录',
    danger: '暂停／删除账户',
  },
  es: {
    ariaLabel: 'Funciones de la cuenta',
    overview: 'Resumen',
    careerContext: 'Condiciones profesionales',
    plans: 'Comprar créditos',
    subscriptionActions: 'Cancelar suscripción',
    sponsor: 'Patrocinar JobBeagle',
    billing: 'Historial de facturación',
    referrals: 'Referidos',
    danger: 'Pausar / eliminar cuenta',
  },
  hi: {
    ariaLabel: 'खाता फ़ंक्शन',
    overview: 'अवलोकन',
    careerContext: 'करियर शर्तें',
    plans: 'क्रेडिट खरीदें',
    subscriptionActions: 'सदस्यता रद्द करें',
    sponsor: 'JobBeagle को स्पॉन्सर करें',
    billing: 'बिलिंग इतिहास',
    referrals: 'रेफरल',
    danger: 'खाता रोकें / हटाएं',
  },
  ar: {
    ariaLabel: 'وظائف الحساب',
    overview: 'نظرة عامة',
    careerContext: 'شروط المسار المهني',
    plans: 'شراء الرصيد',
    subscriptionActions: 'إلغاء الاشتراك',
    sponsor: 'ادعم JobBeagle',
    billing: 'سجل الفوترة',
    referrals: 'الإحالات',
    danger: 'إيقاف / حذف الحساب',
  },
};

export function getAccountNavCopy(language: AppLanguage): AccountNavCopy {
  return ACCOUNT_NAV_COPY[language] ?? ACCOUNT_NAV_COPY.en;
}

export function accountNavLabel(item: AccountNavItem, copy: AccountNavCopy): string {
  switch (item.id) {
    case 'overview':
      return copy.overview;
    case 'career-context':
      return copy.careerContext;
    case 'plans':
      return copy.plans;
    case 'subscription-actions':
      return copy.subscriptionActions;
    case 'sponsor':
      return copy.sponsor;
    case 'billing':
      return copy.billing;
    case 'referrals':
      return copy.referrals;
    case 'danger':
      return copy.danger;
  }
}
