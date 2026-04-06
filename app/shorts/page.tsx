'use client';

import React, { useState, useEffect } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import ProfileModal from '@/components/shorts/ProfileModal';
import { JobData } from '@/types';
import {
  Home, User, Bookmark, X, AlertCircle, Loader2, CheckCircle,
  LogIn, LogOut, Building2, ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { FALLBACK_VIDEOS } from './fallback-videos';

const getLogoUrl = (companyName: string): string =>
  `https://www.google.com/s2/favicons?domain=${companyName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;

export default function JobbeagleShortsPage() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth
  const [user, setUser] = useState<any>(null);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  // UI state
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [activeTab, setActiveTab] = useState<'foryou' | 'following' | 'saved'>('foryou');
  const [navTab, setNavTab] = useState<'home' | 'profile'>('home');

  // Follow / Save (persisted via Supabase, also tracked locally)
  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedJobsData, setSavedJobsData] = useState<JobData[]>([]);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    loadVideos();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) loadUserData(user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u.id);
      else {
        setFollowedCompanies(new Set());
        setSavedJobIds(new Set());
        setSavedJobsData([]);
      }
    });
    return () => subscription.unsubscribe();
  };

  const loadUserData = async (userId: string) => {
    const supabase = createClient();
    const [followsRes, savedRes, companyRes] = await Promise.all([
      supabase.from('followed_companies').select('company_name').eq('user_id', userId),
      supabase.from('saved_jobs').select('job_id, job_data').eq('user_id', userId),
      supabase.from('company_profiles').select('id').eq('user_id', userId).maybeSingle(),
    ]);
    if (followsRes.data) {
      setFollowedCompanies(new Set(followsRes.data.map((r: any) => r.company_name)));
    }
    if (savedRes.data) {
      setSavedJobIds(new Set(savedRes.data.map((r: any) => r.job_id)));
      setSavedJobsData(savedRes.data.map((r: any) => r.job_data as JobData));
    }
    setHasCompanyProfile(!!companyRes.data);
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('shorts_videos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (err || !data || data.length === 0) {
        setJobs(FALLBACK_VIDEOS);
        return;
      }

      setJobs(data.map((v) => ({
        id: v.id,
        companyName: v.company_name,
        jobTitle: v.job_title,
        location: v.location || '',
        salary: v.salary || '',
        description: v.description,
        videoUrl: v.video_url,
        tags: v.tags || [],
        logoUrl: v.logo_url || getLogoUrl(v.company_name),
        contactEmail: v.contact_email || undefined,
        applyUrl: v.apply_url || undefined,
      })));
    } catch {
      setJobs(FALLBACK_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (companyName: string, followed: boolean) => {
    setFollowedCompanies(prev => {
      const next = new Set(prev);
      if (followed) next.add(companyName);
      else next.delete(companyName);
      return next;
    });
  };

  const handleSaveChange = (jobId: string, saved: boolean) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (saved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
    if (!saved) {
      setSavedJobsData(prev => prev.filter(j => j.id !== jobId));
    }
  };

  const displayedJobs =
    activeTab === 'following' ? jobs.filter(j => followedCompanies.has(j.companyName)) :
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
    <div className="h-[100dvh] w-full bg-black flex flex-col relative overflow-hidden font-sans">

      {/* ── PROFILE PAGE (full-screen, hides everything else) ─────────────── */}
      {navTab === 'profile' && (
        <>
          <div className="flex-1 overflow-hidden">
            <ProfileModal
              onClose={() => handleNavTab('home')}
              language={language}
            />
          </div>
          <BottomNav navTab={navTab} onNav={handleNavTab} t={t} />
        </>
      )}

      {/* ── FEED + SAVED views ────────────────────────────────────────────── */}
      {navTab !== 'profile' && (
        <>
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
      <div className="flex-1 h-full w-full relative">
        {activeTab === 'saved' && savedJobsData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-white/60">
            <Bookmark className="w-12 h-12 opacity-40" />
            <p className="text-lg font-semibold">{t('尚無儲存職缺', 'No saved jobs')}</p>
            <p className="text-sm">{t('點擊影片右側書籤圖示即可儲存', 'Tap the bookmark icon on any video to save')}</p>
          </div>
        ) : activeTab === 'following' && displayedJobs.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center flex-col gap-4 text-white/60">
            <Building2 className="w-12 h-12 opacity-40" />
            <p className="text-lg font-semibold">{t('尚未追蹤企業', 'Not following any companies')}</p>
            <p className="text-sm">{t('點擊影片右側追蹤按鈕開始追蹤', 'Tap follow on any video to start')}</p>
          </div>
        ) : (
          <VideoFeed
            jobs={displayedJobs}
            followedCompanies={followedCompanies}
            savedJobIds={savedJobIds}
            onFollowChange={handleFollowChange}
            onSaveChange={handleSaveChange}
            language={language}
          />
        )}
      </div>

      {/* Top Bar (Overlay) */}
      <div className="absolute top-0 left-0 w-full p-4 z-30 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="text-white font-black text-2xl tracking-tighter drop-shadow-lg">
            <span className="text-white">Job</span><span className="text-blue-500">beagle</span>
            <span className="text-white/80 text-lg font-normal ml-1">Shorts</span>
          </h1>
          <div className="flex gap-4 text-white/80 font-semibold text-sm mt-2">
            <button
              onClick={() => { setActiveTab('foryou'); setNavTab('home'); }}
              className={`pb-1 transition-colors ${activeTab === 'foryou' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
            >
              {t('為您推薦', 'For You')}
            </button>
            <button
              onClick={() => { setActiveTab('following'); setNavTab('home'); }}
              className={`pb-1 transition-colors ${activeTab === 'following' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
            >
              {t('追蹤中', 'Following')} {followedCompanies.size > 0 && `(${followedCompanies.size})`}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-1 transition-colors ${activeTab === 'saved' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
            >
              {t('已儲存', 'Saved')} {savedJobIds.size > 0 && `(${savedJobIds.size})`}
            </button>
          </div>
        </div>

        {/* Right: language switcher + auth */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-1">
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${language === 'zh' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/60 hover:text-white/80'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/60 hover:text-white/80'}`}
            >
              EN
            </button>
          </div>

          {user ? (
            <button
              onClick={async () => { const s = createClient(); await s.auth.signOut(); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-black/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('登出', 'Logout')}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-black/60 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('登入', 'Login')}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showLoginMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLoginMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <button
                      onClick={async () => {
                        const s = createClient();
                        await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=employer` } });
                        setShowLoginMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-white text-sm text-left"
                    >
                      <Building2 className="w-4 h-4" />
                      {t('企業登入', 'Employer Login')}
                    </button>
                    <div className="border-t border-slate-700">
                      <button
                        onClick={async () => {
                          const s = createClient();
                          await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts` } });
                          setShowLoginMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-white text-sm"
                      >
                        <User className="w-4 h-4" />
                        {t('人才登入', 'Talent Login')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav navTab={navTab} onNav={handleNavTab} t={t} hasCompanyProfile={hasCompanyProfile} />
        </>
      )}
    </div>
  );
}

// Bottom nav — 首頁 | 個人 / 企業
function BottomNav({
  navTab, onNav, t, hasCompanyProfile,
}: {
  navTab: 'home' | 'profile';
  onNav: (tab: 'home' | 'profile') => void;
  t: (zh: string, en: string) => string;
  hasCompanyProfile: boolean;
}) {
  return (
    <div className="h-16 bg-black border-t border-gray-900 flex flex-row items-center justify-around z-40 text-gray-400 pb-2 flex-shrink-0">
      <button
        onClick={() => onNav('home')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${navTab === 'home' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Home size={24} strokeWidth={navTab === 'home' ? 3 : 2} />
        <span className="text-[10px] font-medium">{t('首頁', 'Home')}</span>
      </button>

      <button
        onClick={() => onNav('profile')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${navTab === 'profile' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
      >
        {hasCompanyProfile
          ? <Building2 size={24} strokeWidth={navTab === 'profile' ? 3 : 2} />
          : <User size={24} strokeWidth={navTab === 'profile' ? 3 : 2} />
        }
        <span className="text-[10px] font-medium">
          {hasCompanyProfile ? t('企業', 'Company') : t('個人', 'Profile')}
        </span>
      </button>
    </div>
  );
}
