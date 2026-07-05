import mammoth from 'mammoth';
import type { ResumeInput } from '@/types';
import { MAX_RESUME_CHARS } from '@/constants/models';
import { truncateText } from '@/lib/payload';

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
    // PDF passed as base64 — Gemini can read inline; for text gate use placeholder length check
    const approxLen = Math.ceil((resume.content.length * 3) / 4);
    if (approxLen > MAX_RESUME_CHARS * 2) {
      throw new Error('Resume PDF too large. Please use a shorter resume.');
    }
    return `[PDF_RESUME_BASE64:${resume.content.slice(0, 500)}...]`;
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
    return {
      text: '[Resume provided as PDF attachment — analyze the document content.]',
      pdfInline: { data: resume.content, mimeType: 'application/pdf' },
    };
  }
  const text = await extractResumeText(resume);
  return { text };
}
