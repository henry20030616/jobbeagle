'use client';

import React, { useEffect, useRef, useState } from 'react';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Viewport / container width where zoom stays at 1 */
  baselinePx?: number;
  /** Cap so ultrawide monitors don’t over-magnify */
  maxZoom?: number;
};

/**
 * Scale report chrome up on large monitors (CSS `zoom`).
 * Without this, rem-sized slides stay optically small under a wide empty canvas
 * even when `max-width` is nearly full viewport.
 */
export function ReportFitStage({
  children,
  className = '',
  baselinePx = 1280,
  maxZoom = 1.5,
}: ReportFitStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth || window.innerWidth;
      const byWidth = width / baselinePx;
      // Scale up on large monitors; never shrink below 1 (layout stacks instead).
      const next = Math.min(Math.max(byWidth, 1), maxZoom);
      setZoom(Number(next.toFixed(3)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [baselinePx, maxZoom]);

  return (
    <div ref={ref} className={`w-full min-w-0 ${className}`}>
      <div className="w-full min-w-0 origin-top" style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}
