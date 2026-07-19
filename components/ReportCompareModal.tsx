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
import { REPORT_ACTION_TEXT, REPORT_ACTION_ICON } from '@/constants/report-frame';
import ReportCompareTable from '@/components/ReportCompareTable';

type ReportCompareModalProps = {
  language?: string;
  className?: string;
  variant?: 'link' | 'button';
};

/** Trigger + modal shell — samples / secondary entry. Homepage uses ReportCompareTable inline. */
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
      ? `inline-flex items-center gap-2.5 rounded-lg border border-slate-400 bg-slate-900/80 px-5 py-3.5 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors ${className}`
      : `inline-flex items-center gap-2.5 ${REPORT_ACTION_TEXT} text-indigo-300 hover:text-indigo-200 transition-colors ${className}`;

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="jb-compare-overlay"
            role="presentation"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'grid',
              placeItems: 'center',
              padding: '0.75rem',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label={REPORT_COMPARE_CLOSE[lang]}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 w-full max-w-4xl max-h-[96dvh] overflow-y-auto"
              style={{ margin: 0 }}
            >
              <div className="sr-only" id={titleId}>
                {REPORT_COMPARE_TITLE[lang]} — {REPORT_COMPARE_SUBTITLE[lang]}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-30 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={REPORT_COMPARE_CLOSE[lang]}
              >
                <X className="w-5 h-5" />
              </button>
              <ReportCompareTable language={language} />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-500 bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  {REPORT_COMPARE_CLOSE[lang]}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        <GitCompareArrows className={REPORT_ACTION_ICON} aria-hidden />
        {REPORT_COMPARE_TRIGGER[lang]}
      </button>
      {dialog}
    </>
  );
}
