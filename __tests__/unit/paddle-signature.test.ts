import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  PADDLE_WEBHOOK_MAX_AGE_SEC,
  verifyPaddleSignature,
} from '@/lib/paddle';

function sign(body: string, secret: string, ts: number): string {
  const h1 = createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex');
  return `ts=${ts};h1=${h1}`;
}

describe('verifyPaddleSignature', () => {
  const secret = 'whsec_test';
  const body = '{"event_type":"transaction.completed"}';

  it('accepts a current HMAC signature', () => {
    const ts = 1_700_000_000;
    expect(verifyPaddleSignature(body, sign(body, secret, ts), secret, ts)).toBe(true);
  });

  it('rejects a wrong secret', () => {
    const ts = 1_700_000_000;
    expect(verifyPaddleSignature(body, sign(body, 'other', ts), secret, ts)).toBe(false);
  });

  it('rejects a replay older than the max age', () => {
    const now = 1_700_000_000;
    const ts = now - PADDLE_WEBHOOK_MAX_AGE_SEC - 1;
    expect(verifyPaddleSignature(body, sign(body, secret, ts), secret, now)).toBe(false);
  });

  it('rejects a missing or malformed header', () => {
    expect(verifyPaddleSignature(body, null, secret, 1_700_000_000)).toBe(false);
    expect(verifyPaddleSignature(body, 'nope', secret, 1_700_000_000)).toBe(false);
  });
});
