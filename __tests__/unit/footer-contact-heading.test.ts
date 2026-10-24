import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'components/FooterSection.tsx'), 'utf8');

describe('homepage footer contact heading', () => {
  it('centers the message-JobBeagle icon and title in the bar', () => {
    expect(source).toContain('py-3 sm:py-4 lg:py-5 text-center');
    expect(source).toContain('flex items-center justify-center gap-2.5 sm:gap-3 lg:gap-4');
    expect(source).not.toMatch(/py-3 sm:py-4 lg:py-5 text-left/);
    expect(source).not.toContain('{t.expandHint}');
    expect(source).not.toContain('h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent');
  });
});
