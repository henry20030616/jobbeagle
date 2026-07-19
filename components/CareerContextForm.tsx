'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, Target } from 'lucide-react';
import type { CareerContext } from '@/types';
import { EMPTY_CAREER_CONTEXT, normalizeCareerContext } from '@/lib/career-context';

const FIELDS: Array<{ key: keyof CareerContext; label: string; placeholder: string }> = [
  {
    key: 'target_level',
    label: 'Target level',
    placeholder: 'e.g. Senior BA / Staff PM',
  },
  {
    key: 'location_or_remote',
    label: 'Location / remote',
    placeholder: 'e.g. US remote · NYC hybrid OK',
  },
  {
    key: 'work_auth',
    label: 'Work authorization',
    placeholder: 'e.g. US citizen · no sponsorship needed',
  },
  {
    key: 'target_tc',
    label: 'Target total compensation',
    placeholder: 'e.g. $180K TC',
  },
  {
    key: 'walk_away_tc',
    label: 'Walk-away floor',
    placeholder: 'e.g. $155K cash',
  },
  {
    key: 'non_negotiables',
    label: 'Non-negotiables',
    placeholder: 'e.g. No on-call · no unpaid overtime culture',
  },
  {
    key: 'signature_strengths',
    label: 'Signature strengths',
    placeholder: 'e.g. SQL ops analytics · stakeholder facilitation',
  },
];

interface CareerContextFormProps {
  initial?: CareerContext | null;
  onSaved?: (ctx: CareerContext) => void;
}

export default function CareerContextForm({ initial, onSaved }: CareerContextFormProps) {
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
        setError(typeof data.error === 'string' ? data.error : 'Could not save.');
        return;
      }
      const saved = normalizeCareerContext(data.career_context);
      setForm(saved);
      setMessage('Career Context saved — used on your next analysis.');
      onSaved?.(saved);
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-start gap-2">
        <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Career Context
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Optional floors for fit and offer targeting. Saved on your account and injected into
            Snapshot / Guide analyses.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm sm:col-span-1">
            <span className="text-slate-400 text-xs font-medium">{f.label}</span>
            <input
              type="text"
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-emerald-300" role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save Career Context
      </button>
    </section>
  );
}
