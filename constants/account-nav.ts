import type { AppLanguage } from '@/lib/report-language';

/**
 * Hash targets for on-page /account sections. Keep in sync with ids in
 * `app/account/page.tsx`. Pause/delete already lives on `/account/danger`.
 * Purchase, cancel, and sponsor share `#plans`.
 */
export const ACCOUNT_HASH_IDS = [
  'overview',
  'career-context',
  'plans',
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
  { id: 'billing', href: '#billing' },
  { id: 'referrals', href: '#referrals' },
  { id: 'danger', href: '/account/danger' },
];

export type AccountNavCopy = {
  ariaLabel: string;
  overview: string;
  careerContext: string;
  plans: string;
  billing: string;
  referrals: string;
  danger: string;
};

export const ACCOUNT_NAV_COPY: Record<AppLanguage, AccountNavCopy> = {
  en: {
    ariaLabel: 'Account functions',
    overview: 'Overview',
    careerContext: 'Personalize',
    plans: 'Buy credits',
    billing: 'Billing history',
    referrals: 'Referrals',
    danger: 'Pause / delete account',
  },
  'zh-TW': {
    ariaLabel: '帳戶功能',
    overview: '總覽',
    careerContext: '個人化職涯條件',
    plans: '購買方案',
    billing: '帳單紀錄',
    referrals: '推薦紀錄',
    danger: '暫停／刪除帳戶',
  },
  'zh-CN': {
    ariaLabel: '账户功能',
    overview: '总览',
    careerContext: '个性化职涯条件',
    plans: '购买方案',
    billing: '账单记录',
    referrals: '推荐记录',
    danger: '暂停／删除账户',
  },
  es: {
    ariaLabel: 'Funciones de la cuenta',
    overview: 'Resumen',
    careerContext: 'Personalizar',
    plans: 'Comprar créditos',
    billing: 'Historial de facturación',
    referrals: 'Referidos',
    danger: 'Pausar / eliminar cuenta',
  },
  hi: {
    ariaLabel: 'खाता फ़ंक्शन',
    overview: 'अवलोकन',
    careerContext: 'व्यक्तिगत करियर शर्तें',
    plans: 'क्रेडिट खरीदें',
    billing: 'बिलिंग इतिहास',
    referrals: 'रेफरल',
    danger: 'खाता रोकें / हटाएं',
  },
  ar: {
    ariaLabel: 'وظائف الحساب',
    overview: 'نظرة عامة',
    careerContext: 'تخصيص شروط المسار المهني',
    plans: 'شراء الرصيد',
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
    case 'billing':
      return copy.billing;
    case 'referrals':
      return copy.referrals;
    case 'danger':
      return copy.danger;
  }
}
