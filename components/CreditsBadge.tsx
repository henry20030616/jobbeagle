'use client';

import React from 'react';
import type { UserProfile } from '@/types';
import type { AppLanguage } from '@/lib/language-context';
import { Sparkles, Zap } from 'lucide-react';
import { FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS } from '@/constants/credits';
import { reportShortLabel, REPORT_CODES } from '@/constants/report-products';

interface CreditsBadgeProps {
  profile: UserProfile | null;
  language?: AppLanguage;
  className?: string;
}

export default function CreditsBadge({ profile, language = 'en', className = '' }: CreditsBadgeProps) {
  if (!profile) return null;
  const snapshot =
    profile.available_job_fit_snapshot_credits
    ?? profile.available_lite_credits
    ?? 0;
  const strategy =
    profile.available_interview_strategy_guide_credits
    ?? profile.available_full_credits
    ?? 0;
  const tierLabel =
    profile.membership_tier === 'advanced_sub'
      ? 'Advanced'
      : profile.membership_tier === 'standard_sub'
        ? 'Standard'
        : null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 text-base ${className}`}>
      {tierLabel && (
        <span className="rounded-full bg-blue-900/60 border border-blue-500/50 px-3 py-1.5 text-zinc-100 font-semibold">
          {tierLabel}
        </span>
      )}
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/50 border border-blue-500/40 px-3 py-1.5 text-zinc-100"
        title={reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language)}
      >
        <Sparkles className="w-4 h-4 text-blue-300" />
        {snapshot} {reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language)}
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/50 border border-blue-500/40 px-3 py-1.5 text-zinc-100"
        title={reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language)}
      >
        <Zap className="w-4 h-4 text-blue-300" />
        {strategy} {reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language)}
      </span>
      {profile.membership_tier === 'free' && (
        <span className="text-slate-500">
          {language === 'zh-TW' || language === 'zh-CN'
            ? `免費 · 終生 ${FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS} 次`
            : `Free · ${FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS} lifetime`}
        </span>
      )}
    </div>
  );
}
