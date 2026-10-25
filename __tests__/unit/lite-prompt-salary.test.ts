import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LITE_SYSTEM_PROMPT } from '@/lib/prompts/lite';

describe('Fit Snapshot salary prompt', () => {
  it('requires a closed-book numeric market band for non-US / TWD roles', () => {
    expect(LITE_SYSTEM_PROMPT).toMatch(/Missing posted salary ≠ missing market band/);
    expect(LITE_SYSTEM_PROMPT).toContain('Taiwan/TWD');
    expect(LITE_SYSTEM_PROMPT).toContain('TWD 1.2M');
    expect(LITE_SYSTEM_PROMPT).not.toMatch(/US region are identifiable/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/never labels or prose \("區間"/);
    expect(LITE_SYSTEM_PROMPT).toMatch(/do not pretend you searched the web/i);
    const source = readFileSync(join(process.cwd(), 'lib/prompts/lite.ts'), 'utf8');
    expect(source).not.toContain('google search');
    expect(source).not.toContain('google_search');
  });
});
