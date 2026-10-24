import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const form = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
const mobile = readFileSync(join(process.cwd(), 'components/InputFormMobile.tsx'), 'utf8');

const mark = form.slice(
  form.indexOf('function StepSequenceMark'),
  form.indexOf('interface SavedResume'),
);

describe('homepage step sequence arrows', () => {
  it('keeps exactly three connectors between the four desktop steps', () => {
    expect((form.match(/<StepSequenceMark \/>/g) ?? []).length).toBe(3);
    expect(mobile).not.toContain('StepSequenceMark');
    expect(mobile).not.toContain('ChevronRight');
  });

  it('enlarges the circular chevrons with a thick high-contrast stroke', () => {
    expect(mark).toContain('h-24 w-24');
    expect(mark).toContain('border-[3px] border-cyan-300');
    expect(mark).toContain('bg-indigo-600 text-white');
    expect(mark).toContain('ring-4 ring-cyan-200');
    expect(mark).toContain('<ChevronRight className="h-14 w-14" strokeWidth={3.25} />');
    expect(mark).not.toContain('h-14 w-14 items-center');
    expect(mark).not.toContain('border-2 border-indigo-400');
    expect(mark).not.toContain('text-indigo-200');
    expect(mark).not.toContain('border-slate-600');
    expect(mark).not.toContain('text-slate-300');
    expect(mark).toContain('<ChevronDown className="h-16 w-16" strokeWidth={3.25} />');
  });
});
