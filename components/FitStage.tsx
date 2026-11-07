'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FIT_ZOOM_CSS_VAR } from '@/constants/fit-stage';
import { computeFitScale, type FitScaleMode } from '@/lib/fit-scale';

export type FitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed canvas width (px). Internal layout always lays out at this width when zooming. */
  designWidth: number;
  /**
   * Optional canvas height (px). When set, scale = min(availW/designW, availH/designH).
   * Used by contain-mode stages that keep a fixed aspect canvas.
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
   * contain (default): fixed design canvas + CSS zoom.
   * fill: full-bleed fluid stage — width/height 100%, zoom=1.
   * shorts: phone full-bleed; desktop 9:16 height-fill so chrome scales with the video.
   */
  mode?: FitScaleMode;
  /**
   * When true, write the current scale to :root `--jb-fit-zoom` so portals
   * (e.g. ShortsSheet) can opt into the same zoom. Fluid/fill stages publish
   * sheetZoom (stage itself stays at zoom=1).
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
 * Contain (reports): height follows the zoomed canvas so the PAGE scrolls.
 * Do not self-stretch or overflow-clip here — `overflow-x: clip` pairs to
 * `overflow-y: clip` and eats wheel/trackpad. Horizontal overflow is already
 * killed on html/body. Fill/shorts stay viewport-bound and may clip.
 * Do NOT put min-h-screen / 100vh inside the zoomed canvas (they get multiplied).
 *
 * mode="shorts": phones fill the viewport; wider screens use a 9:16 column
 * whose zoom keeps text/buttons proportional to the video.
 */
export function FitStage({
  children,
  className = '',
  designWidth,
  designHeight,
  minScale = 0.5,
  maxScale = 2.6,
  mode = 'contain',
  publishZoomVar = false,
  canvasClassName = '',
  canvasHeight,
}: FitStageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // fill stages do not zoom — show content immediately (account felt blank while waiting).
  const [ready, setReady] = useState(mode === 'fill');
  /** When enlarge-only and viewport is narrower than design, use fluid width. */
  const [fluid, setFluid] = useState(mode === 'fill');

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const update = () => {
      // Prefer the direct parent's width (report column / samples main).
      // Fall back to self. Never trust a shrink-wrapped measurement that is
      // ≈ designWidth while the viewport is clearly wider — that is the
      // centered-island lock (canvas dictates parent width).
      const parent = outer.parentElement;
      const parentW = parent?.clientWidth ?? 0;
      const selfW = outer.clientWidth;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
      let availW = parentW > 0 ? parentW : selfW;
      if (
        availW > 0
        && availW <= designWidth * 1.08
        && vw >= designWidth * 1.3
        && parentW >= vw * 0.65
      ) {
        // Full-bleed column that collapsed to the canvas — use content box.
        availW = parentW;
      }
      if (
        availW > 0
        && availW <= designWidth * 1.08
        && vw >= designWidth * 1.3
        && parentW < vw * 0.65
        && parentW <= designWidth * 1.08
      ) {
        // Parent also collapsed (island). Climb one level if it is wider.
        const grandW = parent?.parentElement?.clientWidth ?? 0;
        if (grandW > availW * 1.2) availW = grandW;
      }
      const availH = outer.clientHeight > 0 ? outer.clientHeight : window.innerHeight;
      if (availW <= 0) return;

      const { scale: rounded, fluid: nextFluid, sheetZoom } = computeFitScale({
        availW,
        availH,
        designWidth,
        designHeight,
        minScale,
        maxScale,
        mode,
      });
      setFluid(nextFluid);
      setScale(rounded);
      setReady(true);

      if (publishZoomVar) {
        document.documentElement.style.setProperty(
          FIT_ZOOM_CSS_VAR,
          String(nextFluid ? sheetZoom : rounded),
        );
      }
    };

    let orientTimer: ReturnType<typeof setTimeout> | null = null;
    const updateSoon = () => {
      // iOS fires orientationchange before layout settles — remeasure twice.
      update();
      if (orientTimer) clearTimeout(orientTimer);
      orientTimer = setTimeout(() => {
        update();
        requestAnimationFrame(update);
      }, 120);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    if (outer.parentElement) ro.observe(outer.parentElement);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', updateSoon);
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', updateSoon);
      vv?.removeEventListener('resize', update);
      if (orientTimer) clearTimeout(orientTimer);
      if (publishZoomVar) {
        document.documentElement.style.removeProperty(FIT_ZOOM_CSS_VAR);
      }
    };
  }, [designWidth, designHeight, minScale, maxScale, mode, publishZoomVar]);

  const fillLayout = mode === 'fill' || (mode === 'shorts' && fluid);
  const innerHeight = fillLayout ? undefined : (canvasHeight ?? designHeight);

  return (
    <div
      ref={outerRef}
      data-fit-stage
      data-fit-mode={mode}
      data-fit-fluid={fluid ? 'true' : 'false'}
      className={`flex w-full min-w-0 max-w-full self-stretch justify-center ${fillLayout ? 'h-full' : ''} ${mode === 'shorts' ? 'overflow-hidden' : ''} ${className}`}
      style={{ width: '100%' }}
    >
      <div
        data-fit-canvas
        className={`origin-top shrink-0 ${fluid || fillLayout ? 'w-full max-w-full' : ''} ${fillLayout ? 'h-full min-h-0' : ''} ${canvasClassName}`}
        style={{
          ...(fluid || fillLayout ? {} : { width: designWidth }),
          ...(innerHeight != null && !fluid && !fillLayout ? { height: innerHeight } : {}),
          zoom: scale,
          visibility: ready ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
