'use client';

import React from 'react';

/** Mirror LiteReportDashboard (Page 1) typography — do not diverge. */
export const SECTION_TITLE = 'text-lg font-bold uppercase tracking-[0.14em]';
export const BODY = 'text-lg';
export const BODY_MUTED = 'text-lg text-slate-400';
export const META = 'text-base';

export function PageHeaderBar({
  pageOf,
  title,
  badge,
  badgeTone = 'sky',
}: {
  pageOf: string;
  title: string;
  badge: string;
  badgeTone?: 'sky' | 'emerald' | 'amber' | 'violet' | 'red';
}) {
  const tones = {
    sky: 'border-sky-400/70 text-sky-200 bg-sky-500/10',
    emerald: 'border-emerald-400/70 text-emerald-200 bg-emerald-500/10',
    amber: 'border-amber-400/70 text-amber-100 bg-amber-500/10',
    violet: 'border-violet-400/70 text-violet-200 bg-violet-500/10',
    red: 'border-red-400/70 text-red-200 bg-red-500/10',
  } as const;
  return (
    <header className="border-b border-slate-700/90 px-5 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${SECTION_TITLE} text-indigo-400 mb-1`}>{pageOf}</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            {title}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-bold tracking-wide ${tones[badgeTone]}`}
        >
          {badge}
        </span>
      </div>
    </header>
  );
}

/** Row 1 — dual heroes with divide (mirrors Fit | Offer). */
export function HeroDualRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-700/90">
      <section className="flex flex-col p-4 min-w-0">{left}</section>
      <section className="flex flex-col p-4 min-w-0">{right}</section>
    </div>
  );
}

/** Row 2 — detailed dual bordered cards. */
export function DetailDualRow({
  left,
  right,
  leftAccent = 'indigo',
  rightAccent = 'emerald',
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftAccent?: 'indigo' | 'emerald' | 'sky' | 'amber' | 'violet';
  rightAccent?: 'indigo' | 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const accents = {
    indigo: 'border-sky-400/50 bg-indigo-500/10',
    emerald: 'border-emerald-400/55 bg-emerald-500/10',
    sky: 'border-sky-400/50 bg-sky-500/10',
    amber: 'border-amber-400/50 bg-amber-500/10',
    violet: 'border-violet-400/50 bg-violet-500/10',
  } as const;
  return (
    <div className="border-t border-slate-700/90 px-5 py-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
        <div className={`h-full min-w-0 rounded-lg border px-3.5 py-3 flex flex-col ${accents[leftAccent]}`}>
          {left}
        </div>
        <div className={`h-full min-w-0 rounded-lg border px-3.5 py-3 flex flex-col ${accents[rightAccent]}`}>
          {right}
        </div>
      </div>
    </div>
  );
}

/** Row 3 — shared frame with divide (mirrors Strengths | Gaps). */
export function ContrastDualRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-700/90 px-5 py-3.5">
      <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sky-400/25">
          <section className="p-4 min-w-0">{left}</section>
          <section className="p-4 min-w-0">{right}</section>
        </div>
      </div>
    </div>
  );
}

/** Row 4 — action / fallback panel (mirrors Score Summary | Apply). */
export function ActionDualRow({
  left,
  right,
  fullWidth,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  fullWidth?: React.ReactNode;
}) {
  if (fullWidth) {
    return (
      <div className="border-t border-slate-700/90 px-5 py-3.5">
        <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          {fullWidth}
        </div>
      </div>
    );
  }
  return (
    <div className="border-t border-slate-700/90 px-5 py-3.5">
      <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sky-400/25 items-stretch">
          <section className="p-4 min-w-0 flex flex-col">{left}</section>
          <section className="p-4 min-w-0 flex flex-col">{right}</section>
        </div>
      </div>
    </div>
  );
}

export function BulletList({
  items,
  tone = 'indigo',
}: {
  items: string[];
  tone?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'red';
}) {
  const dots = {
    indigo: 'bg-indigo-300/90',
    emerald: 'bg-emerald-400/90',
    violet: 'bg-violet-300/90',
    amber: 'bg-amber-400/90',
    red: 'bg-red-400/90',
  } as const;
  if (items.length === 0) {
    return <p className={`${BODY} text-slate-500`}>No data for this section in this run.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={idx} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
          <span className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${dots[tone]}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function InsufficientDataBadge({ label = 'Insufficient Public Data' }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-amber-400/50 bg-amber-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
      {label}
    </span>
  );
}

export function GuideSlideShell({ children }: { children: React.ReactNode }) {
  return (
    <article
      className="relative w-full min-w-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl border border-slate-700/90"
    >
      {children}
    </article>
  );
}
