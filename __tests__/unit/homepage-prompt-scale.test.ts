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
    expect(input).toContain('min-h-[16rem]');
    expect(input).toContain('overflow-hidden');
    expect(input).toContain('flex items-start justify-start');
    expect(input).not.toMatch(/absolute inset-0[^\n]*overflow-visible/);
    expect(input).not.toMatch(/inset-0 flex items-center justify-start/);
    expect(input).not.toMatch(/line-clamp|text-ellipsis/);
    expect(css).toContain('.homepage-steps .jd-paste-prompt');
    expect(css).toContain('.homepage-steps .jd-paste-prompt.\\32xl\\:text-4xl');
    expect(css).toContain('.homepage-steps .upload-prompt.\\32xl\\:text-4xl');
    expect(css).toContain('font-size: var(--type-step)');
    expect(input).toContain('list-disc');
    expect(input).toContain('<ul');
    expect(input).toContain('<li');
    expect(input).not.toContain('jd-empty-hint');
    expect(input).not.toContain('jdEmptyHint');
    expect(css).not.toContain('.homepage-steps .jd-empty-hint');
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

  it('sizes the step-4 launch label with the same report-choice-title type as 適配快照', () => {
    const form = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');
    const css = read('app/globals.css');

    expect(form).toContain(
      "const REPORT_CHOICE_TITLE =\n  'report-choice-title text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white opacity-100'",
    );
    expect(form).toContain(
      "const LAUNCH_POINTER = 'h-[1.15em] w-[1.15em] shrink-0 text-white stroke-white'",
    );
    expect(form).toMatch(
      /REPORT_CHOICE_TITLE[\s\S]{0,160}\{submitLabel\}[\s\S]{0,80}Pointer className=\{LAUNCH_POINTER\}/,
    );
    expect(form).toContain('disabled:text-white');
    expect(form).toContain('disabled:opacity-100');
    expect(form).toContain('launch-submit-label');
    expect(form).not.toMatch(/REPORT_TYPE_LAUNCH_BOX\} cursor-not-allowed opacity-80/);
    expect(form).not.toMatch(
      /text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-zinc-100/,
    );
    expect(form).not.toMatch(/text-zinc-300|text-zinc-400/);
    expect(mobile).toMatch(
      /launch-submit-label report-choice-title flex flex-col items-center justify-center gap-\[0\.35em\] text-sm font-bold text-white opacity-100[\s\S]{0,120}\{submitLabel\}[\s\S]{0,80}Pointer className="h-\[1\.15em\] w-\[1\.15em\] shrink-0 text-white stroke-white/,
    );
    expect(mobile).toContain('disabled:text-white');
    expect(mobile).toContain('disabled:opacity-100');
    expect(mobile).not.toMatch(/REPORT_TYPE_LAUNCH_BOX\} cursor-not-allowed opacity-80/);
    expect(css).toContain('button.launch-submit:disabled');
    expect(css).toContain('.launch-submit-label svg');
    expect(css).toMatch(/-webkit-text-fill-color:\s*rgb\(255 255 255\)/);
  });

  it('puts matching leading icons before step-3 Snapshot and Guide titles', () => {
    const form = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');

    expect(form).toMatch(
      /<Camera className="[^"]+" aria-hidden \/>\s*\{reportLabel\(REPORT_CODES\.JOB_FIT_SNAPSHOT/,
    );
    expect(form).toMatch(
      /<Sparkles className="[^"]+" aria-hidden \/>\s*\{reportLabel\(REPORT_CODES\.INTERVIEW_STRATEGY_GUIDE/,
    );
    expect(form).not.toMatch(/report-choice-title[^"]*flex-wrap/);
    expect(form).not.toMatch(
      /\{reportLabel\(REPORT_CODES\.INTERVIEW_STRATEGY_GUIDE[\s\S]{0,120}<Sparkles/,
    );
    expect(mobile).toMatch(
      /<Camera className="[^"]+" aria-hidden \/>\s*\{reportLabel\(REPORT_CODES\.JOB_FIT_SNAPSHOT/,
    );
    expect(mobile).toMatch(
      /<Sparkles className="[^"]+" aria-hidden \/>\s*\{reportLabel\(REPORT_CODES\.INTERVIEW_STRATEGY_GUIDE/,
    );
    expect(mobile).not.toMatch(
      /\{reportLabel\(REPORT_CODES\.INTERVIEW_STRATEGY_GUIDE[\s\S]{0,120}<Sparkles/,
    );
  });

  it('enlarges only the homepage hero brand to 130% of the prior 7.2rem / 7.8rem sizes', () => {
    const css = read('app/globals.css');
    const logo = read('components/BrandLogo.tsx');
    const form = read('components/InputForm.tsx');

    expect(css).toContain('.homepage-font-large .homepage-hero-wrap .lg\\:text-7xl');
    expect(css).toContain('font-size: 9.36rem !important;');
    expect(css).toContain('width: 10.14rem !important;');
    expect(css).toContain('height: 10.14rem !important;');
    expect(css).not.toMatch(/\.homepage-hero-wrap[\s\S]{0,200}font-size:\s*7\.2rem/);
    expect(css).not.toMatch(/\.homepage-hero-wrap[\s\S]{0,200}width:\s*7\.8rem/);
    expect(form).toContain('space-y-[4.5rem]');
    expect(logo).toContain(
      "hero: 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight'",
    );
    expect(logo).toContain(
      "hero: 'w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 drop-shadow-xl'",
    );
    expect(logo).toContain("nav: 'text-2xl sm:text-3xl font-black tracking-tight'");
  });

  it('scales only intro↔features and features↔steps gaps by 1.5× and leaves logo/intro spacing alone', () => {
    const form = read('components/InputForm.tsx');
    const mobile = read('components/InputFormMobile.tsx');

    expect(form).toContain(
      "flex w-full min-w-0 flex-col ${compactChrome ? 'gap-4' : 'min-h-0 flex-1 gap-5 sm:gap-6 lg:gap-7'}",
    );
    expect(form).toContain(
      "mb-[1.5625rem] space-y-[4.5rem] pt-2 sm:mb-[1.875rem] sm:pt-4 lg:mb-[2.1875rem] pb-1",
    );
    expect(form).toContain(
      "flex w-full min-w-0 flex-col ${compactChrome ? 'gap-4' : 'min-h-0 flex-1 gap-[2.8125rem] sm:gap-[3.375rem] lg:gap-[3.9375rem]'}",
    );
    expect(form).toContain('space-y-[4.5rem]');
    expect(form).not.toContain('mb-[0.625rem]');
    expect(form).not.toContain('gap-[1.875rem] sm:gap-[2.25rem] lg:gap-[2.625rem]');
    expect(mobile).toContain('text-center space-y-1 mb-[0.375rem]');
    expect(mobile).toContain('homepage-features mb-[1.6875rem] [&+*]:!mt-0');
    expect(mobile).toContain('<form onSubmit={handleSubmit} className="space-y-3">');
  });
});
