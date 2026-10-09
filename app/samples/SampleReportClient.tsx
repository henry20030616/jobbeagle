'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { ReportFitStage } from '@/components/ReportFitStage';
import {
  V5SampleGuide,
  V5SampleSnapshot,
} from '@/components/prototypes/V5SampleReportPrototype';
import {
  REPORT_CODES,
  normalizeReportType,
  reportLabel,
} from '@/constants/report-products';
import {
  SAMPLE_NOTICE_SURFACE,
  SAMPLE_RAIL_TEXT,
  SAMPLE_RAIL_ICON,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SLIDE_DESIGN_WIDTH,
  SAMPLE_REPORT_TAB_ACTIVE,
  SAMPLE_REPORT_TAB_IDLE,
} from '@/constants/report-frame';
import ReportCompareModal from '@/components/ReportCompareModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ArrowLeft, Check, Home, RotateCcw } from 'lucide-react';
import { useLanguage, type AppLanguage } from '@/lib/language-context';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';

const ANALYZE_LABEL: Record<AppLanguage, string> = {
  en: 'Analyze now with AI',
  'zh-TW': '立刻AI分析',
  'zh-CN': '立刻AI分析',
  es: 'Analizar ya con IA',
  hi: 'अभी AI से विश्लेषण करें',
  ar: 'حلّل الآن بالذكاء الاصطناعي',
};

export default function SampleReportClient() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const chrome = getSnapshotUiCopy(language);
  const rawType = searchParams.get('type') || REPORT_CODES.JOB_FIT_SNAPSHOT;
  const reportType =
    normalizeReportType(rawType) ?? REPORT_CODES.JOB_FIT_SNAPSHOT;
  const isGuide = reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;

  const goHome = () => {
    window.location.href = '/';
  };

  const sampleTabClass = (active: boolean) =>
    `inline-flex h-full w-full items-center justify-center gap-5 px-8 py-6 ${SAMPLE_RAIL_TEXT} shrink-0 text-center leading-snug whitespace-normal transition-colors ${
      active ? SAMPLE_REPORT_TAB_ACTIVE : SAMPLE_REPORT_TAB_IDLE
    }`;

  const snapshotLabel = reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language);
  const guideLabel = reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language);

  return (
    <div className="flex h-screen w-full min-w-0 flex-col overflow-hidden bg-slate-950 text-slate-200">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-6 sm:px-8">
        <BrandLogo size="hero" showIcon />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <LanguageSwitcher size="chrome" />
          <button type="button" onClick={goHome} className={`${REPORT_ACTION_BTN} whitespace-nowrap`}>
            <Home className={REPORT_ACTION_ICON} aria-hidden />
            {chrome.backHome}
          </button>
          <button type="button" onClick={goHome} className={`${REPORT_ACTION_BTN} whitespace-nowrap`}>
            <RotateCcw className={REPORT_ACTION_ICON} aria-hidden />
            {chrome.newAnalysis}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside className="flex h-full w-[42rem] flex-shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-800 p-10">
          <div
            className={`${SAMPLE_NOTICE_SURFACE} w-full px-6 py-5 flex flex-col gap-3 rounded-xl`}
          >
            <p className={`${SAMPLE_RAIL_TEXT} text-slate-100`}>
              {isGuide ? guideLabel : snapshotLabel}
            </p>
            <Link
              href="/"
              className={`inline-flex items-center gap-2 ${SAMPLE_RAIL_TEXT} text-slate-100 hover:text-white`}
            >
              <ArrowLeft className={SAMPLE_RAIL_ICON} />
              {ANALYZE_LABEL[language] ?? ANALYZE_LABEL.en}
            </Link>
          </div>

          <div className="grid h-[42rem] w-full grid-rows-3 gap-6">
            <Link
              href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
              aria-current={!isGuide ? 'page' : undefined}
              className={sampleTabClass(!isGuide)}
            >
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 ${
                  !isGuide ? 'border-white bg-white text-[#3d3c7c]' : 'border-white/80'
                }`}
                aria-hidden
              >
                {!isGuide ? <Check className="h-10 w-10" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 text-left">{snapshotLabel}</span>
            </Link>
            <Link
              href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
              aria-current={isGuide ? 'page' : undefined}
              className={sampleTabClass(isGuide)}
            >
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 ${
                  isGuide ? 'border-white bg-white text-[#3d3c7c]' : 'border-white/80'
                }`}
                aria-hidden
              >
                {isGuide ? <Check className="h-10 w-10" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 text-left">{guideLabel}</span>
            </Link>
            <ReportCompareModal language={language} variant="button" className="h-full w-full min-h-0 justify-center text-center whitespace-normal" />
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 justify-center overflow-auto p-6">
          <ReportFitStage
            designWidth={REPORT_SLIDE_DESIGN_WIDTH}
            maxScale={2.4}
            className="w-full"
          >
            {isGuide ? (
              <V5SampleGuide language={language} />
            ) : (
              <V5SampleSnapshot language={language} />
            )}
          </ReportFitStage>
        </main>
      </div>
    </div>
  );
}
