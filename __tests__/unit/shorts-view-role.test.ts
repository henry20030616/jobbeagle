/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  SHORTS_VIEW_ROLE_KEY,
  ACCOUNT_ROLE_KEY,
  getStoredShortsViewRole,
  setStoredShortsViewRole,
  getStoredAccountRole,
  setStoredAccountRole,
  resolveUserRole,
  resolveShortsViewMode,
} from '@/lib/shorts-view-role';

describe('shorts-view-role storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStoredShortsViewRole returns null when unset', () => {
    expect(getStoredShortsViewRole()).toBeNull();
  });

  it('set/get shorts view role round-trips', () => {
    setStoredShortsViewRole('company');
    expect(getStoredShortsViewRole()).toBe('company');
    expect(localStorage.getItem(SHORTS_VIEW_ROLE_KEY)).toBe('company');
  });

  it('ignores invalid stored shorts view role', () => {
    localStorage.setItem(SHORTS_VIEW_ROLE_KEY, 'invalid');
    expect(getStoredShortsViewRole()).toBeNull();
  });

  it('set/get account role round-trips', () => {
    setStoredAccountRole('employer');
    expect(getStoredAccountRole()).toBe('employer');
    expect(localStorage.getItem(ACCOUNT_ROLE_KEY)).toBe('employer');
  });
});

describe('resolveUserRole', () => {
  beforeEach(() => localStorage.clear());

  it('prefers stored account role over company profile', () => {
    setStoredAccountRole('talent');
    expect(resolveUserRole(true)).toBe('talent');
  });

  it('defaults to employer when has company profile and no stored role', () => {
    expect(resolveUserRole(true)).toBe('employer');
  });

  it('defaults to talent when no company profile and no stored role', () => {
    expect(resolveUserRole(false)).toBe('talent');
  });
});

describe('resolveShortsViewMode', () => {
  beforeEach(() => localStorage.clear());

  it('always personal when no company profile', () => {
    expect(resolveShortsViewMode(false)).toBe('personal');
  });

  it('defaults to company when has profile and no stored view', () => {
    expect(resolveShortsViewMode(true)).toBe('company');
  });

  it('respects stored personal view even with company profile', () => {
    setStoredShortsViewRole('personal');
    expect(resolveShortsViewMode(true)).toBe('personal');
  });
});
