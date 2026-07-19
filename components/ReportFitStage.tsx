'use client';

import React, { useEffect, useRef, useState } from 'react';
import { REPORT_SLIDE_DESIGN_WIDTH } from '@/constants/report-frame';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed slide canvas width (px). Internal layout always lays out at this width. */
  designWidth?: number;
  /** Upper bound so extreme ultrawides don’t become unreadably huge. */
  maxScale?: number;
};

/**
 * Fixed-proportion stage: lay out at designWidth, then enlarge with CSS `zoom`
 * (not transform:scale). Zoom keeps text/vectors crisp; transform:scale rasterizes
 * and looks blurry when scale > 1.
 */
export function ReportFitStage({
  children,
  className = '',
  designWidth = REPORT_SLIDE_DESIGN_WIDTH,
  maxScale = 2.4,
}: ReportFitStageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const update = () => {
      const available = outer.clientWidth;
      if (available <= 0) return;
      const fit = available / designWidth;
      const nextScale = Math.min(maxScale, Math.max(fit, 0.5));
      setScale(Number(nextScale.toFixed(4)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [designWidth, maxScale]);

  return (
    <div
      ref={outerRef}
      className={`w-full min-w-0 self-stretch flex justify-center ${className}`}
    >
      <div
        className="shrink-0"
        style={{
          width: designWidth,
          // Chromium/Safari: zoom scales layout + paint without blurry upscaling.
          // Firefox 126+ also supports zoom; older FF falls back to 1× width.
          zoom: scale,
        }}
      >
        {children}
      </div>
    </div>
  );
}
