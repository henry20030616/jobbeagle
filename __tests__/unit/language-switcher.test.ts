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
    expect(source).toContain("chrome ? 'min-w-[28rem] w-max' : 'min-w-[16rem] w-max'");
    expect(source).not.toMatch(/w-48 sm:w-56 lg:w-80/);
    expect(source).toMatch(/className=\{`w-full flex items-center gap-3 px-4 whitespace-nowrap/);
    expect(source).toContain('font-medium whitespace-nowrap');
  });

  it('does not truncate or wrap the closed trigger label', () => {
    expect(source).toMatch(/inline-flex items-center whitespace-nowrap/);
    expect(source).toMatch(/span className=\{`whitespace-nowrap \$\{chrome/);
    expect(source).not.toMatch(/truncate max-w-\[4\.5rem\]/);
  });
});
