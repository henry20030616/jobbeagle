import mammoth from 'mammoth';
import type { ResumeInput } from '@/types';
import { MAX_RESUME_CHARS } from '@/constants/models';
import { truncateText } from '@/lib/payload';

/** Library rows that only stored a display stub — not real PDF bytes. */
export function isPdfPlaceholderContent(content: string | null | undefined): boolean {
  const t = (content || '').trim();
  if (!t) return false;
  return (
    t.startsWith('[PDF resume:')
    || t.includes('[PDF resume attached]')
    || t.includes('[Resume provided as PDF attachment]')
    || t.startsWith('[PDF_RESUME_BASE64:')
  );
}

/** Strip data-URL prefix and whitespace from base64 payloads. */
export function sanitizePdfBase64(content: string): string {
  const raw = (content || '').trim();
  if (raw.startsWith('data:')) {
    const comma = raw.indexOf(',');
    return (comma >= 0 ? raw.slice(comma + 1) : raw).replace(/\s+/g, '');
  }
  return raw.replace(/\s+/g, '');
}

/** True when content looks like real PDF bytes (base64), not a stub string. */
export function isValidPdfBase64(content: string | null | undefined): boolean {
  if (!content || isPdfPlaceholderContent(content)) return false;
  const data = sanitizePdfBase64(content);
  if (data.length < 64) return false;
  // "%PDF" → base64 typically starts with JVBERi
  if (data.startsWith('JVBERi')) return true;
  try {
    const head = Buffer.from(data.slice(0, 24), 'base64');
    return head.length >= 4
      && head[0] === 0x25
      && head[1] === 0x50
      && head[2] === 0x44
      && head[3] === 0x46;
  } catch {
    return false;
  }
}

export async function extractResumeText(
  resume: ResumeInput,
): Promise<string> {
  const isWordFile =
    resume.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    resume.fileName?.toLowerCase().endsWith('.docx');

  if (resume.type === 'file' && isWordFile && typeof resume.content === 'string') {
    const buffer = Buffer.from(resume.content, 'base64');
    const { value } = await mammoth.extractRawText({ buffer });
    const text = (value || '').trim();
    if (!text) {
      throw new Error(
        'Could not extract text from Word file. Please upload PDF or paste resume text.',
      );
    }
    return truncateText(text, MAX_RESUME_CHARS);
  }

  if (resume.type === 'file' && resume.mimeType === 'application/pdf') {
    if (!isValidPdfBase64(resume.content)) {
      throw new Error(
        'This saved PDF resume is incomplete. Please re-upload the PDF file (Saved Resumes that only show a name must be uploaded again).',
      );
    }
    const approxLen = Math.ceil((sanitizePdfBase64(resume.content).length * 3) / 4);
    if (approxLen > MAX_RESUME_CHARS * 2) {
      throw new Error('Resume PDF too large. Please use a shorter resume.');
    }
    return `[PDF_RESUME_BASE64:${sanitizePdfBase64(resume.content).slice(0, 500)}...]`;
  }

  const text = (resume.content || '').trim();
  if (!text) throw new Error('Resume content is empty.');
  return truncateText(text, MAX_RESUME_CHARS);
}

/** For PDF we need actual text — extract via sending to analyze with inline data in full flow */
export function isPdfResume(resume: ResumeInput): boolean {
  return resume.type === 'file' && resume.mimeType === 'application/pdf';
}

export async function resolveResumeForAnalysis(
  resume: ResumeInput,
): Promise<{ text: string; pdfInline?: { data: string; mimeType: string } }> {
  if (isPdfResume(resume)) {
    if (!isValidPdfBase64(resume.content)) {
      throw new Error(
        'This saved PDF resume is incomplete. Please re-upload the PDF file, then launch again.',
      );
    }
    return {
      text: '[Resume provided as PDF attachment — analyze the document content.]',
      pdfInline: {
        data: sanitizePdfBase64(resume.content),
        mimeType: 'application/pdf',
      },
    };
  }
  const text = await extractResumeText(resume);
  return { text };
}
