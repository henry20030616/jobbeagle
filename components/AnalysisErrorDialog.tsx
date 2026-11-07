'use client';

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import type { AppLanguage } from '@/lib/language-context';

const DISMISS_LABEL: Record<AppLanguage, string> = {
  'zh-TW': '我知道了',
  'zh-CN': '我知道了',
  en: 'Got it',
  es: 'Entendido',
  hi: 'ठीक है',
  ar: 'حسنًا',
};

const CLOSE_LABEL: Record<AppLanguage, string> = {
  'zh-TW': '關閉',
  'zh-CN': '关闭',
  en: 'Close',
  es: 'Cerrar',
  hi: 'बंद करें',
  ar: 'إغلاق',
};

/** Matches InputForm STEP_BODY_MIN when the upload zone is not on screen. */
const FALLBACK_BOX_PX = 288;

type AnalysisErrorDialogProps = {
  title: string;
  message: string;
  language: AppLanguage;
  suggestionsTitle?: string;
  suggestions?: string[];
  onDismiss: () => void;
};

function measureResumeUploadBoxPx(): number {
  const zone = document.querySelector('[data-jb-resume-upload-zone]');
  if (!(zone instanceof HTMLElement)) return FALLBACK_BOX_PX;
  const height = zone.getBoundingClientRect().height;
  // Width and height of the dialog both must not exceed this upload-zone height.
  if (!Number.isFinite(height) || height < 120) return FALLBACK_BOX_PX;
  return Math.round(height);
}

/**
 * Centered analysis-error modal. Box width and height are both capped to the
 * homepage “Click to upload resume” zone height so the dialog never outgrows that card.
 */
export default function AnalysisErrorDialog({
  title,
  message,
  language,
  suggestionsTitle,
  suggestions = [],
  onDismiss,
}: AnalysisErrorDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [boxPx, setBoxPx] = useState(FALLBACK_BOX_PX);
  const titleId = useId();
  const bodyId = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const update = () => setBoxPx(measureResumeUploadBoxPx());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    dismissRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismissRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  const side = `min(${boxPx}px, 96vw, 92vh)`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
        style={{ width: side, height: side, maxWidth: side, maxHeight: side }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400"
        />

        <button
          type="button"
          onClick={onDismiss}
          aria-label={CLOSE_LABEL[language]}
          className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-4 pb-4 pt-5 text-center sm:px-5 sm:pb-5 sm:pt-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-amber-500/15 sm:h-14 sm:w-14">
            <AlertTriangle className="h-6 w-6 text-amber-300 sm:h-7 sm:w-7" strokeWidth={2.25} />
          </div>

          <h2
            id={titleId}
            className="mt-3 shrink-0 text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="mt-3 min-h-0 w-full flex-1 overflow-y-auto whitespace-pre-wrap break-words text-left text-sm leading-relaxed text-slate-100 sm:text-center sm:text-base"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="mt-3 w-full shrink-0 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-left">
              {suggestionsTitle ? (
                <p className="text-sm font-semibold text-slate-100">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-snug text-slate-200 sm:text-sm">
                {suggestions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            ref={dismissRef}
            type="button"
            onClick={onDismiss}
            className="mt-3 w-full shrink-0 rounded-xl bg-indigo-500 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:mt-4 sm:py-3 sm:text-lg"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
