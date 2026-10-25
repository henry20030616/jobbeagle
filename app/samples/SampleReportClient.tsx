'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import { ReportFitStage } from '@/components/ReportFitStage';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import {
  REPORT_CODES,
  normalizeReportType,
  reportLabel,
} from '@/constants/report-products';
import {
  SAMPLE_NOTICE_SURFACE,
  SAMPLE_RAIL_ICON,
  SAMPLE_RAIL_TEXT,
  PAGE_SHELL_GUTTER_LEFT,
  PAGE_SHELL_GUTTER_RIGHT,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SLIDE_DESIGN_WIDTH,
  SAMPLE_RAIL_ROW,
  sampleReportTabClass,
} from '@/constants/report-frame';
import FunctionRail, { FunctionRailCheck } from '@/components/FunctionRail';
import ReportCompareModal from '@/components/ReportCompareModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ArrowLeft, Home, RotateCcw } from 'lucide-react';
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

  const snapshot = useMemo(() => getSampleSnapshotReport(language), [language]);
  const guide = useMemo(() => getSampleStrategyGuideReport(language), [language]);

  const goHome = () => {
    window.location.href = '/';
  };

  const snapshotLabel = reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language);
  const guideLabel = reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language);

  return (
    <div className={`flex min-h-screen w-full min-w-0 flex-col bg-slate-950 text-slate-200 ${PAGE_SHELL_GUTTER_RIGHT}`}>
      <header className={`flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-800 py-6 ${PAGE_SHELL_GUTTER_LEFT}`}>
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

      <div className={`min-w-0 flex-1 py-6 ${SAMPLE_RAIL_ROW}`}>
        <FunctionRail as="aside" label={chrome.productTitle}>
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

          <Link
            href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
            aria-current={!isGuide ? 'page' : undefined}
            className={sampleReportTabClass(!isGuide)}
          >
            <FunctionRailCheck active={!isGuide} />
            <span className="min-w-0 text-left">{snapshotLabel}</span>
          </Link>
          <Link
            href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
            aria-current={isGuide ? 'page' : undefined}
            className={sampleReportTabClass(isGuide)}
          >
            <FunctionRailCheck active={isGuide} />
            <span className="min-w-0 text-left">{guideLabel}</span>
          </Link>
          <ReportCompareModal language={language} variant="button" className="w-full" />
        </FunctionRail>

        <main className="min-w-0 w-full flex-1">
          <ReportFitStage
            designWidth={REPORT_SLIDE_DESIGN_WIDTH}
            maxScale={2.4}
            className="w-full"
          >
            {isGuide ? (
              <FullReportDashboard
                report={guide}
                language={language}
                embedded
                isSample
                onNewAnalysis={goHome}
              />
            ) : (
              <LiteReportDashboard
                report={snapshot}
                language={language}
                embedded
                isSample
                onNewAnalysis={goHome}
              />
            )}
          </ReportFitStage>
        </main>
      </div>
    </div>
  );
}
