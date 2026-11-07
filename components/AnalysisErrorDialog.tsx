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

/** Fallback ≈ desktop resume-column width when the upload zone is missing. */
const FALLBACK_CAP_PX = 360;

type AnalysisErrorDialogProps = {
  title: string;
  message: string;
  language: AppLanguage;
  suggestionsTitle?: string;
  suggestions?: string[];
  onDismiss: () => void;
};

/**
 * Cap by the resume upload card’s shorter side (usually its width).
 * Using full STEP_BODY height made the dialog fill the screen.
 */
function measureResumeUploadCapPx(): number {
  const zone = document.querySelector('[data-jb-resume-upload-zone]');
  if (!(zone instanceof HTMLElement)) return FALLBACK_CAP_PX;
  const { width, height } = zone.getBoundingClientRect();
  const shorter = Math.min(width, height);
  if (!Number.isFinite(shorter) || shorter < 160) return FALLBACK_CAP_PX;
  return Math.round(shorter);
}

/**
 * Compact, content-sized, centered analysis-error dialog.
 * Max width/height ≤ resume-upload card’s shorter side; no empty stretch.
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
  const [capPx, setCapPx] = useState(FALLBACK_CAP_PX);
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
    const update = () => setCapPx(measureResumeUploadCapPx());
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

  const cap = `min(${capPx}px, 92vw, 92vh)`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50"
        style={{
          width: cap,
          maxWidth: cap,
          maxHeight: cap,
        }}
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
          className="absolute right-2.5 top-2.5 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center gap-4 overflow-y-auto px-5 py-6 text-center sm:px-6 sm:py-7">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-amber-500/15">
            <AlertTriangle className="h-8 w-8 text-amber-300" strokeWidth={2.25} />
          </div>

          <h2
            id={titleId}
            className="shrink-0 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl"
          >
            {title}
          </h2>

          <p
            id={bodyId}
            className="w-full shrink-0 whitespace-pre-wrap break-words text-center text-xl font-medium leading-snug text-slate-100 sm:text-2xl sm:leading-snug"
          >
            {message}
          </p>

          {suggestions.length > 0 ? (
            <div className="w-full shrink-0 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left">
              {suggestionsTitle ? (
                <p className="text-lg font-semibold text-slate-100">{suggestionsTitle}</p>
              ) : null}
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-snug text-slate-200">
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
            className="w-full shrink-0 rounded-xl bg-indigo-500 px-4 py-3.5 text-2xl font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {DISMISS_LABEL[language]}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
