'use client';

import React, { useState, useEffect } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import { JobData } from '@/types';
import { Home, User, Briefcase, MessageCircle, X, AlertCircle, Loader2, Sparkles, CheckCircle, LogIn, LogOut, Building2, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { BeagleIcon } from '@/components/AnalysisDashboard';

// Video Generator Modal Component Props
interface VideoGeneratorModalProps {
  language: 'zh' | 'en';
  onClose: () => void;
  onSuccess: () => void;
}

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

// Fallback sample jobs (if no videos in database)
const FALLBACK_JOBS: JobData[] = [
  {
    id: 'google-01',
    companyName: 'Google',
    jobTitle: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    salary: 'USD 180k - 250k / yr',
    description: 'Join the team building the future of AI. We are looking for experienced engineers to work on Gemini and large language models.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    tags: ['AI', 'React', 'Python'],
    logoUrl: getLogoUrl('Google'),
    contactEmail: 'careers@google.com'
  },
  {
    id: 'apple-01',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    location: 'Cupertino, CA',
    salary: 'USD 160k - 230k / yr',
    description: 'Design and build applications for the iOS platform. Ensure the performance, quality, and responsiveness of applications.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    tags: ['Swift', 'iOS', 'Mobile'],
    logoUrl: getLogoUrl('Apple'),
    contactEmail: 'recruiting@apple.com'
  },
  {
    id: 'microsoft-01',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Architect (Azure)',
    location: 'Redmond, WA',
    salary: 'USD 150k - 220k / yr',
    description: 'Lead the design and implementation of secure, scalable, and reliable cloud solutions on Azure.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Azure', 'Cloud', 'Architecture'],
    logoUrl: getLogoUrl('Microsoft'),
    contactEmail: 'azure-hiring@microsoft.com'
  },
];

export default function JobbeaglePage() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [followedJobIds, setFollowedJobIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
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
        setJobs(FALLBACK_JOBS);
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
        setJobs(FALLBACK_JOBS);
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(language === 'zh' ? '載入影片失敗' : 'Failed to load videos');
      setJobs(FALLBACK_JOBS);
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
                        <a
                          href="/employer/login"
                          className="flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-white text-sm"
                          onClick={() => setShowLoginMenu(false)}
                        >
                          <Building2 className="w-4 h-4" />
                          <span>{language === 'zh' ? '企業登入' : 'Employer Login'}</span>
                        </a>
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
            
            {/* Video Generator Tool Button */}
            <div className="relative z-50">
              <button
                onClick={() => setShowVideoGenerator(true)}
                className="flex flex-col items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-2xl border-2 border-blue-400/30 hover:border-blue-300/50"
              >
                {/* Top row: Sparkles icon + Video Generator text */}
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-bold">Video Generator</span>
                </div>
                {/* Bottom row: Beagle logo + Beagle AI text */}
                <div className="flex items-center gap-1.5">
                  <BeagleIcon 
                    className="w-4 h-4" 
                    color="#ffffff" 
                    spotColor="#1e40af" 
                    bellyColor="#3b82f6" 
                  />
                  <span className="text-xs font-medium opacity-90">Beagle AI</span>
                </div>
              </button>
            </div>
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
        
        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <Briefcase size={24} />
            <span className="text-[10px] font-medium">{language === 'zh' ? '職缺' : 'Jobs'}</span>
        </button>

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

      {/* Video Generator Modal */}
      {showVideoGenerator && (
        <VideoGeneratorModal
          language={language}
          onClose={() => setShowVideoGenerator(false)}
          onSuccess={() => {
            setShowVideoGenerator(false);
            loadVideos();
            setSuccess(language === 'zh' ? '影片生成成功！' : 'Video generated successfully!');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}

// Video Generator Modal Component - 參考 HeyGen 設計
function VideoGeneratorModal({ 
  language,
  onClose, 
  onSuccess 
}: VideoGeneratorModalProps) {
  const [formData, setFormData] = useState({
    job_description: '',
    company_logo_url: '',
    office_video_url: '',
    manager_photo_url: '',
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const translations = {
    zh: {
      title: 'AI 影片生成工具',
      subtitle: '自動生成招聘短影片',
      jobDescription: '職位描述',
      companyLogo: '企業 Logo URL',
      managerPhoto: '主管照片 URL',
      officeVideo: '辦公室影片 URL',
      officeVideoOptional: '（選填）',
      officeVideoHint: '留空將使用 AI 自動生成辦公室背景',
      placeholder: {
        jobDescription: '請輸入詳細的職位描述，包括職位要求、職責、公司文化等...',
        logo: 'https://example.com/logo.png',
        manager: 'https://example.com/manager.jpg',
        office: 'https://example.com/office.mp4 (留空將自動生成)',
      },
      required: '必填',
      generating: '生成中...',
      generatingScript: '正在生成腳本...',
      generatingAudio: '正在生成語音...',
      generatingAvatar: '正在生成對嘴影片...',
      generatingBackground: '正在生成背景...',
      composing: '正在合成最終影片...',
      completed: '影片生成完成！',
      startGenerate: '開始生成影片',
      cancel: '取消',
      errorRequired: '請填寫必填欄位：職位描述、企業 Logo、主管照片',
      errorGenerate: '影片生成失敗',
      errorRetry: '生成失敗，請重試',
    },
    en: {
      title: 'AI Video Generator',
      subtitle: 'Automatically generate recruitment short videos',
      jobDescription: 'Job Description',
      companyLogo: 'Company Logo URL',
      managerPhoto: 'Manager Photo URL',
      officeVideo: 'Office Video URL',
      officeVideoOptional: '(Optional)',
      officeVideoHint: 'Leave blank to use AI to automatically generate office background',
      placeholder: {
        jobDescription: 'Please enter a detailed job description, including job requirements, responsibilities, company culture, etc...',
        logo: 'https://example.com/logo.png',
        manager: 'https://example.com/manager.jpg',
        office: 'https://example.com/office.mp4 (leave blank to auto-generate)',
      },
      required: 'Required',
      generating: 'Generating...',
      generatingScript: 'Generating script...',
      generatingAudio: 'Generating audio...',
      generatingAvatar: 'Generating avatar video...',
      generatingBackground: 'Generating background...',
      composing: 'Composing final video...',
      completed: 'Video generated successfully!',
      startGenerate: 'Start Generating',
      cancel: 'Cancel',
      errorRequired: 'Please fill in required fields: Job description, Company Logo, Manager photo',
      errorGenerate: 'Video generation failed',
      errorRetry: 'Generation failed, please retry',
    },
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProgress('');

    if (!formData.job_description || !formData.company_logo_url || !formData.manager_photo_url) {
      setError(t.errorRequired);
      return;
    }

    try {
      setGenerating(true);
      setProgress(t.generatingScript);

      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: formData.job_description,
          company_logo_url: formData.company_logo_url,
          office_video_url: formData.office_video_url || null,
          manager_photo_url: formData.manager_photo_url,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.errorGenerate);
      }

      setProgress(t.completed);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || t.errorRetry);
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - 參考 HeyGen 設計 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t.title}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {progress && (
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-blue-200 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress}
              </p>
            </div>
          )}

          <form id="video-generator-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Job Description */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-semibold">
                {t.jobDescription} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder={t.placeholder.jobDescription}
                required
              />
            </div>

            {/* Step 2: Media Assets - 參考 HeyGen 的卡片式設計 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Logo */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-semibold">
                  {t.companyLogo} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.company_logo_url}
                    onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={t.placeholder.logo}
                    required
                  />
                  {formData.company_logo_url && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600">
                        <img src={formData.company_logo_url} alt="Logo preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manager Photo */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-semibold">
                  {t.managerPhoto} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.manager_photo_url}
                    onChange={(e) => setFormData({ ...formData, manager_photo_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={t.placeholder.manager}
                    required
                  />
                  {formData.manager_photo_url && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600">
                        <img src={formData.manager_photo_url} alt="Manager preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Office Video (Optional) */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-semibold">
                {t.officeVideo} <span className="text-slate-500 text-xs font-normal">{t.officeVideoOptional}</span>
              </label>
              <input
                type="url"
                value={formData.office_video_url}
                onChange={(e) => setFormData({ ...formData, office_video_url: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder={t.placeholder.office}
              />
              <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t.officeVideoHint}
              </p>
            </div>
          </form>
        </div>
        
        {/* Footer - Action Buttons */}
        <div className="border-t border-slate-700 p-6 bg-slate-900/50">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              form="video-generator-form"
              disabled={generating || !formData.job_description || !formData.company_logo_url || !formData.manager_photo_url}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t.startGenerate}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
