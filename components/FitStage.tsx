'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FIT_ZOOM_CSS_VAR } from '@/constants/fit-stage';
import { computeFitScale } from '@/lib/fit-scale';

export type FitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed canvas width (px). Internal layout always lays out at this width when zooming. */
  designWidth: number;
  /**
   * Optional canvas height (px). When set, scale = min(availW/designW, availH/designH).
   * Used by Shorts so the phone column fits both axes.
   */
  designHeight?: number;
  /**
   * Lower clamp. Doc pages use 1 (never shrink): below designWidth the canvas
   * becomes fluid 100% width with zoom=1 so laptop/phone layouts stay unchanged.
   */
  minScale?: number;
  /** Upper clamp so ultrawides don’t become unreadably huge. */
  maxScale?: number;
  /**
   * When true, write the current scale to :root `--jb-fit-zoom` so portals
   * (e.g. ShortsSheet) can opt into the same zoom.
   */
  publishZoomVar?: boolean;
  /** Extra class on the zoomed inner canvas. */
  canvasClassName?: string;
  /** Fixed height on the zoomed canvas (px). Defaults to designHeight when set. */
  canvasHeight?: number;
};

/**
 * Fixed-proportion stage: lay out at designWidth (× designHeight), then scale
 * with CSS `zoom` (not transform:scale — zoom keeps text crisp).
 *
 * Outer always clips horizontally — never contributes to page scroll.
 * Do NOT put min-h-screen / 100vh inside the zoomed canvas (they get multiplied).
 */
export function FitStage({
  children,
  className = '',
  designWidth,
  designHeight,
  minScale = 0.5,
  maxScale = 2.6,
  publishZoomVar = false,
  canvasClassName = '',
  canvasHeight,
}: FitStageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  /** When enlarge-only and viewport is narrower than design, use fluid width. */
  const [fluid, setFluid] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const update = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight > 0 ? outer.clientHeight : window.innerHeight;
      if (availW <= 0) return;

      const { scale: rounded, fluid: nextFluid } = computeFitScale({
        availW,
        availH,
        designWidth,
        designHeight,
        minScale,
        maxScale,
      });
      setFluid(nextFluid);
      setScale(rounded);
      setReady(true);

      if (publishZoomVar) {
        document.documentElement.style.setProperty(FIT_ZOOM_CSS_VAR, String(rounded));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      if (publishZoomVar) {
        document.documentElement.style.removeProperty(FIT_ZOOM_CSS_VAR);
      }
    };
  }, [designWidth, designHeight, minScale, maxScale, publishZoomVar]);

  const innerHeight = canvasHeight ?? designHeight;

  return (
    <div
      ref={outerRef}
      data-fit-stage
      className={`flex w-full min-w-0 justify-center overflow-x-clip self-stretch ${className}`}
    >
      <div
        data-fit-canvas
        className={`origin-top shrink-0 ${fluid ? 'w-full max-w-full' : ''} ${canvasClassName}`}
        style={{
          ...(fluid ? {} : { width: designWidth }),
          ...(innerHeight != null && !fluid ? { height: innerHeight } : {}),
          zoom: scale,
          visibility: ready ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
