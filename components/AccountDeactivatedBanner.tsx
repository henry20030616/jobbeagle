'use client';

import Link from 'next/link';
import type { AppLanguage } from '@/lib/language-context';

const copy: Record<AppLanguage, { message: string; cta: string }> = {
  en: {
    message: 'Your account is deactivated. Analyze and checkout are paused.',
    cta: 'Reactivate in Account management',
  },
  'zh-TW': {
    message: '帳戶已停用，目前無法分析與結帳。',
    cta: '前往帳戶管理重新啟用',
  },
  'zh-CN': {
    message: '账户已停用，目前无法分析与结账。',
    cta: '前往账户管理重新启用',
  },
  es: {
    message: 'Tu cuenta está desactivada. Análisis y checkout pausados.',
    cta: 'Reactivar en Gestión de cuenta',
  },
  hi: {
    message: 'आपका खाता निष्क्रिय है। विश्लेषण और चेकआउट रुके हैं।',
    cta: 'खाता प्रबंधन में पुनः सक्रिय करें',
  },
  ar: {
    message: 'حسابك معطّل. التحليل والدفع متوقفان.',
    cta: 'أعد التفعيل من إدارة الحساب',
  },
};

export default function AccountDeactivatedBanner({
  language = 'en',
}: {
  language?: AppLanguage;
}) {
  const t = copy[language] ?? copy.en;
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100 flex flex-wrap items-center justify-between gap-3"
    >
      <p>{t.message}</p>
      <Link
        href="/account"
        className="shrink-0 font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
      >
        {t.cta}
      </Link>
    </div>
  );
}
