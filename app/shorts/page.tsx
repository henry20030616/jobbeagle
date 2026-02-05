'use client';

import React, { useState, useEffect } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import { JobData } from '@/types';
import { Home, User, Briefcase, MessageCircle, X, AlertCircle, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

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

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 从数据库加载已发布的视频
      const { data: videosData, error: videosError } = await supabase
        .from('shorts_videos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Failed to load videos:', videosError);
        // 如果加载失败，使用 fallback 数据
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
        // 如果没有视频，使用 fallback 数据
        setJobs(FALLBACK_JOBS);
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError('加载视频失败');
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
                  For You
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`pb-1 transition-colors ${activeTab === 'following' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
                >
                  Following {followedJobIds.size > 0 && `(${followedJobIds.size})`}
                </button>
            </div>
         </div>
         {/* Video Generator Tool Button - 右上角 */}
         <div className="pointer-events-auto relative z-50">
            <button
              onClick={() => setShowVideoGenerator(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-2xl border-2 border-white/20 hover:border-white/40"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-bold">AI 视频生成</span>
            </button>
         </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="h-16 bg-black border-t border-gray-900 flex flex-row items-center justify-around z-40 text-gray-400 pb-2">
        <button 
            className="flex flex-col items-center gap-1 p-2 text-white"
        >
            <Home size={24} strokeWidth={3} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <Briefcase size={24} />
            <span className="text-[10px] font-medium">Jobs</span>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-0 -right-0 animate-pulse"></div>
                <MessageCircle size={24} />
            </div>
            <span className="text-[10px] font-medium">Inbox</span>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>

      {/* Video Generator Modal */}
      {showVideoGenerator && (
        <VideoGeneratorModal
          onClose={() => setShowVideoGenerator(false)}
          onSuccess={() => {
            setShowVideoGenerator(false);
            loadVideos();
            setSuccess('视频生成成功！');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}

// Video Generator Modal Component
function VideoGeneratorModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    job_description: '',
    company_logo_url: '',
    office_video_url: '',
    manager_photo_url: '',
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProgress('');

    if (!formData.job_description || !formData.company_logo_url || !formData.manager_photo_url) {
      setError('请填写必填字段：职位描述、企业 Logo、主管照片');
      return;
    }

    try {
      setGenerating(true);
      setProgress('正在生成脚本...');

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
        throw new Error(result.error || '视频生成失败');
      }

      setProgress('视频生成完成！');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || '生成失败，请重试');
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI 视频生成工具</h2>
                <p className="text-slate-400 text-sm">自动生成招聘短视频</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                职位描述 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="请输入详细的职位描述，包括职位要求、职责、公司文化等..."
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                企业 Logo URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.company_logo_url}
                onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="https://example.com/logo.png"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                主管照片 URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.manager_photo_url}
                onChange={(e) => setFormData({ ...formData, manager_photo_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="https://example.com/manager.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                办公室视频 URL <span className="text-slate-500 text-xs">(选填)</span>
              </label>
              <input
                type="url"
                value={formData.office_video_url}
                onChange={(e) => setFormData({ ...formData, office_video_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                placeholder="https://example.com/office.mp4 (留空将自动生成)"
              />
              <p className="text-slate-500 text-xs mt-1">留空将使用 AI 自动生成办公室背景</p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>开始生成视频</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
