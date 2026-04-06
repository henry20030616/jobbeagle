'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobData } from '@/types';
import AnalysisModal from './AnalysisModal';
import { 
  Heart, Share2, MapPin, DollarSign, 
  Briefcase, User, Volume2, VolumeX, AlertCircle, 
  Play, X, Mail, Upload, CheckCircle, Loader2, UserPlus, 
  Bookmark, Copy, Facebook, Twitter, Linkedin, 
  FileText, ChevronRight, ChevronLeft, CheckCircle2, Info, Sparkles, ExternalLink,
  MessageCircle, Link as LinkIcon, Building2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

interface VideoCardProps {
  job: JobData;
  isActive: boolean;
  isFollowed?: boolean;
  isBookmarked?: boolean;
  onFollowChange?: (companyName: string, followed: boolean) => void;
  onSaveChange?: (jobId: string, saved: boolean) => void;
  language?: 'zh' | 'en';
}

const VideoCard: React.FC<VideoCardProps> = ({
  job, isActive, isFollowed = false, isBookmarked = false,
  onFollowChange, onSaveChange, language = 'zh',
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(8200);
  const [followed, setFollowed] = useState(isFollowed);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [applyState, setApplyState] = useState<'idle' | 'step1' | 'step2' | 'submitting' | 'success'>('idle');
  const [applyStep, setApplyStep] = useState<1 | 2 | 3>(1);
  const [videoUrl, setVideoUrl] = useState(job.videoUrl);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [applicationMessage, setApplicationMessage] = useState<string>('');
  const [coverLetterMode, setCoverLetterMode] = useState<'text' | 'file'>('text');
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [coverLetterFileName, setCoverLetterFileName] = useState<string>('');
  const [logoError, setLogoError] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDoubleTapLike, setShowDoubleTapLike] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const lastTapRef = useRef<number>(0);
  const likeLoadedRef = useRef(false);

  // Sync with parent state
  useEffect(() => { setFollowed(isFollowed); }, [isFollowed]);
  useEffect(() => { setBookmarked(isBookmarked); }, [isBookmarked]);

  // Load saved user info from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jobbeagle_shorts_user_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserInfo(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load user info:', e);
      }
    }
  }, []);

  // Save user info to localStorage
  const saveUserInfo = () => {
    localStorage.setItem('jobbeagle_shorts_user_info', JSON.stringify(userInfo));
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverLetterFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
        setHasError(false);
        if (video.currentTime === video.duration) {
            video.currentTime = 0;
        }
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => console.warn("Autoplay prevented:", err));
        }
    } else {
        video.pause();
        setShowFullDetails(false);
        setShowApplyModal(false);
    }
  }, [isActive, job.id, videoUrl]);

  // Load real like count + user's like status once when video becomes active
  useEffect(() => {
    if (!isActive || likeLoadedRef.current) return;
    likeLoadedRef.current = true;
    const load = async () => {
      const supabase = createClient();
      const [{ count }, { data: { user } }] = await Promise.all([
        supabase.from('video_likes').select('*', { count: 'exact', head: true }).eq('video_id', job.id),
        supabase.auth.getUser(),
      ]);
      if (count !== null) setLikeCount(count);
      if (user) {
        const { data } = await supabase.from('video_likes').select('id').eq('user_id', user.id).eq('video_id', job.id).maybeSingle();
        if (data) setLiked(true);
      }
    };
    load().catch(() => {});
  }, [isActive]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const persistLike = async (newLiked: boolean) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (newLiked) {
        await supabase.from('video_likes').upsert({ user_id: user.id, video_id: job.id }, { onConflict: 'user_id,video_id' });
      } else {
        await supabase.from('video_likes').delete().eq('user_id', user.id).eq('video_id', job.id);
      }
    } catch { /* silent */ }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => Math.max(0, newLiked ? prev + 1 : prev - 1));
    if (newLiked) {
      setShowDoubleTapLike(true);
      setTimeout(() => setShowDoubleTapLike(false), 600);
    }
    persistLike(newLiked);
  };

  // Double tap to like
  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
      if (!liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
        setShowDoubleTapLike(true);
        setTimeout(() => setShowDoubleTapLike(false), 600);
        persistLike(true);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFollowed = !followed;
    setFollowed(newFollowed);
    if (onFollowChange) onFollowChange(job.companyName, newFollowed);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (newFollowed) {
          await supabase.from('followed_companies').upsert({
            user_id: user.id, company_name: job.companyName, logo_url: job.logoUrl || null,
          }, { onConflict: 'user_id,company_name' });
        } else {
          await supabase.from('followed_companies').delete()
            .eq('user_id', user.id).eq('company_name', job.companyName);
        }
      }
    } catch { /* silent fallback */ }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleShareNative = async () => {
    const shareData = {
      title: `${job.jobTitle} @ ${job.companyName}`,
      text: job.description,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShowShareMenu(false);
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        await handleCopyLink();
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareMenu(false);
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 animate-fade-in';
      toast.textContent = 'Link copied to clipboard!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy link');
    }
  };

  const handleAnalyzeWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAnalysisModal(true);
  };

  const handleShareSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'line' | 'whatsapp') => {
    const jobUrl = `${window.location.origin}/shorts/company/${encodeURIComponent(job.companyName)}`;
    const url = encodeURIComponent(jobUrl);
    const text = encodeURIComponent(`${job.jobTitle} @ ${job.companyName}`);
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'line':
        shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${job.jobTitle} @ ${job.companyName}\n${jobUrl}`)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${job.jobTitle} @ ${job.companyName}\n${jobUrl}`)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleCopyCompanyLink = async () => {
    const jobUrl = `${window.location.origin}/shorts/company/${encodeURIComponent(job.companyName)}`;
    try {
      await navigator.clipboard.writeText(jobUrl);
      setShowShareMenu(false);
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50';
      toast.textContent = language === 'zh' ? '企業頁面連結已複製！' : 'Company page link copied!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch { /* silent */ }
  };


  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = !bookmarked;
    setBookmarked(newSaved);
    if (onSaveChange) onSaveChange(job.id, newSaved);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (newSaved) {
          await supabase.from('saved_jobs').upsert({
            user_id: user.id, job_id: job.id, job_data: job,
          }, { onConflict: 'user_id,job_id' });
        } else {
          await supabase.from('saved_jobs').delete()
            .eq('user_id', user.id).eq('job_id', job.id);
        }
      }
    } catch { /* silent fallback */ }
  };

  const handleVideoClick = () => {
      if (showFullDetails || showApplyModal || showShareMenu) {
          setShowFullDetails(false);
          setShowApplyModal(false);
          setShowShareMenu(false);
          return;
      }
      const video = videoRef.current;
      if (video) {
          video.paused ? video.play() : video.pause();
      }
  };


  const handleApplyStart = () => {
    setShowApplyModal(true);
    setApplyState('step1');
    setApplyStep(1);
  };

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  const defaultAppMessage = () => language === 'zh'
    ? `您好，近日得知貴公司正在招募「${job.jobTitle}」一職，特此應徵，希望能有機會參加面試，謝謝！`
    : `Hello, I recently learned about the "${job.jobTitle}" opening at ${job.companyName} and would love to apply. I hope to have the opportunity to interview. Thank you!`;

  const handleStep1Next = () => {
    if (!applicationMessage) setApplicationMessage(defaultAppMessage());
    setApplyStep(2);
  };

  const handleStep2Next = () => {
    if (!userInfo.name || !userInfo.email) {
      alert(t('請填寫姓名與 Email', 'Please fill in your name and email'));
      return;
    }
    if (!resumeFile) {
      alert(t('請上傳履歷', 'Please upload a resume'));
      return;
    }
    saveUserInfo();
    setApplyStep(3);
  };

  const handleApplySubmit = async () => {
    setApplyState('submitting');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const uploadToStorage = async (file: File, prefix: string) => {
        const ext = file.name.split('.').pop();
        const path = `applications/${user?.id || 'anon'}/${prefix}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('shorts-videos').upload(path, file, { upsert: true });
        if (error) return null;
        return supabase.storage.from('shorts-videos').getPublicUrl(path).data.publicUrl;
      };

      const resumeUrl = resumeFile ? await uploadToStorage(resumeFile, 'resume') : null;
      const coverLetterUrl = (coverLetterMode === 'file' && coverLetterFile)
        ? await uploadToStorage(coverLetterFile, 'coverletter') : null;

      const res = await fetch('/api/shorts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          contactEmail: job.contactEmail,
          location: job.location,
          salary: job.salary,
          applicantName: userInfo.name,
          applicantEmail: userInfo.email,
          applicantPhone: userInfo.phone,
          applicationMessage: applicationMessage || defaultAppMessage(),
          coverLetter: coverLetterMode === 'text' ? userInfo.coverLetter : null,
          coverLetterUrl,
          coverLetterFileName: coverLetterMode === 'file' ? coverLetterFileName : null,
          resumeUrl,
          resumeFileName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '申請失敗');
      }

      setApplyState('success');
      setTimeout(() => {
        setShowApplyModal(false);
        setApplyState('idle');
        setApplyStep(1);
        setResumeFile(null);
        setResumeFileName('');
        setApplicationMessage('');
        setCoverLetterFile(null);
        setCoverLetterFileName('');
        setCoverLetterMode('text');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (coverLetterFileRef.current) coverLetterFileRef.current.value = '';
      }, 3000);
    } catch (e: any) {
      console.error('Apply error:', e);
      alert(e.message || '申請時發生錯誤，請稍後再試');
      setApplyState('step2');
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden border-b border-gray-800 select-none">
      
      {/* --- Video Layer --- */}
      <div 
        className="absolute inset-0 w-full h-full z-0 flex items-center justify-center bg-gray-900"
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleTap}
      >
        {/* Double Tap Like Animation */}
        {showDoubleTapLike && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <Heart 
              size={80} 
              fill="currentColor" 
              className="text-red-500 animate-ping opacity-80"
            />
          </div>
        )}
        {/* Thumbnail Background */}
        <div className="absolute inset-0 z-0">
             {job.logoUrl && !logoError ? (
                <img 
                    src={job.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-cover opacity-20 blur-xl scale-110" 
                    onError={() => setLogoError(true)}
                />
             ) : (
                <div className="w-full h-full bg-slate-900"></div>
             )}
        </div>

        {/* Video Player：Supabase 影片改走同源 proxy，避免 CORS 導致 Video unavailable */}
        {isActive && !hasError && videoUrl ? (
            <video
                ref={videoRef}
                src={videoUrl.includes('supabase.co/storage/') ? `/api/shorts/proxy?url=${encodeURIComponent(videoUrl)}` : videoUrl}
                className="w-full h-full object-cover z-10"
                loop
                muted={isMuted}
                playsInline
                autoPlay
                preload="auto"
                crossOrigin="anonymous"
                onError={() => setHasError(true)}
            />
        ) : (
            <div className="z-10 flex flex-col items-center justify-center text-center p-8">
                 {!isActive && <Play size={48} className="text-white/50 mb-4" />}
                 {hasError && (
                    <div className="flex flex-col items-center animate-fade-in gap-3">
                        <AlertCircle size={48} className="text-red-500 mb-2" />
                        <p className="text-white font-bold text-lg drop-shadow-md">Video unavailable</p>
                        <p className="text-white/80 text-sm drop-shadow max-w-[300px] text-center">
                          {videoUrl?.includes('drive.google.com')
                            ? '此為 Google 雲端硬碟連結，無法直接當影片播放。請在「上傳新影片」時選擇「選擇檔案」上傳影片，或使用 Supabase / 其他直接影片網址。'
                            : '影片無法載入。請確認影片連結為「直接影片網址」（.mp4），勿使用 Google 雲端硬碟分享連結。'}
                        </p>
                        {videoUrl && (
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-400 hover:underline"
                          >
                            在新分頁開啟連結檢查
                          </a>
                        )}
                    </div>
                 )}
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none z-10"></div>
      </div>

      {/* --- Right Sidebar Actions --- */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-5 z-20 pb-4">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
            <button 
              className={`p-2.5 rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90 ${liked ? 'text-red-500' : 'text-white'} hover:scale-110`} 
              onClick={handleLike}
            >
              <Heart fill={liked ? "currentColor" : "none"} size={26} className={liked ? 'animate-pulse' : ''} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">
              {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </span>
        </div>

        {/* Follow Button */}
        <div className="flex flex-col items-center gap-1">
            <button 
              className={`p-2.5 rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90 hover:scale-110 ${followed ? 'text-cyan-400' : 'text-white'}`} 
              onClick={handleFollow}
            >
              <UserPlus fill={followed ? "currentColor" : "none"} size={26} className={followed ? 'animate-pulse' : ''} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">
              {followed ? 'Followed' : 'Follow'}
            </span>
        </div>

        {/* Bookmark Button */}
        <div className="flex flex-col items-center gap-1">
            <button 
              className={`p-2.5 rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90 hover:scale-110 ${bookmarked ? 'text-yellow-400' : 'text-white'}`} 
              onClick={handleBookmark}
            >
              <Bookmark fill={bookmarked ? "currentColor" : "none"} size={26} className={bookmarked ? 'animate-pulse' : ''} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">
              {bookmarked ? 'Saved' : 'Save'}
            </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all active:scale-90 hover:scale-110"
            onClick={handleShareClick}
          >
            <Share2 size={26} />
          </button>
          <span className="text-[10px] font-semibold drop-shadow-md text-white">{language === 'zh' ? '分享' : 'Share'}</span>
        </div>
        
        {/* Mute Toggle */}
        <div className="flex flex-col items-center gap-1 mt-2">
            <button 
                onClick={toggleMute} 
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all active:scale-90 hover:scale-110"
            >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
        </div>
      </div>

      {/* --- Compact Bottom Info Area --- */}
      {(!showFullDetails && !showApplyModal) && (
          <div className="absolute bottom-0 left-0 w-full p-4 z-20 text-white pb-20 md:pb-6 pointer-events-none bg-gradient-to-t from-black/90 via-black/30 to-transparent">
            <div className="flex flex-col items-start w-[70%] pointer-events-auto">
              
              <div className="flex flex-row items-center gap-3 mb-2">
                  <div className="flex-shrink-0">
                     {job.logoUrl && !logoError ? (
                        <img 
                            src={job.logoUrl} 
                            alt="Logo" 
                            className="w-11 h-11 rounded-full border border-white/50 bg-white object-contain shadow-md" 
                            onError={() => setLogoError(true)}
                        />
                     ) : (
                        <div className="w-11 h-11 rounded-full border border-white/50 bg-gray-700 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xs">
                                {job.companyName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                     )}
                  </div>

                  <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold drop-shadow-md leading-tight truncate">{job.jobTitle}</h3>
                      <h4 className="text-sm font-bold drop-shadow-md leading-tight truncate">@{job.companyName}</h4>
                  </div>
              </div>

               <div className="flex flex-wrap gap-2 mb-4 text-xs">
                 <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-gray-300">
                    <MapPin size={12} /> {job.location}
                 </span>
                 <span className="flex items-center gap-1 bg-green-900/50 text-green-400 px-2 py-1 rounded">
                    <DollarSign size={12} /> {job.salary}
                 </span>
            </div>

              <div className="w-full pl-1 mb-2">
                  <div className="text-[10px] text-gray-200 flex items-end w-full">
                    <p className="line-clamp-1 opacity-90 mr-1 flex-1">{job.description}</p>
                    <span 
                      className="text-white font-bold whitespace-nowrap opacity-100 hover:underline cursor-pointer active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullDetails(true);
                      }}
                    >
                      ...more
                    </span>
                  </div>
              </div>
              
              <div className="w-full pl-1 flex flex-col gap-1.5">
                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-1.5 rounded-md shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-[10px]"
                    >
                      <ExternalLink size={12} /> {language === 'zh' ? '套用' : 'Apply'}
                    </a>
                  ) : (
                    <button 
                      onClick={() => setShowApplyModal(true)}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-md shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-[10px]"
                    >
                       <Briefcase size={14} /> {language === 'zh' ? '一鍵申請' : 'Quick Apply'}
                    </button>
                  )}
                  <button
                    onClick={handleAnalyzeWithAI}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-1.5 rounded-md shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-[10px]"
                  >
                    <Sparkles size={14} /> {language === 'zh' ? 'AI 匹配度分析' : 'AI Match Analysis'}
                  </button>
              </div>
            </div>
          </div>
      )}

      {/* --- Full Details Modal --- */}
      {showFullDetails && (
        <>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setShowFullDetails(false)}
          />
          
          {/* Modal Content */}
          <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-3xl border-t border-white/10 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setShowFullDetails(false)}>
                <div className="w-12 h-1.5 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4 px-5">
                <div className="flex items-center gap-3">
                     {job.logoUrl && !logoError ? (
                        <img 
                            src={job.logoUrl} 
                            className="w-10 h-10 rounded-full border border-white/20 bg-white object-contain" 
                            alt="logo"
                            onError={() => setLogoError(true)}
                        />
                     ) : (
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                                {job.companyName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                     )}
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{job.jobTitle}</h2>
                        <div className="text-sm font-semibold text-gray-400">@{job.companyName}</div>
                    </div>
                </div>
                <button 
                  onClick={() => setShowFullDetails(false)} 
                  className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X size={20} className="text-gray-300" />
                </button>
            </div>

            {/* Job Description - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 mb-6">
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 pb-6 pt-2 border-t border-white/10 flex flex-col gap-2">
                {job.applyUrl ? (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ExternalLink size={18} />
                    <span>{language === 'zh' ? '套用（前往企業申請頁）' : 'Apply on Company Site'}</span>
                  </a>
                ) : (
                  <button 
                      onClick={() => { setShowFullDetails(false); handleApplyStart(); }}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                     <Briefcase size={18} /> {language === 'zh' ? '一鍵申請' : 'Quick Apply'}
                  </button>
                )}
                <button
                    onClick={handleAnalyzeWithAI}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Sparkles size={18} /> {language === 'zh' ? '一鍵 AI 匹配度分析' : 'One-click AI Match Analysis'}
                </button>
            </div>
          </div>
        </>
      )}

      {/* --- LinkedIn-style Quick Apply Modal --- */}
      {showApplyModal && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => {
                if (applyState === 'step1' || applyState === 'idle') {
                  setShowApplyModal(false);
                  setApplyState('idle');
                  setApplyStep(1);
                }
              }}
            />
            
            {/* Modal */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-3xl border-t border-cyan-500/30 animate-slide-up shadow-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{language === 'zh' ? '一鍵申請' : 'Quick Apply'}</h2>
                    <p className="text-sm text-gray-400">{job.companyName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplyState('idle');
                    setApplyStep(1);
                  }} 
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  {[
                    { n: 1, label: t('確認職缺', 'Review') },
                    { n: 2, label: t('填寫資料', 'Details') },
                    { n: 3, label: t('送出', 'Submit') },
                  ].map(({ n, label }, i, arr) => (
                    <React.Fragment key={n}>
                      <div className={`flex items-center gap-2 ${applyStep >= n ? 'text-cyan-400' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${applyStep >= n ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                          {applyStep > n ? <CheckCircle2 size={16} className="text-white" /> : <span className="text-xs font-bold">{n}</span>}
                        </div>
                        <span className="text-xs font-semibold hidden sm:block">{label}</span>
                      </div>
                      {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${applyStep > n ? 'bg-cyan-600' : 'bg-slate-700'}`} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Submitting State */}
                {applyState === 'submitting' && (
                  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-white mb-2">{t('正在送出應徵...', 'Submitting your application...')}</p>
                    <p className="text-sm text-gray-400">{t('請稍候', 'Please wait a moment')}</p>
                  </div>
                )}

                {applyState === 'success' && (
                  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} className="text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('應徵成功！', 'Application Submitted!')}</h3>
                    <p className="text-sm text-gray-400 text-center mb-6 max-w-md">
                      {t('您已成功應徵', 'You have successfully applied for')} <span className="text-white font-semibold">{job.jobTitle}</span> {t('於', 'at')} <span className="text-white font-semibold">{job.companyName}</span>
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 w-full max-w-md">
                      <p className="text-xs text-gray-500 mb-2">{t('接下來？', "What's next?")}</p>
                      <ul className="text-sm text-gray-300 space-y-2">
                        {[
                          t('企業將審閱您的應徵資料', 'The company will review your application'),
                          t('企業可能透過您填寫的 Email 與您聯繫', 'The company may contact you via the email you provided'),
                          t('請留意信箱，隨時保持聯絡方式暢通', 'Keep an eye on your inbox'),
                        ].map((msg, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{msg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 1: Review Job */}
                {applyState !== 'submitting' && applyState !== 'success' && applyStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-lg font-bold text-white mb-2">{job.jobTitle}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} />
                          <span>{job.salary}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 line-clamp-3">{job.description}</div>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 flex items-start gap-3">
                      <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="font-semibold mb-1">{t('接下來會發生什麼？', 'What happens next?')}</p>
                        <p className="text-blue-400/80">{t(`您的應徵資料將直接傳送給 ${job.companyName}，企業可能透過 Email 與您聯繫。`, `Your application will be sent directly to ${job.companyName}. They may contact you via email.`)}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStep1Next}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {t('繼續', 'Continue')} <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {/* Step 2: Fill Details */}
                {applyState !== 'submitting' && applyState !== 'success' && applyStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        {t('姓名', 'Full Name')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('請輸入您的姓名', 'Enter your full name')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('your@email.com（企業將用此信箱聯絡您）', 'your@email.com (company will contact you here)')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        {t('電話', 'Phone')} <span className="text-gray-500 font-normal text-xs">({t('選填', 'Optional')})</span>
                      </label>
                      <input
                        type="tel"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('09xx-xxx-xxx', '+1 (555) 000-0000')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                      />
                    </div>

                    {/* Application message — shown above resume, separate from cover letter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1">
                        {t('應徵信件', 'Application Message')}
                        <span className="ml-1.5 text-xs text-gray-500 font-normal">({t('系統預設，可自行修改', 'pre-filled, feel free to edit')})</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={applicationMessage || defaultAppMessage()}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) setApplicationMessage(e.target.value);
                          }}
                          rows={3}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pb-7 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white resize-none"
                        />
                        <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
                          {applicationMessage && applicationMessage !== defaultAppMessage() && (
                            <button type="button" onClick={() => setApplicationMessage(defaultAppMessage())}
                              className="text-xs text-cyan-400 hover:text-cyan-300 underline">{t('重置', 'Reset')}</button>
                          )}
                          <span className="text-xs text-gray-500">{(applicationMessage || defaultAppMessage()).length}/500</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        {t('履歷', 'Resume')} <span className="text-red-400">*</span>
                      </label>
                      {resumeFile ? (
                        <div className="w-full border-2 border-cyan-500/50 rounded-lg p-4 flex items-center justify-between bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-cyan-400" />
                            <span className="text-sm text-white font-medium">{resumeFileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setResumeFile(null);
                              setResumeFileName('');
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="resume-file-input-shorts"
                          className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-slate-800/50 cursor-pointer transition-all block"
                        >
                          <Upload size={24} className="text-gray-400" />
                          <span className="text-sm text-gray-400">{t('上傳 PDF 履歷（最大 5MB）', 'Upload PDF resume (Max 5MB)')}</span>
                          <span className="text-xs text-gray-500">{t('支援 .pdf 格式', 'Supports .pdf format')}</span>
                        </label>
                      )}
                      <input
                        id="resume-file-input-shorts"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert('File size cannot exceed 5MB');
                              return;
                            }
                            setResumeFile(file);
                            setResumeFileName(file.name);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300">
                          {t('求職信', 'Cover Letter')} <span className="text-gray-500 font-normal text-xs">({t('選填', 'Optional')})</span>
                        </label>
                        <div className="flex bg-slate-800 rounded-lg p-0.5">
                          <button onClick={() => setCoverLetterMode('text')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${coverLetterMode === 'text' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {t('輸入文字', 'Type')}
                          </button>
                          <button onClick={() => setCoverLetterMode('file')}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${coverLetterMode === 'file' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {t('上傳檔案', 'Upload File')}
                          </button>
                        </div>
                      </div>
                      {coverLetterMode === 'text' ? (
                        <div className="relative">
                          <textarea
                            value={userInfo.coverLetter}
                            onChange={(e) => {
                              if (e.target.value.length <= 2000)
                                setUserInfo(prev => ({ ...prev, coverLetter: e.target.value }));
                            }}
                            placeholder={t('輸入您的求職信內容...', 'Write your cover letter...')}
                            rows={7}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pb-7 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500 resize-none"
                          />
                          <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
                            {userInfo.coverLetter && (
                              <button type="button"
                                onClick={() => setUserInfo(prev => ({ ...prev, coverLetter: '' }))}
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                                {t('清除', 'Clear')}
                              </button>
                            )}
                            <span className={`text-xs ${userInfo.coverLetter.length >= 1800 ? 'text-amber-400' : 'text-gray-500'}`}>
                              {userInfo.coverLetter.length}/2000
                            </span>
                          </div>
                        </div>
                      ) : (
                        coverLetterFile ? (
                          <div className="w-full border-2 border-cyan-500/50 rounded-lg p-4 flex items-center justify-between bg-slate-800/50">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-cyan-400" />
                              <span className="text-sm text-white font-medium">{coverLetterFileName}</span>
                            </div>
                            <button type="button" onClick={() => { setCoverLetterFile(null); setCoverLetterFileName(''); if (coverLetterFileRef.current) coverLetterFileRef.current.value = ''; }}
                              className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="cover-letter-file-input" className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg p-5 flex flex-col items-center justify-center gap-2 bg-slate-800/50 cursor-pointer transition-all block">
                            <Upload size={22} className="text-gray-400" />
                            <span className="text-sm text-gray-400">{t('上傳求職信 PDF / Word（最大 5MB）', 'Upload Cover Letter PDF / Word (Max 5MB)')}</span>
                          </label>
                        )
                      )}
                      <input id="cover-letter-file-input" ref={coverLetterFileRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) { alert('檔案不能超過 5MB'); return; }
                            setCoverLetterFile(file);
                            setCoverLetterFileName(file.name);
                          }
                        }} />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setApplyStep(1)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <ChevronLeft size={18} /> {t('上一步', 'Back')}
                      </button>
                      <button onClick={handleStep2Next}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                        {t('繼續', 'Continue')} <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {applyState !== 'submitting' && applyState !== 'success' && applyStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-lg font-bold text-white mb-4">{t('確認應徵內容', 'Review your application')}</h3>
                      <div className="space-y-4">
                        {[
                          { label: t('應徵職位', 'Position'), value: job.jobTitle },
                          { label: t('姓名', 'Name'), value: userInfo.name },
                          { label: 'Email', value: userInfo.email },
                          ...(userInfo.phone ? [{ label: t('電話', 'Phone'), value: userInfo.phone }] : []),
                          { label: t('履歷', 'Resume'), value: resumeFile ? resumeFileName : t('未上傳', 'Not uploaded') },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
                            <p className="text-sm text-white">{value}</p>
                          </div>
                        ))}
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">{t('應徵信件', 'Application Message')}</p>
                          <p className="text-sm text-gray-300 line-clamp-2">{applicationMessage || defaultAppMessage()}</p>
                        </div>
                        {(coverLetterMode === 'text' && userInfo.coverLetter) && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">{t('求職信', 'Cover Letter')}</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-2">{userInfo.coverLetter}</p>
                          </div>
                        )}
                        {(coverLetterMode === 'file' && coverLetterFile) && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">{t('求職信檔案', 'Cover Letter File')}</p>
                            <p className="text-sm text-white">{coverLetterFileName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setApplyStep(2)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <ChevronLeft size={18} /> {t('上一步', 'Back')}
                      </button>
                      <button onClick={handleApplySubmit}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                        {t('確認送出', 'Submit Application')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
      )}


      {/* ── AI Analysis Modal ─────────────────────────────── */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        jobTitle={job.jobTitle}
        companyName={job.companyName}
        location={job.location}
        salary={job.salary}
        jobDescription={job.description}
        language={language}
      />

      {/* ── TikTok-style Share Bottom Sheet ───────────────── */}
      {showShareMenu && (
        <ShareSheet
          job={job}
          language={language}
          onClose={() => setShowShareMenu(false)}
          onCopyLink={handleCopyLink}
          onCopyCompanyLink={handleCopyCompanyLink}
          onShareSocial={handleShareSocial}
          onShareNative={handleShareNative}
        />
      )}
    </div>
  );
};

// ── Share Bottom Sheet ────────────────────────────────────────────────────────
interface ShareSheetProps {
  job: JobData;
  language: string;
  onClose: () => void;
  onCopyLink: () => void;
  onCopyCompanyLink: () => void;
  onShareSocial: (p: 'facebook' | 'twitter' | 'linkedin' | 'line' | 'whatsapp') => void;
  onShareNative: () => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  job, language, onClose, onCopyLink, onCopyCompanyLink, onShareSocial, onShareNative,
}) => {
  const [copiedLink, setCopiedLink] = React.useState<null | 'link' | 'company'>(null);

  const handleCopy = async (type: 'link' | 'company') => {
    if (type === 'link') await onCopyLink();
    else await onCopyCompanyLink();
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  const platforms = [
    { id: 'line' as const, name: 'LINE', bg: '#00B900', label: 'L' },
    { id: 'whatsapp' as const, name: 'WhatsApp', bg: '#25D366', label: 'W' },
    { id: 'facebook' as const, name: 'Facebook', bg: '#1877F2', label: 'f' },
    { id: 'twitter' as const, name: 'X', bg: '#000000', label: '𝕏' },
    { id: 'linkedin' as const, name: 'LinkedIn', bg: '#0A66C2', label: 'in' },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-slate-900 rounded-t-3xl pb-safe"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-5" />

        {/* Title */}
        <p className="text-white font-bold text-center text-base mb-1">
          {language === 'zh' ? '分享' : 'Share'}
        </p>
        <p className="text-slate-400 text-xs text-center mb-6 px-8 truncate">
          {job.jobTitle} @ {job.companyName}
        </p>

        {/* Platform icons — horizontal scroll */}
        <div className="flex gap-5 overflow-x-auto px-6 pb-2 mb-5 no-scrollbar">
          {/* Native share first */}
          <button
            onClick={() => { onShareNative(); onClose(); }}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center shadow">
              <Share2 size={24} className="text-white" />
            </div>
            <span className="text-white/70 text-[11px] w-14 text-center leading-tight">
              {language === 'zh' ? '系統分享' : 'More'}
            </span>
          </button>

          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => { onShareSocial(p.id); onClose(); }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow"
                style={{ backgroundColor: p.bg }}
              >
                {p.label}
              </div>
              <span className="text-white/70 text-[11px] w-14 text-center leading-tight">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Copy / action rows */}
        <div className="px-4 space-y-2 mb-3">
          <button
            onClick={() => handleCopy('link')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors"
          >
            {copiedLink === 'link'
              ? <CheckCircle size={18} className="text-green-400" />
              : <Copy size={18} className="text-white/70" />
            }
            <span className="text-white text-sm font-medium">
              {copiedLink === 'link'
                ? (language === 'zh' ? '已複製！' : 'Copied!')
                : (language === 'zh' ? '複製連結' : 'Copy Link')}
            </span>
          </button>

          <button
            onClick={() => handleCopy('company')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors"
          >
            {copiedLink === 'company'
              ? <CheckCircle size={18} className="text-green-400" />
              : <Building2 size={18} className="text-emerald-400" />
            }
            <span className="text-white text-sm font-medium">
              {copiedLink === 'company'
                ? (language === 'zh' ? '已複製！' : 'Copied!')
                : (language === 'zh' ? '複製企業頁面連結' : 'Copy Company Page')}
            </span>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-4">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white/60 text-sm font-medium transition-colors"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
