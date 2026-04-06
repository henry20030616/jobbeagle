'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Bookmark, Building2, LogIn, Loader2,
  ExternalLink, Trash2, Plus, Play, Settings, User,
  ChevronRight, Grid, Heart, MapPin,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { JobData } from '@/types';

interface ProfileModalProps {
  onClose: () => void;
  language?: 'zh' | 'en';
}

type PersonalTab = 'resumes' | 'saved' | 'following';
type ProfileMode = 'personal' | 'company';

interface ResumeRecord { id: string; file_name: string; created_at: string; }
interface SavedJob { id: string; job_id: string; job_data: JobData; created_at: string; }
interface FollowedCompany { id: string; company_name: string; logo_url: string | null; created_at: string; }
interface CompanyProfile { company_name: string; logo_url: string | null; description: string | null; }
interface CompanyVideo {
  id: string; job_title: string; company_name: string; location: string;
  salary: string; description: string; video_url: string; created_at: string;
  logo_url: string | null; tags: string[];
}

const ProfilePage: React.FC<ProfileModalProps> = ({ onClose, language = 'zh' }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ProfileMode>('personal');
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);

  // Personal data
  const [personalTab, setPersonalTab] = useState<PersonalTab>('resumes');
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);

  // Company data
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [companyVideos, setCompanyVideos] = useState<CompanyVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<CompanyVideo | null>(null);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await Promise.all([loadPersonalData(user.id), loadCompanyData(user.id)]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadPersonalData = async (userId: string) => {
    const supabase = createClient();
    const [resumesRes, savedRes, followsRes] = await Promise.all([
      supabase.from('resume_history').select('id, file_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('saved_jobs').select('id, job_id, job_data, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('followed_companies').select('id, company_name, logo_url, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (resumesRes.data) setResumes(resumesRes.data);
    if (savedRes.data) setSavedJobs(savedRes.data as SavedJob[]);
    if (followsRes.data) setFollowedCompanies(followsRes.data);
  };

  const loadCompanyData = async (userId: string) => {
    const supabase = createClient();
    const [profileRes, videosRes] = await Promise.all([
      supabase.from('company_profiles').select('company_name, logo_url, description').eq('user_id', userId).single(),
      supabase.from('shorts_videos').select('*').eq('company_user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (profileRes.data) {
      setCompanyProfile(profileRes.data);
      setHasCompanyProfile(true);
    }
    if (videosRes.data) setCompanyVideos(videosRes.data as CompanyVideo[]);
  };

  const handleUnsave = async (savedId: string) => {
    const supabase = createClient();
    await supabase.from('saved_jobs').delete().eq('id', savedId);
    setSavedJobs(prev => prev.filter(j => j.id !== savedId));
  };

  const handleUnfollow = async (companyName: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('followed_companies').delete().eq('user_id', user.id).eq('company_name', companyName);
    setFollowedCompanies(prev => prev.filter(c => c.company_name !== companyName));
  };

  const handleLogin = async (type: 'personal' | 'employer') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=${type === 'employer' ? 'employer' : 'talent'}`,
      },
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        <TopBar onBack={onClose} title={t('個人頁面', 'Profile')} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
            <User className="w-12 h-12 text-slate-500" />
          </div>
          <div className="text-center">
            <h2 className="text-white text-xl font-bold mb-2">{t('登入以使用個人功能', 'Login to use personal features')}</h2>
            <p className="text-slate-400 text-sm">{t('儲存職缺、追蹤企業、管理履歷，企業可上傳職缺影片', 'Save jobs, follow companies, upload job videos')}</p>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => handleLogin('personal')}
              className="w-full flex items-center gap-3 px-5 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-semibold transition-colors"
            >
              <User size={20} />
              <div className="text-left">
                <p className="font-semibold">{t('人才登入', 'Talent Login')}</p>
                <p className="text-blue-200 text-xs font-normal">{t('儲存職缺、追蹤企業', 'Save jobs & follow companies')}</p>
              </div>
              <ChevronRight size={18} className="ml-auto opacity-70" />
            </button>
            <button
              onClick={() => handleLogin('employer')}
              className="w-full flex items-center gap-3 px-5 py-4 bg-emerald-700 hover:bg-emerald-600 rounded-2xl text-white font-semibold transition-colors"
            >
              <Building2 size={20} />
              <div className="text-left">
                <p className="font-semibold">{t('企業登入', 'Employer Login')}</p>
                <p className="text-emerald-200 text-xs font-normal">{t('上傳職缺影片、管理職缺', 'Upload & manage job videos')}</p>
              </div>
              <ChevronRight size={18} className="ml-auto opacity-70" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  const avatarLetter = (user.user_metadata?.full_name || user.email || '?')[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <TopBar onBack={onClose} title={mode === 'company' ? t('企業頁面', 'Company') : t('個人頁面', 'Profile')} />

      {/* Mode switcher (show if user has both personal + company profile) */}
      {hasCompanyProfile && (
        <div className="flex-shrink-0 px-4 pt-4">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            <ModeBtn active={mode === 'personal'} onClick={() => setMode('personal')} icon={User} label={t('個人', 'Personal')} />
            <ModeBtn active={mode === 'company'} onClick={() => setMode('company')} icon={Building2} label={t('企業', 'Company')} />
          </div>
        </div>
      )}

      {/* ── PERSONAL MODE ──────────────────────────────────────────────────── */}
      {mode === 'personal' && (
        <div className="flex-1 overflow-y-auto">
          {/* Profile hero */}
          <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-slate-800">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-3">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : avatarLetter}
            </div>
            <h2 className="text-white font-bold text-lg">{user.user_metadata?.full_name || t('使用者', 'User')}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>

            {/* Stats row */}
            <div className="flex gap-8 mt-5">
              <StatItem count={savedJobs.length} label={t('已儲存', 'Saved')} />
              <StatItem count={followedCompanies.length} label={t('追蹤企業', 'Following')} />
              <StatItem count={resumes.length} label={t('履歷', 'Resumes')} />
            </div>

            {/* Setup company profile CTA (if not yet) */}
            {!hasCompanyProfile && (
              <a
                href="/shorts/upload"
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-emerald-900/50 border border-emerald-600/50 rounded-full text-emerald-400 text-sm font-medium hover:bg-emerald-900 transition-colors"
              >
                <Building2 size={14} />
                {t('以企業身份上傳職缺', 'Post a job as a company')}
              </a>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 flex-shrink-0">
            {([
              { key: 'resumes' as PersonalTab, icon: FileText, zh: '我的履歷', en: 'Resumes' },
              { key: 'saved' as PersonalTab, icon: Bookmark, zh: '已儲存職缺', en: 'Saved Jobs' },
              { key: 'following' as PersonalTab, icon: Building2, zh: '追蹤企業', en: 'Following' },
            ]).map(({ key, icon: Icon, zh, en }) => (
              <button
                key={key}
                onClick={() => setPersonalTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  personalTab === key ? 'text-white border-blue-500' : 'text-slate-500 border-transparent'
                }`}
              >
                <Icon size={15} />
                {t(zh, en)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 space-y-3">
            {personalTab === 'resumes' && (
              resumes.length === 0
                ? <EmptyState icon={FileText} text={t('尚無履歷。在 AI 匹配度分析時上傳即可自動儲存。', 'No resumes yet. Upload via AI Match Analysis.')} />
                : resumes.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{r.file_name}</p>
                      <p className="text-slate-500 text-xs">{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                ))
            )}

            {personalTab === 'saved' && (
              savedJobs.length === 0
                ? <EmptyState icon={Bookmark} text={t('尚無儲存職缺。點擊影片右側書籤儲存。', 'No saved jobs. Tap the bookmark icon on videos.')} />
                : savedJobs.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Bookmark size={16} className="text-yellow-400" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{s.job_data?.jobTitle || '—'}</p>
                      <p className="text-slate-400 text-xs truncate">{s.job_data?.companyName}</p>
                      {s.job_data?.location && (
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />{s.job_data.location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a href={`/shorts/company/${encodeURIComponent(s.job_data?.companyName || '')}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => handleUnsave(s.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
            )}

            {personalTab === 'following' && (
              followedCompanies.length === 0
                ? <EmptyState icon={Building2} text={t('尚未追蹤企業。點擊影片右側追蹤按鈕。', 'Not following any companies yet.')} />
                : followedCompanies.map(c => (
                  <a
                    key={c.id}
                    href={`/shorts/company/${encodeURIComponent(c.company_name)}`}
                    className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.company_name} className="w-11 h-11 rounded-full bg-white object-contain border border-slate-700 flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{c.company_name}</p>
                      <p className="text-slate-500 text-xs">{t('追蹤於', 'Followed')} {fmtDate(c.created_at)}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
                    <button
                      onClick={e => { e.preventDefault(); handleUnfollow(c.company_name); }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </a>
                ))
            )}
          </div>
        </div>
      )}

      {/* ── COMPANY MODE ───────────────────────────────────────────────────── */}
      {mode === 'company' && (
        <div className="flex-1 overflow-y-auto">
          {/* Company hero */}
          <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-slate-800">
            {companyProfile?.logo_url ? (
              <img
                src={companyProfile.logo_url}
                alt={companyProfile.company_name}
                className="w-20 h-20 rounded-2xl bg-white object-contain border border-slate-700 shadow-xl mb-3 p-1"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center mb-3 shadow-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            )}
            <h2 className="text-white font-bold text-xl">{companyProfile?.company_name || t('我的企業', 'My Company')}</h2>
            {companyProfile?.description && (
              <p className="text-slate-400 text-sm text-center mt-1 max-w-xs">{companyProfile.description}</p>
            )}

            {/* Stats */}
            <div className="flex gap-8 mt-5">
              <StatItem count={companyVideos.length} label={t('影片職缺', 'Videos')} />
            </div>

            {/* Upload CTA */}
            <a
              href="/shorts/upload"
              className="mt-5 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold transition-colors shadow-lg"
            >
              <Plus size={18} />
              {t('上傳新影片', 'Upload New Video')}
            </a>
          </div>

          {/* Videos grid label */}
          <div className="flex items-center gap-2 px-4 pt-5 pb-3">
            <Grid size={16} className="text-slate-400" />
            <span className="text-slate-400 text-sm font-medium">{t('已上傳職缺影片', 'Uploaded Videos')}</span>
          </div>

          {/* Videos grid */}
          {companyVideos.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={Play}
                text={t('尚未上傳任何職缺影片。點擊上方按鈕開始。', 'No videos yet. Click the button above to start.')}
              />
            </div>
          ) : (
            <>
              <div className="px-4 grid grid-cols-2 gap-3 pb-6">
                {companyVideos.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVideo(selectedVideo?.id === v.id ? null : v)}
                    className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-[9/16] flex flex-col items-center justify-center group hover:border-blue-500/50 transition-colors"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-blue-600/70 transition-colors">
                        <Play size={20} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs font-semibold line-clamp-1">{v.job_title}</p>
                      {v.location && <p className="text-slate-300 text-[10px] flex items-center gap-0.5"><MapPin size={8} />{v.location}</p>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Video detail sheet */}
              {selectedVideo && (
                <div className="fixed inset-x-0 bottom-0 z-60 bg-slate-900 rounded-t-2xl border-t border-slate-700 p-5 max-h-[70dvh] overflow-y-auto">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{selectedVideo.job_title}</h3>
                      <p className="text-slate-400 text-sm">{selectedVideo.company_name}</p>
                    </div>
                    <button onClick={() => setSelectedVideo(null)} className="text-slate-400 text-sm px-3 py-1 bg-slate-800 rounded-lg">
                      {t('收起', 'Close')}
                    </button>
                  </div>
                  <video src={selectedVideo.video_url} controls className="w-full rounded-xl mb-4 max-h-48 bg-black object-contain" />
                  <div className="flex flex-wrap gap-2 text-sm text-slate-300 mb-3">
                    {selectedVideo.location && <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-500" />{selectedVideo.location}</span>}
                  </div>
                  {selectedVideo.description && <p className="text-slate-300 text-sm leading-relaxed">{selectedVideo.description}</p>}
                  {selectedVideo.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedVideo.tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600 text-xs mt-4">{t('發布於', 'Posted')} {fmtDate(selectedVideo.created_at)}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-components
const TopBar = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-slate-800">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
      <ArrowLeft size={22} />
    </button>
    <h1 className="text-white font-bold text-base">{title}</h1>
  </div>
);

const ModeBtn = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
      active ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <Icon size={15} />
    {label}
  </button>
);

const StatItem = ({ count, label }: { count: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-white font-bold text-xl">{count}</span>
    <span className="text-slate-400 text-xs mt-0.5">{label}</span>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
      <Icon className="w-8 h-8 text-slate-600" />
    </div>
    <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">{text}</p>
  </div>
);

export default ProfilePage;
