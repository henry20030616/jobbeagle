import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Live Gemini request builders — sampling / thinkingBudget here would 400 on Gemini 3.6+. */
const GEMINI_CALL_FILES = [
  'lib/gemini-analyze.ts',
  'lib/gemini-guide-pipeline.ts',
  'app/api/shorts/route.ts',
  'scripts/qa/red-team-validator.mjs',
  'jobbeagle.live/services/geminiService.ts',
] as const;

const FORBIDDEN = [
  /\btemperature\s*:/,
  /\btop_p\s*:/,
  /\btopP\s*:/,
  /\btop_k\s*:/,
  /\btopK\s*:/,
  /\bthinking_budget\s*:/,
  /\bthinkingBudget\s*:/,
];

describe('Gemini generateContent configs', () => {
  it('does not send deprecated sampling or thinking_budget fields', () => {
    for (const relative of GEMINI_CALL_FILES) {
      const source = readFileSync(join(root, relative), 'utf8');
      for (const pattern of FORBIDDEN) {
        expect(source, `${relative} still has ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
