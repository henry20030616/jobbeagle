'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobData } from '@/types';
import { 
  Heart, MessageCircle, Share2, MapPin, DollarSign, 
  Briefcase, User, Volume2, VolumeX, AlertCircle, 
  Play, X, Sparkles, Mail, Upload, CheckCircle, Loader2 
} from 'lucide-react';

interface VideoCardProps {
  job: JobData;
  isActive: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ job, isActive }) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [applyState, setApplyState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [videoUrl, setVideoUrl] = useState(job.videoUrl);
  
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

  const handleVideoClick = () => {
      if (showFullDetails || showApplyModal) {
          setShowFullDetails(false);
          setShowApplyModal(false);
          return;
      }
      const video = videoRef.current;
      if (video) {
          video.paused ? video.play() : video.pause();
      }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyState('submitting');
    setTimeout(() => {
      setApplyState('success');
      setTimeout(() => {
        setShowApplyModal(false);
        setApplyState('idle');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden border-b border-gray-800 select-none">
      
      {/* --- Video Layer --- */}
      <div 
        className="absolute inset-0 w-full h-full z-0 flex items-center justify-center bg-gray-900"
        onClick={handleVideoClick}
      >
        {/* Thumbnail Background */}
        <div className="absolute inset-0 z-0">
             {job.logoUrl ? (
                 <img src={job.logoUrl} alt="Logo" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
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
                        <p className="text-white font-bold text-lg drop-shadow-md">影片無法顯示</p>
                    </div>
                 )}
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none z-10"></div>
      </div>

      {/* --- Right Sidebar Actions --- */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-5 z-20 pb-4">
        <div className="flex flex-col items-center gap-1">
            <button className={`p-2.5 rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90 ${liked ? 'text-red-500' : 'text-white'}`} onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
              <Heart fill={liked ? "currentColor" : "none"} size={26} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">8.2k</span>
        </div>

        <div className="flex flex-col items-center gap-1">
            <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-transform active:scale-90">
              <MessageCircle size={26} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">240</span>
        </div>

        <div className="flex flex-col items-center gap-1">
             <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-transform active:scale-90">
              <Share2 size={26} />
            </button>
            <span className="text-[10px] font-semibold drop-shadow-md text-white">Share</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 mt-2">
            <button 
                onClick={toggleMute} 
                className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white transition-transform active:scale-90"
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
                     {job.logoUrl ? (
                        <img 
                            src={job.logoUrl} 
                            alt="Logo" 
                            className="w-11 h-11 rounded-full border border-white/50 bg-white object-contain shadow-md" 
                        />
                     ) : (
                        <div className="w-11 h-11 rounded-full border border-white/50 bg-gray-700 flex items-center justify-center shadow-md">
                            <User size={20} className="text-white" />
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
                  <div 
                    className="text-[10px] text-gray-200 cursor-pointer flex items-end w-full"
                    onClick={() => setShowFullDetails(true)}
                  >
                    <p className="line-clamp-1 opacity-90 mr-1">{job.description}</p>
                    <span className="text-white font-bold whitespace-nowrap opacity-100 hover:underline">...更多</span>
                  </div>
              </div>
              
              <div className="w-full pl-1">
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-md shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-[10px]"
                  >
                     <Briefcase size={14} /> 一鍵應徵
                  </button>
              </div>
            </div>
          </div>
      )}

      {/* --- Full Details Modal --- */}
      {showFullDetails && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl rounded-t-2xl border-t border-white/10 p-5 pb-24 animate-fade-in">
            <div className="w-full flex justify-center mb-2" onClick={() => setShowFullDetails(false)}>
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                     {job.logoUrl ? (
                        <img src={job.logoUrl} className="w-10 h-10 rounded-full border border-white/20 bg-white object-contain" alt="logo"/>
                     ) : <div className="w-10 h-10 bg-gray-700 rounded-full"></div>}
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{job.jobTitle}</h2>
                        <div className="text-sm font-semibold text-gray-400">@{job.companyName}</div>
                    </div>
                </div>
                <button onClick={() => setShowFullDetails(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20">
                    <X size={20} className="text-gray-300" />
                </button>
            </div>

            <div className="text-sm text-gray-300 leading-relaxed max-h-60 overflow-y-auto mb-6 pr-2 whitespace-pre-wrap">
                {job.description}
            </div>

            <button 
                onClick={() => { setShowFullDetails(false); setShowApplyModal(true); }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
               <Briefcase size={18} /> 一鍵應徵
            </button>
        </div>
      )}

      {/* --- Easy Apply Modal --- */}
      {showApplyModal && (
          <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-3xl p-6 pb-24 border-t border-cyan-500/30 animate-fade-in shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <Mail className="text-cyan-400" /> 一鍵應徵
                  </h2>
                  <button onClick={() => setShowApplyModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                      <X size={20} />
                  </button>
              </div>

              {applyState === 'idle' && (
                  <form onSubmit={handleApplySubmit} className="space-y-5 animate-fade-in">
                      <div className="text-sm text-gray-400 mb-2">
                          正在應徵：<span className="text-white font-bold">{job.jobTitle}</span> @ <span className="text-cyan-300">{job.companyName}</span>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">姓名</label>
                          <input required type="text" placeholder="您的姓名" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">上傳履歷 (Resume)</label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-800/50 cursor-pointer transition-all"
                          >
                              <Upload size={24} className="text-gray-400" />
                              <span className="text-xs text-gray-400">點擊上傳 PDF (Max 5MB)</span>
                              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" />
                          </div>
                      </div>

                      <div className="bg-cyan-900/10 p-3 rounded-lg border border-cyan-900/30 text-[10px] text-cyan-300 italic">
                          您的履歷將直接寄送至該公司徵才信箱。
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                      >
                          確認應徵
                      </button>
                  </form>
              )}

              {applyState === 'submitting' && (
                  <div className="py-20 flex flex-col items-center justify-center animate-fade-in">
                      <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                      <p className="text-lg font-bold">正在遞交您的應徵申請...</p>
                  </div>
              )}

              {applyState === 'success' && (
                  <div className="py-20 flex flex-col items-center justify-center animate-fade-in">
                      <CheckCircle size={64} className="text-green-500 mb-4 animate-bounce" />
                      <p className="text-xl font-bold">應徵申請已送出！</p>
                      <p className="text-sm text-gray-400 mt-2 text-center">招募團隊將會直接透過您的 Email 與您聯繫。</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default VideoCard;
