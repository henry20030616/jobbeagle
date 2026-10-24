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
    expect(input).not.toMatch(/line-clamp|text-ellipsis/);
    expect(css).toContain('.homepage-steps .jd-paste-prompt');
    expect(css).toContain('font-size: var(--type-step)');
  });
});
