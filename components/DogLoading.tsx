'use client';

import React from 'react';
import { BeagleIcon } from './AnalysisDashboard';
import { AppLanguage } from '@/lib/language-context';

interface DogLoadingProps {
  progress?: number;
  stage?: string;
  elapsed?: number;
  language?: AppLanguage;
}

const DogLoading: React.FC<DogLoadingProps> = ({
  progress = 0,
  stage,
  elapsed = 0,
  language = 'en',
}) => {
  const displayProgress = Math.min(Math.max(Math.round(progress), 0), 99);

  const defaultStageMap: Record<AppLanguage, string> = {
    'zh-TW': '小獵犬正在努力嗅探資料中...',
    'zh-CN': '小猎犬正在努力嗅探数据中...',
    en: 'Beagle is sniffing for data...',
    es: 'El Beagle está olfateando datos...',
    hi: 'बीगल डेटा खोज रहा है...',
    ar: 'يقوم البيغل بالبحث عن البيانات...',
  };
  const estimatedMap: Record<AppLanguage, string> = {
    'zh-TW': '通常需要 30–60 秒',
    'zh-CN': '通常需要 30–60 秒',
    en: 'Usually takes 30–60 seconds',
    es: 'Normalmente tarda 30–60 segundos',
    hi: 'आमतौर पर 30–60 सेकंड लगते हैं',
    ar: 'عادةً يستغرق 30–60 ثانية',
  };
  const elapsedMap: Record<AppLanguage, string> = {
    'zh-TW': `已分析 ${elapsed} 秒`,
    'zh-CN': `已分析 ${elapsed} 秒`,
    en: `${elapsed}s elapsed`,
    es: `${elapsed}s transcurridos`,
    hi: `${elapsed} सेकंड बीते`,
    ar: `مرت ${elapsed} ثانية`,
  };

  const currentStage = stage || defaultStageMap[language];
  const estimatedLabel = estimatedMap[language];
  const elapsedLabel = elapsedMap[language];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 z-50 px-6">
      <div className="flex flex-col items-center space-y-8 w-full max-w-md">

        {/* Logo with breathing animation */}
        <div className="animate-pulse transform scale-110">
          <BeagleIcon
            className="w-24 h-24 md:w-32 md:h-32 drop-shadow-xl"
            color="#cbd5e1"
            spotColor="#5d4037"
            bellyColor="#94a3b8"
          />
        </div>

        {/* Stage text */}
        <p className="text-slate-300 text-base md:text-lg font-semibold text-center leading-snug min-h-[2rem] transition-all duration-500">
          {currentStage}
        </p>

        {/* Progress bar container */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>{elapsedLabel}</span>
            <span className="font-mono text-indigo-400 font-bold">{displayProgress}%</span>
          </div>

          <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            {/* Animated shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.8s_infinite] bg-[length:200%_100%]" />
            {/* Progress fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          <p className="text-center text-xs text-slate-600">
            {estimatedLabel}
          </p>
        </div>

      </div>
    </div>
  );
};

export default DogLoading;
