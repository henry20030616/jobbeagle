'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Database, MessageSquare, TrendingUp, Lightbulb } from 'lucide-react';

interface LoadingPhase {
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface ProgressiveLoadingStateProps {
  /** Language for copy */
  language?: 'en' | 'zh-TW' | 'zh-CN';
  /** Duration per phase in ms (default: 3500) */
  phaseDuration?: number;
}

const PHASES_EN: LoadingPhase[] = [
  {
    icon: <Database className="w-6 h-6" />,
    label: 'Parsing ATS Requirements',
    description: 'Extracting hidden filters from job description...',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    label: 'Searching Blind Reviews',
    description: 'Fetching team culture intel from Blind & Reddit...',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    label: 'Cross-referencing Levels.fyi',
    description: 'Comparing salary bands for this role & level...',
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    label: 'Building STAR Interview Bank',
    description: 'Generating personalized STAR frameworks from your resume...',
  },
];

const PHASES_ZH_TW: LoadingPhase[] = [
  {
    icon: <Database className="w-6 h-6" />,
    label: '解析 ATS 篩選規則',
    description: '從職缺描述提取隱性門檻...',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    label: '檢索 Blind 口碑',
    description: '從 Blind 與 Reddit 擷取團隊文化資訊...',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    label: '比對 Levels.fyi',
    description: '比對此職級薪資區間...',
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    label: '編制 STAR 題庫',
    description: '從履歷生成個人化 STAR 框架...',
  },
];

const PHASES_ZH_CN: LoadingPhase[] = [
  {
    icon: <Database className="w-6 h-6" />,
    label: '解析 ATS 筛选规则',
    description: '从职位描述提取隐性门槛...',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    label: '检索 Blind 口碑',
    description: '从 Blind 与 Reddit 撷取团队文化信息...',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    label: '比对 Levels.fyi',
    description: '比对此职级薪资区间...',
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    label: '编制 STAR 题库',
    description: '从简历生成个性化 STAR 框架...',
  },
];

const PHASE_MAP = {
  en: PHASES_EN,
  'zh-TW': PHASES_ZH_TW,
  'zh-CN': PHASES_ZH_CN,
};

/**
 * Progressive Loading State — 4-phase carousel with Skeleton Pulse animation
 * Cycles through: ATS parsing → Blind scraping → Levels.fyi comparison → STAR bank generation
 */
export default function ProgressiveLoadingState({
  language = 'en',
  phaseDuration = 3500,
}: ProgressiveLoadingStateProps) {
  const phases = PHASE_MAP[language] ?? PHASES_EN;
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, phaseDuration);

    return () => clearInterval(timer);
  }, [phaseDuration, phases.length]);

  const phase = phases[currentPhase];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 px-6">
      {/* Central Spinner */}
      <div className="relative">
        <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
      </div>

      {/* Phase Indicator */}
      <div className="text-center space-y-3 max-w-md">
        <div className="flex items-center justify-center gap-2 text-indigo-300">
          {phase.icon}
          <h3 className="text-xl font-bold">{phase.label}</h3>
        </div>
        <p className="text-base text-slate-400">{phase.description}</p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2">
        {phases.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === currentPhase
                ? 'w-8 bg-indigo-400'
                : index < currentPhase
                ? 'w-2 bg-indigo-600'
                : 'w-2 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Skeleton Cards (Pulse Animation) */}
      <div className="w-full max-w-2xl space-y-3 mt-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
