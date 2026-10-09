'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Puzzle } from 'lucide-react';
import { jdPasteSteps } from '@/lib/jd-paste-help';

export interface ErrorStateUIProps {
  boardLabel?: string;
  language?: string;
  extensionHref?: string;
  /** Focus the JD textarea so the user stays on the funnel. */
  onPasteHere?: () => void;
}

/**
 * Shown when the user pastes a login-walled job-board URL.
 * Manual paste is the primary path; extension is secondary.
 */
export default function ErrorStateUI({
  boardLabel = 'LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs',
  language = 'en',
  extensionHref = '/extension',
  onPasteHere,
}: ErrorStateUIProps) {
  const zh = language === 'zh-TW' || language === 'zh-CN';

  const copy = zh
    ? {
        title: `偵測到 ${boardLabel} 網址，網站無法直接抓取。請複製職缺全文貼上（不必先裝外掛）。`,
        pasteHere: '貼上職缺文字',
        extension: '或用外掛一鍵抓取',
      }
    : {
        title: `We detected a ${boardLabel} URL and cannot fetch it. Paste the full job text — you do not need the extension.`,
        pasteHere: 'Paste job text here',
        extension: 'Or capture with the extension',
      };

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border border-amber-500/40 bg-amber-950/50 text-amber-100 animate-fade-in"
      role="alert"
    >
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm leading-relaxed text-amber-50/95">{copy.title}</p>
        </div>

        <p className="rounded-lg border border-amber-600/30 bg-amber-950/60 px-3 py-2.5 text-sm leading-relaxed text-amber-100/90">
          {jdPasteSteps(language)}
        </p>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={onPasteHere}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/30 transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            {copy.pasteHere}
          </button>

          <Link
            href={extensionHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500/60 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700/80 active:scale-[0.98]"
          >
            <Puzzle className="h-4 w-4" />
            <span>{copy.extension}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
