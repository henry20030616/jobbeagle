import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(
  join(process.cwd(), 'components/AnalysisErrorDialog.tsx'),
  'utf8',
);
const PAYWALL = readFileSync(
  join(process.cwd(), 'components/QuotaPaywallCard.tsx'),
  'utf8',
);
const SHELL = readFileSync(
  join(process.cwd(), 'components/CenterModalShell.tsx'),
  'utf8',
);
const PAGE = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');

describe('centered error + paywall modals', () => {
  it('centers both dialogs in the viewport without CSS zoom hacks', () => {
    expect(SHELL).toContain('fixed inset-0');
    expect(SHELL).toContain('items-center justify-center');
    expect(SHELL).toContain('createPortal');
    expect(SRC).toContain('CenterModalShell');
    expect(SRC).not.toContain('zoom:');
    expect(PAYWALL).toContain('CenterModalShell');
    expect(PAYWALL).not.toContain('zoom:');
  });

  it('uses homepage step title type scale for modal copy', () => {
    expect(SRC).toContain('HOMEPAGE_TITLE_TYPE');
    expect(PAYWALL).toContain('HOMEPAGE_TITLE_TYPE');
    expect(SRC).toMatch(/text-lg sm:text-xl lg:text-2xl xl:text-3xl/);
    expect(PAYWALL).toMatch(/text-lg sm:text-xl lg:text-2xl xl:text-3xl/);
  });

  it('homepage suggestions stay human — no F12 / Gemini / API Key / stub jargon', () => {
    expect(PAGE).toContain('tipReupload');
    expect(PAGE).toContain('tipPaste');
    expect(PAGE).not.toMatch(/checkConsole|Gemini API|API Key|F12|Saved Resume stub|\.docx|legacy \.doc/);
  });
});
