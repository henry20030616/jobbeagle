import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_OPTIONS } from '@/lib/language-context';
import {
  LOGIN_BUTTON_COPY,
  getLoginButtonCopy,
} from '@/constants/login-button-copy';
import {
  HEADER_ACCOUNT_HREF,
  LoggedInHeaderControls,
} from '@/components/LoginButton';

describe('login button copy', () => {
  it('covers every UI language', () => {
    for (const { code } of LANGUAGE_OPTIONS) {
      const copy = getLoginButtonCopy(code);
      expect(copy.account.trim().length).toBeGreaterThan(0);
      expect(copy.accountTitle.trim().length).toBeGreaterThan(0);
      expect(copy.logout.trim().length).toBeGreaterThan(0);
      expect(LOGIN_BUTTON_COPY[code]).toEqual(copy);
    }
  });

  it('uses my-account titles for the merged identity control', () => {
    expect(LOGIN_BUTTON_COPY['zh-TW'].accountTitle).toBe('我的帳號管理');
    expect(LOGIN_BUTTON_COPY['zh-CN'].accountTitle).toBe('我的帐号管理');
    expect(LOGIN_BUTTON_COPY.en.accountTitle).toBe('My account');
    expect(LOGIN_BUTTON_COPY.es.accountTitle).toBe('Mi cuenta');
    expect(LOGIN_BUTTON_COPY.hi.accountTitle).toBe('मेरा खाता');
    expect(LOGIN_BUTTON_COPY.ar.accountTitle).toBe('حسابي');
  });
});

describe('LoggedInHeaderControls', () => {
  it('links a single identity control to /account and keeps logout', () => {
    const html = renderToStaticMarkup(
      createElement(LoggedInHeaderControls, {
        avatarUrl: undefined,
        copy: getLoginButtonCopy('zh-TW'),
        onLogout: () => undefined,
      }),
    );

    expect(HEADER_ACCOUNT_HREF).toBe('/account');
    expect(html).toContain('href="/account"');
    expect(html.match(/href="\/account"/g)?.length).toBe(1);
    expect(html).toContain('我的帳號管理');
    expect(html).not.toContain('>帳戶<');
    expect(html).not.toContain('>帳戶管理<');
    expect(html).toContain('登出');
  });

  it('does not send a logged-in control to anywhere except /account', () => {
    const html = renderToStaticMarkup(
      createElement(LoggedInHeaderControls, {
        avatarUrl: 'https://example.com/ada.png',
        copy: getLoginButtonCopy('en'),
        onLogout: () => undefined,
      }),
    );

    expect(html).toContain('href="/account"');
    expect(html.match(/href="\/account"/g)?.length).toBe(1);
    expect(html).not.toContain('href="/account/danger"');
    expect(html).toContain('My account');
    expect(html).not.toContain('>Account<');
    expect(html).not.toContain('Account management');
    expect(html).toContain('Log out');
  });

  it('shows the localized account label without Google identity or truncation', () => {
    const html = renderToStaticMarkup(
      createElement(LoggedInHeaderControls, {
        avatarUrl: undefined,
        copy: getLoginButtonCopy('zh-TW'),
        onLogout: () => undefined,
      }),
    );

    expect(html).toContain('我的帳號管理');
    expect(html).not.toContain('henry20030616');
    expect(html).not.toContain('henry061680@gmail.com');
    expect(html).not.toContain('@gmail.com');
    expect(html).not.toContain('max-w-[7.5rem]');
    expect(html).not.toContain('max-w-[10rem]');
    expect(html).not.toContain('max-w-[12rem]');
    expect(html).not.toContain('max-w-[18rem]');
    expect(html).not.toContain('truncate');
    expect(html).toContain('whitespace-nowrap');
    expect(html.match(/href="\/account"/g)?.length).toBe(1);
    expect(html).toContain('登出');
  });
});
