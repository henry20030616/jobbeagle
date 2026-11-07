import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(
  join(process.cwd(), 'components/AnalysisErrorDialog.tsx'),
  'utf8',
);
const PAGE = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');

describe('AnalysisErrorDialog sizing + copy', () => {
  it('matches homepage type scale and uses a wide modal', () => {
    expect(SRC).toContain('compare-font-large');
    expect(SRC).toContain('w-[min(92vw,56rem)]');
    expect(SRC).not.toContain('FALLBACK_CAP_PX');
    expect(SRC).not.toContain('measureResumeUploadCapPx');
    expect(SRC).toContain('text-4xl');
    expect(SRC).toContain('sm:text-5xl');
  });

  it('homepage suggestions stay human — no F12 / Gemini / API Key / stub jargon', () => {
    expect(PAGE).toContain('tipReupload');
    expect(PAGE).toContain('tipPaste');
    expect(PAGE).not.toMatch(/checkConsole|Gemini API|API Key|F12|Saved Resume stub|\.docx|legacy \.doc/);
  });
});
