'use client';

import React, { useState } from 'react';
import type { AppLanguage } from '@/lib/language-context';
import { Copy, Check, Gift } from 'lucide-react';

interface ReferralCardProps {
  referralCode: string | null | undefined;
  language?: AppLanguage;
  compact?: boolean;
}

const copy: Record<AppLanguage, { title: string; desc: string; copied: string; copy: string }> = {
  'zh-TW': {
    title: '推薦好友 +1 Lite',
    desc: '好友註冊並完成首次 Lite 分析後，你獲得 1 次 Lite 額度。',
    copied: '已複製',
    copy: '複製推薦連結',
  },
  'zh-CN': {
    title: '推荐好友 +1 Lite',
    desc: '好友注册并完成首次 Lite 分析后，你获得 1 次 Lite 额度。',
    copied: '已复制',
    copy: '复制推荐链接',
  },
  en: {
    title: 'Refer a friend · +1 Lite',
    desc: 'You earn +1 Lite when they sign up and complete their first Lite analysis.',
    copied: 'Copied',
    copy: 'Copy referral link',
  },
  es: {
    title: 'Invita · +1 Lite',
    desc: 'Ganas +1 Lite cuando completen su primer análisis Lite.',
    copied: 'Copiado',
    copy: 'Copiar enlace',
  },
  hi: {
    title: 'रेफर करें · +1 Lite',
    desc: 'पहला Lite विश्लेषण पूरा करने पर +1 Lite।',
    copied: 'कॉपी हो गया',
    copy: 'लिंक कॉपी करें',
  },
  ar: {
    title: 'أحِل صديقًا · +1 Lite',
    desc: 'تحصل على +1 Lite عند إكمالهم أول تحليل Lite.',
    copied: 'تم النسخ',
    copy: 'نسخ رابط الإحالة',
  },
};

export default function ReferralCard({ referralCode, language = 'en', compact = false }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const t = copy[language] ?? copy.en;

  if (!referralCode) return null;

  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${referralCode}`
      : `https://www.jobbeagle.com/?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200"
      >
        <Gift className="w-3.5 h-3.5" />
        {copied ? t.copied : t.copy}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4">
      <p className="font-semibold text-white text-sm flex items-center gap-2">
        <Gift className="w-4 h-4 text-indigo-400" />
        {t.title}
      </p>
      <p className="text-xs text-slate-400 mt-1 mb-3">{t.desc}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}
