import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOMEPAGE_POPOVER_TYPE } from '@/constants/report-frame';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('homepage mobile layout guards', () => {
  it('hides the desktop 4-col form below lg and mounts InputFormMobile', () => {
    const wrapper = read('components/InputFormWrapper.tsx');
    const desktop = read('components/InputForm.tsx');
    const confirm = read('app/confirm/page.tsx');
    const home = read('app/page.tsx');

    expect(wrapper).toContain('InputFormMobile');
    expect(wrapper).toMatch(/className="hidden min-h-0 lg:flex lg:flex-1 lg:flex-col"/);
    expect(wrapper).toMatch(/className="block lg:hidden"/);
    expect(wrapper).toMatch(/<InputForm \{\.\.\.props\} \/>/);
    expect(wrapper).toMatch(/<InputFormMobile \{\.\.\.props\} \/>/);

    expect(desktop).toMatch(
      /grid-cols-1 items-stretch[\s\S]*lg:grid-cols-\[minmax\(0,4fr\)/,
    );
    expect(home).toContain('InputFormWrapper');
    expect(confirm).toContain('InputFormWrapper');
    expect(confirm).not.toMatch(/import InputForm from '@\/components\/InputForm'/);
  });

  it('expands the four advantage chips inline under the title, not as a floating popover', () => {
    const desktop = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');

    expect(desktop).toMatch(/grid-rows-\[1fr\]/);
    expect(desktop).toMatch(/grid-rows-\[0fr\]/);
    expect(desktop).toMatch(/className="feature-desc w-full/);
    expect(desktop).not.toMatch(/HOMEPAGE_POPOVER_PANEL[\s\S]{0,240}feature-desc/);
    expect(desktop).not.toMatch(
      /absolute left-0 top-full min-w-\[22em\][\s\S]{0,160}feature-desc/,
    );

    expect(mobile).toContain('featuresOpen');
    expect(mobile).toContain('Tap to expand');
    expect(mobile).toMatch(/featuresOpen && \(/);
    const featuresStart = mobile.indexOf('homepage-features');
    const featuresEnd = mobile.indexOf('{/* Step 1: Job */}');
    expect(featuresStart).toBeGreaterThan(-1);
    expect(featuresEnd).toBeGreaterThan(featuresStart);
    const featuresBlock = mobile.slice(featuresStart, featuresEnd);
    expect(featuresBlock).not.toContain('HOMEPAGE_POPOVER');
    expect(featuresBlock).not.toContain('absolute left-0 top-full');
  });

  it('keeps xl:text-3xl homepage popovers behind lg/xl and gives mobile a smaller floor', () => {
    expect(HOMEPAGE_POPOVER_TYPE).toMatch(/\btext-sm\b/);
    expect(HOMEPAGE_POPOVER_TYPE).toMatch(/\blg:text-2xl\b/);
    expect(HOMEPAGE_POPOVER_TYPE).toMatch(/\bxl:text-3xl\b/);
    expect(HOMEPAGE_POPOVER_TYPE).not.toMatch(/(^|\s)text-3xl\b/);
    expect(HOMEPAGE_POPOVER_TYPE).not.toMatch(/(^|\s)text-2xl\b/);

    const desktop = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');
    expect(desktop).toContain('HOMEPAGE_POPOVER_PANEL');
    expect(mobile).toContain('HOMEPAGE_POPOVER_PANEL');
  });

  it('keeps the compact JD prompt inside the step-1 box on a phone-width stack', () => {
    const input = read('components/SmartInputArea.tsx');
    const mobile = read('components/InputFormMobile.tsx');

    expect(mobile).toContain('compact');
    expect(input).toContain("compact ? 'h-full min-h-[16rem] flex-1 lg:min-h-0'");
    expect(input).toContain('flex items-start justify-start overflow-hidden');
    expect(input).not.toMatch(/absolute inset-0[^\n]*overflow-visible/);
    expect(mobile).toMatch(/language !== currentLanguage/);
  });

  it('keeps mobile step titles larger than step-card body copy', () => {
    const mobile = read('components/InputFormMobile.tsx');
    const input = read('components/SmartInputArea.tsx');

    expect(mobile).toContain(
      "const MOBILE_STEP_TITLE = 'step-title flex items-center gap-2 text-base font-bold leading-snug text-white'",
    );
    expect(mobile).toContain("const MOBILE_STEP_BODY = 'text-xs leading-snug'");
    expect(mobile).toContain('homepage-title-type text-xs');
    expect(mobile).not.toMatch(/MOBILE_STEP_TITLE = [`'][^`']*\$\{MOBILE_TITLE_TYPE\}/);
    expect(mobile).toMatch(/className=\{MOBILE_STEP_TITLE\}/);
    expect(mobile).toMatch(/\$\{MOBILE_STEP_BODY\}/);
    expect(input).toContain('text-xs leading-snug font-bold lg:text-2xl');
  });
});
