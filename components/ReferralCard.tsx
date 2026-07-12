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
    title: '推薦好友 · +1 Job Fit Snapshot',
    desc: '好友註冊並完成首次 Job Fit Snapshot 分析後，你獲得 1 次 Snapshot 額度。',
    copied: '已複製',
    copy: '複製推薦連結',
  },
  'zh-CN': {
    title: '推荐好友 · +1 Job Fit Snapshot',
    desc: '好友注册并完成首次 Job Fit Snapshot 分析后，你获得 1 次 Snapshot 额度。',
    copied: '已复制',
    copy: '复制推荐链接',
  },
  en: {
    title: 'Refer a friend · +1 Job Fit Snapshot',
    desc: 'You earn +1 Job Fit Snapshot when they sign up and complete their first Snapshot analysis.',
    copied: 'Copied',
    copy: 'Copy referral link',
  },
  es: {
    title: 'Invita · +1 Job Fit Snapshot',
    desc: 'Ganas +1 Snapshot cuando completen su primer análisis Job Fit Snapshot.',
    copied: 'Copiado',
    copy: 'Copiar enlace',
  },
  hi: {
    title: 'रेफर करें · +1 Job Fit Snapshot',
    desc: 'पहला Job Fit Snapshot पूरा करने पर आपको +1 Snapshot मिलता है।',
    copied: 'कॉपी हो गया',
    copy: 'लिंक कॉपी करें',
  },
  ar: {
    title: 'أحِل صديقًا · +1 Job Fit Snapshot',
    desc: 'تحصل على +1 Snapshot عند إكمالهم أول تحليل Job Fit Snapshot.',
    copied: 'تم النسخ',
    copy: 'نسخ رابط الإحالة',
  },
};

export default function ReferralCard({ referralCode, language = 'en', compact = false }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const t = copy[language] ?? copy.en;

  if (!referralCode) return null;

  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`
      : `https://www.jobbeagle.com/?ref=${encodeURIComponent(referralCode)}`;

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
    <div
      className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 group/referral"
      onMouseEnter={() => setDescOpen(true)}
      onMouseLeave={() => setDescOpen(false)}
      onFocus={() => setDescOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDescOpen(false);
        }
      }}
    >
      <p className="font-semibold text-white text-base flex items-center gap-2">
        <Gift className="w-5 h-5 text-indigo-400" />
        {t.title}
      </p>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          descOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-slate-400 mt-1">{t.desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-base font-semibold text-white"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}
