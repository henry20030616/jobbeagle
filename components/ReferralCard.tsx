'use client';

import React, { useState } from 'react';
import type { AppLanguage } from '@/lib/language-context';
import { Copy, Check, Gift } from 'lucide-react';

interface ReferralCardProps {
  referralCode: string | null | undefined;
  language?: AppLanguage;
  compact?: boolean;
  /** @deprecated Credits live on /account — ignored */
  userProfile?: unknown;
}

const copy: Record<
  AppLanguage,
  {
    title: string;
    desc: string;
    copied: string;
    copy: string;
  }
> = {
  'zh-TW': {
    title: '推薦好友 · +1 Job Fit Snapshot',
    desc: '好友註冊並完成首次 Snapshot 後，你獲得 1 次額度。',
    copied: '已複製',
    copy: '複製推薦連結',
  },
  'zh-CN': {
    title: '推荐好友 · +1 Job Fit Snapshot',
    desc: '好友注册并完成首次 Snapshot 后，你获得 1 次额度。',
    copied: '已复制',
    copy: '复制推荐链接',
  },
  en: {
    title: 'Refer a friend · +1 Job Fit Snapshot',
    desc: 'Earn +1 Snapshot when they sign up and finish their first Snapshot.',
    copied: 'Copied',
    copy: 'Copy referral link',
  },
  es: {
    title: 'Invita · +1 Job Fit Snapshot',
    desc: 'Ganas +1 Snapshot cuando completen su primer análisis.',
    copied: 'Copiado',
    copy: 'Copiar enlace',
  },
  hi: {
    title: 'रेफर करें · +1 Job Fit Snapshot',
    desc: 'पहला Snapshot पूरा करने पर +1 मिलता है।',
    copied: 'कॉपी हो गया',
    copy: 'लिंक कॉपी करें',
  },
  ar: {
    title: 'أحِل صديقًا · +1 Job Fit Snapshot',
    desc: 'تحصل على +1 عند إكمال أول Snapshot.',
    copied: 'تم النسخ',
    copy: 'نسخ رابط الإحالة',
  },
};

export default function ReferralCard({
  referralCode,
  language = 'en',
  compact = false,
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const t = copy[language] ?? copy.en;

  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(referralCode || '')}`
      : `https://www.jobbeagle.com/?ref=${encodeURIComponent(referralCode || '')}`;

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!referralCode) return null;

  if (compact) {
    return (
      <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
        >
          <Gift className="w-3.5 h-3.5" />
          {copied ? t.copied : t.copy}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-3 max-w-xl">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 min-w-0 flex-1">
          <Gift className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{t.title}</span>
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
        <p className="w-full text-[11px] text-slate-500 leading-snug">{t.desc}</p>
      </div>
    </div>
  );
}
