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

  it('uses account-management titles for the merged identity control', () => {
    expect(LOGIN_BUTTON_COPY['zh-TW'].accountTitle).toBe('帳戶管理');
    expect(LOGIN_BUTTON_COPY.en.accountTitle).toBe('Account management');
  });
});

describe('LoggedInHeaderControls', () => {
  it('links a single identity control to /account and keeps logout', () => {
    const html = renderToStaticMarkup(
      createElement(LoggedInHeaderControls, {
        avatarUrl: undefined,
        displayName: 'Ada',
        displayEmail: 'ada@example.com',
        copy: getLoginButtonCopy('zh-TW'),
        onLogout: () => undefined,
      }),
    );

    expect(HEADER_ACCOUNT_HREF).toBe('/account');
    expect(html).toContain('href="/account"');
    expect(html.match(/href="\/account"/g)?.length).toBe(1);
    expect(html).toContain('Ada');
    expect(html).toContain('ada@example.com');
    expect(html).toContain('帳戶管理');
    expect(html).not.toContain('>帳戶<');
    expect(html).toContain('登出');
  });

  it('does not send a logged-in control to anywhere except /account', () => {
    const html = renderToStaticMarkup(
      createElement(LoggedInHeaderControls, {
        avatarUrl: 'https://example.com/ada.png',
        displayName: 'Ada',
        displayEmail: '',
        copy: getLoginButtonCopy('en'),
        onLogout: () => undefined,
      }),
    );

    expect(html).toContain('href="/account"');
    expect(html.match(/href="\/account"/g)?.length).toBe(1);
    expect(html).not.toContain('href="/account/danger"');
    expect(html).toContain('Account management');
    expect(html).not.toContain('>Account<');
    expect(html).toContain('Log out');
  });
});
