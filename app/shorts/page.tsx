'use client';

import React, { useState, useEffect } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import { JobData } from '@/types';
import { Home, User, Briefcase, MessageCircle, X, AlertCircle, Loader2, CheckCircle, LogIn, LogOut, Building2, ChevronDown, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { BeagleIcon } from '@/components/AnalysisDashboard';
import { FALLBACK_VIDEOS } from './fallback-videos';

// Helper function to generate logo URL
const getLogoUrl = (companyName: string): string => {
  // Try multiple logo APIs as fallback
  const domain = companyName.toLowerCase().replace(/\s+/g, '');
  
  // Option 1: Google Favicon API (most reliable)
  return `https://www.google.com/s2/favicons?domain=${domain}.com&sz=128`;
  
  // Option 2: If Google fails, can use:
  // return `https://logo.clearbit.com/${domain}.com`;
  // return `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;
};

// 後備影片：當資料庫沒有影片時使用（可編輯 app/shorts/fallback-videos.ts 替換成 4 支真實影片）

export default function JobbeaglePage() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [followedJobIds, setFollowedJobIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadVideos();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 從資料庫載入已發布的影片
      const { data: videosData, error: videosError } = await supabase
        .from('shorts_videos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Failed to load videos:', videosError);
        // 如果載入失敗，使用 fallback 資料
        setJobs(FALLBACK_VIDEOS);
        return;
      }

      if (videosData && videosData.length > 0) {
        // 转换数据库格式到 JobData 格式
        const convertedJobs: JobData[] = videosData.map((video) => ({
          id: video.id,
          companyName: video.company_name,
          jobTitle: video.job_title,
          location: video.location || '',
          salary: video.salary || '',
          description: video.description,
          videoUrl: video.video_url,
          tags: video.tags || [],
          logoUrl: video.logo_url || getLogoUrl(video.company_name),
          contactEmail: video.contact_email || undefined,
        }));
        setJobs(convertedJobs);
      } else {
        // 如果沒有影片，使用 fallback 資料
        setJobs(FALLBACK_VIDEOS);
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(language === 'zh' ? '載入影片失敗' : 'Failed to load videos');
      setJobs(FALLBACK_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (message: string) => {
    setError(message);
    // Auto-hide error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const handleFollowChange = (jobId: string, followed: boolean) => {
    setFollowedJobIds(prev => {
      const newSet = new Set(prev);
      if (followed) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  // Filter jobs based on active tab
  const displayedJobs = activeTab === 'following' 
    ? jobs.filter(job => followedJobIds.has(job.id))
    : jobs;

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[90vw]">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-100 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-900/90 backdrop-blur-md border border-green-500/50 rounded-lg p-4 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[90vw]">
            <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
            <p className="text-green-100 text-sm flex-1">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-300 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 h-full w-full relative">
        <VideoFeed 
          jobs={displayedJobs} 
          followedJobIds={followedJobIds}
          onFollowChange={handleFollowChange}
        />
      </div>

      {/* Top Bar (Overlay) */}
      <div className="absolute top-0 left-0 w-full p-4 z-30 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
         <div className="pointer-events-auto">
            <h1 className="text-white font-black text-2xl tracking-tighter drop-shadow-lg flex items-center gap-1">
                <span className="text-white">Job</span><span className="text-blue-600 dark:text-blue-500">beagle</span> <span className="text-white/80 text-lg font-normal">Shorts</span>
            </h1>
            <div className="flex gap-4 text-white/80 font-semibold text-sm mt-2">
                <button
                  onClick={() => setActiveTab('foryou')}
                  className={`pb-1 transition-colors ${activeTab === 'foryou' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
                >
                  {language === 'zh' ? '為您推薦' : 'For You'}
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`pb-1 transition-colors ${activeTab === 'following' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
                >
                  {language === 'zh' ? '追蹤中' : 'Following'} {followedJobIds.size > 0 && `(${followedJobIds.size})`}
                </button>
            </div>
         </div>
         {/* Right side: Language Switcher + Login Menu + Video Generator */}
         <div className="pointer-events-auto flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-1">
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  language === 'zh'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                English
              </button>
            </div>
            
            {/* Login Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-black/60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'zh' ? '登出' : 'Logout'}</span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowLoginMenu(!showLoginMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-black/60 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{language === 'zh' ? '登入' : 'Login'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showLoginMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowLoginMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                        <button
                          onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signInWithOAuth({
                              provider: 'google',
                              options: {
                                redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=employer`,
                              },
                            });
                            setShowLoginMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-white text-sm text-left"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>{language === 'zh' ? '企業登入' : 'Employer Login'}</span>
                        </button>
                        <div className="border-t border-slate-700">
                          <button
                            onClick={async () => {
                              const supabase = createClient();
                              await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                  redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts`,
                                },
                              });
                              setShowLoginMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-white text-sm"
                          >
                            <User className="w-4 h-4" />
                            <span>{language === 'zh' ? '人才登入' : 'Talent Login'}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* 上傳新影片（顯眼按鈕：含公司、職位、地點等） */}
            <a
              href="/employer/dashboard"
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400/50 text-white shadow-lg transition-colors"
              title={language === 'zh' ? '上傳影片並填寫公司、職缺、地點等' : 'Upload video and fill job info'}
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs font-bold whitespace-nowrap">{language === 'zh' ? '上傳新影片' : 'Upload'}</span>
            </a>
         </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="h-16 bg-black border-t border-gray-900 flex flex-row items-center justify-around z-40 text-gray-400 pb-2">
        <button 
            className="flex flex-col items-center gap-1 p-2 text-white"
        >
            <Home size={24} strokeWidth={3} />
            <span className="text-[10px] font-medium">{language === 'zh' ? '首頁' : 'Home'}</span>
        </button>
        
        <a
            href="/employer/dashboard"
            className="flex flex-col items-center gap-1 p-2 text-emerald-400 hover:text-emerald-300"
        >
            <Upload size={24} />
            <span className="text-[10px] font-medium">{language === 'zh' ? '上傳' : 'Upload'}</span>
        </a>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-0 -right-0 animate-pulse"></div>
                <MessageCircle size={24} />
            </div>
            <span className="text-[10px] font-medium">{language === 'zh' ? '訊息' : 'Inbox'}</span>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <User size={24} />
            <span className="text-[10px] font-medium">{language === 'zh' ? '個人' : 'Profile'}</span>
        </button>
      </div>

    </div>
  );
}
