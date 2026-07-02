'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportPagerProps {
  children: React.ReactNode[];
  labels?: string[];
}

export default function ReportPager({ children, labels }: ReportPagerProps) {
  const total = children.length;
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(total - 1, next)));
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? index + 1 : index - 1);
    touchStart.current = null;
  };

  return (
    <div className="no-print">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-semibold text-jb-accent tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-jb-ink-subtle">/</span>
          <span className="text-sm text-jb-ink-muted tabular-nums">{String(total).padStart(2, '0')}</span>
          {labels?.[index] && (
            <span className="hidden text-sm text-jb-ink-muted sm:inline">· {labels[index]}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="jb-interactive flex h-10 w-10 items-center justify-center rounded-jb border border-jb-border bg-jb-elevated text-jb-ink disabled:opacity-30"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            className="jb-interactive flex h-10 w-10 items-center justify-center rounded-jb border border-jb-border bg-jb-elevated text-jb-ink disabled:opacity-30"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-jb-lg" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full shrink-0 px-0.5">
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {children.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-8 bg-jb-accent' : 'w-1.5 bg-jb-border hover:bg-jb-ink-subtle'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
