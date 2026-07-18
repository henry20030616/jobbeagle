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
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <BrandLogo size="inline" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {strategy ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
        </span>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {strategy ? (
          <FullReportDashboard
            report={normalizeFullReport(payload.report as FullReport)}
            language="en"
            onNewAnalysis={handleNewAnalysis}
          />
        ) : (
          <LiteReportDashboard
            report={normalizeLiteReport(payload.report as LiteReport)}
            language="en"
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  );
}
