/**
 * Server-only Anthropic client for Guide writing modules.
 * Reads ANTHROPIC_API_KEY on the server. Do not import from Client Components.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_WRITING_MODEL } from '@/constants/models';
import { parseJsonResponse } from '@/lib/parse-gemini-json';

export type GuideContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const IMAGE_MEDIA = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
} as const;

type ImageMediaType = keyof typeof IMAGE_MEDIA;

type AnthropicUserBlock =
  | { type: 'text'; text: string }
  | {
      type: 'document';
      source: { type: 'base64'; media_type: 'application/pdf'; data: string };
    }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: ImageMediaType; data: string };
    };

function isImageMediaType(value: string): value is ImageMediaType {
  return Object.prototype.hasOwnProperty.call(IMAGE_MEDIA, value);
}

export function getAnthropicApiKey(): string | undefined {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key || undefined;
}

function getClient(): Anthropic {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new Anthropic({ apiKey });
}

export function toAnthropicUserContent(parts: GuideContentPart[]): AnthropicUserBlock[] {
  const blocks: AnthropicUserBlock[] = [];
  for (const part of parts) {
    if ('text' in part) {
      blocks.push({ type: 'text', text: part.text });
      continue;
    }
    if (part.inlineData.mimeType === 'application/pdf') {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: part.inlineData.data,
        },
      });
      continue;
    }
    if (isImageMediaType(part.inlineData.mimeType)) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: part.inlineData.mimeType,
          data: part.inlineData.data,
        },
      });
    }
  }
  return blocks.length > 0
    ? blocks
    : [{ type: 'text', text: 'No documents provided.' }];
}

function textFromClaude(content: ReadonlyArray<{ type: string; text?: string }>): string {
  return content
    .filter(
      (block): block is { type: 'text'; text: string } =>
        block.type === 'text' && typeof block.text === 'string',
    )
    .map((block) => block.text)
    .join('\n');
}

/**
 * Call Claude for a writing module. Search stays off.
 * Untrusted JD/resume must already be fenced in `parts` (user content), never concatenated into `system`.
 */
export async function generateAnthropicJson(options: {
  system: string;
  parts: GuideContentPart[];
}): Promise<unknown> {
  const client = getClient();
  const response = await client.messages.create({
    model: ANTHROPIC_WRITING_MODEL,
    max_tokens: 8192,
    system: `${options.system}\n\nReturn a single JSON object only. No markdown.`,
    messages: [
      {
        role: 'user',
        content: toAnthropicUserContent(options.parts),
      },
    ],
  });
  const text = textFromClaude(response.content);
  if (!text) throw new Error('Empty Claude writing response');
  return parseJsonResponse(text);
}
