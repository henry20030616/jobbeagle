'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chrome, Puzzle, CheckCircle2, ExternalLink, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BrandLogo from '@/components/BrandLogo';
import { FitStage } from '@/components/FitStage';
import { DOC_DESIGN_WIDTH } from '@/constants/fit-stage';
import { getChromeWebStoreUrl } from '@/lib/chrome-webstore';

export default function ExtensionInstallPage() {
  const { language } = useLanguage();
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const storeUrl = getChromeWebStoreUrl();
  const [showDevSteps, setShowDevSteps] = useState(false);

  const steps = zh
    ? [
        {
          title: '打開 Chrome 擴充功能頁',
          body: '在網址列輸入 chrome://extensions 並 Enter（Edge 用 edge://extensions）。',
        },
        {
          title: '開啟「開發人員模式」',
          body: '頁面右上角打開開發人員模式開關。',
        },
        {
          title: '載入未封裝項目',
          body: '選擇本機 JobBeagle 的 browser-extension 資料夾（或從 GitHub 下載後解壓）。',
        },
        {
          title: '釘選並使用',
          body: '在 LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs 職缺詳情頁點工具列 JobBeagle 圖示。',
        },
      ]
    : [
        {
          title: 'Open Chrome extensions',
          body: 'Go to chrome://extensions (or edge://extensions on Edge).',
        },
        {
          title: 'Enable Developer mode',
          body: 'Toggle Developer mode in the top-right corner.',
        },
        {
          title: 'Load unpacked',
          body: 'Select the JobBeagle browser-extension folder (or unzip from GitHub).',
        },
        {
          title: 'Pin and capture',
          body: 'On a job detail page, click the JobBeagle toolbar icon to send the JD to Step 1.',
        },
      ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <FitStage designWidth={DOC_DESIGN_WIDTH} minScale={1} maxScale={2.6} className="w-full">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6" data-fit-ref="extension">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo size="nav" showIcon />
            <LanguageSwitcher />
          </div>

          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Puzzle className="h-3.5 w-3.5" />
              JobBeagle Extension
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              {zh ? '一鍵安裝 Chrome 外掛' : 'Add JobBeagle to Chrome'}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-400">
              {zh
                ? '在 LinkedIn、Indeed 等職缺頁點工具列圖示，職缺會自動填進官網 Step 1，接著做 AI 分析。'
                : 'Click the toolbar icon on LinkedIn, Indeed, and other job boards. The posting fills homepage Step 1 for AI analysis.'}
            </p>
          </header>

          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500 sm:w-auto"
            >
              <Chrome className="h-6 w-6" />
              {zh ? '加到 Chrome（一鍵安裝）' : 'Add to Chrome'}
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
          ) : (
            <div className="space-y-3 rounded-2xl border border-indigo-500/35 bg-indigo-950/40 p-5">
              <p className="text-base font-bold text-white">
                {zh ? '商店上架後，這裡會變成一顆「加到 Chrome」按鈕' : 'After Chrome Web Store listing is live, this page is one Add to Chrome click'}
              </p>
              <p className="text-sm leading-relaxed text-slate-400">
                {zh
                  ? '瀏覽器不允許網站直接塞外掛。真正的一鍵安裝只能走 Chrome 線上應用程式商店。上架完成後把商店連結設進網站，這顆按鈕就會出現。'
                  : 'Browsers block sites from silently installing extensions. One-click install only works via the Chrome Web Store. Once the listing is live, this page becomes a single Add to Chrome button.'}
              </p>
            </div>
          )}

          <ul className="grid gap-3 sm:grid-cols-3">
            {(zh
              ? ['職缺頁一鍵抓 JD', '帶回官網 Step 1', '接著跑 Snapshot / Guide']
              : ['Capture the JD on the job page', 'Send it to homepage Step 1', 'Run Snapshot or Guide']
            ).map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {zh ? '支援網站' : 'Supported boards'}
            </div>
            <p className="text-sm text-emerald-100/80">
              LinkedIn · Indeed · ZipRecruiter · Glassdoor · GovernmentJobs · 104
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700"
          >
            {zh ? '先不用外掛，回首頁貼 JD' : 'Skip for now — paste JD on the homepage'}
          </Link>

          <div className="border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setShowDevSteps((v) => !v)}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showDevSteps ? 'rotate-180' : ''}`} />
              {zh ? '開發人員安裝（未封裝）' : 'Developer install (unpacked)'}
            </button>
            {showDevSteps && (
              <ol className="mt-4 space-y-3">
                {steps.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h2 className="mb-1 font-bold text-white">{step.title}</h2>
                      <p className="text-sm leading-relaxed text-slate-400">{step.body}</p>
                    </div>
                  </li>
                ))}
                <a
                  href="https://github.com/henry20030616/jobbeagle/tree/main/browser-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  {zh ? '在 GitHub 查看原始碼' : 'View source on GitHub'}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </ol>
            )}
          </div>
        </div>
      </FitStage>
    </div>
  );
}
