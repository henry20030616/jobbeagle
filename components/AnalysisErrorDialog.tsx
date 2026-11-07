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
 * Centered modal for analysis failures. Portaled to <body> so the homepage CSS zoom
 * cannot shrink it into a thin strip.
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-xl rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl shadow-red-950/50 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label={CLOSE_LABEL[language]}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 id={titleId} className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h2>
          <p
            id={bodyId}
            className="mt-4 max-h-[40vh] w-full overflow-y-auto whitespace-pre-wrap break-words text-lg leading-relaxed text-slate-200"
          >
            {message}
          </p>
        </div>

        {suggestions.length > 0 ? (
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4 text-left">
            {suggestionsTitle ? (
              <p className="text-base font-semibold text-slate-100">{suggestionsTitle}</p>
            ) : null}
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-slate-200">
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
          className="mt-6 w-full rounded-xl bg-red-500 px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          {DISMISS_LABEL[language]}
        </button>
      </div>
    </div>,
    document.body,
  );
}
