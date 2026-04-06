'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle,
  Video, Building2, MapPin, DollarSign, FileText, Tag,
  Mail, ExternalLink, Image, LogIn, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

type Step = 'auth' | 'video' | 'info' | 'apply' | 'preview' | 'done';
type ApplyMethod = 'email' | 'url' | 'none';

interface FormData {
  companyName: string;
  jobTitle: string;
  location: string;
  salary: string;
  description: string;
  tags: string;
  contactEmail: string;
  applyUrl: string;
  applyMethod: ApplyMethod;
  videoUrl: string;
  logoUrl: string;
}

const INITIAL_FORM: FormData = {
  companyName: '', jobTitle: '', location: '', salary: '',
  description: '', tags: '', contactEmail: '', applyUrl: '',
  applyMethod: 'email', videoUrl: '', logoUrl: '',
};

export default function ShortsUploadPage() {
  const [step, setStep] = useState<Step>('auth');
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) setStep('video');
    });
  }, []);

  const set = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts/upload` },
    });
  };

  const uploadFile = async (file: File, type: 'video' | 'logo'): Promise<string | null> => {
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'logo' ? 'png' : 'mp4');
    const path = type === 'logo'
      ? `logos/logo-${Date.now()}.${ext}`
      : `video-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('shorts-videos')
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('尚未建立 Storage 空間。請到 Supabase → Storage → 新增 bucket「shorts-videos」並設為公開，再執行 supabase-shorts-storage.sql 的權限設定。');
      }
      throw new Error(error.message || '上傳失敗');
    }

    const { data: urlData } = supabase.storage.from('shorts-videos').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      setError('影片請勿超過 500MB');
      return;
    }
    setUploadingVideo(true);
    setError(null);
    try {
      const url = await uploadFile(file, 'video');
      if (url) set('videoUrl', url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const url = await uploadFile(file, 'logo');
      if (url) set('logoUrl', url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        company_name: form.companyName,
        job_title: form.jobTitle,
        location: form.location,
        salary: form.salary,
        description: form.description,
        tags: form.tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean),
        video_url: form.videoUrl,
        logo_url: form.logoUrl || undefined,
        contact_email: form.applyMethod === 'email' ? form.contactEmail : undefined,
        apply_url: form.applyMethod === 'url' ? form.applyUrl : undefined,
      };
      const res = await fetch('/api/shorts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '發佈失敗');
      setPublishedUrl(`/shorts/company/${encodeURIComponent(form.companyName)}`);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Link href="/shorts" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg">上傳職缺影片</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Step: Auth */}
        {step === 'auth' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">企業登入後即可上傳</h2>
              <p className="text-slate-400 text-sm">上傳職缺影片、填寫公司資訊，讓更多求職者看到你們</p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-base transition-colors"
            >
              <LogIn size={20} />
              以 Google 帳號登入
            </button>
          </div>
        )}

        {/* Step: Video upload */}
        {step === 'video' && (
          <div className="space-y-6">
            <StepHeader step={1} total={4} title="上傳招募影片" />
            <div
              onClick={() => videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                form.videoUrl ? 'border-green-500/50 bg-green-900/10' : 'border-slate-600 hover:border-blue-500/60 hover:bg-slate-800/30'
              }`}
            >
              {uploadingVideo ? (
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              ) : form.videoUrl ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-400" />
                  <p className="text-green-300 font-medium">影片已上傳</p>
                  <video src={form.videoUrl} className="w-full rounded-xl max-h-48 object-cover" muted />
                  <p className="text-slate-400 text-sm">點擊重新上傳</p>
                </>
              ) : (
                <>
                  <Video className="w-12 h-12 text-slate-400" />
                  <p className="text-white font-semibold">點擊上傳影片</p>
                  <p className="text-slate-400 text-sm text-center">支援 MP4 / WebM，最大 100MB<br />建議 9:16 直式短影音</p>
                </>
              )}
            </div>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
            {error && <ErrorMsg text={error} />}
            <NextBtn disabled={!form.videoUrl || uploadingVideo} onClick={() => setStep('info')} />
          </div>
        )}

        {/* Step: Job info */}
        {step === 'info' && (
          <div className="space-y-5">
            <StepHeader step={2} total={4} title="填寫職缺資訊" />
            <Field icon={Building2} label="公司名稱 *" placeholder="例：Jobbeagle Inc." value={form.companyName} onChange={v => set('companyName', v)} />
            <Field icon={FileText} label="職缺名稱 *" placeholder="例：前端工程師" value={form.jobTitle} onChange={v => set('jobTitle', v)} />
            <Field icon={MapPin} label="工作地點" placeholder="例：台北市信義區 / 遠端" value={form.location} onChange={v => set('location', v)} />
            <Field icon={DollarSign} label="薪資範圍" placeholder="例：月薪 60,000–90,000" value={form.salary} onChange={v => set('salary', v)} />
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2"><FileText size={15} /> 職缺描述</label>
              <textarea
                rows={4}
                placeholder="描述工作內容、需求技能、公司文化…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
            <Field icon={Tag} label="標籤（逗號分隔）" placeholder="例：React, TypeScript, 遠端" value={form.tags} onChange={v => set('tags', v)} />

            {/* Logo upload */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2"><Image size={15} /> 公司 Logo（選填）</label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors ${
                  form.logoUrl ? 'border-green-500/50 bg-green-900/10' : 'border-slate-600 hover:border-blue-500/60'
                }`}
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : form.logoUrl ? (
                  <>
                    <img src={form.logoUrl} alt="logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                    <div>
                      <p className="text-green-300 text-sm font-medium">Logo 已上傳</p>
                      <p className="text-slate-400 text-xs">點擊重新上傳</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Image className="w-7 h-7 text-slate-400" />
                    <p className="text-slate-400 text-sm">點擊上傳 Logo（PNG/JPG，最大 5MB）</p>
                  </>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            {error && <ErrorMsg text={error} />}
            <div className="flex gap-3">
              <BackBtn onClick={() => setStep('video')} />
              <NextBtn disabled={!form.companyName || !form.jobTitle} onClick={() => setStep('apply')} />
            </div>
          </div>
        )}

        {/* Step: Apply method */}
        {step === 'apply' && (
          <div className="space-y-5">
            <StepHeader step={3} total={4} title="申請方式" />
            <p className="text-slate-400 text-sm">選擇求職者如何申請這個職缺</p>
            <div className="space-y-3">
              {([
                { val: 'email', icon: Mail, title: '一鍵申請（接收履歷信件）', desc: '求職者直接透過平台發送履歷到你的信箱' },
                { val: 'url', icon: ExternalLink, title: '導引到企業申請頁', desc: '求職者點擊「套用」後跳轉到你們的招募頁面' },
                { val: 'none', icon: Building2, title: '暫不開放申請', desc: '僅展示職缺資訊，不接受申請' },
              ] as const).map(({ val, icon: Icon, title, desc }) => (
                <button
                  key={val}
                  onClick={() => set('applyMethod', val)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                    form.applyMethod === val ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${form.applyMethod === val ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {form.applyMethod === 'email' && (
              <Field icon={Mail} label="接收履歷的信箱 *" placeholder="hr@yourcompany.com" value={form.contactEmail} onChange={v => set('contactEmail', v)} type="email" />
            )}
            {form.applyMethod === 'url' && (
              <Field icon={ExternalLink} label="企業申請頁網址 *" placeholder="https://yourcompany.com/jobs/..." value={form.applyUrl} onChange={v => set('applyUrl', v)} type="url" />
            )}
            <div className="flex gap-3">
              <BackBtn onClick={() => setStep('info')} />
              <NextBtn
                disabled={
                  (form.applyMethod === 'email' && !form.contactEmail) ||
                  (form.applyMethod === 'url' && !form.applyUrl)
                }
                onClick={() => setStep('preview')}
              />
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-5">
            <StepHeader step={4} total={4} title="確認並發佈" />
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
              {form.videoUrl && (
                <video src={form.videoUrl} controls className="w-full aspect-video object-cover bg-black" />
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="logo" className="w-11 h-11 rounded-full object-contain bg-white p-1 border border-slate-600" />
                  )}
                  <div>
                    <p className="text-white font-bold text-lg">{form.jobTitle}</p>
                    <p className="text-slate-400 text-sm">{form.companyName}</p>
                  </div>
                </div>
                {form.location && <p className="text-slate-300 text-sm">📍 {form.location}</p>}
                {form.salary && <p className="text-slate-300 text-sm">💰 {form.salary}</p>}
                {form.description && <p className="text-slate-300 text-sm leading-relaxed">{form.description}</p>}
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.split(/[,，\s]+/).filter(Boolean).map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-slate-400 text-xs">
                    申請方式：{form.applyMethod === 'email' ? `一鍵申請 (${form.contactEmail})` : form.applyMethod === 'url' ? `企業申請頁 (${form.applyUrl})` : '暫不開放'}
                  </p>
                </div>
              </div>
            </div>
            {error && <ErrorMsg text={error} />}
            <div className="flex gap-3">
              <BackBtn onClick={() => setStep('apply')} />
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-white font-bold transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload size={18} />}
                {submitting ? '發佈中…' : '立即發佈'}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">發佈成功！</h2>
              <p className="text-slate-400 text-sm">你的職缺影片已上線，求職者現在可以在 Shorts 看到</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a
                href={publishedUrl}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors"
              >
                <ExternalLink size={16} />
                查看企業頁面
              </a>
              <Link
                href="/shorts"
                className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-colors"
              >
                返回 Shorts
              </Link>
              <button
                onClick={() => { setForm(INITIAL_FORM); setStep('video'); }}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-sm transition-colors"
              >
                再上傳一個職缺
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable sub-components
function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="space-y-2">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">步驟 {step} / {total}</p>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-blue-500' : 'bg-slate-700'}`} />
        ))}
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, placeholder, value, onChange, type = 'text',
}: {
  icon: React.ElementType; label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
        <Icon size={15} /> {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function NextBtn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
    >
      繼續 <ChevronRight size={18} />
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
    >
      返回
    </button>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <p className="text-red-200 text-sm">{text}</p>
    </div>
  );
}
