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
    unlock: 'Unlock Interview Strategy Guide — $9.99',
    features: [
      '4 STAR interview questions with personalized answers',
      'Verbatim salary negotiation script (cite your resume wins + Levels.fyi data)',
      'Blind/Reddit team culture reality check',
      'Layoff risk audit via Layoffs.fyi',
    ],
  },
  'zh-TW': {
    alert: '偵測到隱性風險',
    message: '系統已偵測到 2 項可能導致 ATS 秒刷的隱性要求，與潛在的談薪溢價空間。',
    unlock: '解鎖完整版 Interview Strategy Guide — $9.99',
    features: [
      '4 道 STAR 面試題 + 個人化答題框架',
      '逐字談薪劇本（引用履歷成果 + Levels.fyi 數據）',
      'Blind / Reddit 團隊文化真相',
      '透過 Layoffs.fyi 審查裁員風險',
    ],
  },
  'zh-CN': {
    alert: '检测到隐性风险',
    message: '系统已检测到 2 项可能导致 ATS 秒刷的隐性要求，与潜在的谈薪溢价空间。',
    unlock: '解锁完整版 Interview Strategy Guide — $9.99',
    features: [
      '4 道 STAR 面试题 + 个性化答题框架',
      '逐字谈薪剧本（引用简历成果 + Levels.fyi 数据）',
      'Blind / Reddit 团队文化真相',
      '通过 Layoffs.fyi 审查裁员风险',
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
