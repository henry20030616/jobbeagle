'use client';

import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AppLanguage } from '@/lib/language-context';
import { toUserFacingAnalyzeError } from '@/lib/analyze-error-message';
import { HOMEPAGE_TITLE_TYPE } from '@/constants/report-frame';
import CenterModalShell from '@/components/CenterModalShell';

const DISMISS_LABEL: Record<AppLanguage, string> = {
  'zh-TW': '我知道了',
  'zh-CN': '我知道了',
  en: 'Got it',
};

const CLOSE_LABEL: Record<AppLanguage, string> = {
  'zh-TW': '關閉',
  'zh-CN': '关闭',
  en: 'Close',
};

/** Same scale as homepage step titles / step body prompts. */
const MODAL_TITLE = `${HOMEPAGE_TITLE_TYPE} font-bold leading-snug text-white`;
const MODAL_BODY =
  'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium leading-snug text-slate-100';

type AnalysisErrorDialogProps = {
  title: string;
  message: string;
  language: AppLanguage;
  suggestionsTitle?: string;
  suggestions?: string[];
  onDismiss: () => void;
};

/** Centered analysis-error modal — type matches homepage step titles. */
export default function AnalysisErrorDialog({
  title,
  message,
  language,
  suggestionsTitle,
  suggestions = [],
  onDismiss,
}: AnalysisErrorDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const dismissRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  const displayMessage = toUserFacingAnalyzeError(message, language).message;

  return (
    <CenterModalShell
      onDismiss={onDismiss}
      labelledBy={titleId}
      describedBy={bodyId}
      closeLabel={CLOSE_LABEL[language]}
    >
      <div className="flex flex-col items-center gap-4 px-5 py-7 text-center sm:gap-5 sm:px-8 sm:py-9">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-amber-500/15 sm:h-16 sm:w-16">
          <AlertTriangle
            className="h-8 w-8 text-amber-300 sm:h-9 sm:w-9"
            strokeWidth={2.25}
          />
        </div>

        <h2 id={titleId} className={MODAL_TITLE}>
          {title}
        </h2>

        <p id={bodyId} className={`w-full whitespace-pre-wrap break-words ${MODAL_BODY}`}>
          {displayMessage}
        </p>

        {suggestions.length > 0 ? (
          <div className="w-full rounded-xl border border-slate-600 bg-slate-900/90 px-4 py-4 text-left">
            {suggestionsTitle ? (
              <p className={`${HOMEPAGE_TITLE_TYPE} font-semibold text-slate-100`}>
                {suggestionsTitle}
              </p>
            ) : null}
            <ul className={`mt-3 list-disc space-y-2 pl-6 ${MODAL_BODY} text-slate-200`}>
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
          className={`w-full rounded-xl bg-indigo-500 px-5 py-4 ${HOMEPAGE_TITLE_TYPE} font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300`}
        >
          {DISMISS_LABEL[language]}
        </button>
      </div>
    </CenterModalShell>
  );
}
