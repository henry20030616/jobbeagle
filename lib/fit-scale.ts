/**
 * Pure fit-scale math — shared by FitStage and unit tests.
 */

export type FitScaleInput = {
  availW: number;
  availH: number;
  designWidth: number;
  designHeight?: number;
  minScale: number;
  maxScale: number;
};

export type FitScaleResult = {
  scale: number;
  /** True when enlarge-only docs run below designWidth (fluid, zoom=1). */
  fluid: boolean;
};

export function computeFitScale(input: FitScaleInput): FitScaleResult {
  const { availW, availH, designWidth, designHeight, minScale, maxScale } = input;
  if (availW <= 0) return { scale: 1, fluid: false };

  if (minScale >= 1 && availW < designWidth && designHeight == null) {
    return { scale: 1, fluid: true };
  }

  const fitW = availW / designWidth;
  const fitH = designHeight != null && designHeight > 0 ? availH / designHeight : fitW;
  const fit = Math.min(fitW, fitH);
  const scale = Math.min(maxScale, Math.max(fit, minScale));
  return { scale: Number(scale.toFixed(4)), fluid: false };
}
