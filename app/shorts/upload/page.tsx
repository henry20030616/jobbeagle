'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, ArrowLeft, Loader2, CheckCircle, Copy, AlertCircle } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function ShortsUploadPage() {
  const [files, setFiles] = useState<(File | null)>([null, null, null, null]);
  const [urls, setUrls] = useState<string[]>([]);
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = (index: number, file: File | null) => {
    const next = [...files];
    next[index] = file;
    setFiles(next);
    setError(null);
  };

  const handleUpload = async () => {
    const toUpload = files.filter((f): f is File => f != null);
    if (toUpload.length === 0) {
      setError('請至少選擇 1 個影片檔案');
      return;
    }

    setState('uploading');
    setError(null);
    const results: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const form = new FormData();
      form.append('file', toUpload[i]);
      form.append('index', String(i + 1));

      const res = await fetch('/api/shorts/upload', {
        method: 'POST',
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || '上傳失敗');
        setState('error');
        return;
      }

      if (data.url) results.push(data.url);
    }

    const padded = [...results, ...new Array(Math.max(0, 4 - results.length)).fill('')].slice(0, 4);
    setUrls(padded);
    setState('done');
  };

  const copyUrls = () => {
    const text = urls.map((url, i) => `videoUrl-${i + 1}: ${url}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/shorts"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回 Shorts
        </Link>

        <h1 className="text-2xl font-bold mb-2">上傳 4 支影片（最簡單）</h1>
        <p className="text-slate-400 text-sm mb-8">
          選擇電腦裡的影片，上傳後會得到網址，再貼到 fallback-videos.ts 的 videoUrl 即可。
        </p>

        {/* 一次只上傳多個檔案 */}
        <div className="space-y-4 mb-8">
          <label className="block text-slate-300 font-medium">選擇影片（可多選，最多 4 個）</label>
          <input
            type="file"
            accept="video/mp4,video/webm"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files || []).slice(0, 4);
              const next: (File | null)[] = [...files];
              list.forEach((f, i) => { next[i] = f; });
              for (let i = list.length; i < 4; i++) next[i] = null;
              setFiles(next);
              setError(null);
            }}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white"
          />
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded">
                {f ? f.name : `影片 ${i + 1}`}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={state === 'uploading' || files.every(f => !f)}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
        >
          {state === 'uploading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              上傳中…
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              上傳
            </>
          )}
        </button>

        {state === 'done' && urls.length > 0 && (
          <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-green-400 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">上傳成功</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              請將下面網址複製到 <code className="bg-slate-700 px-1 rounded">app/shorts/fallback-videos.ts</code> 的對應 <code className="bg-slate-700 px-1 rounded">videoUrl</code> 欄位。
            </p>
            <div className="space-y-2">
              {urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">影片 {i + 1}</span>
                  <input
                    readOnly
                    value={url}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-300"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={copyUrls}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
            >
              <Copy className="w-4 h-4" />
              {copied ? '已複製' : '複製全部網址'}
            </button>
          </div>
        )}

        <div className="mt-10 p-4 bg-slate-800/30 rounded-lg text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-2">第一次使用請先設定 Supabase Storage：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>開啟 Supabase Dashboard → Storage</li>
            <li>新增 bucket，名稱為 <code className="bg-slate-700 px-1">shorts-videos</code>，勾選「Public」</li>
            <li>在 SQL Editor 執行 <code className="bg-slate-700 px-1">supabase-shorts-storage.sql</code> 裡的權限（允許上傳）</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
