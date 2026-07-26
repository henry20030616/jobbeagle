'use client';

import React, { useState } from 'react';
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
  language?: AppLanguage;
  onNewAnalysis?: () => void;
  /** Show large SAMPLE mark at top of the Guide frame (sample preview pages) */
  isSample?: boolean;
}

const NAV: { id: GuideTab; label: string; icon: React.ReactNode; blurb: string }[] = [
  {
    id: 'snapshot',
    label: 'Snapshot',
    icon: <ScanSearch className="w-5 h-5" />,
    blurb: 'One-page fit score, offer range, strengths and gaps.',
  },
  {
    id: 'hiring',
    label: 'Role & Team',
    icon: <Building2 className="w-5 h-5" />,
    blurb: 'Page 2 — career trajectory, RTO, team vibe, HM questions.',
  },
  {
    id: 'interview',
    label: 'Company Truth',
    icon: <Globe className="w-5 h-5" />,
    blurb: 'Page 3 — strategy, competitors, culture forums, red flags.',
  },
  {
    id: 'salary',
    label: 'Interview & Comp',
    icon: <HandCoins className="w-5 h-5" />,
    blurb: 'Page 4 — TC mix, negotiation steps, behavioral & technical Qs.',
  },
  {
    id: 'provenance',
    label: 'References',
    icon: <Link2 className="w-5 h-5" />,
    blurb: 'Page 5 — citation audit trail and evidence tiers.',
  },
];

export default function FullReportDashboard({
  report,
  embedded = false,
  onNewAnalysis,
  isSample = false,
}: FullReportDashboardProps) {
  const [tab, setTab] = useState<GuideTab>('snapshot');

  const handleBack = () => {
    if (onNewAnalysis) onNewAnalysis();
    else window.location.href = '/';
  };

  const activeNav = NAV.find((n) => n.id === tab) ?? NAV[0];

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
            Back to Home
          </button>
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <RotateCcw className={REPORT_ACTION_ICON} />
            New Analysis
          </button>
        </div>
      )}

      <div className={`@container/report relative min-w-0 overflow-x-auto ${REPORT_SLIDE_SURFACE}`}>
        {/* Title bar inside slide */}
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-700">
          <div className="min-w-0">
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Interview Strategy Guide
            </p>
            <p className="text-lg text-slate-400 mt-1.5">
              Snapshot + playbook — switch pages from the top nav
            </p>
          </div>
          {isSample ? (
            <div className="shrink-0 self-start">
              <SampleMark />
            </div>
          ) : null}
        </div>

        {/* Page nav — wrap so no tab is clipped */}
        <nav className="px-4 sm:px-6 py-3 border-b border-slate-700 bg-slate-900/60 flex flex-wrap gap-2">
          {NAV.map((item) => {
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

        {/* Content panel */}
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
                language="en"
                embedded
                onNewAnalysis={onNewAnalysis}
              />
            ) : (
              <GuideStrategyPages tab={tab} report={report} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
