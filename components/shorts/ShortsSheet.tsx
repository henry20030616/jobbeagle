'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ShortsSheetProps = {
  children: React.ReactNode;
  onBackdropClick?: () => void;
  accentClass?: string;
};

/**
 * Viewport bottom sheet. Portal to document.body so VideoCard overflow / snap
 * cannot trap `position:fixed` and squash the panel into a thin strip.
 */
export default function ShortsSheet({
  children,
  onBackdropClick,
  accentClass = 'border-white/10',
}: ShortsSheetProps) {
  const [mounted, setMounted] = useState(false);
  const onBackdropRef = useRef(onBackdropClick);
  onBackdropRef.current = onBackdropClick;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBackdropRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onBackdropClick}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 flex h-[85dvh] max-h-[85dvh] w-full min-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border-t bg-slate-900 text-base text-slate-100 shadow-2xl ${accentClass}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
