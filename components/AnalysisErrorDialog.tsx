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
 * Large, readable analysis-error dialog (portaled to body so homepage
 * type-scale does not shrink it to a tiny chip).
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in sm:p-8"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex w-[min(40rem,94vw)] max-h-[min(90vh,48rem)] flex-col overflow-hidden rounded-3xl border-2 border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400"
        />

        <button
          type="button"
          onClick={onDismiss}
          aria-label={CLOSE_LABEL[language]}
          className="absolute right-3 top-3 z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:right-4 sm:top-4"
        >
          <X className="h-8 w-8" />
        </button>

        <div className="flex flex-col items-center gap-5 overflow-y-auto px-6 py-8 text-center sm:gap-6 sm:px-10 sm:py-10">
          <div className="analysis-error-icon-well flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-amber-400/50 bg-amber-500/15 sm:h-24 sm:w-24">
            <AlertTriangle
              className="analysis-error-icon h-11 w-11 text-amber-300 sm:h-14 sm:w-14"
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
            className="w-full max-w-prose shrink-0 whitespace-pre-wrap break-words text-center text-2xl font-medium leading-snug text-slate-100 sm:text-3xl sm:leading-snug"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="w-full shrink-0 rounded-2xl border border-slate-600 bg-slate-900/90 px-5 py-4 text-left sm:px-6 sm:py-5">
              {suggestionsTitle ? (
                <p className="text-xl font-semibold text-slate-100 sm:text-2xl">
                  {suggestionsTitle}
                </p>
              ) : null}
              <ul className="mt-3 list-disc space-y-2.5 pl-6 text-lg leading-snug text-slate-200 sm:text-xl">
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
            className="w-full shrink-0 rounded-2xl bg-indigo-500 px-5 py-4 text-2xl font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:text-3xl sm:py-5"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
