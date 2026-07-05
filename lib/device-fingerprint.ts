/** Canvas-based device fingerprint for Sybil defense (client-only) */

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallbackFingerprint();

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('JobBeagle fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('JobBeagle fingerprint', 4, 17);

    const dataUrl = canvas.toDataURL();
    const nav = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
    ].join('|');

    const raw = dataUrl + nav;
    return await hashString(raw);
  } catch {
    return fallbackFingerprint();
  }
}

function fallbackFingerprint(): string {
  const nav = [
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
    typeof screen !== 'undefined' ? screen.width : 0,
  ].join('|');
  return `fb_${nav.length}_${Date.now() % 100000}`;
}

async function hashString(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h)}`;
}
