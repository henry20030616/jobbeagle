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
  variant?: 'link' | 'button';
};

/**
 * Cake-style right drawer: trigger opens Snapshot vs Guide comparison
 * sliding in from the right over the current page.
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
      : `inline-flex items-center gap-2.5 ${REPORT_ACTION_TEXT} text-indigo-300 hover:text-indigo-200 transition-colors ${className}`;

  const drawer =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              aria-label={REPORT_COMPARE_CLOSE[lang]}
              onClick={() => setOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-y-0 right-0 z-10 flex w-full max-w-[min(48rem,92vw)] flex-col border-l border-slate-600 bg-slate-950 shadow-2xl animate-slide-in-right"
            >
              <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3.5 sm:px-5 shrink-0">
                <div className="min-w-0">
                  <BrandLogo size="sm" showIcon href={null} className="mb-2" />
                  <h2 id={titleId} className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {REPORT_COMPARE_TITLE[lang]}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 leading-snug">
                    {REPORT_COMPARE_SUBTITLE[lang]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={REPORT_COMPARE_CLOSE[lang]}
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
                <ReportCompareTable language={language} showHeader={false} />
              </div>

              <footer className="shrink-0 border-t border-slate-800 px-4 py-3 sm:px-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
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
        <GitCompareArrows
          className={variant === 'button' ? SAMPLE_HEADER_ICON : REPORT_ACTION_ICON}
          aria-hidden
        />
        {REPORT_COMPARE_TRIGGER[lang]}
      </button>
      {drawer}
    </>
  );
}
