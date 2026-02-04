'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobData } from '@/types';
import { 
  Heart, MessageCircle, Share2, MapPin, DollarSign, 
  Briefcase, User, Volume2, VolumeX, AlertCircle, 
  Play, X, Mail, Upload, CheckCircle, Loader2, UserPlus, 
  Bookmark, Copy, Facebook, Twitter, Linkedin, 
  FileText, ChevronRight, ChevronLeft, CheckCircle2, Info
} from 'lucide-react';

interface VideoCardProps {
  job: JobData;
  isActive: boolean;
  isFollowed?: boolean;
  onFollowChange?: (jobId: string, followed: boolean) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ job, isActive, isFollowed = false, onFollowChange }) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(8200); // Initial like count
  const [commentCount, setCommentCount] = useState(240); // Initial comment count
  const [followed, setFollowed] = useState(isFollowed);
  const [bookmarked, setBookmarked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [applyState, setApplyState] = useState<'idle' | 'step1' | 'step2' | 'submitting' | 'success'>('idle');
  const [applyStep, setApplyStep] = useState<1 | 2 | 3>(1);
  const [videoUrl, setVideoUrl] = useState(job.videoUrl);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [logoError, setLogoError] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; time: string; liked: boolean; likeCount: number }>>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDoubleTapLike, setShowDoubleTapLike] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Sync with parent state
  useEffect(() => {
    setFollowed(isFollowed);
  }, [isFollowed]);

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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    
    // Show animation
    if (newLiked) {
      setShowDoubleTapLike(true);
      setTimeout(() => setShowDoubleTapLike(false), 600);
    }
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
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFollowed = !followed;
    setFollowed(newFollowed);
    if (onFollowChange) {
      onFollowChange(job.id, newFollowed);
    }
    console.log(`${newFollowed ? '✅' : '❌'} [VideoCard] ${newFollowed ? 'Followed' : 'Unfollowed'}:`, job.jobTitle);
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

  const handleShareSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
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
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: `comment-${Date.now()}`,
      user: 'You',
      text: newComment.trim(),
      time: 'Just now',
      liked: false,
      likeCount: 0,
    };

    setComments(prev => [comment, ...prev]);
    setCommentCount(prev => prev + 1);
    setNewComment('');
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const newLiked = !comment.liked;
        return {
          ...comment,
          liked: newLiked,
          likeCount: newLiked ? comment.likeCount + 1 : comment.likeCount - 1,
        };
      }
      return comment;
    }));
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  const handleVideoClick = () => {
      if (showFullDetails || showApplyModal || showCommentsModal || showShareMenu) {
          setShowFullDetails(false);
          setShowApplyModal(false);
          setShowCommentsModal(false);
          setShowShareMenu(false);
          return;
      }
      const video = videoRef.current;
      if (video) {
          video.paused ? video.play() : video.pause();
      }
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showShareMenu && !(e.target as Element).closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const handleApplyStart = () => {
    setShowApplyModal(true);
    setApplyState('step1');
    setApplyStep(1);
  };

  const handleStep1Next = () => {
    setApplyStep(2);
  };

  const handleStep2Next = () => {
    if (!userInfo.name || !userInfo.email) {
      alert('Please fill in your name and email');
      return;
    }
    if (!resumeFile) {
      alert('Please upload a resume');
      return;
    }
    saveUserInfo();
    setApplyStep(3);
  };

  const handleApplySubmit = async () => {
    setApplyState('submitting');
    
    const applicationData = {
      jobId: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      userInfo,
      resumeFileName: resumeFileName,
      coverLetter: userInfo.coverLetter,
    };
    
    console.log('📤 [VideoCard] Submitting application', applicationData);
    
    // TODO: Add actual API call to submit application
    // Example: await fetch('/api/apply', { method: 'POST', body: JSON.stringify(applicationData) });
    
    setTimeout(() => {
      setApplyState('success');
      setTimeout(() => {
        setShowApplyModal(false);
        setApplyState('idle');
        setApplyStep(1);
        setResumeFile(null);
        setResumeFileName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    }, 1500);
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

        {/* Video Player */}
        {isActive && !hasError && videoUrl ? (
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover z-10"
                loop
                muted={isMuted}
                playsInline
                autoPlay
                preload="auto"
                onError={() => setHasError(true)}
            />
        ) : (
            <div className="z-10 flex flex-col items-center justify-center text-center p-8">
                 {!isActive && <Play size={48} className="text-white/50 mb-4" />}
                 {hasError && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <AlertCircle size={48} className="text-red-500 mb-2" />
                        <p className="text-white font-bold text-lg drop-shadow-md">Video unavailable</p>
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

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
            <button 
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all active:scale-90 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsModal(true);
              }}
            >
              <MessageCircle size={26} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">
              {commentCount >= 1000 ? `${(commentCount / 1000).toFixed(1)}k` : commentCount}
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
        <div className="flex flex-col items-center gap-1 relative share-menu-container">
             <button 
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all active:scale-90 hover:scale-110"
              onClick={handleShareClick}
            >
              <Share2 size={26} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">Share</span>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-12 top-0 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-slate-700 min-w-[200px] z-50 animate-fade-in">
                <button
                  onClick={handleShareNative}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-white text-sm"
                >
                  <Share2 size={18} />
                  <span>Native Share</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-white text-sm"
                >
                  <Copy size={18} />
                  <span>Copy Link</span>
                </button>
                <div className="border-t border-slate-700 my-2"></div>
                <button
                  onClick={() => handleShareSocial('facebook')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-white text-sm"
                >
                  <Facebook size={18} className="text-blue-500" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => handleShareSocial('twitter')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-white text-sm"
                >
                  <Twitter size={18} className="text-blue-400" />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={() => handleShareSocial('linkedin')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-white text-sm"
                >
                  <Linkedin size={18} className="text-blue-600" />
                  <span>LinkedIn</span>
                </button>
              </div>
            )}
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
              
              <div className="w-full pl-1">
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-md shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-[10px]"
                  >
                     <Briefcase size={14} /> Quick Apply
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

            {/* Quick Apply Button */}
            <div className="px-5 pb-6 pt-2 border-t border-white/10">
                <button 
                    onClick={() => { setShowFullDetails(false); handleApplyStart(); }}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                   <Briefcase size={18} /> Quick Apply
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
                    <h2 className="text-xl font-bold text-white">Quick Apply</h2>
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
                  <div className={`flex items-center gap-2 ${applyStep >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${applyStep >= 1 ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                      {applyStep > 1 ? <CheckCircle2 size={16} className="text-white" /> : <span className="text-xs font-bold">1</span>}
                    </div>
                    <span className="text-xs font-semibold hidden sm:block">Review</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${applyStep >= 2 ? 'bg-cyan-600' : 'bg-slate-700'}`} />
                  <div className={`flex items-center gap-2 ${applyStep >= 2 ? 'text-cyan-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${applyStep >= 2 ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                      {applyStep > 2 ? <CheckCircle2 size={16} className="text-white" /> : <span className="text-xs font-bold">2</span>}
                    </div>
                    <span className="text-xs font-semibold hidden sm:block">Details</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${applyStep >= 3 ? 'bg-cyan-600' : 'bg-slate-700'}`} />
                  <div className={`flex items-center gap-2 ${applyStep >= 3 ? 'text-cyan-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${applyStep >= 3 ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <span className="text-xs font-semibold hidden sm:block">Submit</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Submitting State */}
                {applyState === 'submitting' && (
                  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-white mb-2">Submitting your application...</p>
                    <p className="text-sm text-gray-400">Please wait a moment</p>
                  </div>
                )}

                {/* Success State */}
                {applyState === 'success' && (
                  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} className="text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Application Submitted!</h3>
                    <p className="text-sm text-gray-400 text-center mb-6 max-w-md">
                      Your application for <span className="text-white font-semibold">{job.jobTitle}</span> at <span className="text-white font-semibold">{job.companyName}</span> has been successfully submitted.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 w-full max-w-md">
                      <p className="text-xs text-gray-500 mb-2">What's next?</p>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span>The company will review your application</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span>You'll receive an email confirmation shortly</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Check your email for updates</span>
                        </li>
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
                        <p className="font-semibold mb-1">What happens next?</p>
                        <p className="text-blue-400/80">Your application will be sent directly to {job.companyName}. They may contact you via email.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStep1Next}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {/* Step 2: Fill Details */}
                {applyState !== 'submitting' && applyState !== 'success' && applyStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
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
                        placeholder="your.email@example.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Resume <span className="text-red-400">*</span>
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
                          <span className="text-sm text-gray-400">Upload PDF resume (Max 5MB)</span>
                          <span className="text-xs text-gray-500">or select from saved resumes</span>
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
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Cover Letter (Optional)
                      </label>
                      <textarea
                        value={userInfo.coverLetter}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, coverLetter: e.target.value }))}
                        placeholder="Add a note to your application..."
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white placeholder-gray-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">This will be included with your application</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setApplyStep(1)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button
                        onClick={handleStep2Next}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        Continue <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {applyState !== 'submitting' && applyState !== 'success' && applyStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-lg font-bold text-white mb-4">Review your application</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Position</p>
                          <p className="text-sm text-white font-semibold">{job.jobTitle}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Name</p>
                          <p className="text-sm text-white">{userInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                          <p className="text-sm text-white">{userInfo.email}</p>
                        </div>
                        {userInfo.phone && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                            <p className="text-sm text-white">{userInfo.phone}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Resume</p>
                          <p className="text-sm text-white">{resumeFile ? resumeFileName : 'No resume selected'}</p>
                        </div>
                        {userInfo.coverLetter && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Cover Letter</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{userInfo.coverLetter}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setApplyStep(2)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button
                        onClick={handleApplySubmit}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        Submit Application
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
      )}

      {/* --- Comments Modal --- */}
      {showCommentsModal && (
          <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-3xl p-6 pb-24 border-t border-cyan-500/30 animate-fade-in shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <MessageCircle className="text-cyan-400" /> Comments ({commentCount})
                  </h2>
                  <button 
                    onClick={() => setShowCommentsModal(false)} 
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                  >
                      <X size={20} />
                  </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                          <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No comments yet. Be the first to comment!</p>
                      </div>
                  ) : (
                      comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-800/50 rounded-xl p-4">
                              <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                          <span className="text-white font-bold text-xs">
                                              {comment.user.charAt(0).toUpperCase()}
                                          </span>
                                      </div>
                                      <span className="font-bold text-sm text-white">{comment.user}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{comment.time}</span>
                              </div>
                              <p className="text-sm text-gray-300 ml-10 mb-2">{comment.text}</p>
                              <div className="ml-10 flex items-center gap-4">
                                  <button
                                    onClick={() => handleCommentLike(comment.id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${comment.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                  >
                                    <Heart fill={comment.liked ? "currentColor" : "none"} size={14} />
                                    <span>{comment.likeCount > 0 ? comment.likeCount : ''}</span>
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-gray-500"
                  />
                  <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-all active:scale-95"
                  >
                      Send
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};

export default VideoCard;
