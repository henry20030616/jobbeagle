'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
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

type AnalysisErrorDialogProps = {
  title: string;
  message: string;
  language: AppLanguage;
  suggestionsTitle?: string;
  suggestions?: string[];
  onDismiss: () => void;
};

/**
 * Full-viewport-weight error dialog. Uses `compare-font-large` so type matches
 * the zoomed homepage (plain rem looked tiny against homepage-font-large).
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
  const titleId = useId();
  const bodyId = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return createPortal(
    <div
      className="compare-font-large fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-[3vw] backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex w-[min(92vw,56rem)] max-h-[88vh] flex-col overflow-hidden rounded-[1.25rem] border-[3px] border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400"
        />

        <button
          type="button"
          onClick={onDismiss}
          aria-label={CLOSE_LABEL[language]}
          className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-8 w-8 sm:h-10 sm:w-10" />
        </button>

        <div className="flex flex-col items-center gap-6 overflow-y-auto px-8 py-10 text-center sm:gap-8 sm:px-12 sm:py-12">
          <div className="analysis-error-icon-well flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-amber-400/50 bg-amber-500/15">
            <AlertTriangle
              className="analysis-error-icon h-10 w-10 text-amber-300"
              strokeWidth={2.25}
            />
          </div>

          <h2
            id={titleId}
            className="shrink-0 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="w-full shrink-0 whitespace-pre-wrap break-words text-center text-2xl font-medium leading-snug text-slate-100 sm:text-3xl sm:leading-snug"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="w-full shrink-0 rounded-2xl border border-slate-600 bg-slate-900/90 px-6 py-5 text-left">
              {suggestionsTitle ? (
                <p className="text-2xl font-semibold text-slate-100">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-4 list-disc space-y-3 pl-8 text-xl leading-snug text-slate-200 sm:text-2xl">
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
            className="w-full shrink-0 rounded-2xl bg-indigo-500 px-6 py-5 text-3xl font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:text-4xl"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
