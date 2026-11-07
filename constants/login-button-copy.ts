import type { AppLanguage } from '@/lib/report-language';

export type LoginButtonCopy = {
  loading: string;
  account: string;
  accountTitle: string;
  logout: string;
  userFallback: string;
  google: string;
  email: string;
  emailPlaceholder: string;
  emailSend: string;
  emailSending: string;
  emailSent: string;
  emailInvalid: string;
  emailError: string;
  moreWays: string;
};

export const LOGIN_BUTTON_COPY: Record<AppLanguage, LoginButtonCopy> = {
  'zh-TW': {
    loading: '載入中...',
    account: '帳戶',
    accountTitle: '我的帳號管理',
    logout: '登出',
    userFallback: '用戶',
    google: 'Google',
    email: 'Email 登入',
    emailPlaceholder: 'you@email.com',
    emailSend: '寄送登入連結',
    emailSending: '寄送中…',
    emailSent: '已寄出連結，請到信箱點開登入（可含垃圾郵件匣）。',
    emailInvalid: '請輸入有效的 Email。',
    emailError: '寄送失敗，請稍後再試。',
    moreWays: '其他登入方式',
  },
  'zh-CN': {
    loading: '加载中...',
    account: '账户',
    accountTitle: '我的帐号管理',
    logout: '退出',
    userFallback: '用户',
    google: 'Google',
    email: 'Email 登录',
    emailPlaceholder: 'you@email.com',
    emailSend: '发送登录链接',
    emailSending: '发送中…',
    emailSent: '已发送链接，请到邮箱打开登录（可查看垃圾邮件）。',
    emailInvalid: '请输入有效的 Email。',
    emailError: '发送失败，请稍后再试。',
    moreWays: '其他登录方式',
  },
  en: {
    loading: 'Loading...',
    account: 'Account',
    accountTitle: 'My account',
    logout: 'Log out',
    userFallback: 'User',
    google: 'Google',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    emailSend: 'Send magic link',
    emailSending: 'Sending…',
    emailSent: 'Check your email for the sign-in link (and spam folder).',
    emailInvalid: 'Enter a valid email.',
    emailError: 'Could not send the link. Try again.',
    moreWays: 'More ways to sign in',
  },
  es: {
    loading: 'Cargando...',
    account: 'Cuenta',
    accountTitle: 'Mi cuenta',
    logout: 'Salir',
    userFallback: 'Usuario',
    google: 'Google',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    emailSend: 'Enviar enlace',
    emailSending: 'Enviando…',
    emailSent: 'Revisa tu correo para el enlace de acceso (y spam).',
    emailInvalid: 'Introduce un email válido.',
    emailError: 'No se pudo enviar el enlace. Inténtalo de nuevo.',
    moreWays: 'Más formas de entrar',
  },
  hi: {
    loading: 'लोड हो रहा है...',
    account: 'खाता',
    accountTitle: 'मेरा खाता',
    logout: 'लॉग आउट',
    userFallback: 'उपयोगकर्ता',
    google: 'Google',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    emailSend: 'लॉगिन लिंक भेजें',
    emailSending: 'भेजा जा रहा है…',
    emailSent: 'साइन-इन लिंक के लिए अपना ईमेल देखें (स्पैम भी)।',
    emailInvalid: 'मान्य ईमेल दर्ज करें।',
    emailError: 'लिंक नहीं भेजा जा सका। फिर कोशिश करें।',
    moreWays: 'और साइन-इन तरीके',
  },
  ar: {
    loading: 'جارٍ التحميل...',
    account: 'الحساب',
    accountTitle: 'حسابي',
    logout: 'تسجيل الخروج',
    userFallback: 'مستخدم',
    google: 'Google',
    email: 'البريد',
    emailPlaceholder: 'you@email.com',
    emailSend: 'أرسل رابط الدخول',
    emailSending: 'جارٍ الإرسال…',
    emailSent: 'تحقق من بريدك لرابط تسجيل الدخول (وصندوق السبام).',
    emailInvalid: 'أدخل بريداً صالحاً.',
    emailError: 'تعذر إرسال الرابط. حاول مجدداً.',
    moreWays: 'طرق دخول أخرى',
  },
};

export function getLoginButtonCopy(language: AppLanguage): LoginButtonCopy {
  return LOGIN_BUTTON_COPY[language] ?? LOGIN_BUTTON_COPY.en;
}
