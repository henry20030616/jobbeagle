/**
 * Parse / repair Gemini JSON output that may be truncated mid-string.
 */

export function extractJsonObject(text: string): string {
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = clean.indexOf('{');
  if (first < 0) return clean;
  clean = clean.slice(first);

  // Prefer balanced object if complete; otherwise keep from first `{`
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end >= 0) return clean.slice(0, end + 1);
  return clean;
}

/** Close truncated JSON: open strings, arrays, objects. */
export function repairTruncatedJson(raw: string): string {
  let s = extractJsonObject(raw).trim();
  if (!s) return '{}';

  // Remove trailing incomplete escape
  if (s.endsWith('\\')) s = s.slice(0, -1);

  let inString = false;
  let escape = false;
  const stack: Array<'{' | '['> = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') stack.push('{');
    else if (ch === '[') stack.push('[');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  if (inString) s += '"';

  // Drop trailing comma / colon before closing
  s = s.replace(/[,:]\s*$/, '');

  while (stack.length) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }

  // Trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s;
}

export function parseJsonResponse<T>(text: string): T {
  const attempts = [extractJsonObject(text), repairTruncatedJson(text)];
  let lastError: unknown;

  for (const candidate of attempts) {
    try {
      const cleaned = candidate.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(cleaned) as T;
    } catch (e) {
      lastError = e;
    }
  }

  const msg = lastError instanceof Error ? lastError.message : 'Invalid JSON';
  throw new Error(
    `AI returned incomplete JSON (${msg}). Please retry — large PDFs sometimes truncate the model output.`,
  );
}
