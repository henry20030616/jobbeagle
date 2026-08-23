'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { GitCompareArrows, X } from 'lucide-react';
import {
  REPORT_COMPARE_CLOSE,
  REPORT_COMPARE_SUBTITLE,
  REPORT_COMPARE_TITLE,
  REPORT_COMPARE_TRIGGER,
  resolveCompareLang,
  type ReportCompareLang,
} from '@/constants/report-compare';
import {
  REPORT_ACTION_TEXT,
  REPORT_ACTION_ICON,
  SAMPLE_HEADER_BTN,
  SAMPLE_HEADER_ICON,
} from '@/constants/report-frame';
import ReportCompareTable from '@/components/ReportCompareTable';
import BrandLogo from '@/components/BrandLogo';

type ReportCompareModalProps = {
  language?: string;
  className?: string;
  /** link = text; button = samples chrome size; panel = full-width under Guide card */
  variant?: 'link' | 'button' | 'panel';
};

/**
 * Large overlay for Snapshot vs Guide compare.
 * Covers most of the viewport (OK to cover the homepage) so the table stays readable
 * even when the homepage itself is CSS-zoomed.
 */
export default function ReportCompareModal({
  language = 'en',
  className = '',
  variant = 'link',
}: ReportCompareModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const lang: ReportCompareLang = resolveCompareLang(language);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const triggerClass =
    variant === 'button'
      ? `${SAMPLE_HEADER_BTN} border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300 ${className}`
      : variant === 'panel'
        ? `compare-panel-label flex h-full w-full min-h-0 items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/30 px-3.5 py-3 text-2xl font-semibold leading-snug text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 ${className}`
        : `inline-flex items-center gap-2.5 ${REPORT_ACTION_TEXT} text-indigo-300 hover:text-indigo-200 transition-colors ${className}`;

  const iconClass =
    variant === 'button' || variant === 'panel'
      ? SAMPLE_HEADER_ICON
      : REPORT_ACTION_ICON;

  const drawer =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[9999]" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label={REPORT_COMPARE_CLOSE[lang]}
              onClick={() => setOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-2 sm:inset-4 z-10 flex w-auto max-w-none flex-col rounded-2xl border border-slate-500 bg-slate-950 shadow-2xl animate-slide-in-right overflow-hidden"
            >
              <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-8 sm:py-5 shrink-0">
                <div className="min-w-0">
                  <BrandLogo size="nav" showIcon href={null} className="mb-2" />
                  <h2
                    id={titleId}
                    className="text-2xl sm:text-3xl font-bold text-white leading-tight"
                  >
                    {REPORT_COMPARE_TITLE[lang]}
                  </h2>
                  <p className="text-base sm:text-lg text-slate-400 mt-1.5 leading-snug">
                    {REPORT_COMPARE_SUBTITLE[lang]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={REPORT_COMPARE_CLOSE[lang]}
                >
                  <X className="w-7 h-7" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5">
                <ReportCompareTable language={language} showHeader={false} size="lg" />
              </div>

              <footer className="shrink-0 border-t border-slate-800 px-5 py-4 sm:px-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-500 bg-slate-900 px-6 py-3 text-lg font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  {REPORT_COMPARE_CLOSE[lang]}
                </button>
              </footer>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        <GitCompareArrows className={iconClass} aria-hidden />
        {REPORT_COMPARE_TRIGGER[lang]}
      </button>
      {drawer}
    </>
  );
}
