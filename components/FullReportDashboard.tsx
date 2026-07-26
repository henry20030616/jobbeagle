'use client';

import React, { useMemo, useState } from 'react';
import type { FullReport } from '@/types';
import {
  Building2,
  Globe,
  HandCoins,
  Home,
  Link2,
  RotateCcw,
  ScanSearch,
} from 'lucide-react';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import GuideStrategyPages, {
  type GuideStrategyTab,
} from '@/components/guide/GuideStrategyPages';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getGuideUiCopy } from '@/lib/report-ui-copy';
import {
  REPORT_SLIDE_SURFACE,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SHELL_WIDTH,
} from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';

type GuideTab = 'snapshot' | GuideStrategyTab;

interface FullReportDashboardProps {
  report: FullReport;
  embedded?: boolean;
  language?: AppLanguage | string;
  onNewAnalysis?: () => void;
  /** Show large SAMPLE mark at top of the Guide frame (sample preview pages) */
  isSample?: boolean;
}

export default function FullReportDashboard({
  report,
  embedded = false,
  language = 'en',
  onNewAnalysis,
  isSample = false,
}: FullReportDashboardProps) {
  const lang = normalizeReportLanguage(language);
  const copy = getGuideUiCopy(lang);
  const [tab, setTab] = useState<GuideTab>('snapshot');

  const nav = useMemo(
    () => [
      {
        id: 'snapshot' as const,
        label: copy.nav.snapshot.label,
        icon: <ScanSearch className="w-5 h-5" />,
        blurb: copy.nav.snapshot.blurb,
      },
      {
        id: 'hiring' as const,
        label: copy.nav.hiring.label,
        icon: <Building2 className="w-5 h-5" />,
        blurb: copy.nav.hiring.blurb,
      },
      {
        id: 'interview' as const,
        label: copy.nav.interview.label,
        icon: <Globe className="w-5 h-5" />,
        blurb: copy.nav.interview.blurb,
      },
      {
        id: 'salary' as const,
        label: copy.nav.salary.label,
        icon: <HandCoins className="w-5 h-5" />,
        blurb: copy.nav.salary.blurb,
      },
      {
        id: 'provenance' as const,
        label: copy.nav.provenance.label,
        icon: <Link2 className="w-5 h-5" />,
        blurb: copy.nav.provenance.blurb,
      },
    ],
    [copy],
  );

  const handleBack = () => {
    if (onNewAnalysis) onNewAnalysis();
    else window.location.href = '/';
  };

  const activeNav = nav.find((n) => n.id === tab) ?? nav[0];

  return (
    <div
      className={`w-full min-w-0 mx-auto ${
        embedded ? '' : `${REPORT_SHELL_WIDTH} space-y-4`
      }`}
    >
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <Home className={REPORT_ACTION_ICON} />
            {copy.backHome}
          </button>
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <RotateCcw className={REPORT_ACTION_ICON} />
            {copy.newAnalysis}
          </button>
        </div>
      )}

      <div className={`@container/report relative min-w-0 overflow-x-auto ${REPORT_SLIDE_SURFACE}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-700">
          <div className="min-w-0">
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {copy.productTitle}
            </p>
            <p className="text-lg text-slate-400 mt-1.5">
              {copy.productSubtitle}
            </p>
          </div>
          {isSample ? (
            <div className="shrink-0 self-start">
              <SampleMark />
            </div>
          ) : null}
        </div>

        <nav className="px-4 sm:px-6 py-3 border-b border-slate-700 bg-slate-900/60 flex flex-wrap gap-2">
          {nav.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold transition-colors border ${
                  active
                    ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className={active ? 'text-violet-300' : 'text-slate-500'}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="p-4 sm:p-6 space-y-4 bg-slate-950 min-w-0 min-h-[28rem]">
          {tab !== 'snapshot' && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-1">
                {activeNav.label}
              </p>
              <p className="text-base text-slate-500">{activeNav.blurb}</p>
            </div>
          )}

          <div key={tab} className="animate-fade-in space-y-4">
            {tab === 'snapshot' ? (
              <LiteReportDashboard
                report={report}
                language={lang}
                embedded
                onNewAnalysis={onNewAnalysis}
              />
            ) : (
              <GuideStrategyPages tab={tab} report={report} language={lang} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
