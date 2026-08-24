/**
 * Pure fit-scale math — shared by FitStage and unit tests.
 */

export type FitScaleMode = 'contain' | 'fill' | 'shorts';

export type FitScaleInput = {
  availW: number;
  availH: number;
  designWidth: number;
  designHeight?: number;
  minScale: number;
  maxScale: number;
  /**
   * contain (default): fixed canvas + zoom to fit.
   * fill: fluid 100%×100%, zoom=1.
   * shorts: phone/narrow (≤9:16) full-bleed; wider viewports 9:16 height-fill with zoom.
   */
  mode?: FitScaleMode;
};

export type FitScaleResult = {
  scale: number;
  /** True when enlarge-only docs run below designWidth (fluid, zoom=1), or mode=fill. */
  fluid: boolean;
  /**
   * Zoom for portaled sheets. Equal to scale in contain mode; in fill mode
   * the stage stays at zoom=1 and sheets use this separate zoom.
   */
  sheetZoom: number;
};

const NINE_SIXTEEN = 9 / 16;

function computeShortsScale(input: {
  availW: number;
  availH: number;
  designWidth: number;
  designHeight?: number;
  minScale: number;
  maxScale: number;
}): FitScaleResult {
  const { availW, availH, designWidth, designHeight, minScale, maxScale } = input;
  const ratio = availH > 0 ? availW / availH : 1;
  // Portrait / narrower than 9:16 (phones): edge-to-edge, native type size.
  if (ratio <= NINE_SIXTEEN) {
    return { scale: 1, fluid: true, sheetZoom: 1 };
  }
  // Landscape / desktop: 9:16 column filling height so chrome scales with the video.
  const height =
    designHeight != null && designHeight > 0
      ? designHeight
      : Math.round((designWidth * 16) / 9);
  const fitW = availW / designWidth;
  const fitH = height > 0 ? availH / height : fitW;
  const fit = Math.min(fitW, fitH);
  const scale = Math.min(maxScale, Math.max(fit, minScale));
  const rounded = Number(scale.toFixed(4));
  return { scale: rounded, fluid: false, sheetZoom: rounded };
}

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

  if (mode === 'shorts') {
    return computeShortsScale({
      availW,
      availH,
      designWidth,
      designHeight,
      minScale,
      maxScale,
    });
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
