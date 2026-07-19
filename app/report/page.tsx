'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FullReport, LiteReport } from '@/types';
import { REPORT_CODES } from '@/constants/report-products';
import {
  clearReportSession,
  isStrategyReport,
  loadReportSession,
  type StoredReportPayload,
} from '@/lib/report-session';
import { normalizeFullReport, normalizeLiteReport } from '@/lib/normalize-lite-report';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import BrandLogo from '@/components/BrandLogo';
import { ReportFitStage } from '@/components/ReportFitStage';
import { REPORT_ACTION_BTN, REPORT_ACTION_ICON } from '@/constants/report-frame';
import { Loader2, Home, RotateCcw } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<StoredReportPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadReportSession();
    setPayload(stored);
    setReady(true);
  }, []);

  const handleNewAnalysis = () => {
    clearReportSession();
    router.push('/');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <BrandLogo size="inline" />
        <p className="text-slate-300 text-center">No report in this session.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const strategy = isStrategyReport(payload.report_type);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-950 text-slate-200 flex flex-col">
      {/* Absolute top — above logo / report */}
      <div className="border-b border-slate-800/80 bg-slate-950 px-4 sm:px-6 py-3 shrink-0">
        <div className="mx-auto w-full max-w-full flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={handleNewAnalysis} className={REPORT_ACTION_BTN}>
            <Home className={REPORT_ACTION_ICON} aria-hidden />
            Back to Home
          </button>
          <button type="button" onClick={handleNewAnalysis} className={REPORT_ACTION_BTN}>
            <RotateCcw className={REPORT_ACTION_ICON} aria-hidden />
            New Analysis
          </button>
        </div>
      </div>

      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <BrandLogo size="inline" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {strategy ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
        </span>
      </header>
      <main className="flex-1 min-h-0 w-full px-2 sm:px-4 py-4 flex flex-col items-stretch">
        <ReportFitStage className="w-full flex-1 min-h-0">
          {strategy ? (
            <FullReportDashboard
              report={normalizeFullReport(payload.report as FullReport)}
              language="en"
              embedded
              onNewAnalysis={handleNewAnalysis}
            />
          ) : (
            <LiteReportDashboard
              report={normalizeLiteReport(payload.report as LiteReport)}
              language="en"
              embedded
              onNewAnalysis={handleNewAnalysis}
            />
          )}
        </ReportFitStage>
      </main>
    </div>
  );
}
