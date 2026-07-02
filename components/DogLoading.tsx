'use client';

import React from 'react';
import { BeagleIcon } from './report/report-shared';
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-jb-bg/95 px-6 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center space-y-8">
        <div className="scale-110 animate-pulse transform">
          <BeagleIcon className="h-24 w-24 md:h-32 md:w-32" color="#002FA7" spotColor="#5d4037" bellyColor="#94a3b8" />
        </div>
        <p className="min-h-[2rem] text-center text-base font-medium leading-snug text-jb-ink transition-all duration-500 md:text-lg">
          {currentStage}
        </p>
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs text-jb-ink-muted">
            <span>{elapsedLabel}</span>
            <span className="font-mono font-semibold text-jb-accent">{displayProgress}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-jb-surface">
            <div
              className="h-full rounded-full bg-jb-accent transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <p className="text-center text-xs text-jb-ink-subtle">{estimatedLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default DogLoading;
