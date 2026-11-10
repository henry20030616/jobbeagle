'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BeagleIcon } from './AnalysisDashboard';
import { AppLanguage } from '@/lib/language-context';
import {
  computeDogLoadingZoom,
  DOG_LOADING_CARD_WIDTH,
} from '@/lib/dog-loading-zoom';

interface DogLoadingProps {
  progress?: number;
  stage?: string;
  stageLabel?: string;
  elapsed?: number;
  language?: AppLanguage;
  /** Snapshot stays shorter; Guide uses Gemini Pro+Search + Claude writing. */
  estimateKind?: 'snapshot' | 'guide';
}

const DogLoading: React.FC<DogLoadingProps> = ({
  progress = 0,
  stage,
  stageLabel,
  elapsed = 0,
  language = 'en',
  estimateKind = 'snapshot',
}) => {
  const displayProgress = Math.min(Math.max(Math.round(progress), 0), 99);
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setZoom(computeDogLoadingZoom(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const defaultStageMap: Record<AppLanguage, string> = {
    'zh-TW': '小獵犬正在努力嗅探資料中...',
    'zh-CN': '小猎犬正在努力嗅探数据中...',
    en: 'Beagle is sniffing for data...',
  };
  const estimatedMapSnapshot: Record<AppLanguage, string> = {
    'zh-TW': '適配快照通常需要 15–45 秒，請稍候',
    'zh-CN': '适配快照通常需要 15–45 秒，请稍候',
    en: 'Fit Snapshot usually takes 15–45 seconds',
  };
  const estimatedMapGuide: Record<AppLanguage, string> = {
    'zh-TW': '面試指南含網路搜尋與撰寫，通常需要 1–3 分鐘（Gemini＋Claude）',
    'zh-CN': '面试指南含网络搜索与撰写，通常需要 1–3 分钟（Gemini＋Claude）',
    en: 'Interview Guide usually takes 1–3 minutes (Gemini search + Claude writing)',
  };
  const estimatedMap = estimateKind === 'guide' ? estimatedMapGuide : estimatedMapSnapshot;
  const elapsedMap: Record<AppLanguage, string> = {
    'zh-TW': `已分析 ${elapsed} 秒`,
    'zh-CN': `已分析 ${elapsed} 秒`,
    en: `${elapsed}s elapsed`,
  };

  const currentStage = stage || stageLabel || defaultStageMap[language];
  const estimatedLabel = estimatedMap[language];
  const elapsedLabel = elapsedMap[language];

  const overlay = (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6">
      {/* Portal to body so homepage-font-large does not double-scale; CSS zoom adapts to viewport */}
      <div
        className="flex flex-col items-center space-y-10"
        style={{
          width: DOG_LOADING_CARD_WIDTH,
          zoom,
        }}
      >
        <div className="animate-pulse transform scale-110">
          <BeagleIcon
            className="h-48 w-48 drop-shadow-xl sm:h-56 sm:w-56"
            color="#cbd5e1"
            spotColor="#5d4037"
            bellyColor="#94a3b8"
          />
        </div>

        <p className="min-h-[2.75rem] text-center text-2xl font-semibold leading-snug text-slate-300 transition-all duration-500 sm:text-3xl">
          {currentStage}
        </p>

        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-lg text-slate-400 sm:text-xl">
            <span>{elapsedLabel}</span>
            <span className="font-mono font-bold text-indigo-400">{displayProgress}%</span>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800 sm:h-5">
            <div className="absolute inset-0 animate-[shimmer_1.8s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          <p className="text-center text-base text-slate-500 sm:text-lg">{estimatedLabel}</p>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
};

export default DogLoading;
