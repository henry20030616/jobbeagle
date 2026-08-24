'use client';

import { AppLanguage } from '@/lib/language-context';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { JobData } from '@/types';
import AnalysisModal from './AnalysisModal';
import ShortsSheet from './ShortsSheet';
import { 
  Heart, Share2, MapPin, DollarSign, 
  Briefcase, User, Volume2, VolumeX, AlertCircle, 
  Play, X, Mail, Upload, CheckCircle, Loader2, UserPlus, 
  Bookmark, Copy, Facebook, Twitter, Linkedin, 
  FileText, ChevronRight, ChevronLeft, CheckCircle2, Info, Sparkles, ExternalLink,
  MessageCircle, Link as LinkIcon, Building2, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { translateApiError } from '@/lib/api-errors';
import { toYouTubeEmbedUrl, toFacebookEmbedUrl, normalizeInstagramUrl } from '@/lib/video-embed';
import { createPortal } from 'react-dom';
import { FIT_ZOOM_CSS_VAR, SHORTS_DESIGN_WIDTH } from '@/constants/fit-stage';

interface VideoCardProps {
  job: JobData;
  isActive: boolean;
  isFollowed?: boolean;
  isBookmarked?: boolean;
  onFollowChange?: (companyName: string, followed: boolean) => void;
  onSaveChange?: (jobId: string, saved: boolean, jobData?: JobData) => void;
  language?: AppLanguage;
}

const VideoCard: React.FC<VideoCardProps> = ({
  job, isActive, isFollowed = false, isBookmarked = false,
  onFollowChange, onSaveChange, language = 'en',
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [followed, setFollowed] = useState(isFollowed);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  // Read localStorage sound preference; default muted (required for browser autoplay policy)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('jobbeagle_sound_pref') !== 'on';
  });
  const [showSoundHint, setShowSoundHint] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [applyState, setApplyState] = useState<'idle' | 'step1' | 'step2' | 'submitting' | 'success'>('idle');
  const [applyEmailSent, setApplyEmailSent] = useState(true);
  const [applyStep, setApplyStep] = useState<1 | 2 | 3>(1);
  const [videoUrl, setVideoUrl] = useState(job.videoUrl);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  /** 與首頁／AI 分析共用：Supabase resume_history */
  const [savedResumeRows, setSavedResumeRows] = useState<
    { id: string; type: 'text' | 'file'; content: string; mimeType: string | null; fileName: string }[]
  >([]);
  const [loadingSavedResumes, setLoadingSavedResumes] = useState(false);
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState<string | null>(null);
  const [applyResumeLoggedIn, setApplyResumeLoggedIn] = useState(false);
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
  const [hasApplied, setHasApplied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const lastTapRef = useRef<number>(0);
  const likeLoadedRef = useRef(false);
  const [ytPaused, setYtPaused] = useState(false);

  const railBtnClass =
    'p-3 min-w-[3rem] min-h-[3rem] flex items-center justify-center rounded-full bg-black/55 backdrop-blur-md border border-white/20 transition-all active:scale-90 hover:scale-105';

  const getJobShareUrl = () => `${window.location.origin}/shorts?job=${encodeURIComponent(job.id)}`;

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
  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverLetterFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 無論任何影片類型，inactive 時都關閉 overlay
    if (!isActive) {
      setShowFullDetails(false);
      setShowApplyModal(false);
      setYtPaused(false);
    }

    const video = videoRef.current;
    if (!video) return; // embed 類型沒有 <video> 元素，跳出

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
    }
  }, [isActive, job.id, videoUrl]);

  // Listen for global "sound enabled" event dispatched by the shorts page overlay
  useEffect(() => {
    const handler = () => {
      setIsMuted(false);
      setShowSoundHint(false);
      // Native <video> — unmute immediately
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => { /* already playing */ });
      }
      // YouTube iframe — send unMute postMessage immediately (before src update)
      if (youtubeIframeRef.current?.contentWindow) {
        youtubeIframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"unMute","args":""}', '*'
        );
        youtubeIframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"setVolume","args":[100]}', '*'
        );
      }
      // setIsMuted(false) causes re-render → toYouTubeEmbedUrl(url, false) → iframe src
      // changes to mute=0 → YouTube reloads with audio as a fallback if postMessage was too early.
    };
    window.addEventListener('jobbeagle:soundEnabled', handler);
    return () => window.removeEventListener('jobbeagle:soundEnabled', handler);
  }, []);

  // Show sound hint on first-ever active video (only if no preference set yet)
  useEffect(() => {
    if (!isActive) { setShowSoundHint(false); return; }
    if (isMuted && !localStorage.getItem('jobbeagle_sound_pref')) {
      setShowSoundHint(true);
      const t = setTimeout(() => setShowSoundHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  // 觀看計數：active 超過 3 秒才算一次（debounce，避免快速滑過被計算）
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => {
      fetch(`/api/shorts/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: job.id }),
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [isActive, job.id]);

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

  /** 關閉一鍵申請時清空履歷選擇（與 AnalysisModal 同源 resume_history） */
  useEffect(() => {
    if (showApplyModal) return;
    setResumeFile(null);
    setResumeFileName('');
    setSelectedSavedResumeId(null);
    setSavedResumeRows([]);
    setApplyResumeLoggedIn(false);
    setAgreedToTerms(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [showApplyModal]);

  /** 進入步驟 2 時載入已儲存履歷（最多 3 筆） */
  useEffect(() => {
    if (!showApplyModal || applyStep !== 2) return;
    let cancelled = false;
    const loadSavedResumes = async () => {
      setLoadingSavedResumes(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setApplyResumeLoggedIn(!!user);
        if (!user) {
          setSavedResumeRows([]);
          return;
        }
        const { data } = await supabase
          .from('resume_history')
          .select('id, type, content, mime_type, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        if (cancelled || !data) return;
        setSavedResumeRows(
          data.map((item: { id: string; type: string; content: string; mime_type: string | null; file_name: string | null }) => ({
            id: item.id,
            type: item.type === 'file' ? 'file' as const : 'text' as const,
            content: item.content,
            mimeType: item.mime_type,
            fileName: item.file_name || 'resume',
          })),
        );
      } catch {
        if (!cancelled) setSavedResumeRows([]);
      } finally {
        if (!cancelled) setLoadingSavedResumes(false);
      }
    };
    loadSavedResumes();
    return () => { cancelled = true; };
  }, [showApplyModal, applyStep]);

  // Check if user already applied for this job
  useEffect(() => {
    if (!job.id || job.id.startsWith('video-')) return;
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let email = user?.email || userInfo.email || '';
      if (!email) return;
      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('applicant_email', email.trim().toLowerCase())
        .maybeSingle();
      setHasApplied(!!data);
    };
    void check();
  }, [job.id, userInfo.email, isActive]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setShowSoundHint(false);
    // Persist preference so subsequent videos start at user's chosen state
    localStorage.setItem('jobbeagle_sound_pref', newMuted ? 'off' : 'on');

    const sourceType = job.videoSourceType ?? 'upload';

    // Native <video> — muted prop is reactive, no extra action needed
    if (sourceType === 'upload') return;

    // YouTube IFrame API — send postMessage command
    if (sourceType === 'youtube') {
      const iframe = youtubeIframeRef.current;
      if (iframe?.contentWindow) {
        const cmd = newMuted
          ? '{"event":"command","func":"mute","args":""}'
          : '{"event":"command","func":"unMute","args":""}';
        iframe.contentWindow.postMessage(cmd, '*');
      }
      return;
    }

    // Facebook / Instagram / external — native player controls sound;
    // we can't control their iframes. Show a brief visual hint by toggling icon only.
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
    const shareUrl = getJobShareUrl();
    const shareData = {
      title: `${job.jobTitle} @ ${job.companyName}`,
      text: job.description,
      url: shareUrl,
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
      await navigator.clipboard.writeText(getJobShareUrl());
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
    const jobUrl = getJobShareUrl();
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
      toast.textContent = (language === 'zh-TW' || language === 'zh-CN') ? '企業頁面連結已複製！' : 'Company page link copied!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch { /* silent */ }
  };


  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = !bookmarked;
    setBookmarked(newSaved);
    if (onSaveChange) onSaveChange(job.id, newSaved, newSaved ? job : undefined);
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

  const sendYouTubeCommand = (func: 'playVideo' | 'pauseVideo' | 'mute' | 'unMute') => {
    youtubeIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*',
    );
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
          return;
      }
      if (youtubeIframeRef.current) {
        const nextPaused = !ytPaused;
        setYtPaused(nextPaused);
        sendYouTubeCommand(nextPaused ? 'pauseVideo' : 'playVideo');
      }
  };


  const t = (zh: string, en: string) => (language === 'zh-TW' || language === 'zh-CN') ? zh : en;

  const handleApplyStart = async (e?: React.MouseEvent, prefillResumeId?: string) => {
    e?.stopPropagation();
    if (hasApplied) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const msg = t('請先登入後再申請，以便追蹤申請記錄。', 'Please sign in to apply and track your application history.');
      if (window.confirm(`${msg}\n\n${t('是否現在登入？', 'Sign in now?')}`)) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/shorts?job=${job.id}`)}&type=talent`,
          },
        });
      }
      return;
    }

    setShowApplyModal(true);
    setApplyState('step1');
    if (prefillResumeId) {
      setSelectedSavedResumeId(prefillResumeId);
      setApplyStep(2);
    } else {
      setApplyStep(1);
    }
  };

  const handleApplyFromAnalysis = (resumeId: string) => {
    setShowAnalysisModal(false);
    void handleApplyStart(undefined, resumeId);
  };

  const base64ToFile = (base64: string, fileName: string, mime: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], fileName, { type: mime || 'application/pdf' });
  };

  const fileFromSavedResumeRow = (row: { type: 'text' | 'file'; content: string; mimeType: string | null; fileName: string }) => {
    if (row.type === 'file') {
      const mime = row.mimeType || 'application/pdf';
      return base64ToFile(row.content, row.fileName || 'resume.pdf', mime);
    }
    const name = row.fileName?.toLowerCase().endsWith('.txt') ? row.fileName : `${row.fileName || 'resume'}.txt`;
    return new File([row.content], name, { type: 'text/plain;charset=utf-8' });
  };

  const defaultAppMessage = () => (language === 'zh-TW' || language === 'zh-CN')
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
    if (!resumeFile && !selectedSavedResumeId) {
      alert(t('請選擇已儲存履歷或上傳 PDF', 'Please choose a saved resume or upload a PDF'));
      return;
    }
    saveUserInfo();
    setApplyStep(3);
  };

  const handleApplySubmit = async () => {
    if (!agreedToTerms) {
      alert(t('請勾選同意服務條款與隱私權政策', 'Please agree to the Terms of Service and Privacy Policy'));
      return;
    }
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

      let resumeFileForUpload: File | null = resumeFile;
      let finalResumeFileName = resumeFileName;
      if (!resumeFileForUpload && selectedSavedResumeId) {
        const row = savedResumeRows.find((r) => r.id === selectedSavedResumeId);
        if (!row) {
          throw new Error(t('找不到已選履歷，請回到上一步重選', 'Selected resume not found. Go back and choose again.'));
        }
        try {
          resumeFileForUpload = fileFromSavedResumeRow(row);
          finalResumeFileName = row.fileName || resumeFileForUpload.name;
        } catch {
          throw new Error(t('履歷檔案無法讀取，請改上傳新檔', 'Could not read saved resume. Please upload a new file.'));
        }
      }

      const resumeUrl = resumeFileForUpload ? await uploadToStorage(resumeFileForUpload, 'resume') : null;
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
          resumeFileName: finalResumeFileName,
        }),
      });

      const resData = await res.json();

      // 409 — already applied
      if (res.status === 409) {
        setApplyState('idle');
        setShowApplyModal(false);
        alert(translateApiError(resData.errorCode, resData.error, language));
        return;
      }

      // 429 — rate limited
      if (res.status === 429) {
        setApplyState('idle');
        alert(translateApiError(resData.errorCode, resData.error, language));
        return;
      }

      if (!res.ok) {
        throw new Error(translateApiError(resData.errorCode, resData.error, language));
      }

      // Track whether the employer notification email was actually sent
      setApplyEmailSent(resData.emailSent !== false);
      setApplyState('success');
      setHasApplied(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplyState('idle');
        setApplyStep(1);
        setResumeFile(null);
        setResumeFileName('');
        setSelectedSavedResumeId(null);
        setApplicationMessage('');
        setCoverLetterFile(null);
        setCoverLetterFileName('');
        setCoverLetterMode('text');
        setApplyEmailSent(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (coverLetterFileRef.current) coverLetterFileRef.current.value = '';
      }, 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('申請時發生錯誤，請稍後再試', 'An error occurred. Please try again.');
      console.error('Apply error:', msg);
      alert(msg);
      setApplyState('idle');
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

        {/* ─────── Video / Embed Player ─────── */}
        {(() => {
          const sourceType = job.videoSourceType ?? 'upload';

          // ── YouTube embed ──
          if (sourceType === 'youtube' && videoUrl) {
            // Pass isMuted so when user enables sound, src regenerates without mute=1
            const embedSrc = toYouTubeEmbedUrl(videoUrl, isMuted);
            if (embedSrc && isActive) {
              return (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  <iframe
                    ref={youtubeIframeRef}
                    src={embedSrc}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-full w-auto min-h-full aspect-video max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.35] border-0"
                    allow="autoplay; encrypted-media"
                    title="YouTube 短影音"
                  />
                </div>
              );
            }
            return (
              <div className="z-10 flex flex-col items-center justify-center gap-3 text-white/70">
                <span className="text-5xl">▶</span>
                <p className="text-sm font-medium">YouTube</p>
              </div>
            );
          }

          // ── Facebook embed ──
          if (sourceType === 'facebook' && videoUrl) {
            const fbSrc = toFacebookEmbedUrl(videoUrl);
            if (fbSrc && isActive) {
              return (
                <iframe
                  src={fbSrc}
                  className="w-full h-full z-0 border-0 pointer-events-none"
                  allow="autoplay; encrypted-media"
                  title="Facebook 影片"
                  scrolling="no"
                />
              );
            }
            return (
              <div className="z-10 flex flex-col items-center justify-center gap-3 text-white/70">
                <span className="text-5xl">📘</span>
                <p className="text-sm font-medium">Facebook</p>
              </div>
            );
          }

          // ── Instagram embed ──
          if (sourceType === 'instagram' && videoUrl) {
            if (isActive) {
              const igUrl = normalizeInstagramUrl(videoUrl);
              return (
                <div className="w-full h-full z-10 overflow-hidden flex items-center justify-center bg-black">
                  {/* Instagram 官方 blockquote embed；embed.js 由 layout 或此元件動態注入 */}
                  <blockquote
                    className="instagram-media"
                    data-instgrm-captioned
                    data-instgrm-permalink={igUrl}
                    data-instgrm-version="14"
                    style={{
                      background: '#000',
                      border: 0,
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  >
                    <a href={igUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs p-4 block text-center">
                      {t('前往 Instagram 觀看原貼文', 'View original post on Instagram')}
                    </a>
                  </blockquote>
                  <IGEmbedScript />
                </div>
              );
            }
            return (
              <div className="z-10 flex flex-col items-center justify-center gap-3 text-white/70">
                <span className="text-5xl">📸</span>
                <p className="text-sm font-medium">Instagram</p>
              </div>
            );
          }

          // ── External / unknown link fallback ──
          if (sourceType === 'external' && videoUrl) {
            return (
              <div className="z-10 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="text-5xl">🔗</span>
                <p className="text-white/80 text-sm font-medium">{t('此影片在外部平台', 'Video hosted on external platform')}</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  {t('前往觀看影片', 'Watch Video')}
                </a>
              </div>
            );
          }

          // ── Default: native video (upload 或 mp4 直連) ──
          if (isActive && !hasError && videoUrl) {
            return (
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
            );
          }

          // ── Inactive / error / no video ──
          return (
            <div className="z-10 flex flex-col items-center justify-center text-center p-8">
              {!isActive && !hasError && <Play size={48} className="text-white/50 mb-4" />}
              {hasError && (
                <div className="flex flex-col items-center animate-fade-in gap-3">
                  <AlertCircle size={48} className="text-red-500 mb-2" />
                  <p className="text-white font-bold text-lg drop-shadow-md">Video unavailable</p>
                  <p className="text-white/80 text-sm drop-shadow max-w-[300px] text-center">
                    {videoUrl?.includes('drive.google.com')
                      ? t('此為 Google 雲端硬碟連結，無法直接當影片播放。請使用 Supabase 上傳或貼社群平台連結。', 'Google Drive links cannot be played directly. Please upload via Supabase or paste a social platform URL.')
                      : t('影片無法載入。請確認影片連結為直接影片網址（.mp4），或改用社群平台連結。', 'Video could not load. Please check the URL is a direct video link (.mp4) or use a social platform link.')}
                  </p>
                  {videoUrl && (
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline" onClick={e => e.stopPropagation()}>
                      {t('在新分頁開啟連結檢查', 'Open link in new tab to check')}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        
        {ytPaused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/55 p-5 border border-white/20">
              <Play size={40} className="text-white fill-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none z-10"></div>

        {/* Sound hint — appears briefly when first video plays muted and user has never set a preference */}
        {showSoundHint && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-fade-in"
            aria-hidden
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-white text-sm font-semibold shadow-xl">
              <VolumeX size={18} className="text-white/80" />
              <span>Tap 🔊 to enable sound</span>
            </div>
          </div>
        )}
      </div>

      {/* --- Right Sidebar Actions --- */}
      <div className="absolute right-3 bottom-[11.5rem] flex flex-col items-center gap-3 z-30 pb-2">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1.5">
            <button 
              className={`${railBtnClass} ${liked ? 'text-red-500' : 'text-white'}`}
              onClick={handleLike}
            >
              <Heart fill={liked ? "currentColor" : "none"} size={26} className={liked ? 'animate-pulse' : ''} />
            </button>
            <span className="text-sm md:text-base font-bold drop-shadow-md text-white tabular-nums">
              {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </span>
        </div>

        {/* Follow Button */}
        <div className="flex flex-col items-center gap-1.5">
            <button 
              className={`${railBtnClass} ${followed ? 'text-cyan-400' : 'text-white'}`}
              onClick={handleFollow}
            >
              <UserPlus fill={followed ? "currentColor" : "none"} size={26} className={followed ? 'animate-pulse' : ''} />
            </button>
            <span className="text-sm md:text-base font-bold drop-shadow-md text-white max-w-[4.5rem] text-center leading-tight">
              {followed ? 'Followed' : 'Follow'}
            </span>
        </div>

        {/* Bookmark Button */}
        <div className="flex flex-col items-center gap-1.5">
            <button 
              className={`${railBtnClass} ${bookmarked ? 'text-yellow-400' : 'text-white'}`}
              onClick={handleBookmark}
            >
              <Bookmark fill={bookmarked ? "currentColor" : "none"} size={26} className={bookmarked ? 'animate-pulse' : ''} />
            </button>
            <span className="text-sm md:text-base font-bold drop-shadow-md text-white">
              {bookmarked ? 'Saved' : 'Save'}
            </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            className={`${railBtnClass} text-white`}
            onClick={handleShareClick}
          >
            <Share2 size={26} />
          </button>
          <span className="text-sm md:text-base font-bold drop-shadow-md text-white">{(language === 'zh-TW' || language === 'zh-CN') ? '分享' : 'Share'}</span>
        </div>
        
        {/* Mute Toggle — shown for all video types.
            Upload: directly controls <video>.muted
            YouTube: uses postMessage / enablejsapi
            FB / IG / external: toggles icon; user uses platform native controls */}
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <button
            onClick={toggleMute}
            className={`${railBtnClass} text-white`}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>

      {/* --- Bottom: title then Match / Apply (phone column, not 3-col squeeze) --- */}
      {(!showFullDetails && !showApplyModal) && (
          <div className="absolute bottom-0 left-0 w-full z-30 text-white pb-3 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
            <div className="pointer-events-auto px-3 w-full flex flex-col gap-3">
                <div className="min-w-0 flex flex-col justify-end gap-1.5 pr-16">
                  <div className="flex flex-row items-center gap-2 min-h-0 shrink-0">
                    <Link
                      href={`/shorts/company/${encodeURIComponent(job.companyName)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 rounded-full ring-2 ring-transparent hover:ring-white/50 transition-shadow"
                      aria-label={(language === 'zh-TW' || language === 'zh-CN') ? `查看 ${job.companyName} 公開主頁` : `View ${job.companyName} public page`}
                    >
                      {job.logoUrl && !logoError ? (
                        <img
                          src={job.logoUrl}
                          alt=""
                          className="w-11 h-11 rounded-full border border-white/40 bg-white object-contain shadow-lg"
                          onError={() => setLogoError(true)}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full border border-white/40 bg-gray-700 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {job.companyName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-col min-w-0 gap-0 justify-center">
                      <h3 className="text-xl font-extrabold drop-shadow-lg leading-snug line-clamp-2">
                        {job.jobTitle}
                      </h3>
                      <Link
                        href={`/shorts/company/${encodeURIComponent(job.companyName)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-bold drop-shadow-md truncate text-white/90 hover:underline text-left"
                      >
                        @{job.companyName}
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-nowrap gap-1.5 text-sm min-h-0 shrink-0 overflow-hidden">
                    <span className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-md text-gray-100 border border-white/10 min-w-0 max-w-[50%]">
                      <MapPin size={14} className="shrink-0 opacity-90" />
                      <span className="truncate">{job.location}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-emerald-950/70 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-500/25 min-w-0 max-w-[50%]">
                      <DollarSign size={14} className="shrink-0 opacity-90" />
                      <span className="truncate">{job.salary}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 min-w-0 text-sm text-gray-100/95 leading-snug">
                    <p className="line-clamp-1 min-w-0 flex-1 break-words">{job.description}</p>
                    <button
                      type="button"
                      className="text-white font-bold hover:underline cursor-pointer active:scale-95 transition-transform shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullDetails(true);
                      }}
                    >
                      ...more
                    </button>
                  </div>
                </div>

                <div className={`grid gap-2 ${job.applyUrl ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {!job.applyUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyzeWithAI(e);
                      }}
                      className="w-full h-12 shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg flex flex-row items-center justify-center gap-2 transition-colors active:scale-[0.99] text-base border border-violet-400/20 px-3"
                    >
                      <Sparkles size={22} className="shrink-0" />
                      <span className="text-center leading-tight line-clamp-2">
                        {(language === 'zh-TW' || language === 'zh-CN') ? 'AI 匹配度分析' : 'AI Match'}
                      </span>
                    </button>
                )}

                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-12 shrink-0 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.99] text-base border border-white/10 px-3"
                    >
                      <ExternalLink size={18} className="shrink-0" /> {(language === 'zh-TW' || language === 'zh-CN') ? '套用' : 'Apply'}
                    </a>
                  ) : hasApplied ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-12 shrink-0 bg-slate-700 text-slate-300 font-bold rounded-2xl flex flex-row items-center justify-center gap-2 text-base border border-slate-600 px-3 cursor-not-allowed"
                    >
                      <CheckCircle size={16} className="shrink-0 text-emerald-400" />
                      <span className="text-center leading-tight">{t('已申請', 'Applied')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { void handleApplyStart(e); }}
                      className="w-full h-12 shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg flex flex-row items-center justify-center gap-2 transition-colors active:scale-[0.99] text-base border border-cyan-400/25 px-3"
                    >
                      <Briefcase size={22} className="shrink-0" />
                      <span className="text-center leading-tight line-clamp-2">
                        {(language === 'zh-TW' || language === 'zh-CN') ? '一鍵申請' : 'Quick Apply'}
                      </span>
                    </button>
                  )}
                </div>
            </div>
          </div>
      )}

      {/* --- Full Details Sheet (portaled — must not live inside VideoCard overflow:hidden) --- */}
      {showFullDetails && (
        <ShortsSheet onBackdropClick={() => setShowFullDetails(false)} accentClass="border-white/10">
            {/* Drag Handle */}
            <div className="flex w-full shrink-0 cursor-pointer justify-center pb-2 pt-3" onClick={() => setShowFullDetails(false)}>
                <div className="h-1.5 w-14 rounded-full bg-gray-600 transition-colors hover:bg-gray-500" />
            </div>

            {/* Header */}
            <div className="mb-4 flex shrink-0 items-start justify-between gap-3 px-5">
                <div className="flex min-w-0 items-center gap-3">
                     <Link
                       href={`/shorts/company/${encodeURIComponent(job.companyName)}`}
                       onClick={(e) => e.stopPropagation()}
                       className="flex-shrink-0 rounded-full transition-opacity hover:opacity-90"
                       aria-hidden
                     >
                     {job.logoUrl && !logoError ? (
                        <img 
                            src={job.logoUrl} 
                            className="h-14 w-14 rounded-full border border-white/20 bg-white object-contain" 
                            alt=""
                            onError={() => setLogoError(true)}
                        />
                     ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700">
                            <span className="text-lg font-bold text-white">
                                {job.companyName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                     )}
                     </Link>
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold leading-snug text-white">{job.jobTitle}</h2>
                        <Link
                          href={`/shorts/company/${encodeURIComponent(job.companyName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-base font-semibold text-gray-400 hover:text-blue-400 hover:underline"
                        >
                          @{job.companyName}
                        </Link>
                    </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowFullDetails(false)} 
                  className="shrink-0 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                >
                    <X size={22} className="text-gray-300" />
                </button>
            </div>

            {/* Meta chips */}
            <div className="mb-3 flex shrink-0 flex-wrap gap-2 px-5 text-sm">
              <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-slate-800/90 px-2 py-1 text-gray-100">
                <MapPin size={14} className="shrink-0 opacity-90" />
                <span className="truncate">{job.location}</span>
              </span>
              <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-950/70 px-2 py-1 text-emerald-200">
                <DollarSign size={14} className="shrink-0 opacity-90" />
                <span className="truncate">{job.salary}</span>
              </span>
            </div>

            {/* Job Description - Scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
                <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-200">
                    {job.description?.trim()
                      ? job.description
                      : t('此職缺尚未提供詳細說明。', 'No detailed description was provided for this job.')}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 border-t border-white/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              {job.applyUrl ? (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-700 px-4 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-slate-600 active:scale-[0.99]"
                >
                  <ExternalLink size={20} />
                  <span>{t('套用（前往企業申請頁）', 'Apply on Company Site')}</span>
                </a>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleAnalyzeWithAI(e)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-violet-500 active:scale-[0.99]"
                  >
                    <Sparkles size={20} className="shrink-0" />
                    <span className="text-center leading-tight">{t('AI 匹配度分析', 'AI Match')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullDetails(false);
                      void handleApplyStart();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-cyan-500 active:scale-[0.99]"
                  >
                    <Briefcase size={20} className="shrink-0" />
                    <span className="text-center leading-tight">{t('一鍵申請', 'Quick Apply')}</span>
                  </button>
                </div>
              )}
            </div>
        </ShortsSheet>
      )}

      {/* --- LinkedIn-style Quick Apply Modal --- */}
      {showApplyModal && (
          <ShortsSheet
            accentClass="border-cyan-500/30"
            onBackdropClick={() => {
              if (applyState === 'step1' || applyState === 'idle') {
                setShowApplyModal(false);
                setApplyState('idle');
                setApplyStep(1);
              }
            }}
          >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{(language === 'zh-TW' || language === 'zh-CN') ? '一鍵申請' : 'Quick Apply'}</h2>
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
              <div className="px-6 py-4 border-b border-slate-700 shrink-0">
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
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
                    {/* Email-not-sent notice */}
                    {!applyEmailSent && (
                      <div className="w-full max-w-md mb-4 flex items-start gap-3 bg-amber-900/20 border border-amber-500/40 rounded-lg p-4">
                        <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200">
                          {t(
                            '您的資料已儲存，但企業通知信目前無法寄送。您的應徵紀錄已儲存於企業後台，企業仍可查看。',
                            'Your application was saved, but the email notification to the employer could not be sent. Your application is still visible in the employer dashboard.'
                          )}
                        </p>
                      </div>
                    )}
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

                      {loadingSavedResumes && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm py-2 mb-2">
                          <Loader2 size={15} className="animate-spin" />
                          {t('載入儲存的履歷…', 'Loading saved resumes…')}
                        </div>
                      )}

                      {!loadingSavedResumes && savedResumeRows.length > 0 && !resumeFile && !selectedSavedResumeId && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                            <Clock size={11} className="shrink-0" />
                            {t('使用已儲存履歷（與首頁相同）', 'Use saved resume (same as homepage)')}
                          </div>
                          {savedResumeRows.map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => {
                                setSelectedSavedResumeId(row.id);
                                setResumeFile(null);
                                setResumeFileName('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className={`w-full flex items-center gap-3 rounded-xl p-3 mb-2 transition-all text-left border ${
                                selectedSavedResumeId === row.id
                                  ? 'bg-cyan-900/40 border-cyan-500'
                                  : 'bg-slate-800 hover:bg-slate-800/80 border-slate-700'
                              }`}
                            >
                              <FileText size={19} className="text-cyan-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                  {row.fileName || (row.type === 'text' ? t('文字履歷', 'Text resume') : t('履歷檔', 'Resume file'))}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {row.type === 'text' ? t('將以 .txt 上傳', 'Will upload as .txt') : (row.mimeType?.includes('pdf') ? 'PDF' : t('檔案', 'File'))}
                                </div>
                              </div>
                              <span className="text-xs text-cyan-400 font-bold shrink-0">
                                {selectedSavedResumeId === row.id ? t('已選', 'Selected') : t('選擇', 'Select')}
                              </span>
                            </button>
                          ))}
                          <div className="relative flex items-center my-3">
                            <div className="flex-1 border-t border-slate-700" />
                            <span className="px-3 text-xs text-gray-600">{t('或上傳新 PDF', 'or upload new PDF')}</span>
                            <div className="flex-1 border-t border-slate-700" />
                          </div>
                        </div>
                      )}

                      {!loadingSavedResumes && applyResumeLoggedIn && savedResumeRows.length === 0 && !resumeFile && !selectedSavedResumeId && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 mb-3">
                          {t('尚無儲存履歷：於首頁分析或上傳後可在此一鍵使用。', 'No saved resume yet. Save one from the homepage to use here next time.')}
                        </div>
                      )}

                      {!loadingSavedResumes && !applyResumeLoggedIn && !resumeFile && !selectedSavedResumeId && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 mb-3">
                          {t('登入後可同步首頁已儲存履歷，免重複上傳。', 'Sign in to use resumes saved on the homepage without re-uploading.')}
                        </div>
                      )}

                      {resumeFile ? (
                        <div className="w-full border-2 border-cyan-500/50 rounded-lg p-4 flex items-center justify-between bg-slate-800/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={20} className="text-cyan-400 shrink-0" />
                            <span className="text-sm text-white font-medium truncate">{resumeFileName}</span>
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
                            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : selectedSavedResumeId ? (
                        <div className="w-full border-2 border-cyan-500/50 rounded-lg p-4 flex items-center justify-between bg-slate-800/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={20} className="text-cyan-400 shrink-0" />
                            <span className="text-sm text-white font-medium truncate">
                              {savedResumeRows.find((r) => r.id === selectedSavedResumeId)?.fileName || t('已儲存履歷', 'Saved resume')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedSavedResumeId(null)}
                            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all shrink-0"
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
                            setSelectedSavedResumeId(null);
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
                          {
                            label: t('履歷', 'Resume'),
                            value: resumeFile
                              ? resumeFileName
                              : (selectedSavedResumeId
                                ? (savedResumeRows.find((r) => r.id === selectedSavedResumeId)?.fileName || t('已儲存履歷', 'Saved resume'))
                                : t('未上傳', 'Not uploaded')),
                          },
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
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300">
                        {(language === 'zh-TW' || language === 'zh-CN') ? (
                          <>我同意 <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline" onClick={(e) => e.stopPropagation()}>服務條款</a> 與 <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline" onClick={(e) => e.stopPropagation()}>隱私權政策</a>，並授權將我的申請資料提供給 {job.companyName}。</>
                        ) : (
                          <>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>, and consent to sharing my application with {job.companyName}.</>
                        )}
                      </span>
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setApplyStep(2)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <ChevronLeft size={18} /> {t('上一步', 'Back')}
                      </button>
                      <button onClick={handleApplySubmit}
                        disabled={!agreedToTerms}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                        {t('確認送出', 'Submit Application')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </ShortsSheet>
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
        canApply={!job.applyUrl && !!job.contactEmail && !hasApplied}
        onApplyWithResume={handleApplyFromAnalysis}
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 rounded-t-3xl"
        onClick={e => e.stopPropagation()}
        style={{
          width: SHORTS_DESIGN_WIDTH,
          zoom: `var(${FIT_ZOOM_CSS_VAR}, 1)`,
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-5" />

        {/* Title */}
        <p className="text-white font-bold text-center text-base mb-1">
          {(language === 'zh-TW' || language === 'zh-CN') ? '分享' : 'Share'}
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
              {(language === 'zh-TW' || language === 'zh-CN') ? '系統分享' : 'More'}
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
                ? ((language === 'zh-TW' || language === 'zh-CN') ? '已複製！' : 'Copied!')
                : ((language === 'zh-TW' || language === 'zh-CN') ? '複製連結' : 'Copy Link')}
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
                ? ((language === 'zh-TW' || language === 'zh-CN') ? '已複製！' : 'Copied!')
                : ((language === 'zh-TW' || language === 'zh-CN') ? '複製企業頁面連結' : 'Copy Company Page')}
            </span>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-4">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white/60 text-sm font-medium transition-colors"
          >
            {(language === 'zh-TW' || language === 'zh-CN') ? '取消' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default VideoCard;

/**
 * 一次性注入 Instagram embed.js 腳本（重複呼叫不會重複注入）
 */
function IGEmbedScript() {
  useEffect(() => {
    if (document.getElementById('ig-embed-script')) {
      // 若 instgrm 已存在，重新處理 blockquote
      if ((window as any).instgrm?.Embeds) {
        (window as any).instgrm.Embeds.process();
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'ig-embed-script';
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);
  return null;
}
