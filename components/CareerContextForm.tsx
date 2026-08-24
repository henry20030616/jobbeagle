'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, Target } from 'lucide-react';
import type { CareerContext } from '@/types';
import { EMPTY_CAREER_CONTEXT, normalizeCareerContext } from '@/lib/career-context';
import { useLanguage } from '@/lib/language-context';

const FIELD_KEYS: Array<keyof CareerContext> = [
  'target_level',
  'location_or_remote',
  'work_auth',
  'target_tc',
  'walk_away_tc',
  'non_negotiables',
  'signature_strengths',
];

const FIELD_COPY: Record<
  'en' | 'zh',
  Record<keyof CareerContext, { label: string; placeholder: string }>
> = {
  en: {
    target_level: { label: 'Target level', placeholder: 'e.g. Senior BA / Staff PM' },
    location_or_remote: {
      label: 'Location / remote',
      placeholder: 'e.g. US remote · NYC hybrid OK',
    },
    work_auth: {
      label: 'Work authorization',
      placeholder: 'e.g. US citizen · no sponsorship needed',
    },
    target_tc: { label: 'Target total compensation', placeholder: 'e.g. $180K TC' },
    walk_away_tc: { label: 'Walk-away floor', placeholder: 'e.g. $155K cash' },
    non_negotiables: {
      label: 'Non-negotiables',
      placeholder: 'e.g. No on-call · no unpaid overtime culture',
    },
    signature_strengths: {
      label: 'Signature strengths',
      placeholder: 'e.g. SQL ops analytics · stakeholder facilitation',
    },
  },
  zh: {
    target_level: { label: '目標職級', placeholder: '例如 Senior BA / Staff PM' },
    location_or_remote: {
      label: '地點／遠端',
      placeholder: '例如 US remote · NYC hybrid OK',
    },
    work_auth: {
      label: '工作權',
      placeholder: '例如 US citizen · 不需 sponsorship',
    },
    target_tc: { label: '目標總薪酬', placeholder: '例如 $180K TC' },
    walk_away_tc: { label: '最低底線', placeholder: '例如 $155K cash' },
    non_negotiables: {
      label: '不可妥協',
      placeholder: '例如 不當 on-call · 不要無薪加班文化',
    },
    signature_strengths: {
      label: '招牌優勢',
      placeholder: '例如 SQL 營運分析 · stakeholder facilitation',
    },
  },
};

interface CareerContextFormProps {
  initial?: CareerContext | null;
  onSaved?: (ctx: CareerContext) => void;
  /** Dedicated page already has the product intro — hide the compact header. */
  hideIntro?: boolean;
}

export default function CareerContextForm({
  initial,
  onSaved,
  hideIntro = false,
}: CareerContextFormProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const fields = zh ? FIELD_COPY.zh : FIELD_COPY.en;
  const [form, setForm] = useState<CareerContext>(
    normalizeCareerContext(initial ?? EMPTY_CAREER_CONTEXT),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm(normalizeCareerContext(initial));
  }, [initial]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_context: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : zh
              ? '儲存失敗。'
              : 'Could not save.',
        );
        return;
      }
      const saved = normalizeCareerContext(data.career_context);
      setForm(saved);
      setMessage(
        zh
          ? '已儲存 — 下次 Snapshot / Guide 分析會自動帶入。'
          : 'Career Context saved — used on your next analysis.',
      );
      onSaved?.(saved);
    } catch {
      setError(zh ? '儲存失敗。' : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-7 space-y-5">
      {!hideIntro && (
        <div className="flex items-start gap-3">
          <Target className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
              Career Context
            </h2>
            <p className="text-lg text-slate-500 mt-1 leading-snug">
              {zh
                ? '選填底線，存進帳號後會注入每次 Snapshot / Guide 分析。'
                : 'Optional floors for fit and offer targeting. Saved on your account and injected into Snapshot / Guide analyses.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELD_KEYS.map((key) => (
          <label key={key} className="block sm:col-span-1">
            <span className="text-slate-400 text-base font-medium">{fields[key].label}</span>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={fields[key].placeholder}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
        ))}
      </div>

      {error && (
        <p className="text-lg text-red-400" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-lg text-emerald-300" role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-lg font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white transition-colors"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {zh ? '儲存 Career Context' : 'Save Career Context'}
      </button>
    </section>
  );
}
