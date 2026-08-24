'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FIT_ZOOM_CSS_VAR,
  SHORTS_DESIGN_WIDTH,
  SHORTS_SHEET_HEIGHT,
} from '@/constants/fit-stage';

type ShortsSheetProps = {
  children: React.ReactNode;
  onBackdropClick?: () => void;
  accentClass?: string;
};

/**
 * Viewport bottom sheet — portaled so VideoCard `overflow:hidden` cannot clip it
 * (job “...more” details, apply, AI match). Backdrop is unscaled (fixed inset-0).
 * Content uses phone canvas width + `--jb-fit-zoom` from the Shorts FitStage.
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
    <div className="fixed inset-0 z-[200] flex items-end justify-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onBackdropClick}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 flex flex-col overflow-hidden rounded-t-3xl border-t bg-slate-900 text-base text-slate-100 shadow-2xl ${accentClass}`}
        style={{
          width: SHORTS_DESIGN_WIDTH,
          height: SHORTS_SHEET_HEIGHT,
          zoom: `var(${FIT_ZOOM_CSS_VAR}, 1)`,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
