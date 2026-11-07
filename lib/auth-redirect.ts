/**
 * Build /auth/callback URL with optional post-login redirect + referral.
 */
export function buildAuthCallbackUrl(options: {
  origin: string;
  redirectTo?: string;
  referralCode?: string | null;
}): string {
  const callbackUrl = new URL(`${options.origin}/auth/callback`);
  if (options.redirectTo) {
    callbackUrl.searchParams.set('redirect', options.redirectTo);
  }
  const ref = (options.referralCode || '').trim();
  if (ref) {
    callbackUrl.searchParams.set('ref', ref);
  }
  return callbackUrl.toString();
}
