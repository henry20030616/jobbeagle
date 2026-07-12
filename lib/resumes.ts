import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ResumeSource = 'analyze' | 'manual_save' | 'library_pick';

export interface UpsertResumeInput {
  contentText: string;
  /** Material used for dedupe hash (defaults to contentText). Use PDF bytes for PDF uploads. */
  hashMaterial?: string;
  fileName?: string | null;
  mimeType?: string | null;
  source?: ResumeSource;
  type?: 'text' | 'file';
  pin?: boolean;
}

export interface UpsertResumeResult {
  id: string;
  reused: boolean;
}

/** Normalize resume text for stable hashing across minor whitespace differences. */
export function normalizeResumeText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

export function hashResumeContent(userId: string, material: string): string {
  const normalized = normalizeResumeText(material);
  return createHash('sha256')
    .update(`${userId}\n${normalized}`, 'utf8')
    .digest('hex');
}

/**
 * Upsert a resume version for the user (dedupe by content_hash).
 * Clears soft-delete and refreshes last_used_at when reusing.
 */
export async function upsertResumeForUser(
  admin: SupabaseClient,
  userId: string,
  input: UpsertResumeInput,
): Promise<UpsertResumeResult> {
  const contentText = normalizeResumeText(input.contentText || '');
  if (!contentText) {
    throw new Error('Resume text is empty.');
  }

  const hashMaterial = input.hashMaterial ?? contentText;
  const contentHash = hashResumeContent(userId, hashMaterial);
  const now = new Date().toISOString();
  const fileName = input.fileName?.trim() || null;
  const label =
    fileName ||
    `Resume · ${new Date().toISOString().slice(0, 10)}`;
  const type = input.type ?? (input.mimeType ? 'file' : 'text');
  const source = input.source ?? 'analyze';

  const { data: existing, error: selectError } = await admin
    .from('resume_history')
    .select('id')
    .eq('user_id', userId)
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Resume lookup failed: ${selectError.message}`);
  }

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      deleted_at: null,
      last_used_at: now,
      updated_at: now,
      label,
      file_name: fileName,
      mime_type: input.mimeType ?? null,
      source,
      // Keep stored text in sync if we now have richer extracted text
      content: contentText,
    };
    if (input.pin === true) patch.is_pinned = true;

    const { error: updateError } = await admin
      .from('resume_history')
      .update(patch)
      .eq('id', existing.id)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Resume update failed: ${updateError.message}`);
    }

    return { id: existing.id, reused: true };
  }

  const { data: inserted, error: insertError } = await admin
    .from('resume_history')
    .insert({
      user_id: userId,
      type,
      content: contentText,
      content_hash: contentHash,
      mime_type: input.mimeType ?? null,
      file_name: fileName,
      label,
      source,
      is_pinned: input.pin === true,
      deleted_at: null,
      last_used_at: now,
      updated_at: now,
      created_at: now,
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    // Race: unique violation → fetch existing
    if (insertError?.code === '23505') {
      const { data: raced } = await admin
        .from('resume_history')
        .select('id')
        .eq('user_id', userId)
        .eq('content_hash', contentHash)
        .maybeSingle();
      if (raced?.id) {
        await admin
          .from('resume_history')
          .update({
            deleted_at: null,
            last_used_at: now,
            updated_at: now,
          })
          .eq('id', raced.id);
        return { id: raced.id, reused: true };
      }
    }
    throw new Error(`Resume insert failed: ${insertError?.message || 'unknown'}`);
  }

  return { id: inserted.id, reused: false };
}

/** Soft-delete a resume version (keeps rows for report FK / history). */
export async function softDeleteResume(
  client: SupabaseClient,
  userId: string,
  resumeId: string,
): Promise<void> {
  const { error } = await client
    .from('resume_history')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Resume soft-delete failed: ${error.message}`);
  }
}
