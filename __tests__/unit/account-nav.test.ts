import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_OPTIONS } from '@/lib/language-context';
import {
  ACCOUNT_HASH_IDS,
  ACCOUNT_NAV_COPY,
  ACCOUNT_NAV_ITEMS,
  accountNavLabel,
  getAccountNavCopy,
  isAccountHashId,
} from '@/constants/account-nav';
import AccountSectionNav from '@/components/AccountSectionNav';

const ACCOUNT_PAGE = readFileSync(join(process.cwd(), 'app/account/page.tsx'), 'utf8');
const ACCOUNT_CSS = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

describe('account function nav', () => {
  it('covers every UI language with non-empty labels', () => {
    for (const { code } of LANGUAGE_OPTIONS) {
      const copy = getAccountNavCopy(code);
      expect(ACCOUNT_NAV_COPY[code]).toEqual(copy);
      expect(copy.ariaLabel.trim().length).toBeGreaterThan(0);
      for (const item of ACCOUNT_NAV_ITEMS) {
        expect(accountNavLabel(item, copy).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('lists existing account functions in zh-TW without inventing new products', () => {
    const copy = getAccountNavCopy('zh-TW');
    expect(ACCOUNT_NAV_ITEMS.map((item) => item.id)).toEqual([
      'overview',
      'career-context',
      'plans',
      'subscription-actions',
      'sponsor',
      'billing',
      'referrals',
      'danger',
    ]);
    expect(copy.overview).toBe('總覽');
    expect(copy.careerContext).toBe('職涯條件');
    expect(copy.plans).toBe('購買方案');
    expect(copy.subscriptionActions).toBe('取消訂閱');
    expect(copy.sponsor).toBe('贊助 JobBeagle');
    expect(copy.billing).toBe('帳單紀錄');
    expect(copy.referrals).toBe('推薦紀錄');
    expect(copy.danger).toBe('暫停／刪除帳戶');
  });

  it('uses hash targets for on-page sections and the existing danger route', () => {
    const hashes = ACCOUNT_NAV_ITEMS.filter((item) => item.href.startsWith('#'));
    const routes = ACCOUNT_NAV_ITEMS.filter((item) => !item.href.startsWith('#'));
    expect(hashes.map((item) => item.href)).toEqual(ACCOUNT_HASH_IDS.map((id) => `#${id}`));
    expect(routes).toEqual([{ id: 'danger', href: '/account/danger' }]);
  });

  it('keeps matching section ids on the account page', () => {
    for (const id of ACCOUNT_HASH_IDS) {
      expect(ACCOUNT_PAGE).toContain(`id="${id}"`);
    }
    expect(ACCOUNT_PAGE).toContain('<AccountSectionNav language={language} activeId={panel} />');
    expect(ACCOUNT_PAGE).toContain('lg:flex-row');
    expect(ACCOUNT_PAGE).not.toContain('我的帳號管理');
  });

  it('shows one tab panel at a time with headings from nav copy', () => {
    for (const id of ACCOUNT_HASH_IDS) {
      expect(ACCOUNT_PAGE).toContain(`panel === '${id}'`);
    }
    expect(ACCOUNT_PAGE).toContain('{navCopy.overview}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.careerContext}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.plans}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.subscriptionActions}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.sponsor}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.billing}');
    expect(ACCOUNT_PAGE).toContain('{navCopy.referrals}');
    expect(isAccountHashId('overview')).toBe(true);
    expect(isAccountHashId('danger')).toBe(false);
  });

  it('left-aligns a full-width account shell and uses homepage type tokens', () => {
    expect(ACCOUNT_PAGE).toContain('account-font-large');
    expect(ACCOUNT_PAGE).toContain('mode="fill"');
    expect(ACCOUNT_PAGE).toContain('!justify-start');
    expect(ACCOUNT_PAGE).toContain('mx-0 w-full max-w-none');
    expect(ACCOUNT_PAGE).not.toContain('mx-auto w-full px-4');
    expect(ACCOUNT_CSS).toContain('.account-font-large');
    expect(ACCOUNT_CSS).toContain('--type-ui: 2.75rem');
    expect(ACCOUNT_CSS).toContain('--type-rest: 4rem');
    expect(ACCOUNT_CSS).toContain('--type-chrome: 3.15rem');
  });

  it('uses the navy/blue account palette instead of mixed accent islands', () => {
    expect(ACCOUNT_PAGE).toContain('border-blue-500 bg-blue-950/40');
    expect(ACCOUNT_PAGE).toContain('bg-blue-600 hover:bg-blue-500');
    expect(ACCOUNT_PAGE).toContain('bg-amber-600 hover:bg-amber-500');
    expect(ACCOUNT_PAGE).not.toContain('bg-emerald-');
    expect(ACCOUNT_PAGE).not.toContain('border-emerald-');
    expect(ACCOUNT_PAGE).not.toContain('text-emerald-');
    expect(ACCOUNT_PAGE).not.toContain('bg-indigo-');
    expect(ACCOUNT_PAGE).not.toContain('bg-violet-');
  });

  it('renders a wrapping mobile row and a left desktop stack without duplicating the header title', () => {
    const html = renderToStaticMarkup(
      createElement(AccountSectionNav, { language: 'zh-TW' }),
    );
    expect(html).toContain('aria-label="帳戶功能"');
    expect(html).toContain('href="#overview"');
    expect(html).toContain('href="#career-context"');
    expect(html).toContain('href="#plans"');
    expect(html).toContain('href="#subscription-actions"');
    expect(html).toContain('href="#sponsor"');
    expect(html).toContain('href="#billing"');
    expect(html).toContain('href="#referrals"');
    expect(html).toContain('href="/account/danger"');
    expect(html).toContain('總覽');
    expect(html).toContain('職涯條件');
    expect(html).toContain('購買方案');
    expect(html).toContain('取消訂閱');
    expect(html).toContain('贊助 JobBeagle');
    expect(html).toContain('帳單紀錄');
    expect(html).toContain('推薦紀錄');
    expect(html).toContain('暫停／刪除帳戶');
    expect(html).toContain('flex-wrap');
    expect(html).toContain('lg:flex-col');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('bg-blue-900');
    expect(html).not.toContain('indigo-500');
    expect(html).not.toContain('我的帳號管理');
    expect(html).not.toContain('帳戶管理');
  });
});
