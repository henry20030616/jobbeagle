'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Chrome,
  Puzzle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ExtensionInstallPage() {
  const { language } = useLanguage();
  const zh = language === 'zh-TW' || language === 'zh-CN';

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
          body: '在 LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs 職缺詳情頁點工具列 JobBeagle 圖示，即可開啟 Confirm。',
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
          body: 'Select the JobBeagle browser-extension folder from your machine (or unzip from GitHub).',
        },
        {
          title: 'Pin and capture',
          body: 'On a LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs job detail page, click the JobBeagle toolbar icon to open Confirm.',
        },
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {zh ? '回首頁' : 'Back home'}
          </Link>
          <LanguageSwitcher />
        </div>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-200">
            <Puzzle className="w-3.5 h-3.5" />
            JobBeagle Extension
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            {zh ? '獲取官方外掛' : 'Get the official extension'}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            {zh
              ? '在職缺頁一鍵抓取 JD → Pre-Flight 確認 → AI 分析。Chrome Web Store 上架前，請用開發人員模式載入未封裝版本。'
              : 'One-click JD capture on job boards → Pre-Flight → AI analysis. Until Chrome Web Store review, load the unpacked developer build.'}
          </p>
        </header>

        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="font-bold text-white mb-1">{step.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {zh ? '支援網站' : 'Supported boards'}
          </div>
          <p className="text-sm text-emerald-100/80">
            LinkedIn · Indeed · ZipRecruiter · Glassdoor · 104
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/henry20030616/jobbeagle/tree/main/browser-extension"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-all"
          >
            <Chrome className="w-4 h-4" />
            {zh ? '在 GitHub 查看外掛原始碼' : 'View extension on GitHub'}
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all"
          >
            {zh ? '改為手動貼 JD' : 'Paste JD on homepage instead'}
          </Link>
        </div>
      </div>
    </div>
  );
}
