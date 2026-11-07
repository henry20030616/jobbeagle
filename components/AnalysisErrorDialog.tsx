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
 * Error dialog at ~2.5× visual size vs the previous compact chip.
 * Base width × zoom 2.5 ≈ most of the viewport; type stays readable
 * against the zoomed homepage.
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
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto bg-black/85 p-4 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative my-4 flex w-[min(38vw,22rem)] flex-col overflow-hidden rounded-2xl border-[3px] border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
        style={{ zoom: 2.5 }}
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
          className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex max-h-[34vh] flex-col items-center gap-3 overflow-y-auto px-4 py-5 text-center sm:gap-4 sm:px-5 sm:py-6">
          <div className="analysis-error-icon-well flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-amber-500/15">
            <AlertTriangle
              className="analysis-error-icon h-7 w-7 text-amber-300"
              strokeWidth={2.25}
            />
          </div>

          <h2
            id={titleId}
            className="shrink-0 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="w-full shrink-0 whitespace-pre-wrap break-words text-center text-base font-medium leading-snug text-slate-100 sm:text-lg"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="w-full shrink-0 rounded-xl border border-slate-600 bg-slate-900/90 px-3 py-3 text-left">
              {suggestionsTitle ? (
                <p className="text-base font-semibold text-slate-100">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug text-slate-200 sm:text-base">
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
            className="w-full shrink-0 rounded-xl bg-indigo-500 px-4 py-3 text-xl font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
