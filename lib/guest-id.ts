/** Persistent anonymous id for the 1× guest Fit Snapshot ledger (client-only). */

const STORAGE_KEY = 'jb_guest_id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && UUID_RE.test(existing)) return existing.toLowerCase();

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;

    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return '';
  }
}
