'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import ProfileModal from '@/components/shorts/ProfileModal';
import { JobData } from '@/types';
import {
  Home, User, Bookmark, X, AlertCircle, Loader2, CheckCircle,
  LogIn, LogOut, Building2, ChevronDown, UserCircle2,
  Heart, Video, Upload, Settings, ChevronRight, Users,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { FALLBACK_VIDEOS } from './fallback-videos';
import { setStoredShortsViewRole } from '@/lib/shorts-view-role';
import { useLanguage, AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const getLogoUrl = (companyName: string): string =>
  `https://www.google.com/s2/favicons?domain=${companyName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;

const PAGE_SIZE = 10;

export default function JobbeagleShortsPage() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth
  const [user, setUser] = useState<any>(null);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Language from global context
  const { language: appLang } = useLanguage();
  const SI: Record<string, Record<AppLanguage, string>> = {
    forYou:      { en: 'For You',    'zh-TW': '為您推薦', 'zh-CN': '为你推荐', es: 'Para Ti',           hi: 'आपके लिए',     ar: 'لك' },
    following:   { en: 'Following',  'zh-TW': '追蹤中',   'zh-CN': '关注中',   es: 'Siguiendo',         hi: 'अनुसरण',       ar: 'المتابَعون' },
    saved:       { en: 'Saved',      'zh-TW': '已儲存',   'zh-CN': '已收藏',   es: 'Guardado',          hi: 'सहेजा गया',    ar: 'محفوظ' },
    me:          { en: 'Me',         'zh-TW': '我',       'zh-CN': '我',       es: 'Yo',                hi: 'मैं',           ar: 'أنا' },
    logout:      { en: 'Logout',     'zh-TW': '登出',     'zh-CN': '退出登录', es: 'Cerrar Sesión',     hi: 'लॉग आउट',      ar: 'تسجيل الخروج' },
    login:       { en: 'Login',      'zh-TW': '登入',     'zh-CN': '登录',     es: 'Iniciar Sesión',    hi: 'लॉग इन',       ar: 'تسجيل الدخول' },
    empLogin:    { en: 'Employer Login', 'zh-TW': '企業登入', 'zh-CN': '企业登录', es: 'Acceso Empresa',  hi: 'नियोक्ता लॉगिन', ar: 'دخول صاحب العمل' },
    talLogin:    { en: 'Job Seeker Login', 'zh-TW': '人才登入', 'zh-CN': '人才登录', es: 'Acceso Candidato', hi: 'नौकरी खोजने वाले', ar: 'دخول الباحث عن عمل' },
    home:        { en: 'Home',       'zh-TW': '首頁',     'zh-CN': '首页',     es: 'Inicio',            hi: 'होम',           ar: 'الرئيسية' },
    company:     { en: 'Company',    'zh-TW': '企業',     'zh-CN': '企业',     es: 'Empresa',           hi: 'कंपनी',         ar: 'الشركة' },
    profile:     { en: 'Profile',    'zh-TW': '個人',     'zh-CN': '个人',     es: 'Perfil',            hi: 'प्रोफ़ाइल',    ar: 'الملف' },
    noSaved:     { en: 'No saved jobs', 'zh-TW': '尚無儲存職缺', 'zh-CN': '暂无收藏职位', es: 'Sin trabajos guardados', hi: 'कोई सहेजी गई नौकरी नहीं', ar: 'لا توجد وظائف محفوظة' },
    tapBookmark: { en: 'Tap the bookmark icon on any video to save', 'zh-TW': '點擊影片右側書籤圖示即可儲存', 'zh-CN': '点击视频右侧书签图标即可收藏', es: 'Toca el ícono de marcador en cualquier video para guardar', hi: 'सहेजने के लिए किसी भी वीडियो पर बुकमार्क आइकन टैप करें', ar: 'اضغط أيقونة الحفظ على أي فيديو لحفظه' },
    noFollowing: { en: 'Not following any companies', 'zh-TW': '尚未追蹤企業', 'zh-CN': '暂未关注企业', es: 'Sin empresas seguidas', hi: 'किसी भी कंपनी का अनुसरण नहीं', ar: 'لا تتابع أي شركات' },
    tapFollow:   { en: 'Tap follow on any video to start', 'zh-TW': '點擊影片右側追蹤按鈕開始追蹤', 'zh-CN': '点击视频右侧关注按钮开始关注', es: 'Toca seguir en cualquier video para comenzar', hi: 'शुरू करने के लिए किसी भी वीडियो पर फॉलो टैप करें', ar: 'اضغط متابعة على أي فيديو للبدء' },
    dashboard:   { en: 'Company Dashboard', 'zh-TW': '企業後台', 'zh-CN': '企业后台', es: 'Panel Empresa', hi: 'कंपनी डैशबोर्ड', ar: 'لوحة الشركة' },
    uploadVideo: { en: 'Upload Job Video', 'zh-TW': '上傳職缺影片', 'zh-CN': '上传职位视频', es: 'Subir Video', hi: 'वीडियो अपलोड करें', ar: 'رفع فيديو' },
    myCompany:   { en: 'My Company Page', 'zh-TW': '我的企業頁面', 'zh-CN': '我的企业页面', es: 'Mi Empresa', hi: 'मेरी कंपनी', ar: 'صفحة شركتي' },
    savedJobs:   { en: 'Saved Jobs', 'zh-TW': '已儲存職缺', 'zh-CN': '已收藏职位', es: 'Empleos Guardados', hi: 'सहेजी नौकरियां', ar: 'الوظائف المحفوظة' },
    loginFirst:  { en: 'Sign in to follow companies', 'zh-TW': '登入後即可追蹤企業', 'zh-CN': '登录后可关注企业', es: 'Inicia sesión para seguir empresas', hi: 'कंपनियों को फॉलो करने के लिए लॉग इन करें', ar: 'سجل الدخول لمتابعة الشركات' },
  };
  const t = (key: string): string => (SI[key]?.[appLang] ?? SI[key]?.['en'] ?? key);

  // UI state
  const [activeTab, setActiveTab] = useState<'foryou' | 'following' | 'saved'>('foryou');
  const [navTab, setNavTab] = useState<'home' | 'profile'>('home');

  // Follow / Save
  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedJobsData, setSavedJobsData] = useState<JobData[]>([]);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  // Following feed (loaded directly from DB, not filtered from For You)
  const [followingVideos, setFollowingVideos] = useState<JobData[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  useEffect(() => {
    loadVideos(null);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadUserData(user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      else {
        setFollowedCompanies(new Set());
        setSavedJobIds(new Set());
        setSavedJobsData([]);
        setHasCompanyProfile(false);
        setCompanyName('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /** OAuth redirect params */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let changed = false;
    const v = params.get('shorts_view');
    if (v === 'company' || v === 'personal') {
      setStoredShortsViewRole(v);
      params.delete('shorts_view');
      changed = true;
    }
    const openProfile = params.get('open_profile');
    if (openProfile === '1' || openProfile === 'true') {
      setNavTab('profile');
      params.delete('open_profile');
      changed = true;
    }
    if (changed) {
      const q = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${q ? `?${q}` : ''}`);
    }
  }, []);

  const loadUserData = async (userId: string) => {
    const supabase = createClient();
    const [followsRes, savedRes, companyRes] = await Promise.all([
      supabase.from('followed_companies').select('company_name').eq('user_id', userId),
      supabase.from('saved_jobs').select('job_id, job_data').eq('user_id', userId),
      supabase.from('company_profiles').select('id, company_name').eq('user_id', userId).maybeSingle(),
    ]);
    if (followsRes.data) {
      setFollowedCompanies(new Set(followsRes.data.map((r: any) => r.company_name)));
    }
    if (savedRes.data) {
      setSavedJobIds(new Set(savedRes.data.map((r: any) => r.job_id)));
      setSavedJobsData(savedRes.data.map((r: any) => r.job_data as JobData));
    }
    if (companyRes.data) {
      setHasCompanyProfile(true);
      setCompanyName(companyRes.data.company_name || '');
    }
  };

  const mapVideo = (v: any): JobData => ({
    id: v.id,
    companyName: v.company_name,
    jobTitle: v.job_title,
    location: v.location || '',
    salary: v.salary || '',
    description: v.description,
    videoUrl: v.video_url,
    videoSourceType: v.video_source_type || 'upload',
    tags: v.tags || [],
    logoUrl: v.logo_url || getLogoUrl(v.company_name),
    contactEmail: v.contact_email || undefined,
    applyUrl: v.apply_url || undefined,
  });

  const loadVideos = async (cursor: string | null) => {
    try {
      if (!cursor) setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from('shorts_videos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) query = query.lt('created_at', cursor);

      const { data, error: err } = await query;

      if (!cursor && (err || !data || data.length === 0)) {
        setJobs(FALLBACK_VIDEOS);
        setHasMore(false);
        return;
      }
      if (!data || data.length === 0) { setHasMore(false); return; }

      const mapped = data.map(mapVideo);
      if (!cursor) setJobs(mapped);
      else setJobs(prev => [...prev, ...mapped]);

      setHasMore(data.length === PAGE_SIZE);
      lastCursorRef.current = data[data.length - 1].created_at;
    } catch {
      if (!cursor) setJobs(FALLBACK_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  // Load Following videos directly from DB (not just filtered from For You)
  const loadFollowingVideos = useCallback(async () => {
    if (!user) return;
    if (followedCompanies.size === 0) { setFollowingVideos([]); return; }
    setLoadingFollowing(true);
    try {
      const supabase = createClient();
      const names = Array.from(followedCompanies);
      const { data } = await supabase
        .from('shorts_videos')
        .select('*')
        .in('company_name', names)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (data) setFollowingVideos(data.map(mapVideo));
    } catch { /* silent */ } finally {
      setLoadingFollowing(false);
    }
  }, [user, followedCompanies]);

  useEffect(() => {
    if (activeTab === 'following') loadFollowingVideos();
  }, [activeTab, loadFollowingVideos]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || !lastCursorRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    loadVideos(lastCursorRef.current).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, [hasMore]);

  const handleFollowChange = (name: string, followed: boolean) => {
    setFollowedCompanies(prev => {
      const next = new Set(prev);
      if (followed) next.add(name); else next.delete(name);
      return next;
    });
    // Refresh following feed
    if (activeTab === 'following') setTimeout(loadFollowingVideos, 300);
  };

  const handleSaveChange = (jobId: string, saved: boolean, jobData?: JobData) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (saved) next.add(jobId); else next.delete(jobId);
      return next;
    });
    if (saved && jobData) setSavedJobsData(prev => prev.some(j => j.id === jobId) ? prev : [...prev, jobData]);
    else if (!saved) setSavedJobsData(prev => prev.filter(j => j.id !== jobId));
  };

  const displayedJobs =
    activeTab === 'following' ? followingVideos :
    activeTab === 'saved' ? savedJobsData :
    jobs;

  const handleNavTab = (tab: 'home' | 'profile') => {
    setNavTab(tab);
    if (tab === 'home') setActiveTab('foryou');
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col overflow-hidden font-sans">

      {/* ── PROFILE PAGE ──────────────────────────────────────────── */}
      {navTab === 'profile' && (
        <>
          <div className="flex-1 overflow-hidden">
            <ProfileModal onClose={() => handleNavTab('home')} language={appLang} />
          </div>
          <BottomNav
            activeTab={activeTab} navTab={navTab} onNav={handleNavTab}
            onTabChange={setActiveTab} t={t}
            followCount={followedCompanies.size} savedCount={savedJobIds.size}
          />
        </>
      )}

      {/* ── FEED + SAVED + FOLLOWING views ────────────────────────── */}
      {navTab !== 'profile' && (
        <>
          {/* ── Top Header ───────────────────────────────────────── */}
          <div className="w-full flex-shrink-0 px-4 pt-3 pb-2.5 md:px-6 md:pt-4 md:pb-3 z-30 flex justify-between items-start gap-4 bg-black/90 backdrop-blur-md border-b border-white/8">
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-black tracking-tight drop-shadow-lg leading-none">
                <span className="text-3xl md:text-4xl lg:text-5xl">
                  <span className="text-white">Job</span><span className="text-blue-500">beagle</span>
                </span>
                <span className="text-white/90 text-xl md:text-2xl lg:text-3xl font-semibold ml-1.5 md:ml-2">Shorts</span>
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/90 font-semibold text-base md:text-lg mt-2.5 md:mt-3">
                <button
                  onClick={() => { setActiveTab('foryou'); setNavTab('home'); }}
                  className={`pb-1.5 transition-colors ${activeTab === 'foryou' && navTab === 'home' ? 'border-b-[3px] border-white opacity-100' : 'opacity-60 hover:opacity-90'}`}
                >
                  {t('forYou')}
                </button>
                <button
                  onClick={() => { setActiveTab('following'); setNavTab('home'); }}
                  className={`pb-1.5 transition-colors ${activeTab === 'following' ? 'border-b-[3px] border-white opacity-100' : 'opacity-60 hover:opacity-90'}`}
                >
                  {t('following')} {followedCompanies.size > 0 && `(${followedCompanies.size})`}
                </button>
                <button
                  onClick={() => { setActiveTab('saved'); setNavTab('home'); }}
                  className={`pb-1.5 transition-colors ${activeTab === 'saved' ? 'border-b-[3px] border-white opacity-100' : 'opacity-60 hover:opacity-90'}`}
                >
                  {t('saved')} {savedJobIds.size > 0 && `(${savedJobIds.size})`}
                </button>
              </div>
            </div>

            {/* Right: language + avatar/login */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 pt-1">
              <LanguageSwitcher variant="light" />

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full ring-2 ring-white/25 hover:ring-white/60 transition-all overflow-hidden bg-slate-800 shrink-0"
                    aria-label="Profile menu"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                      </span>
                    )}
                    {hasCompanyProfile && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                        <Building2 size={7} className="text-white" />
                      </span>
                    )}
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 w-60 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                        {/* User info */}
                        <div className="px-4 py-3.5 border-b border-slate-700/60 flex items-center gap-3">
                          {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                              <UserCircle2 size={22} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-semibold truncate">{user.user_metadata?.full_name || 'User'}</p>
                            <p className="text-slate-400 text-xs truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Employer section */}
                        {hasCompanyProfile && (
                          <div className="py-1.5 border-b border-slate-700/60">
                            <p className="px-4 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Employer</p>
                            <Link
                              href="/employer/dashboard"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-slate-200 text-sm"
                            >
                              <Building2 size={16} className="text-blue-400 shrink-0" />
                              {t('dashboard')}
                            </Link>
                            <Link
                              href="/shorts/upload"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-slate-200 text-sm"
                            >
                              <Upload size={16} className="text-violet-400 shrink-0" />
                              {t('uploadVideo')}
                            </Link>
                            {companyName && (
                              <Link
                                href={`/shorts/company/${encodeURIComponent(companyName)}`}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-slate-200 text-sm"
                              >
                                <Video size={16} className="text-cyan-400 shrink-0" />
                                {t('myCompany')}
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Talent section */}
                        <div className="py-1.5 border-b border-slate-700/60">
                          <p className="px-4 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">My Activity</p>
                          <button
                            onClick={() => { setShowUserMenu(false); setActiveTab('saved'); setNavTab('home'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-slate-200 text-sm text-left"
                          >
                            <Bookmark size={16} className="text-amber-400 shrink-0" />
                            {t('savedJobs')} {savedJobIds.size > 0 && <span className="ml-auto text-xs text-slate-500">{savedJobIds.size}</span>}
                          </button>
                          <button
                            onClick={() => { setShowUserMenu(false); setNavTab('profile'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-slate-200 text-sm text-left"
                          >
                            <User size={16} className="text-emerald-400 shrink-0" />
                            {t('profile')}
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="py-1.5">
                          <button
                            onClick={async () => { setShowUserMenu(false); const s = createClient(); await s.auth.signOut(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/30 transition-colors text-red-400 text-sm text-left"
                          >
                            <LogOut size={16} className="shrink-0" />
                            {t('logout')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowLoginMenu(!showLoginMenu)}
                    className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-xl text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    {t('login')}
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  </button>
                  {showLoginMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLoginMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <button
                          onClick={async () => {
                            const s = createClient();
                            await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=employer` } });
                            setShowLoginMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-white text-sm text-left"
                        >
                          <Building2 className="w-4 h-4 text-blue-400" />
                          {t('empLogin')}
                        </button>
                        <div className="border-t border-slate-700">
                          <button
                            onClick={async () => {
                              const s = createClient();
                              await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=talent` } });
                              setShowLoginMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-white text-sm text-left"
                          >
                            <User className="w-4 h-4 text-emerald-400" />
                            {t('talLogin')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Toast */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
              <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[90vw]">
                <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                <p className="text-red-100 text-sm flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={18} /></button>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {success && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
              <div className="bg-green-900/90 backdrop-blur-md border border-green-500/50 rounded-lg p-4 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[90vw]">
                <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                <p className="text-green-100 text-sm flex-1">{success}</p>
                <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-300"><X size={18} /></button>
              </div>
            </div>
          )}

          {/* Main video feed */}
          <div className="flex-1 min-h-0 w-full relative">
            {activeTab === 'saved' && savedJobsData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-white/60">
                <Bookmark className="w-12 h-12 opacity-40" />
                <p className="text-lg font-semibold">{t('noSaved')}</p>
                <p className="text-sm text-center max-w-xs">{t('tapBookmark')}</p>
              </div>
            ) : activeTab === 'following' && !user ? (
              <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-white/60 px-6">
                <Users className="w-14 h-14 opacity-30" />
                <p className="text-lg font-semibold text-center">{t('loginFirst')}</p>
                <button
                  onClick={() => setShowLoginMenu(true)}
                  className="mt-2 px-6 py-3 bg-white/10 border border-white/25 rounded-xl text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  {t('login')}
                </button>
              </div>
            ) : activeTab === 'following' && followedCompanies.size === 0 ? (
              <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-white/60">
                <Building2 className="w-12 h-12 opacity-40" />
                <p className="text-lg font-semibold">{t('noFollowing')}</p>
                <p className="text-sm text-center max-w-xs">{t('tapFollow')}</p>
              </div>
            ) : activeTab === 'following' && loadingFollowing ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : (
              <VideoFeed
                jobs={displayedJobs}
                followedCompanies={followedCompanies}
                savedJobIds={savedJobIds}
                onFollowChange={handleFollowChange}
                onSaveChange={handleSaveChange}
                language={appLang}
                onLoadMore={activeTab === 'foryou' ? handleLoadMore : undefined}
                hasMore={activeTab === 'foryou' ? hasMore : false}
                loadingMore={loadingMore}
              />
            )}
          </div>

          {/* Bottom nav */}
          <BottomNav
            activeTab={activeTab} navTab={navTab} onNav={handleNavTab}
            onTabChange={(tab) => { setActiveTab(tab); setNavTab('home'); }}
            t={t}
            followCount={followedCompanies.size}
            savedCount={savedJobIds.size}
          />
        </>
      )}
    </div>
  );
}

// ── Bottom Nav: Home | Following | Saved | Me ─────────────────────────────────
function BottomNav({
  activeTab, navTab, onNav, onTabChange, t, followCount, savedCount,
}: {
  activeTab: 'foryou' | 'following' | 'saved';
  navTab: 'home' | 'profile';
  onNav: (tab: 'home' | 'profile') => void;
  onTabChange: (tab: 'foryou' | 'following' | 'saved') => void;
  t: (k: string) => string;
  followCount: number;
  savedCount: number;
}) {
  const tabs = [
    { id: 'foryou' as const, icon: Home, label: t('home'), isActive: activeTab === 'foryou' && navTab === 'home' },
    { id: 'following' as const, icon: Users, label: t('following'), badge: followCount, isActive: activeTab === 'following' && navTab === 'home' },
    { id: 'saved' as const, icon: Bookmark, label: t('saved'), badge: savedCount, isActive: activeTab === 'saved' && navTab === 'home' },
  ];
  return (
    <div className="h-[4.25rem] md:h-20 bg-black/95 border-t border-gray-800/80 flex flex-row items-center justify-around z-40 flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ id, icon: Icon, label, badge, isActive }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 min-w-[4rem] transition-colors relative ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="relative">
            <Icon size={26} strokeWidth={isActive ? 2.75 : 2} className="md:w-7 md:h-7" />
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <span className="text-[11px] md:text-xs font-semibold leading-none">{label}</span>
        </button>
      ))}
      {/* Me tab */}
      <button
        onClick={() => onNav('profile')}
        className={`flex flex-col items-center gap-1 px-4 py-1.5 min-w-[4rem] transition-colors ${navTab === 'profile' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <User size={26} strokeWidth={navTab === 'profile' ? 2.75 : 2} className="md:w-7 md:h-7" />
        <span className="text-[11px] md:text-xs font-semibold leading-none">{t('me')}</span>
      </button>
    </div>
  );
}
