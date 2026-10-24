import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const STEP_BODY_SCALE =
  'text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold';

describe('homepage prompt type scale', () => {
  it('sizes compact job-paste prompt with the same desktop type as step-2 upload', () => {
    const input = read('components/SmartInputArea.tsx');
    const form = read('components/InputForm.tsx');
    const css = read('app/globals.css');

    expect(form).toContain(`upload-prompt ${STEP_BODY_SCALE}`);
    expect(input).toContain(STEP_BODY_SCALE);
    expect(input).toContain('upload-prompt');
    expect(input).toContain('jd-paste-prompt');
    expect(input).toContain('JD_PROMPT_TYPE_COMPACT');
    expect(input).toContain('compact ? JD_PROMPT_TYPE_COMPACT : JD_PROMPT_TYPE');
    expect(input).not.toMatch(/jd-paste-prompt text-sm/);
    expect(input).toContain('overflow-visible');
    expect(input).toContain('flex items-center justify-start');
    expect(input).not.toMatch(/inset-0 flex items-start/);
    expect(input).not.toMatch(/line-clamp|text-ellipsis/);
    expect(css).toContain('.homepage-steps .jd-paste-prompt');
    expect(css).toContain('.homepage-steps .jd-paste-prompt.\\32xl\\:text-4xl');
    expect(css).toContain('.homepage-steps .upload-prompt.\\32xl\\:text-4xl');
    expect(css).toContain('font-size: var(--type-step)');
  });

  it('sizes step-3 report blurbs with the same desktop type as step-2 upload', () => {
    const form = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');
    const promptType = "const STEP_PROMPT_TYPE =\n  'upload-prompt text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl'";

    expect(form).toContain(promptType);
    expect(form).toMatch(/STEP_PROMPT_TYPE[\s\S]{0,80}snapshotBlurb/);
    expect(form).toMatch(/STEP_PROMPT_TYPE[\s\S]{0,80}strategyBlurb/);
    expect(form).toMatch(/report-choice-title[^"]*text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white/);
    expect(mobile).toMatch(/upload-prompt whitespace-normal text-sm leading-snug text-indigo-100">\{t\.snapshotBlurb\}/);
    expect(mobile).toMatch(/upload-prompt whitespace-normal text-sm leading-snug text-indigo-100">\{t\.strategyBlurb\}/);
  });
});
