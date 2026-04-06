'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Bookmark, Building2, LogIn, Loader2, ExternalLink, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { JobData } from '@/types';

interface ProfileModalProps {
  onClose: () => void;
  language?: 'zh' | 'en';
}

type Tab = 'resumes' | 'saved' | 'following';

interface ResumeRecord {
  id: string;
  file_name: string;
  created_at: string;
}

interface SavedJob {
  id: string;
  job_id: string;
  job_data: JobData;
  created_at: string;
}

interface FollowedCompany {
  id: string;
  company_name: string;
  logo_url: string | null;
  created_at: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, language = 'zh' }) => {
  const [tab, setTab] = useState<Tab>('resumes');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await loadData(user.id);
      setLoading(false);
    };
    init();
  }, []);

  const loadData = async (userId: string) => {
    const supabase = createClient();
    const [resumesRes, savedRes, followsRes] = await Promise.all([
      supabase.from('resume_history').select('id, file_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('saved_jobs').select('id, job_id, job_data, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('followed_companies').select('id, company_name, logo_url, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (resumesRes.data) setResumes(resumesRes.data);
    if (savedRes.data) setSavedJobs(savedRes.data as SavedJob[]);
    if (followsRes.data) setFollowedCompanies(followsRes.data);
  };

  const handleUnsaveJob = async (savedId: string) => {
    const supabase = createClient();
    await supabase.from('saved_jobs').delete().eq('id', savedId);
    setSavedJobs(prev => prev.filter(j => j.id !== savedId));
  };

  const handleUnfollowCompany = async (companyName: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('followed_companies').delete().eq('user_id', user.id).eq('company_name', companyName);
    setFollowedCompanies(prev => prev.filter(c => c.company_name !== companyName));
  };

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts` },
    });
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl p-8 flex justify-center">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-slate-900 w-full max-w-lg rounded-t-2xl flex flex-col"
        style={{ maxHeight: '85dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {(user.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user.email}</p>
                  <p className="text-slate-400 text-xs">{t('個人帳號', 'Personal Account')}</p>
                </div>
              </>
            ) : (
              <p className="text-white font-semibold">{t('個人頁面', 'Profile')}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">{t('登入以查看個人資料', 'Login to view your profile')}</p>
              <p className="text-slate-400 text-sm">{t('儲存職缺、追蹤企業、管理履歷', 'Save jobs, follow companies, manage resumes')}</p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
            >
              <LogIn size={18} />
              {t('以 Google 帳號登入', 'Sign in with Google')}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-700/50 flex-shrink-0">
              {([
                { key: 'resumes', icon: FileText, zh: '我的履歷', en: 'Resumes' },
                { key: 'saved', icon: Bookmark, zh: '已儲存', en: 'Saved' },
                { key: 'following', icon: Building2, zh: '追蹤中', en: 'Following' },
              ] as const).map(({ key, icon: Icon, zh, en }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                    tab === key ? 'text-white border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  <Icon size={15} />
                  {t(zh, en)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Resumes */}
              {tab === 'resumes' && (
                <div className="space-y-2">
                  {resumes.length === 0 ? (
                    <EmptyState icon={FileText} text={t('尚無履歷記錄。在 AI 匹配度分析時上傳後即可儲存。', 'No resumes yet. Upload one in AI Match Analysis.')} />
                  ) : resumes.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      <div className="w-9 h-9 bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.file_name}</p>
                        <p className="text-slate-400 text-xs">{fmtDate(r.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Saved Jobs */}
              {tab === 'saved' && (
                <div className="space-y-2">
                  {savedJobs.length === 0 ? (
                    <EmptyState icon={Bookmark} text={t('尚無儲存職缺。在影片右側點擊書籤圖示即可儲存。', 'No saved jobs yet. Tap the bookmark icon on any video.')} />
                  ) : savedJobs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{s.job_data?.jobTitle || '—'}</p>
                        <p className="text-slate-400 text-xs truncate">{s.job_data?.companyName} · {fmtDate(s.created_at)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a
                          href={`/shorts/company/${encodeURIComponent(s.job_data?.companyName || '')}`}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleUnsaveJob(s.id)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Followed Companies */}
              {tab === 'following' && (
                <div className="space-y-2">
                  {followedCompanies.length === 0 ? (
                    <EmptyState icon={Building2} text={t('尚未追蹤任何企業。點擊影片中的追蹤按鈕即可開始。', 'Not following any companies yet. Tap the follow button on any video.')} />
                  ) : followedCompanies.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.company_name} className="w-10 h-10 rounded-full bg-white object-contain border border-slate-600 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <Building2 size={18} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.company_name}</p>
                        <p className="text-slate-400 text-xs">{t('追蹤於', 'Followed')} {fmtDate(c.created_at)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a
                          href={`/shorts/company/${encodeURIComponent(c.company_name)}`}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleUnfollowCompany(c.company_name)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-6 pt-3 border-t border-slate-700/50 flex-shrink-0">
              <a
                href="/shorts/upload"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <Upload size={16} />
                {t('企業：上傳職缺影片', 'Company: Upload Job Video')}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
      <Icon className="w-7 h-7 text-slate-500" />
    </div>
    <p className="text-slate-400 text-sm max-w-[240px]">{text}</p>
  </div>
);

export default ProfileModal;
