/**
 * Pure fit-scale math — shared by FitStage and unit tests.
 */

export type FitScaleMode = 'contain' | 'fill';

export type FitScaleInput = {
  availW: number;
  availH: number;
  designWidth: number;
  designHeight?: number;
  minScale: number;
  maxScale: number;
  /**
   * contain (default): fixed canvas + zoom to fit.
   * fill: fluid 100%×100%, zoom=1 (desktop Shorts full-bleed).
   */
  mode?: FitScaleMode;
};

export type FitScaleResult = {
  scale: number;
  /** True when enlarge-only docs run below designWidth (fluid, zoom=1), or mode=fill. */
  fluid: boolean;
  /**
   * Zoom for portaled sheets when the stage itself is fill (zoom=1).
   * Keeps ShortsSheet / ShareSheet readable on wide desktops.
   */
  sheetZoom: number;
};

/** Sheet zoom when stage is full-bleed — target ~40% of viewport width from a 430px canvas. */
export function computeSheetZoom(availW: number, designWidth: number, maxScale: number): number {
  if (availW <= 0 || designWidth <= 0) return 1;
  const targetW = Math.min(availW * 0.9, Math.max(designWidth, availW * 0.4));
  return Number(Math.min(maxScale, Math.max(1, targetW / designWidth)).toFixed(4));
}

export function computeFitScale(input: FitScaleInput): FitScaleResult {
  const {
    availW,
    availH,
    designWidth,
    designHeight,
    minScale,
    maxScale,
    mode = 'contain',
  } = input;
  if (availW <= 0) return { scale: 1, fluid: false, sheetZoom: 1 };

  if (mode === 'fill') {
    return {
      scale: 1,
      fluid: true,
      sheetZoom: computeSheetZoom(availW, designWidth, maxScale),
    };
  }

  if (minScale >= 1 && availW < designWidth && designHeight == null) {
    return { scale: 1, fluid: true, sheetZoom: 1 };
  }

  const fitW = availW / designWidth;
  const fitH = designHeight != null && designHeight > 0 ? availH / designHeight : fitW;
  const fit = Math.min(fitW, fitH);
  const scale = Math.min(maxScale, Math.max(fit, minScale));
  const rounded = Number(scale.toFixed(4));
  return { scale: rounded, fluid: false, sheetZoom: rounded };
}
