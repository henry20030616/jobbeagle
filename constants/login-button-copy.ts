import type { AppLanguage } from '@/lib/report-language';

export type LoginButtonCopy = {
  loading: string;
  account: string;
  accountTitle: string;
  logout: string;
  userFallback: string;
};

export const LOGIN_BUTTON_COPY: Record<AppLanguage, LoginButtonCopy> = {
  'zh-TW': {
    loading: '載入中...',
    account: '帳戶',
    accountTitle: '我的帳號管理',
    logout: '登出',
    userFallback: '用戶',
  },
  'zh-CN': {
    loading: '加载中...',
    account: '账户',
    accountTitle: '我的帐号管理',
    logout: '退出',
    userFallback: '用户',
  },
  en: {
    loading: 'Loading...',
    account: 'Account',
    accountTitle: 'My account',
    logout: 'Log out',
    userFallback: 'User',
  },
  es: {
    loading: 'Cargando...',
    account: 'Cuenta',
    accountTitle: 'Mi cuenta',
    logout: 'Salir',
    userFallback: 'Usuario',
  },
  hi: {
    loading: 'लोड हो रहा है...',
    account: 'खाता',
    accountTitle: 'मेरा खाता',
    logout: 'लॉग आउट',
    userFallback: 'उपयोगकर्ता',
  },
  ar: {
    loading: 'جارٍ التحميل...',
    account: 'الحساب',
    accountTitle: 'حسابي',
    logout: 'تسجيل الخروج',
    userFallback: 'مستخدم',
  },
};

export function getLoginButtonCopy(language: AppLanguage): LoginButtonCopy {
  return LOGIN_BUTTON_COPY[language] ?? LOGIN_BUTTON_COPY.en;
}
