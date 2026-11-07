import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(
  join(process.cwd(), 'components/AnalysisErrorDialog.tsx'),
  'utf8',
);
const PAGE = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');

describe('AnalysisErrorDialog sizing + copy', () => {
  it('scales the dialog ~2.5× so it is readable on the zoomed homepage', () => {
    expect(SRC).toContain('zoom: 2.5');
    expect(SRC).toContain('w-[min(38vw,22rem)]');
    expect(SRC).not.toContain('FALLBACK_CAP_PX');
    expect(SRC).not.toContain('measureResumeUploadCapPx');
  });

  it('homepage suggestions stay human — no F12 / Gemini / API Key / stub jargon', () => {
    expect(PAGE).toContain('tipReupload');
    expect(PAGE).toContain('tipPaste');
    expect(PAGE).not.toMatch(/checkConsole|Gemini API|API Key|F12|Saved Resume stub|\.docx|legacy \.doc/);
  });
});
