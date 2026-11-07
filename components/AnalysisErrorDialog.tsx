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
 * Large centered modal for analysis failures. Portaled to <body> so homepage
 * type scaling cannot shrink it into a strip. Sized to match homepage chrome.
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 sm:p-8 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/40"
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
          className="absolute right-4 top-4 rounded-xl p-3 text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:right-5 sm:top-5"
        >
          <X className="h-8 w-8 sm:h-9 sm:w-9" />
        </button>

        <div className="flex flex-col items-center px-6 pb-8 pt-10 text-center sm:px-12 sm:pb-10 sm:pt-12">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-amber-400/40 bg-amber-500/15 sm:h-28 sm:w-28">
            <AlertTriangle className="h-12 w-12 text-amber-300 sm:h-14 sm:w-14" strokeWidth={2.25} />
          </div>

          <h2
            id={titleId}
            className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="mt-5 max-h-[42vh] w-full overflow-y-auto whitespace-pre-wrap break-words text-left text-xl leading-relaxed text-slate-100 sm:mt-6 sm:text-center sm:text-2xl sm:leading-relaxed"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="mt-6 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-5 text-left">
              {suggestionsTitle ? (
                <p className="text-xl font-semibold text-slate-100 sm:text-2xl">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-3 list-disc space-y-2 pl-6 text-lg leading-relaxed text-slate-200 sm:text-xl">
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
            className="mt-8 w-full rounded-2xl bg-indigo-500 px-6 py-4 text-2xl font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:py-5 sm:text-3xl"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
