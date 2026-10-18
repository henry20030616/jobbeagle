'use client';

import React from 'react';
import { AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

interface CuriosityGapPaywallProps {
  /** Language for copy */
  language?: 'en' | 'zh-TW' | 'zh-CN';
  /** Callback when upgrade button is clicked */
  onUpgrade: () => void;
}

const COPY = {
  en: {
    alert: 'Hidden Risks Detected',
    message:
      'System has identified 2 potential ATS auto-reject triggers and untapped salary negotiation leverage.',
    unlock: 'Unlock Interview Guide — $9.99',
    features: [
      '20 interview questions with source links and resume-grounded answers',
      'Your pay landing plus base, equity, and bonus',
      'H-1B, layoff, and remote or sponsorship check',
      'Headhunter script for pay and benefits',
    ],
  },
  'zh-TW': {
    alert: '偵測到隱性風險',
    message: '系統已偵測到 2 項可能導致 ATS 秒刷的隱性要求，與潛在的談薪溢價空間。',
    unlock: '解鎖完整面試指南 — $9.99',
    features: [
      '20 題附來源的面試題，答法只引用履歷',
      '個人落點，以及底薪、股票、獎金拆解',
      'H-1B、裁員、遠端或贊助檢查',
      '獵頭級薪資與福利說法',
    ],
  },
  'zh-CN': {
    alert: '检测到隐性风险',
    message: '系统已检测到 2 项可能导致 ATS 秒刷的隐性要求，与潜在的谈薪溢价空间。',
    unlock: '解锁完整面试指南 — $9.99',
    features: [
      '20 题附来源的面试题，答法只引用简历',
      '个人落点，以及底薪、股票、奖金拆解',
      'H-1B、裁员、远程或赞助检查',
      '猎头级薪资与福利说法',
    ],
  },
};

/**
 * Curiosity Gap Paywall — Frosted Glass overlay at bottom of Snapshot
 * Teases hidden insights to drive upgrade from free Snapshot → $9.99 Guide
 */
export default function CuriosityGapPaywall({
  language = 'en',
  onUpgrade,
}: CuriosityGapPaywallProps) {
  const t = COPY[language] ?? COPY.en;

  return (
    <div className="relative mt-8">
      {/* Frosted Glass Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none" />

      {/* Content Card */}
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="bg-slate-900/50 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-amber-900/30">
          {/* Alert Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-300 mb-2">{t.alert}</h3>
              <p className="text-base text-slate-300 leading-relaxed">{t.message}</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {t.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-slate-400"
              >
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.unlock}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
