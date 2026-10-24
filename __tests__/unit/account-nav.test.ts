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
} from '@/constants/account-nav';
import AccountSectionNav from '@/components/AccountSectionNav';

const ACCOUNT_PAGE = readFileSync(join(process.cwd(), 'app/account/page.tsx'), 'utf8');

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
    expect(ACCOUNT_PAGE).toContain('<AccountSectionNav language={language} />');
    expect(ACCOUNT_PAGE).toContain('lg:flex-row');
    expect(ACCOUNT_PAGE).not.toContain('我的帳號管理');
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
    expect(html).not.toContain('我的帳號管理');
    expect(html).not.toContain('帳戶管理');
  });
});
