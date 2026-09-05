'use client';

import React from 'react';
import Link from 'next/link';
import { Chrome, Download } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BrandLogo from '@/components/BrandLogo';
import { FitStage } from '@/components/FitStage';
import { ACCOUNT_DESIGN_WIDTH } from '@/constants/fit-stage';
import { EXTENSION_ZIP_HREF, getChromeWebStoreUrl } from '@/lib/chrome-webstore';
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics';

export default function ExtensionInstallPage() {
  const { language } = useLanguage();
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const storeUrl = getChromeWebStoreUrl();
  const href = storeUrl ?? EXTENSION_ZIP_HREF;
  const oneClick = Boolean(storeUrl);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <FitStage designWidth={ACCOUNT_DESIGN_WIDTH} minScale={1} maxScale={2} className="w-full">
        <div className="mx-auto w-full px-8 py-10 space-y-10" data-fit-ref="extension">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo size="nav" showIcon />
            <LanguageSwitcher variant="dark" size="lg" />
          </div>

          <header className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white">
              {zh ? '職缺頁一鍵抓 JD' : 'Grab the job in one click'}
            </h1>
            <p className="max-w-2xl text-xl leading-snug text-slate-400">
              {zh
                ? '在 LinkedIn、Indeed 等職缺頁點 JobBeagle，職缺會自動帶進網站，接著跑 Snapshot 或 Guide。'
                : 'Click JobBeagle on LinkedIn, Indeed, and other boards. The posting lands in the site for Snapshot or Guide.'}
            </p>
          </header>

          <a
            href={href}
            {...(oneClick
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : { download: 'jobbeagle-extension.zip' })}
            onClick={() =>
              trackEvent(ANALYTICS_EVENTS.extensionInstallClick, {
                source: oneClick ? 'chrome_web_store' : 'zip',
              })
            }
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-5 text-2xl font-black text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500 sm:w-auto"
          >
            {oneClick ? <Chrome className="h-8 w-8" /> : <Download className="h-8 w-8" />}
            {oneClick
              ? zh
                ? '加到 Chrome'
                : 'Add to Chrome'
              : zh
                ? '下載 Chrome 外掛'
                : 'Download for Chrome'}
          </a>

          <p className="text-lg text-slate-500">
            LinkedIn · Indeed · ZipRecruiter · Glassdoor · GovernmentJobs · 104
          </p>

          {!oneClick && (
            <ol className="space-y-3 text-lg text-slate-300">
              {(zh
                ? ['解壓下載的 zip', '打開 chrome://extensions', '開啟開發人員模式 → 載入未封裝 → 選那個資料夾']
                : ['Unzip the download', 'Open chrome://extensions', 'Turn on Developer mode → Load unpacked → pick the folder']
              ).map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          )}

          <Link href="/" className="inline-block text-lg text-slate-500 hover:text-slate-300">
            {zh ? '改貼職缺文字' : 'Paste a JD instead'}
          </Link>
        </div>
      </FitStage>
    </div>
  );
}
