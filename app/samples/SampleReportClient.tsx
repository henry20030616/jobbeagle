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
  HOME_DESIGN_WIDTH,
  REPORT_FRAME_BORDER,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
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
        ? 'border-violet-500 bg-violet-500/15 text-violet-100'
        : 'border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300'
    }`;

  const snapshotLabel = reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT);
  const guideLabel = reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-950 text-slate-200">
      <ReportFitStage
        designWidth={HOME_DESIGN_WIDTH}
        maxScale={1.6}
        className="w-full"
      >
        <div className="w-full max-w-full flex flex-col min-h-[100vh] overflow-x-clip">
          <header className="border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Same BrandLogo size as /report top-left (inline = text-xl) */}
            <BrandLogo size="inline" />
            <div className="flex flex-wrap items-center gap-2">
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

          {/*
            One row: left chrome box (SAMPLE + tabs + Compare) | right report box
          */}
          <main className="flex-1 w-full max-w-full px-4 py-4 overflow-x-clip">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] gap-4 items-start w-full max-w-full">
              <aside
                className={`rounded-2xl ${REPORT_FRAME_BORDER} bg-slate-950 p-3 sm:p-4 flex flex-col gap-3 min-w-0 h-fit self-start`}
              >
                <div
                  className={`${SAMPLE_NOTICE_SURFACE} w-full px-4 py-3 flex flex-col gap-2`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SampleMark variant="notice" />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-blue-950/40">
                      <Sparkles className="w-4 h-4 text-white" />
                    </span>
                  </div>
                  <p className="text-base font-bold text-white leading-snug">
                    {isGuide ? guideLabel : snapshotLabel} sample · no credits
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-base font-bold text-white hover:text-blue-50"
                  >
                    <ArrowLeft className="w-5 h-5 shrink-0" />
                    Analyze
                  </Link>
                </div>

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
                <ReportCompareModal
                  language="en"
                  variant="panel"
                  className="w-full"
                />
              </aside>

              <div className="min-w-0 max-w-full overflow-x-clip">
                {isGuide ? (
                  <FullReportDashboard
                    report={guide}
                    language="en"
                    embedded
                    isSample={false}
                    onNewAnalysis={goHome}
                  />
                ) : (
                  <LiteReportDashboard
                    report={snapshot}
                    language="en"
                    embedded
                    isSample={false}
                    onNewAnalysis={goHome}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </ReportFitStage>
    </div>
  );
}
