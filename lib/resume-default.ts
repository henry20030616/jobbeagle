import type { ResumeInput } from '@/types';

export type SavedResumeLike = {
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  fileName?: string;
  timestamp: number;
};

/** Stub rows from older saves that only stored a PDF label, not bytes. */
export function isIncompleteSavedPdf(saved: {
  mimeType?: string;
  content: string;
}): boolean {
  if (saved.mimeType !== 'application/pdf') return false;
  const content = saved.content.trim();
  return (
    content.startsWith('[PDF resume:')
    || content.includes('[PDF resume attached]')
    || content.includes('[Resume provided as PDF attachment]')
  );
}

export function savedResumeToInput(saved: SavedResumeLike): ResumeInput {
  return {
    type: saved.type,
    content: saved.content,
    mimeType: saved.mimeType,
    fileName: saved.fileName,
  };
}

/**
 * Newest usable library resume (by timestamp). Skips incomplete PDF stubs.
 */
export function pickDefaultSavedResume<T extends SavedResumeLike>(
  items: T[],
): T | null {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
  return sorted.find((item) => !isIncompleteSavedPdf(item)) ?? null;
}

/** Prefer the later of last_used_at / created_at for “latest saved”. */
export function resumeLibraryTimestamp(
  lastUsedAt: string | null | undefined,
  createdAt: string,
): number {
  const created = new Date(createdAt).getTime();
  const used = lastUsedAt ? new Date(lastUsedAt).getTime() : 0;
  const createdMs = Number.isFinite(created) ? created : 0;
  const usedMs = Number.isFinite(used) ? used : 0;
  return Math.max(createdMs, usedMs);
}
