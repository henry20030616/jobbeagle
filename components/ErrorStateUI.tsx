'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, Puzzle } from 'lucide-react';

export interface ErrorStateUIProps {
  boardLabel?: string;
  language?: string;
  extensionHref?: string;
}

/**
 * Progressive disclosure when user pastes a login-walled job board URL.
 * Dark-theme warning (matches JobBeagle slate UI).
 */
export default function ErrorStateUI({
  boardLabel = 'LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs',
  language = 'en',
  extensionHref = '/extension',
}: ErrorStateUIProps) {
  const [showManualHelp, setShowManualHelp] = useState(false);
  const zh = language === 'zh-TW' || language === 'zh-CN';

  const copy = zh
    ? {
        title: `系統偵測到 ${boardLabel} 網址。為保護您的帳號安全與突破登入牆，我們無法直接抓取此網址。請選擇以下方式繼續：`,
        manual: '手動複製（查看教學）',
        manualSteps:
          '在職缺頁右側詳情區：全選職缺文字（Ctrl/Cmd+A）→ 複製 → 回到此處貼上完整內容（勿只貼連結）。',
        extension: '獲取 JobBeagle 官方外掛',
        extensionHint: '在職缺頁一鍵抓取，免手動複製',
      }
    : {
        title: `We detected a ${boardLabel} URL. To protect your account and bypass login walls, we cannot fetch this link directly. Choose how to continue:`,
        manual: 'Paste manually (show tips)',
        manualSteps:
          'On the job page detail panel: select all job text (Ctrl/Cmd+A) → copy → paste the full posting here (not the URL alone).',
        extension: 'Get the JobBeagle extension',
        extensionHint: 'One-click capture on the job page — no manual copy',
      };

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border border-amber-500/40 bg-amber-950/50 text-amber-100 transition-all duration-300 ease-out animate-fade-in"
      role="alert"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm leading-relaxed text-amber-50/95">{copy.title}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowManualHelp((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-500/60 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700/80 transition-all active:scale-[0.98]"
          >
            {copy.manual}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showManualHelp ? 'rotate-180' : ''}`}
            />
          </button>

          <Link
            href={extensionHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/30 transition-all active:scale-[0.98]"
          >
            <Puzzle className="w-4 h-4" />
            <span>⚡ {copy.extension}</span>
          </Link>
        </div>

        <p className="text-xs text-amber-200/70 sm:pl-1">{copy.extensionHint}</p>

        <div
          className={`grid transition-all duration-300 ease-out ${
            showManualHelp ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <p className="mt-1 rounded-lg border border-amber-600/30 bg-amber-950/60 px-3 py-2.5 text-sm text-amber-100/90 leading-relaxed">
              {copy.manualSteps}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
