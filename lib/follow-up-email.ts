export type ParsedFollowUpEmail = {
  when: string;
  subject: string;
  body: string;
};

const SUBJECT_RE =
  /^(subject|主旨|主题|asunto|विषय|الموضوع)\s*[:：]\s*(.+)$/iu;

function firstLine(block: string): string {
  return block.trim().split('\n')[0]?.trim() ?? '';
}

/** Split coaching note, subject line, and letter body from the negotiation string. */
export function parseFollowUpEmail(raw: string): ParsedFollowUpEmail {
  const text = raw.trim();
  if (!text) return { when: '', subject: '', body: '' };
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  let when = '';
  let letterBlocks = blocks;
  if (blocks.length > 1 && !SUBJECT_RE.test(firstLine(blocks[0] ?? ''))) {
    when = blocks[0] ?? '';
    letterBlocks = blocks.slice(1);
  }
  const letter = letterBlocks.join('\n\n');
  let subject = '';
  const bodyLines: string[] = [];
  for (const line of letter.split('\n')) {
    const match = line.trim().match(SUBJECT_RE);
    if (!subject && match?.[2]) {
      subject = match[2].trim();
      continue;
    }
    bodyLines.push(line);
  }
  return { when, subject, body: bodyLines.join('\n').trim() };
}

/** Vertical rhythm for a copy-ready letter. Prefers blank-line paragraphs; falls back to lines. */
export function followUpLetterParagraphs(body: string): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  const blocks = trimmed.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length >= 2) return blocks;
  const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.length >= 2 ? lines : blocks;
}
