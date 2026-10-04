import React from 'react';

/** Austere terminal frame for copy-ready scripts. Content brings its own copy buttons. */
export function TerminalWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-black/70">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900/80 px-3 py-1.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
        </span>
        <span className="truncate font-mono text-xs text-slate-400">{title}</span>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}
