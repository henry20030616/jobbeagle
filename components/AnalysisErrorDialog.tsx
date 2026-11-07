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
 * Full-viewport modal for analysis failures. Portaled to <body>, and uses
 * `compare-font-large` so type matches the homepage operator scale (~4rem body).
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="compare-font-large relative flex max-h-[92vh] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-3xl border-2 border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
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
          className="absolute right-4 top-4 z-10 rounded-xl p-3 text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:right-6 sm:top-6"
        >
          <X className="analysis-error-icon h-8 w-8" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-10 text-center sm:px-12 sm:py-14">
          <div className="analysis-error-icon-well flex items-center justify-center rounded-3xl border-2 border-amber-400/50 bg-amber-500/15">
            <AlertTriangle
              className="analysis-error-icon text-amber-300"
              strokeWidth={2.25}
            />
          </div>

          <h2
            id={titleId}
            className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="mt-5 w-full max-w-5xl whitespace-pre-wrap break-words text-left text-base leading-snug text-slate-100 sm:mt-8 sm:text-center sm:text-lg"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="mt-6 w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-5 text-left sm:mt-8">
              {suggestionsTitle ? (
                <p className="text-lg font-semibold text-slate-100">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-3 list-disc space-y-2 pl-8 text-base leading-snug text-slate-200">
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
            className="mt-8 w-full max-w-5xl rounded-2xl bg-indigo-500 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:mt-10 sm:py-5 sm:text-xl"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
