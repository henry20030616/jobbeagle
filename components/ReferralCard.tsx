'use client';

import React, { useState } from 'react';
import type { AppLanguage } from '@/lib/language-context';
import type { UserProfile } from '@/types';
import { REPORT_CODES, reportShortLabel } from '@/constants/report-products';
import { Copy, Check, Gift, Coins } from 'lucide-react';
import Link from 'next/link';

interface ReferralCardProps {
  referralCode: string | null | undefined;
  language?: AppLanguage;
  compact?: boolean;
  /** When set, show Snapshot + Strategy credit balances above the referral CTA */
  userProfile?: UserProfile | null;
}

const copy: Record<
  AppLanguage,
  {
    creditsTitle: string;
    buyMore: string;
    title: string;
    desc: string;
    copied: string;
    copy: string;
  }
> = {
  'zh-TW': {
    creditsTitle: '目前額度',
    buyMore: '加購',
    title: '推薦好友 · +1 Job Fit Snapshot',
    desc: '好友註冊並完成首次 Snapshot 後，你獲得 1 次額度。',
    copied: '已複製',
    copy: '複製推薦連結',
  },
  'zh-CN': {
    creditsTitle: '当前额度',
    buyMore: '加购',
    title: '推荐好友 · +1 Job Fit Snapshot',
    desc: '好友注册并完成首次 Snapshot 后，你获得 1 次额度。',
    copied: '已复制',
    copy: '复制推荐链接',
  },
  en: {
    creditsTitle: 'Your credits',
    buyMore: 'Buy more',
    title: 'Refer a friend · +1 Job Fit Snapshot',
    desc: 'Earn +1 Snapshot when they sign up and finish their first Snapshot.',
    copied: 'Copied',
    copy: 'Copy referral link',
  },
  es: {
    creditsTitle: 'Tus créditos',
    buyMore: 'Comprar',
    title: 'Invita · +1 Job Fit Snapshot',
    desc: 'Ganas +1 Snapshot cuando completen su primer análisis.',
    copied: 'Copiado',
    copy: 'Copiar enlace',
  },
  hi: {
    creditsTitle: 'आपके क्रेडिट',
    buyMore: 'और खरीदें',
    title: 'रेफर करें · +1 Job Fit Snapshot',
    desc: 'पहला Snapshot पूरा करने पर +1 मिलता है।',
    copied: 'कॉपी हो गया',
    copy: 'लिंक कॉपी करें',
  },
  ar: {
    creditsTitle: 'رصيدك',
    buyMore: 'اشترِ المزيد',
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
  userProfile = null,
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const t = copy[language] ?? copy.en;

  const snapshotCredits =
    userProfile?.available_job_fit_snapshot_credits
    ?? userProfile?.available_lite_credits
    ?? null;
  const strategyCredits =
    userProfile?.available_interview_strategy_guide_credits
    ?? userProfile?.available_full_credits
    ?? null;
  const showCredits = snapshotCredits != null && strategyCredits != null;

  const snapLabel = reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language);
  const stratLabel = reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language);

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

  if (compact) {
    if (!referralCode && !showCredits) return null;
    return (
      <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {showCredits && (
          <span className="inline-flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-indigo-400" />
            {snapLabel} {snapshotCredits} · {stratLabel} {strategyCredits}
          </span>
        )}
        {referralCode ? (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
          >
            <Gift className="w-3.5 h-3.5" />
            {copied ? t.copied : t.copy}
          </button>
        ) : null}
      </div>
    );
  }

  if (!referralCode && !showCredits) return null;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-3 max-w-xl">
      {showCredits && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-700/70">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3 text-indigo-400" />
              {t.creditsTitle}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
              <span className="text-slate-200">
                <span className="text-slate-500">{snapLabel}</span>{' '}
                <strong className="tabular-nums text-white">{snapshotCredits}</strong>
              </span>
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
              <span className="text-slate-200">
                <span className="text-slate-500">{stratLabel}</span>{' '}
                <strong className="tabular-nums text-white">{strategyCredits}</strong>
              </span>
            </div>
          </div>
          <Link
            href="/account"
            className="shrink-0 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200"
          >
            {t.buyMore} →
          </Link>
        </div>
      )}

      {referralCode ? (
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
      ) : null}
    </div>
  );
}
