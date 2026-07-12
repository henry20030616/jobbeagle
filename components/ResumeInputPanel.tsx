'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import type { ResumeInput } from '@/types';
import { FileText, History, Upload, X, Save, Clock, Loader2 } from 'lucide-react';

interface LibraryItem {
  id: string;
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  fileName?: string;
  timestamp: number;
}

export interface ResumeInputPanelProps {
  value: ResumeInput | null;
  onChange: (resume: ResumeInput | null) => void;
  language?: string;
  /** Max library rows shown (product: keep picker light). */
  libraryLimit?: number;
}

/**
 * Shared resume UX: paste / upload PDF·DOCX·text + library pick/save/soft-delete.
 * Used on homepage-adjacent flows and Confirm Job page (extension handoff).
 */
export default function ResumeInputPanel({
  value,
  onChange,
  language = 'en',
  libraryLimit = 3,
}: ResumeInputPanelProps) {
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [pasteDraft, setPasteDraft] = useState(
    value?.type === 'text' ? value.content : '',
  );

  const loadLibrary = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLibrary([]);
        return;
      }
      const { data, error } = await supabase
        .from('resume_history')
        .select('id, type, content, mime_type, file_name, created_at, last_used_at, label')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .limit(libraryLimit);

      if (error) {
        const legacy = await supabase
          .from('resume_history')
          .select('id, type, content, mime_type, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(libraryLimit);
        setLibrary(
          (legacy.data || [])
            .filter((i) => i.id && i.content)
            .map((i: any) => ({
              id: i.id,
              type: i.type,
              content: i.content,
              mimeType: i.mime_type,
              fileName: i.file_name,
              timestamp: new Date(i.created_at).getTime(),
            })),
        );
        return;
      }

      setLibrary(
        (data || [])
          .filter((i) => i.id && i.content)
          .map((i: any) => ({
            id: i.id,
            type: i.type,
            content: i.content,
            mimeType: i.mime_type,
            fileName: i.file_name || i.label,
            timestamp: new Date(i.last_used_at || i.created_at).getTime(),
          })),
      );
    } catch {
      setLibrary([]);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [libraryLimit]);

  useEffect(() => {
    if (value?.type === 'text') setPasteDraft(value.content);
    if (!value) setPasteDraft('');
  }, [value]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const applyText = (text: string) => {
    setPasteDraft(text);
    if (text.trim()) {
      onChange({ type: 'text', content: text });
    } else {
      onChange(null);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert(zh ? '檔案超過 4MB' : 'File exceeds 4MB');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isWord =
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc');

    if (isPdf || isWord) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result?.split(',')[1];
        if (!base64) return;
        onChange({
          type: 'file',
          content: base64,
          mimeType: isPdf
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileName: file.name,
        });
        setPasteDraft('');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = String(ev.target?.result || '');
        applyText(text);
        onChange({
          type: 'text',
          content: text,
          fileName: file.name,
          mimeType: file.type || 'text/plain',
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || (zh ? '儲存失敗' : 'Save failed'));
        return;
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
      await loadLibrary();
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('resume_history')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    await loadLibrary();
  };

  const clear = () => {
    onChange(null);
    setPasteDraft('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-300">
          {zh ? '履歷（上傳或貼上）' : 'Resume (upload or paste)'}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20"
          >
            <History className="w-3.5 h-3.5" />
            {zh ? '履歷庫' : 'Library'}
            {library.length > 0 ? ` (${library.length})` : ''}
          </button>
          {showLibrary && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLibrary(false)} />
              <div className="absolute right-0 top-9 w-72 z-20 rounded-xl border border-slate-600 bg-slate-800 shadow-2xl overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-700">
                  {zh ? `最近 ${libraryLimit} 份` : `Last ${libraryLimit}`}
                </div>
                {library.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">
                    {zh ? '尚無履歷（分析或儲存後會出現）' : 'Empty — analyze or save to add'}
                  </p>
                ) : (
                  library.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onChange({
                          type: item.type,
                          content: item.content,
                          mimeType: item.mimeType,
                          fileName: item.fileName,
                        });
                        if (item.type === 'text') setPasteDraft(item.content);
                        else setPasteDraft('');
                        setShowLibrary(false);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter') {
                          onChange({
                            type: item.type,
                            content: item.content,
                            mimeType: item.mimeType,
                            fileName: item.fileName,
                          });
                          setShowLibrary(false);
                        }
                      }}
                      className="flex items-start gap-2 p-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm text-slate-200 font-semibold truncate">
                          {item.fileName || 'resume'}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => handleSoftDelete(item.id, ev)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {!value || value.type === 'text' ? (
        <textarea
          value={pasteDraft}
          onChange={(e) => applyText(e.target.value)}
          rows={7}
          placeholder={zh ? '貼上履歷文字，或下方上傳檔案…' : 'Paste resume text, or upload a file below…'}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-indigo-300 shrink-0" />
            <span className="text-sm font-medium truncate">{value.fileName || 'Uploaded file'}</span>
          </div>
          <button type="button" onClick={clear} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <Upload className="w-3.5 h-3.5" />
          {zh ? '上傳 PDF / Word / 文字' : 'Upload PDF / Word / text'}
        </button>
        <button
          type="button"
          disabled={!value || saving}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/30 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saveOk ? (zh ? '已儲存' : 'Saved') : zh ? '儲存到履歷庫' : 'Save to library'}
        </button>
        <span className="text-[11px] text-slate-500">
          {zh ? `履歷庫顯示最近 ${libraryLimit} 份` : `Library shows last ${libraryLimit}`}
        </span>
      </div>
    </div>
  );
}
