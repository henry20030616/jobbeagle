'use client';

import React, { useEffect, useRef, useState } from 'react';
import { REPORT_SLIDE_DESIGN_WIDTH } from '@/constants/report-frame';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed slide canvas width (px). Internal layout always lays out at this width. */
  designWidth?: number;
  /**
   * Never scale the slide larger than this (default 1 = design size).
   * Window resize may shrink to fit, but never stretches the presentation.
   */
  maxScale?: number;
};

/**
 * Fixed-proportion presentation stage.
 * - Lays out at a constant design width (no responsive reflow inside the slide)
 * - Scales down only to fit the container; never scales up past design size
 * - Centers the slide horizontally (and vertically when the stage has height)
 */
export function ReportFitStage({
  children,
  className = '',
  designWidth = REPORT_SLIDE_DESIGN_WIDTH,
  maxScale = 1,
}: ReportFitStageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const available = outer.clientWidth;
      if (available <= 0) return;
      const fit = available / designWidth;
      const nextScale = Math.min(maxScale, fit);
      setScale(Number(nextScale.toFixed(4)));
      setContentHeight(inner.scrollHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [designWidth, maxScale]);

  const scaledHeight = contentHeight > 0 ? contentHeight * scale : undefined;
  const scaledWidth = designWidth * scale;

  return (
    <div
      ref={outerRef}
      className={`w-full min-w-0 flex justify-center items-center ${className}`}
    >
      <div
        className="relative shrink-0"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <div
          ref={innerRef}
          className="absolute top-0 left-1/2 will-change-transform"
          style={{
            width: designWidth,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
