'use client';

import React from 'react';
import type { UserProfile } from '@/types';
import type { AppLanguage } from '@/lib/language-context';
import { Sparkles, Zap } from 'lucide-react';
import { FREE_LIFETIME_LITE_CREDITS } from '@/constants/credits';

interface CreditsBadgeProps {
  profile: UserProfile | null;
  language?: AppLanguage;
  className?: string;
}

const copy: Record<AppLanguage, { lite: string; full: string; tier: string; freeNote: string }> = {
  'zh-TW': { lite: 'Lite', full: 'Full', tier: '訂閱', freeNote: `免費 · 終生 ${FREE_LIFETIME_LITE_CREDITS} 次` },
  'zh-CN': { lite: 'Lite', full: 'Full', tier: '订阅', freeNote: `免费 · 终生 ${FREE_LIFETIME_LITE_CREDITS} 次` },
  en: { lite: 'Lite', full: 'Full', tier: 'Plan', freeNote: `Free · ${FREE_LIFETIME_LITE_CREDITS} lifetime` },
  es: { lite: 'Lite', full: 'Full', tier: 'Plan', freeNote: `Gratis · ${FREE_LIFETIME_LITE_CREDITS} de por vida` },
  hi: { lite: 'Lite', full: 'Full', tier: 'Plan', freeNote: `मुफ़्त · जीवनभर ${FREE_LIFETIME_LITE_CREDITS}` },
  ar: { lite: 'Lite', full: 'Full', tier: 'Plan', freeNote: `مجاني · ${FREE_LIFETIME_LITE_CREDITS} مدى الحياة` },
};

export default function CreditsBadge({ profile, language = 'en', className = '' }: CreditsBadgeProps) {
  if (!profile) return null;
  const t = copy[language] ?? copy.en;
  const tierLabel =
    profile.membership_tier === 'advanced_sub'
      ? 'Advanced'
      : profile.membership_tier === 'standard_sub'
        ? 'Standard'
        : null;

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      {tierLabel && (
        <span className="rounded-full bg-violet-500/20 border border-violet-500/40 px-2.5 py-1 text-violet-200 font-semibold">
          {tierLabel} {t.tier}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-600 px-2.5 py-1 text-slate-200">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        {profile.available_lite_credits} {t.lite}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-600 px-2.5 py-1 text-slate-200">
        <Zap className="w-3 h-3 text-amber-400" />
        {profile.available_full_credits} {t.full}
      </span>
      {profile.membership_tier === 'free' && (
        <span className="text-slate-500">{t.freeNote}</span>
      )}
    </div>
  );
}
