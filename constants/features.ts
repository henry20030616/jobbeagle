/** Product feature flags */

/**
 * Shorts / employer video recruiting surface.
 * Enabled by default. Set NEXT_PUBLIC_SHORTS_ENABLED=false to freeze.
 */
export function isShortsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHORTS_ENABLED !== 'false';
}
