'use client';

import React, { useEffect, useRef, useState } from 'react';
import { REPORT_SLIDE_DESIGN_WIDTH } from '@/constants/report-frame';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed slide canvas width (px). Internal layout always lays out at this width. */
  designWidth?: number;
};

/**
 * One-page presentation stage: children lay out at a fixed design width, then
 * the whole slide is scaled uniformly to the container. Proportions never reflow
 * when the browser window or page zoom changes — only the outer scale factor does.
 */
export function ReportFitStage({
  children,
  className = '',
  designWidth = REPORT_SLIDE_DESIGN_WIDTH,
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
      const nextScale = available / designWidth;
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
  }, [designWidth]);

  return (
    <div ref={outerRef} className={`w-full min-w-0 overflow-x-hidden ${className}`}>
      <div
        className="relative w-full"
        style={{ height: contentHeight > 0 ? contentHeight * scale : undefined }}
      >
        <div
          ref={innerRef}
          className="origin-top-left will-change-transform"
          style={{
            width: designWidth,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
