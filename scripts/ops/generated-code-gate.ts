/**
 * Generated-code gate: static review of the patch, then security tests.
 * AI/agent output is not shippable until this exits 0.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { blockingFindings, reviewGeneratedDiff } from '../../lib/generated-code-review';

function collectUntrackedAsDiff(): string {
  const listed = execSync('git ls-files --others --exclude-standard', {
    encoding: 'utf8',
  })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const file of listed) {
    if (file.startsWith('tmp/') || file.endsWith('.zip') || file.endsWith('.png')) continue;
    if (!/\.(ts|tsx|js|mjs|cjs|sql)$/.test(file)) continue;
    try {
      const text = readFileSync(file, 'utf8');
      const added = text
        .split('\n')
        .map((line) => `+${line}`)
        .join('\n');
      chunks.push(`+++ b/${file}\n${added}`);
    } catch {
      /* skip unreadable */
    }
  }
  return chunks.join('\n');
}

function collectDiff(): string {
  const range = process.env.GATE_DIFF_RANGE?.trim();
  if (range && !/^0+$/.test(range.split('...')[0] ?? '')) {
    try {
      return execSync(`git diff ${range}`, { encoding: 'utf8' });
    } catch {
      return '';
    }
  }
  const unstaged = execSync('git diff', { encoding: 'utf8' });
  const staged = execSync('git diff --cached', { encoding: 'utf8' });
  const untracked = collectUntrackedAsDiff();
  if (unstaged || staged || untracked) return `${unstaged}\n${staged}\n${untracked}`;
  try {
    return execSync('git diff HEAD~1...HEAD', { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function runSecurityTests(): void {
  execSync('npx vitest run --config vitest.security.config.ts', {
    stdio: 'inherit',
  });
}

function main(): void {
  const diff = collectDiff();
  if (diff.trim()) {
    const findings = reviewGeneratedDiff(diff);
    const blocked = blockingFindings(findings);
    for (const f of findings) {
      const tag = f.severity === 'block' ? 'BLOCK' : 'REFACTOR';
      console.log(`[${tag}] ${f.file}: ${f.message}`);
    }
    if (blocked.length > 0) {
      console.error(
        `\nGenerated-code review failed (${blocked.length} blocking). Refactor before shipping.`,
      );
      process.exit(1);
    }
    const refactors = findings.filter((f) => f.severity === 'refactor');
    if (refactors.length > 0) {
      console.log(
        `\n${refactors.length} refactor note(s) — tighten types / keep untrusted input fenced, then continue.`,
      );
    }
  } else {
    console.log('No diff to review; running security tests only.');
  }

  runSecurityTests();
  console.log('Generated-code gate passed (review + security tests).');
}

main();
