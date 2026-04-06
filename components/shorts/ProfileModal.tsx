'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Bookmark, Building2, LogIn, Loader2,
  ExternalLink, Trash2, Plus, Play, User, ChevronRight,
  MapPin, Heart, Edit2, Check, X, Globe, Mail, Eye, EyeOff,
  BarChart2, Upload,
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
interface CompanyProfile {
  id?: string; user_id?: string;
  company_name: string; logo_url: string | null;
  description: string | null; website: string | null; contact_email: string | null;
}
interface CompanyVideo {
  id: string; job_title: string; company_name: string; location: string;
  salary: string; description: string; video_url: string; created_at: string;
  logo_url: string | null; tags: string[]; is_published: boolean;
}
interface CompanyStats { videoCount: number; followerCount: number; totalLikes: number; }

const ProfilePage: React.FC<ProfileModalProps> = ({ onClose, language = 'zh' }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ProfileMode>('personal');
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);

  // Personal
  const [personalTab, setPersonalTab] = useState<PersonalTab>('resumes');
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);

  // Company
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [companyVideos, setCompanyVideos] = useState<CompanyVideo[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats>({ videoCount: 0, followerCount: 0, totalLikes: 0 });
  const [selectedVideo, setSelectedVideo] = useState<CompanyVideo | null>(null);

  // Company edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', description: '', website: '', contact_email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Per-video like counts
  const [videoLikes, setVideoLikes] = useState<Record<string, number>>({});
  const [togglingVideo, setTogglingVideo] = useState<string | null>(null);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await Promise.all([loadPersonalData(user.id), loadCompanyData(user.id)]);
      setLoading(false);
    };
    init();
  }, []);

  const loadPersonalData = async (userId: string) => {
    const supabase = createClient();
    const [rr, sr, fr] = await Promise.all([
      supabase.from('resume_history').select('id, file_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('saved_jobs').select('id, job_id, job_data, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('followed_companies').select('id, company_name, logo_url, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (rr.data) setResumes(rr.data);
    if (sr.data) setSavedJobs(sr.data as SavedJob[]);
    if (fr.data) setFollowedCompanies(fr.data);
  };

  const loadCompanyData = async (userId: string) => {
    const supabase = createClient();
    const [profileRes, videosRes] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('shorts_videos').select('*').eq('company_user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (profileRes.data) {
      setCompanyProfile(profileRes.data);
      setHasCompanyProfile(true);
      setEditForm({
        company_name: profileRes.data.company_name || '',
        description: profileRes.data.description || '',
        website: profileRes.data.website || '',
        contact_email: profileRes.data.contact_email || '',
      });

      // Load stats
      const companyName = profileRes.data.company_name;
      const [followersRes] = await Promise.all([
        supabase.from('followed_companies').select('*', { count: 'exact', head: true }).eq('company_name', companyName),
      ]);
      const followerCount = followersRes.count || 0;

      const videos = (videosRes.data || []) as CompanyVideo[];
      setCompanyVideos(videos);

      // Load likes per video
      if (videos.length > 0) {
        const ids = videos.map(v => v.id);
        const likesMap: Record<string, number> = {};
        await Promise.all(ids.map(async (id) => {
          const { count } = await supabase.from('video_likes').select('*', { count: 'exact', head: true }).eq('video_id', id);
          likesMap[id] = count || 0;
        }));
        setVideoLikes(likesMap);
        const totalLikes = Object.values(likesMap).reduce((a, b) => a + b, 0);
        setCompanyStats({ videoCount: videos.length, followerCount, totalLikes });
      } else {
        setCompanyStats({ videoCount: 0, followerCount, totalLikes: 0 });
      }
    } else {
      if (videosRes.data) setCompanyVideos(videosRes.data as CompanyVideo[]);
    }
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

  const handleDeleteResume = async (resumeId: string) => {
    const supabase = createClient();
    await supabase.from('resume_history').delete().eq('id', resumeId);
    setResumes(prev => prev.filter(r => r.id !== resumeId));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const supabase = createClient();
    await supabase.from('company_profiles').upsert({
      user_id: user.id,
      company_name: editForm.company_name,
      description: editForm.description || null,
      website: editForm.website || null,
      contact_email: editForm.contact_email || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setCompanyProfile(prev => prev ? { ...prev, ...editForm } : null);
    setIsEditingProfile(false);
    setSavingProfile(false);
  };

  const handleTogglePublish = async (video: CompanyVideo) => {
    setTogglingVideo(video.id);
    const supabase = createClient();
    const newState = !video.is_published;
    await supabase.from('shorts_videos').update({ is_published: newState }).eq('id', video.id);
    setCompanyVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_published: newState } : v));
    if (selectedVideo?.id === video.id) setSelectedVideo(prev => prev ? { ...prev, is_published: newState } : null);
    setTogglingVideo(null);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(t('確定要刪除這個職缺影片嗎？此操作無法復原。', 'Delete this job video? This cannot be undone.'))) return;
    const supabase = createClient();
    await supabase.from('shorts_videos').delete().eq('id', videoId);
    setCompanyVideos(prev => prev.filter(v => v.id !== videoId));
    setSelectedVideo(null);
    setCompanyStats(prev => ({ ...prev, videoCount: prev.videoCount - 1 }));
  };

  const handleLogin = async (type: 'personal' | 'employer') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=${type === 'employer' ? 'employer' : 'talent'}` },
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
            <h2 className="text-white text-xl font-bold mb-2">{t('登入以使用個人功能', 'Login to continue')}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{t('儲存職缺、追蹤企業、管理履歷\n企業可上傳職缺影片', 'Save jobs, follow companies,\nupload job videos')}</p>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <LoginBtn onClick={() => handleLogin('personal')} icon={User} title={t('人才登入', 'Talent Login')} sub={t('儲存職缺・追蹤企業・管理履歷', 'Save jobs & follow companies')} color="blue" />
            <LoginBtn onClick={() => handleLogin('employer')} icon={Building2} title={t('企業登入', 'Employer Login')} sub={t('發布職缺影片・管理申請', 'Post jobs & manage applicants')} color="emerald" />
          </div>
        </div>
      </div>
    );
  }

  const avatarLetter = (user.user_metadata?.full_name || user.email || '?')[0].toUpperCase();
  const publishedCount = companyVideos.filter(v => v.is_published).length;
  const draftCount = companyVideos.filter(v => !v.is_published).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
      <TopBar
        onBack={onClose}
        title={mode === 'company' ? t('企業儀表板', 'Company Dashboard') : t('個人頁面', 'Profile')}
        right={hasCompanyProfile ? (
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <ModePill active={mode === 'personal'} onClick={() => setMode('personal')} icon={User} label={t('個人', 'Me')} />
            <ModePill active={mode === 'company'} onClick={() => setMode('company')} icon={Building2} label={t('企業', 'Company')} />
          </div>
        ) : undefined}
      />

      {/* ── PERSONAL MODE ────────────────────────────────────────────────── */}
      {mode === 'personal' && (
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-slate-800">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-3 overflow-hidden">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : avatarLetter}
            </div>
            <h2 className="text-white font-bold text-xl">{user.user_metadata?.full_name || t('使用者', 'User')}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            <div className="flex gap-10 mt-5">
              <StatPill count={savedJobs.length} label={t('已儲存', 'Saved')} />
              <StatPill count={followedCompanies.length} label={t('追蹤', 'Following')} />
              <StatPill count={resumes.length} label={t('履歷', 'Resumes')} />
            </div>
            {!hasCompanyProfile && (
              <a href="/shorts/upload" className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-900/40 border border-emerald-600/50 rounded-full text-emerald-400 text-sm font-medium hover:bg-emerald-900/70 transition-colors">
                <Building2 size={14} />
                {t('建立企業頁面，開始發布職缺', 'Create company page & post jobs')}
                <ChevronRight size={14} />
              </a>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {([
              { key: 'resumes' as PersonalTab, icon: FileText, zh: '我的履歷', en: 'Resumes' },
              { key: 'saved' as PersonalTab, icon: Bookmark, zh: '已儲存職缺', en: 'Saved Jobs' },
              { key: 'following' as PersonalTab, icon: Building2, zh: '追蹤企業', en: 'Following' },
            ]).map(({ key, icon: Icon, zh, en }) => (
              <button key={key} onClick={() => setPersonalTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-colors ${personalTab === key ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                <Icon size={15} />{t(zh, en)}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-2.5 pb-8">
            {/* Resumes */}
            {personalTab === 'resumes' && (
              resumes.length === 0
                ? <EmptyState icon={FileText} text={t('尚無履歷。在 Jobbeagle 分析時上傳即可自動儲存（最多 3 份）。', 'No resumes yet. Upload in AI Match Analysis (max 3).')} />
                : resumes.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{r.file_name}</p>
                      <p className="text-slate-500 text-xs">{fmtDate(r.created_at)}</p>
                    </div>
                    <button onClick={() => handleDeleteResume(r.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
            )}

            {/* Saved Jobs */}
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
                      {s.job_data?.location && <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10} />{s.job_data.location}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a href={`/shorts/company/${encodeURIComponent(s.job_data?.companyName || '')}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => handleUnsave(s.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
            )}

            {/* Following */}
            {personalTab === 'following' && (
              followedCompanies.length === 0
                ? <EmptyState icon={Building2} text={t('尚未追蹤企業。點擊影片右側追蹤按鈕。', 'Not following any companies yet.')} />
                : followedCompanies.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    {c.logo_url
                      ? <img src={c.logo_url} alt={c.company_name} className="w-11 h-11 rounded-full bg-white object-contain border border-slate-700 flex-shrink-0" />
                      : <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><Building2 size={18} className="text-slate-400" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{c.company_name}</p>
                      <p className="text-slate-500 text-xs">{fmtDate(c.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a href={`/shorts/company/${encodeURIComponent(c.company_name)}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => handleUnfollow(c.company_name)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ── COMPANY MODE ─────────────────────────────────────────────────── */}
      {mode === 'company' && (
        <div className="flex-1 overflow-y-auto">
          {/* Company header */}
          <div className="px-5 pt-6 pb-5 border-b border-slate-800">
            {isEditingProfile ? (
              /* ── Edit form ─────────────────── */
              <div className="space-y-3">
                <p className="text-white font-bold text-base mb-3">{t('編輯企業資料', 'Edit Company Profile')}</p>
                {([
                  { key: 'company_name', label: t('公司名稱', 'Company Name'), icon: Building2, placeholder: 'Acme Corp' },
                  { key: 'description', label: t('一句話介紹', 'Short Description'), icon: FileText, placeholder: t('讓求職者認識你們', 'Describe your company') },
                  { key: 'website', label: t('官網', 'Website'), icon: Globe, placeholder: 'https://yourcompany.com' },
                  { key: 'contact_email', label: t('聯絡信箱', 'Contact Email'), icon: Mail, placeholder: 'hr@yourcompany.com' },
                ] as const).map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-slate-400 text-xs flex items-center gap-1.5"><Icon size={12} />{label}</label>
                    <input
                      value={editForm[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 text-sm font-medium transition-colors">
                    {t('取消', 'Cancel')}
                  </button>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition-colors">
                    {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {t('儲存', 'Save')}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Company info display ──────── */
              <div>
                <div className="flex items-start gap-4 mb-4">
                  {companyProfile?.logo_url
                    ? <img src={companyProfile.logo_url} alt={companyProfile?.company_name} className="w-16 h-16 rounded-2xl bg-white object-contain border border-slate-700 shadow flex-shrink-0 p-1" />
                    : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center flex-shrink-0 shadow">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-bold text-xl truncate">{companyProfile?.company_name || t('我的企業', 'My Company')}</h2>
                      <button onClick={() => setIsEditingProfile(true)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                        <Edit2 size={13} />
                      </button>
                    </div>
                    {companyProfile?.description && <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">{companyProfile.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {companyProfile?.website && (
                        <a href={companyProfile.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors">
                          <Globe size={11} />{companyProfile.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                      {companyProfile?.contact_email && (
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <Mail size={11} />{companyProfile.contact_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <StatCard count={companyStats.videoCount} label={t('職缺影片', 'Videos')} icon={Play} color="blue" />
                  <StatCard count={companyStats.followerCount} label={t('追蹤者', 'Followers')} icon={User} color="purple" />
                  <StatCard count={companyStats.totalLikes} label={t('總愛心', 'Total Likes')} icon={Heart} color="red" />
                </div>

                {/* Upload CTA */}
                <a href="/shorts/upload"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30">
                  <Upload size={16} />
                  {t('+ 上傳新職缺影片', '+ Upload New Job Video')}
                </a>
              </div>
            )}
          </div>

          {/* Videos section */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">
              {t('已發布', 'Published')} <span className="text-white font-bold">{publishedCount}</span>
              {draftCount > 0 && <span className="text-slate-500 ml-2">{t('草稿', 'Drafts')} {draftCount}</span>}
            </span>
          </div>

          {companyVideos.length === 0 ? (
            <div className="px-4 py-4">
              <EmptyState icon={Play} text={t('尚未上傳任何職缺影片。點擊上方按鈕開始發布。', 'No videos yet. Click the button above to get started.')} />
            </div>
          ) : (
            <div className="px-4 pb-8 space-y-3">
              {companyVideos.map(v => (
                <VideoManageCard
                  key={v.id}
                  video={v}
                  likeCount={videoLikes[v.id] || 0}
                  isSelected={selectedVideo?.id === v.id}
                  toggling={togglingVideo === v.id}
                  onSelect={() => setSelectedVideo(selectedVideo?.id === v.id ? null : v)}
                  onTogglePublish={() => handleTogglePublish(v)}
                  onDelete={() => handleDeleteVideo(v.id)}
                  t={t}
                  fmtDate={fmtDate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const TopBar = ({ onBack, title, right }: { onBack: () => void; title: string; right?: React.ReactNode }) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-safe py-3 border-b border-slate-800">
    <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
      <ArrowLeft size={22} />
    </button>
    <h1 className="text-white font-bold text-base flex-1">{title}</h1>
    {right && <div className="flex-shrink-0">{right}</div>}
  </div>
);

const ModePill = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${active ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
    <Icon size={13} />{label}
  </button>
);

const StatPill = ({ count, label }: { count: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-white font-bold text-xl">{count}</span>
    <span className="text-slate-400 text-xs mt-0.5">{label}</span>
  </div>
);

const StatCard = ({ count, label, icon: Icon, color }: { count: number; label: string; icon: React.ElementType; color: string }) => {
  const colors: Record<string, string> = { blue: 'bg-blue-900/30 text-blue-400', purple: 'bg-purple-900/30 text-purple-400', red: 'bg-red-900/30 text-red-400' };
  return (
    <div className={`rounded-2xl p-3 flex flex-col gap-1 ${colors[color] || colors.blue}`}>
      <Icon size={16} />
      <span className="text-white font-bold text-xl">{count}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
};

const LoginBtn = ({ onClick, icon: Icon, title, sub, color }: { onClick: () => void; icon: React.ElementType; title: string; sub: string; color: 'blue' | 'emerald' }) => {
  const bg = color === 'emerald' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500';
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 ${bg} rounded-2xl text-white transition-colors`}>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Icon size={20} /></div>
      <div className="text-left flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-white/70 text-xs font-normal">{sub}</p>
      </div>
      <ChevronRight size={18} className="opacity-60" />
    </button>
  );
};

interface VideoManageCardProps {
  video: CompanyVideo; likeCount: number; isSelected: boolean; toggling: boolean;
  onSelect: () => void; onTogglePublish: () => void; onDelete: () => void;
  t: (zh: string, en: string) => string; fmtDate: (d: string) => string;
}
const VideoManageCard: React.FC<VideoManageCardProps> = ({ video, likeCount, isSelected, toggling, onSelect, onTogglePublish, onDelete, t, fmtDate }) => (
  <div className={`bg-slate-900 rounded-2xl border transition-colors ${video.is_published ? 'border-slate-800' : 'border-amber-800/50'}`}>
    {/* Top: status badge + title + actions */}
    <div className="flex items-start gap-3 p-4 pb-3">
      <button onClick={onSelect}
        className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 group hover:bg-slate-700 transition-colors overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-blue-600/60 transition-colors">
          <Play size={16} fill="white" className="text-white ml-0.5" />
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">{video.job_title}</p>
            {video.location && <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10} />{video.location}</p>}
          </div>
          {!video.is_published && (
            <span className="flex-shrink-0 text-[10px] bg-amber-900/50 text-amber-400 border border-amber-700/50 rounded px-1.5 py-0.5">
              {t('草稿', 'Draft')}
            </span>
          )}
        </div>
        {/* Stats + actions */}
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-slate-400 text-xs"><Heart size={11} />{likeCount}</span>
          <span className="text-slate-600 text-xs">{fmtDate(video.created_at)}</span>
          <div className="flex gap-1.5 ml-auto">
            <button onClick={onTogglePublish} disabled={toggling}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${video.is_published ? 'bg-slate-700 hover:bg-amber-900/50 text-slate-300 hover:text-amber-300' : 'bg-emerald-900/50 hover:bg-emerald-900 text-emerald-400'}`}>
              {toggling ? <Loader2 size={11} className="animate-spin" /> : video.is_published ? <EyeOff size={11} /> : <Eye size={11} />}
              {video.is_published ? t('下架', 'Unpublish') : t('發布', 'Publish')}
            </button>
            <button onClick={onDelete}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Expanded video player */}
    {isSelected && (
      <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
        <video src={video.video_url} controls className="w-full rounded-xl bg-black max-h-52 object-contain" />
        {video.description && <p className="text-slate-300 text-sm leading-relaxed">{video.description}</p>}
        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.map((tag, i) => <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">{tag}</span>)}
          </div>
        )}
      </div>
    )}
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
