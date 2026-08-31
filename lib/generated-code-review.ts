/**
 * Static review of generated (or any) patches.
 * Findings with severity "block" fail the generated-code gate.
 */

export type ReviewSeverity = 'block' | 'refactor';

export type ReviewFinding = {
  severity: ReviewSeverity;
  file: string;
  message: string;
};

const BLOCK_IN_ADDED_LINE: Array<{ name: string; re: RegExp }> = [
  { name: 'eval()', re: /\beval\s*\(/ },
  { name: 'new Function()', re: /\bnew Function\s*\(/ },
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML/ },
  { name: 'document.write()', re: /document\.write\s*\(/ },
];

const CLIENT_SECRET_RE =
  /\b(SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY|GOOGLE_GEMINI_API_KEY|LEMONSQUEEZY_API_KEY|LEMONSQUEEZY_WEBHOOK_SECRET|PADDLE_API_KEY|PADDLE_WEBHOOK_SECRET)\b/;

const LOOSE_ANY_RE = /\bas any\b/;

/** Fixtures and the scanner itself mention banned APIs on purpose. */
const SKIP_STATIC_REVIEW = new Set([
  'lib/generated-code-review.ts',
  '__tests__/unit/generated-code-review.test.ts',
  'scripts/ops/generated-code-gate.ts',
]);

export function shouldSkipStaticReview(file: string): boolean {
  return SKIP_STATIC_REVIEW.has(file);
}

function isClientPath(file: string): boolean {
  if (file.startsWith('app/api/')) return false;
  return (
    file.startsWith('components/') ||
    file.startsWith('app/') ||
    file.startsWith('browser-extension/')
  );
}

function isStrictTsPath(file: string): boolean {
  if (file.includes('__tests__/')) return false;
  return file.startsWith('lib/') || file.startsWith('app/api/');
}

export function isSensitivePath(file: string): boolean {
  return (
    file.startsWith('app/api/') ||
    file.startsWith('lib/') ||
    file.startsWith('browser-extension/') ||
    file.startsWith('supabase/')
  );
}

/** Review a unified diff. Only added lines (`+`) are judged — generated dumps show up here. */
export function reviewGeneratedDiff(diff: string): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  let currentFile = '';
  const sensitiveTouched = new Set<string>();

  for (const rawLine of diff.split('\n')) {
    if (rawLine.startsWith('+++ b/')) {
      currentFile = rawLine.slice('+++ b/'.length).trim();
      if (shouldSkipStaticReview(currentFile)) currentFile = '';
      continue;
    }
    if (rawLine.startsWith('diff --git ')) {
      currentFile = '';
      continue;
    }
    if (!currentFile) continue;
    if (!rawLine.startsWith('+') || rawLine.startsWith('+++')) continue;
    const added = rawLine.slice(1);
    if (isSensitivePath(currentFile)) sensitiveTouched.add(currentFile);

    for (const rule of BLOCK_IN_ADDED_LINE) {
      if (rule.re.test(added)) {
        findings.push({
          severity: 'block',
          file: currentFile,
          message: `Added ${rule.name} — not allowed in generated or reviewed code.`,
        });
      }
    }

    if (isClientPath(currentFile) && CLIENT_SECRET_RE.test(added)) {
      findings.push({
        severity: 'block',
        file: currentFile,
        message: 'Added a server secret name in client-reachable code.',
      });
    }

    if (isStrictTsPath(currentFile) && LOOSE_ANY_RE.test(added)) {
      findings.push({
        severity: 'refactor',
        file: currentFile,
        message: 'Added `as any` — replace with a narrow type before merge.',
      });
    }
  }

  if (sensitiveTouched.size > 0) {
    findings.push({
      severity: 'refactor',
      file: [...sensitiveTouched][0] ?? '',
      message:
        'Sensitive path changed (api / lib / extension / supabase). Keep the diff surgical, wrap untrusted model inputs, and keep credit/webhook mutations server-only.',
    });
  }

  return findings;
}

export function blockingFindings(findings: ReviewFinding[]): ReviewFinding[] {
  return findings.filter((f) => f.severity === 'block');
}
