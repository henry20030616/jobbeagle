'use client';

import React from 'react';
import { BeagleIcon } from './AnalysisDashboard';

/**
 * DogLoading 元件
 * 使用首頁的 BeagleIcon Logo，加上「小狗呼吸」動畫效果
 */
const DogLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 z-50">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo 動畫：使用 animate-pulse（呼吸效果）和 scale-110（微幅縮放） */}
        <div className="animate-pulse transform scale-110">
          <BeagleIcon
            className="w-24 h-24 md:w-32 md:h-32 drop-shadow-xl"
            color="#cbd5e1"
            spotColor="#5d4037"
            bellyColor="#94a3b8"
          />
        </div>

        {/* 提示文字 */}
        <p className="text-slate-400 text-base md:text-lg font-medium animate-pulse">
          小獵犬正在努力嗅探資料中...
        </p>
      </div>
    </div>
  );
};

export default DogLoading;
