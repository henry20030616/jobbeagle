/**
 * Shorts 底部「個人 / 企業」分頁要開哪一種後台視角（僅本人瀏覽器）。
 * 與公開企業主頁 /shorts/company/[id] 無關。
 */
export const SHORTS_VIEW_ROLE_KEY = 'jobbeagle_shorts_view_role';

export type ShortsViewRole = 'personal' | 'company';

export function getStoredShortsViewRole(): ShortsViewRole | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(SHORTS_VIEW_ROLE_KEY);
  if (v === 'personal' || v === 'company') return v;
  return null;
}

export function setStoredShortsViewRole(role: ShortsViewRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHORTS_VIEW_ROLE_KEY, role);
}

/** Explicit account type chosen at login (employer vs talent). */
export const ACCOUNT_ROLE_KEY = 'jobbeagle_account_role';
export type AccountRole = 'employer' | 'talent';

export function getStoredAccountRole(): AccountRole | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(ACCOUNT_ROLE_KEY);
  if (v === 'employer' || v === 'talent') return v;
  return null;
}

export function setStoredAccountRole(role: AccountRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNT_ROLE_KEY, role);
}

/** Prefer explicit login choice; fall back to company profile presence. */
export function resolveUserRole(hasCompanyProfile: boolean): AccountRole {
  const stored = getStoredAccountRole();
  if (stored) return stored;
  return hasCompanyProfile ? 'employer' : 'talent';
}

/** 無企業資料時只能個人；有企業且尚未選過時預設企業後台 */
export function resolveShortsViewMode(hasCompanyProfile: boolean): ShortsViewRole {
  if (!hasCompanyProfile) return 'personal';
  const stored = getStoredShortsViewRole();
  if (stored) return stored;
  return 'company';
}
