/** Design canvas width for DogLoading progress card (former max-w-md). */
export const DOG_LOADING_CARD_WIDTH = 448;

/**
 * Scale so the analyze progress card reads clearly on desktop/ultrawide.
 * Target ≈ 36% of viewport width, clamped to [1, 2.4].
 */
export function computeDogLoadingZoom(viewportW: number): number {
  if (viewportW <= 0) return 1;
  const targetW = Math.min(
    viewportW * 0.9,
    Math.max(DOG_LOADING_CARD_WIDTH, viewportW * 0.36),
  );
  return Math.min(2.4, Math.max(1, targetW / DOG_LOADING_CARD_WIDTH));
}
