import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_OPTIONS } from '@/lib/language-context';

const source = readFileSync(
  join(process.cwd(), 'components/LanguageSwitcher.tsx'),
  'utf8',
);

describe('LanguageSwitcher label layout', () => {
  it('keeps the six shipped locales', () => {
    expect(LANGUAGE_OPTIONS.map(o => o.code)).toEqual([
      'en',
      'zh-TW',
      'zh-CN',
      'es',
      'hi',
      'ar',
    ]);
  });

  it('widens the menu so native names stay on one line with the check', () => {
    expect(source).toContain('lg:min-w-[28rem]');
    expect(source).toContain('max-w-[calc(100vw-2rem)]');
    expect(source).toContain('HOMEPAGE_POPOVER_PANEL');
    expect(source).toContain('sm:min-w-[18em]');
    expect(source).not.toMatch(/w-48 sm:w-56 lg:w-80/);
    expect(source).not.toContain('overflow-hidden');
    expect(source).not.toMatch(/py-2\.5 text-sm/);
    expect(source).toContain('HOMEPAGE_POPOVER_OPTION');
    expect(source).toContain('ms-2 font-medium whitespace-nowrap');
    expect(source).toMatch(/ml-auto shrink-0 text-indigo-400/);
  });

  it('does not truncate or wrap the closed trigger label', () => {
    expect(source).toMatch(/inline-flex items-center gap-2 whitespace-nowrap/);
    expect(source).toMatch(/span className=\{`ms-2 whitespace-nowrap \$\{chrome/);
    expect(source).not.toMatch(/truncate max-w-\[4\.5rem\]/);
  });
});
