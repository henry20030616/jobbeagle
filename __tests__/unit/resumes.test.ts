import { describe, expect, it } from 'vitest';
import {
  contentFingerprint,
  hashResumeContent,
  normalizeResumeText,
} from '@/lib/resumes';

describe('resumes helpers', () => {
  it('normalizes line endings', () => {
    expect(normalizeResumeText('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('hashes stably for same user + content', () => {
    const a = hashResumeContent('user-1', 'Hello Resume\n');
    const b = hashResumeContent('user-1', 'Hello Resume');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('hashes differently across users', () => {
    const a = hashResumeContent('user-1', 'Same text');
    const b = hashResumeContent('user-2', 'Same text');
    expect(a).not.toBe(b);
  });

  it('fingerprints JD/resume content without user id', () => {
    expect(contentFingerprint('JD A')).not.toBe(contentFingerprint('JD B'));
    expect(contentFingerprint('Same\n')).toBe(contentFingerprint('Same'));
  });
});
