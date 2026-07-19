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
  SAMPLE_HEADER_BTN,
  SAMPLE_RAIL_TEXT,
  SAMPLE_RAIL_ICON,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SLIDE_DESIGN_WIDTH,
} from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';
import ReportCompareModal from '@/components/ReportCompareModal';
import { ArrowLeft, Home, RotateCcw, Sparkles } from 'lucide-react';

export default function SampleReportClient() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type') || REPORT_CODES.JOB_FIT_SNAPSHOT;
  const reportType =
    normalizeReportType(rawType) ?? REPORT_CODES.JOB_FIT_SNAPSHOT;
  const isGuide = reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;

  const snapshot = useMemo(() => getSampleSnapshotReport(), []);
  const guide = useMemo(() => getSampleStrategyGuideReport(), []);

  const goHome = () => {
    window.location.href = '/';
  };

  const sampleTabClass = (active: boolean) =>
    `${SAMPLE_HEADER_BTN} w-full justify-center text-center leading-snug whitespace-normal ${
      active
        ? 'border-solid border-violet-500 bg-violet-500/20 text-violet-100'
        : 'border-dashed border-slate-500 bg-slate-900/60 text-slate-100 hover:bg-slate-800/80 hover:border-slate-400'
    }`;

  const snapshotLabel = reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT);
  const guideLabel = reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE);

  return (
    <div className="flex h-screen w-full min-w-0 flex-col overflow-hidden bg-slate-950 text-slate-200">
      {/* Shared top bar — logo + actions; body columns start at the same Y */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 sm:px-6">
        <BrandLogo size="inline" showIcon />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={goHome} className={`${REPORT_ACTION_BTN} whitespace-nowrap`}>
            <Home className={REPORT_ACTION_ICON} aria-hidden />
            Back to Home
          </button>
          <button type="button" onClick={goHome} className={`${REPORT_ACTION_BTN} whitespace-nowrap`}>
            <RotateCcw className={REPORT_ACTION_ICON} aria-hidden />
            New Analysis
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Left rail — SAMPLE top aligns with report card top (shared p-6) */}
        <aside className="flex h-full w-[240px] flex-shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-slate-800 p-6">
          <div
            className={`${SAMPLE_NOTICE_SURFACE} w-full px-3 py-2.5 flex flex-col gap-1.5 rounded-xl`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <SampleMark variant="notice" />
              <Sparkles className={`${SAMPLE_RAIL_ICON} text-white`} aria-hidden />
            </div>
            <p className={`${SAMPLE_RAIL_TEXT} text-white`}>
              {isGuide ? guideLabel : snapshotLabel}
            </p>
            <Link
              href="/"
              className={`inline-flex items-center gap-1 ${SAMPLE_RAIL_TEXT} text-white hover:text-blue-50`}
            >
              <ArrowLeft className={SAMPLE_RAIL_ICON} />
              Analyze
            </Link>
          </div>

          <ReportCompareModal
            language="en"
            variant="panel"
            className="w-full shrink-0"
          />
          <Link
            href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
            className={sampleTabClass(!isGuide)}
          >
            {snapshotLabel}
          </Link>
          <Link
            href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
            className={sampleTabClass(isGuide)}
          >
            {guideLabel}
          </Link>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-6">
          <ReportFitStage
            designWidth={REPORT_SLIDE_DESIGN_WIDTH}
            maxScale={2.4}
            className="w-full"
          >
            {isGuide ? (
              <FullReportDashboard
                report={guide}
                language="en"
                embedded
                isSample
                onNewAnalysis={goHome}
              />
            ) : (
              <LiteReportDashboard
                report={snapshot}
                language="en"
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
