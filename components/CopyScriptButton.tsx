'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyScriptButton({
  text,
  label = 'Copy to Clipboard',
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!text.trim() || text.trim() === '—') return null;

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/50 bg-slate-800 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-slate-700"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}
