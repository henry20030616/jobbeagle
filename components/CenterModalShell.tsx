'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type CenterModalShellProps = {
  children: React.ReactNode;
  onDismiss: () => void;
  labelledBy?: string;
  describedBy?: string;
  closeLabel?: string;
  /** Extra classes on the dialog panel. */
  panelClassName?: string;
};

/**
 * Viewport-centered modal for homepage error / paywall flows.
 * No CSS zoom — size comes from homepage title type scale.
 */
export default function CenterModalShell({
  children,
  onDismiss,
  labelledBy,
  describedBy,
  closeLabel = 'Close',
  panelClassName = '',
}: CenterModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in sm:p-6"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative flex max-h-[min(88dvh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-[3px] border-blue-500 bg-zinc-950 shadow-2xl shadow-blue-950/50 ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
