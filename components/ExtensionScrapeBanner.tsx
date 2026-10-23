'use client';

import { AlertTriangle } from 'lucide-react';
import {
  extensionScrapeBannerChrome,
  getExtensionScrapeError,
} from '@/constants/extension-scrape-errors';

export default function ExtensionScrapeBanner({
  errorKey,
  language,
  onDismiss,
}: {
  errorKey: string;
  language: string;
  onDismiss: () => void;
}) {
  const message = getExtensionScrapeError(errorKey, language);
  if (!message) return null;
  const chrome = extensionScrapeBannerChrome(language);
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-50">{chrome.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/90">{message}</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-200/80">{chrome.hint}</p>
      </div>
      <button
        type="button"
        className="shrink-0 text-amber-300/80 hover:text-amber-100"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
