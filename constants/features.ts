/** Product feature flags — freeze non-core surfaces by default */

/**
 * Shorts / employer video recruiting surface.
 * Set NEXT_PUBLIC_SHORTS_ENABLED=true to re-enable public CTAs and /shorts routes.
 * Default: frozen (false) so engineering focus stays on extension → /confirm → analyze.
 */
export function isShortsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHORTS_ENABLED === 'true';
}
