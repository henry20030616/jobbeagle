'use client';

import { AppLanguage } from '@/lib/language-context';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Bookmark, Building2, LogIn, Loader2,
  ExternalLink, Trash2, Play, User, ChevronRight,
  MapPin, Heart, Edit2, Check, X, Globe, Mail,
  Upload, Users, DollarSign, Send, Eye, EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { resolveShortsViewMode, setStoredShortsViewRole } from '@/lib/shorts-view-role';
import { JobData } from '@/types';
import { toYouTubeEmbedUrl, toFacebookEmbedUrl, normalizeInstagramUrl } from '@/lib/video-embed';

interface ProfileModalProps {
  onClose: () => void;
  language?: AppLanguage;
}

type PersonalTab = 'resumes' | 'saved' | 'following' | 'applied';
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
  video_source_type?: string;
}
interface CompanyStats { videoCount: number; followerCount: number; totalLikes: number; totalApplications: number; }

interface JobApplicationRow {
  id: string;
  job_id: string | null;
  job_title: string;
  company_name: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  application_message: string | null;
  cover_letter: string | null;
  cover_letter_url: string | null;
  cover_letter_file_name: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  status: string;
  created_at: string;
}

interface AppliedJobRow {
  id: string;
  job_id: string | null;
  job_title: string;
  company_name: string;
  status: string;
  created_at: string;
}

const ProfilePage: React.FC<ProfileModalProps> = ({ onClose, language = 'en' }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ProfileMode>('personal');
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  /** 確認切換個人 / 企業後台視角（與公開企業主頁無關） */
  const [switchConfirm, setSwitchConfirm] = useState<ProfileMode | null>(null);
  /** 刪除 / 上架 / 下架職缺影片前確認 */
  const [videoManageConfirm, setVideoManageConfirm] = useState<
    null | { action: 'delete' | 'unpublish' | 'publish'; video: CompanyVideo }
  >(null);

  // Personal
  const [personalTab, setPersonalTab] = useState<PersonalTab>('resumes');
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobRow[]>([]);

  // Company
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [companyVideos, setCompanyVideos] = useState<CompanyVideo[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats>({ videoCount: 0, followerCount: 0, totalLikes: 0, totalApplications: 0 });
  const [selectedVideo, setSelectedVideo] = useState<CompanyVideo | null>(null);
  const [videoAppCounts, setVideoAppCounts] = useState<Record<string, number>>({});
  const [sheetApplicants, setSheetApplicants] = useState<JobApplicationRow[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Company edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', description: '', website: '', contact_email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Per-video like counts
  const [videoLikes, setVideoLikes] = useState<Record<string, number>>({});
  const [togglingVideo, setTogglingVideo] = useState<string | null>(null);

  const profileTranslations: Record<string, Partial<Record<AppLanguage, string>>> = {
    Profile: { 'zh-TW': '個人頁面', 'zh-CN': '个人页面', es: 'Perfil', hi: 'प्रोफ़ाइल', ar: 'الملف الشخصي' },
    'Login to continue': { 'zh-TW': '登入以使用個人功能', 'zh-CN': '登录以使用个人功能', es: 'Inicia sesión para continuar', hi: 'जारी रखने के लिए लॉग इन करें', ar: 'سجّل الدخول للمتابعة' },
    'Save jobs, follow companies,\nupload job videos': { 'zh-TW': '儲存職缺、追蹤企業、管理履歷\n企業可上傳職缺影片', 'zh-CN': '收藏职位、关注企业、管理简历\n企业可上传职位视频', es: 'Guarda empleos, sigue empresas\ny sube videos de empleo', hi: 'नौकरियां सहेजें, कंपनियों को फॉलो करें\nऔर जॉब वीडियो अपलोड करें', ar: 'احفظ الوظائف وتابع الشركات\nوارفع فيديوهات التوظيف' },
    'Talent Login': { 'zh-TW': '人才登入', 'zh-CN': '人才登录', es: 'Acceso candidato', hi: 'उम्मीदवार लॉगिन', ar: 'دخول الباحث عن عمل' },
    'Employer Login': { 'zh-TW': '企業登入', 'zh-CN': '企业登录', es: 'Acceso empresa', hi: 'नियोक्ता लॉगिन', ar: 'دخول صاحب العمل' },
    'Save jobs & follow companies': { 'zh-TW': '儲存職缺・追蹤企業・管理履歷', 'zh-CN': '收藏职位・关注企业・管理简历', es: 'Guarda empleos y sigue empresas', hi: 'नौकरियां सहेजें और कंपनियों को फॉलो करें', ar: 'احفظ الوظائف وتابع الشركات' },
    'Post jobs & manage applicants': { 'zh-TW': '發布職缺影片・管理申請', 'zh-CN': '发布职位视频・管理申请', es: 'Publica empleos y gestiona candidatos', hi: 'जॉब पोस्ट करें और आवेदकों को प्रबंधित करें', ar: 'انشر الوظائف وأدر المتقدمين' },
    'Company Dashboard': { 'zh-TW': '企業儀表板', 'zh-CN': '企业仪表板', es: 'Panel de empresa', hi: 'कंपनी डैशबोर्ड', ar: 'لوحة الشركة' },
    'Private — only you. Public profile is separate.': { 'zh-TW': '私人後台，僅本人可見。對外請使用「公開企業主頁」。', 'zh-CN': '私人后台，仅本人可见。对外请使用“公开企业主页”。', es: 'Privado: solo tú. El perfil público está separado.', hi: 'निजी: केवल आप। सार्वजनिक प्रोफ़ाइल अलग है।', ar: 'خاص بك فقط. الملف العام منفصل.' },
    Me: { 'zh-TW': '個人', 'zh-CN': '个人', es: 'Yo', hi: 'मैं', ar: 'أنا' },
    Company: { 'zh-TW': '企業', 'zh-CN': '企业', es: 'Empresa', hi: 'कंपनी', ar: 'الشركة' },
    User: { 'zh-TW': '使用者', 'zh-CN': '用户', es: 'Usuario', hi: 'उपयोगकर्ता', ar: 'المستخدم' },
    Saved: { 'zh-TW': '已儲存', 'zh-CN': '已收藏', es: 'Guardado', hi: 'सहेजा गया', ar: 'محفوظ' },
    Following: { 'zh-TW': '追蹤', 'zh-CN': '关注', es: 'Siguiendo', hi: 'अनुसरण', ar: 'متابعة' },
    Resumes: { 'zh-TW': '我的履歷', 'zh-CN': '我的简历', es: 'CV', hi: 'CV', ar: 'السير الذاتية' },
    Applied: { 'zh-TW': '投遞紀錄', 'zh-CN': '投递记录', es: 'Postulaciones', hi: 'आवेदन', ar: 'الطلبات' },
    'Create company page & post jobs': { 'zh-TW': '建立企業頁面，開始發布職缺', 'zh-CN': '建立企业页面，开始发布职位', es: 'Crea una página de empresa y publica empleos', hi: 'कंपनी पेज बनाएं और नौकरियां पोस्ट करें', ar: 'أنشئ صفحة شركة وانشر وظائف' },
    'No resumes yet. Upload in AI Match Analysis (max 3).': { 'zh-TW': '尚無履歷。在 Jobbeagle 分析時上傳即可自動儲存（最多 3 份）。', 'zh-CN': '暂无简历。在 Jobbeagle 分析时上传即可自动保存（最多 3 份）。', es: 'Aún no hay CV. Súbelo en el análisis IA (máx. 3).', hi: 'अभी कोई CV नहीं। AI विश्लेषण में अपलोड करें (अधिकतम 3)।', ar: 'لا توجد سير ذاتية بعد. ارفعها في تحليل الذكاء الاصطناعي (حتى 3).' },
    'No saved jobs. Tap the bookmark icon on videos.': { 'zh-TW': '尚無儲存職缺。點擊影片右側書籤儲存。', 'zh-CN': '暂无收藏职位。点击视频右侧书签收藏。', es: 'No hay empleos guardados. Toca el marcador en los videos.', hi: 'कोई सहेजी गई नौकरी नहीं। वीडियो पर बुकमार्क टैप करें।', ar: 'لا توجد وظائف محفوظة. اضغط علامة الحفظ على الفيديوهات.' },
    'Not following any companies yet.': { 'zh-TW': '尚未追蹤企業。點擊影片右側追蹤按鈕。', 'zh-CN': '暂未关注企业。点击视频右侧关注按钮。', es: 'Aún no sigues ninguna empresa.', hi: 'आप अभी किसी कंपनी को फॉलो नहीं कर रहे हैं।', ar: 'لا تتابع أي شركات بعد.' },
    'No applications submitted yet.': { 'zh-TW': '尚未投遞任何職缺。', 'zh-CN': '尚未投递任何职位。', es: 'Aún no has enviado postulaciones.', hi: 'अभी कोई आवेदन जमा नहीं किया गया।', ar: 'لم ترسل أي طلبات بعد.' },
    Unread: { 'zh-TW': '未讀取', 'zh-CN': '未读取', es: 'Sin leer', hi: 'अपठित', ar: 'غير مقروء' },
    Read: { 'zh-TW': '已讀取', 'zh-CN': '已读取', es: 'Leído', hi: 'पढ़ा गया', ar: 'مقروء' },
    'Edit Company Profile': { 'zh-TW': '編輯企業資料', 'zh-CN': '编辑企业资料', es: 'Editar perfil de empresa', hi: 'कंपनी प्रोफ़ाइल संपादित करें', ar: 'تعديل ملف الشركة' },
    Cancel: { 'zh-TW': '取消', 'zh-CN': '取消', es: 'Cancelar', hi: 'रद्द करें', ar: 'إلغاء' },
    Save: { 'zh-TW': '儲存', 'zh-CN': '保存', es: 'Guardar', hi: 'सहेजें', ar: 'حفظ' },
    Videos: { 'zh-TW': '職缺影片', 'zh-CN': '职位视频', es: 'Videos', hi: 'वीडियो', ar: 'الفيديوهات' },
    Followers: { 'zh-TW': '追蹤者', 'zh-CN': '关注者', es: 'Seguidores', hi: 'फॉलोअर', ar: 'المتابعون' },
    Likes: { 'zh-TW': '總愛心', 'zh-CN': '总点赞', es: 'Me gusta', hi: 'लाइक', ar: 'الإعجابات' },
    Applications: { 'zh-TW': '收到申請', 'zh-CN': '收到申请', es: 'Postulaciones', hi: 'आवेदन', ar: 'الطلبات' },
    'Applicants & resumes': { 'zh-TW': '應徵者與履歷', 'zh-CN': '应聘者与简历', es: 'Candidatos y CV', hi: 'आवेदक और CV', ar: 'المتقدمون والسير الذاتية' },
    '+ Upload New Job Video': { 'zh-TW': '+ 上傳新職缺影片', 'zh-CN': '+ 上传新职位视频', es: '+ Subir nuevo video de empleo', hi: '+ नया जॉब वीडियो अपलोड करें', ar: '+ رفع فيديو وظيفة جديد' },
    'My job videos': { 'zh-TW': '我的職缺影片', 'zh-CN': '我的职位视频', es: 'Mis videos de empleo', hi: 'मेरे जॉब वीडियो', ar: 'فيديوهات الوظائف الخاصة بي' },
    Published: { 'zh-TW': '已發布', 'zh-CN': '已发布', es: 'Publicado', hi: 'प्रकाशित', ar: 'منشور' },
    Drafts: { 'zh-TW': '草稿', 'zh-CN': '草稿', es: 'Borradores', hi: 'ड्राफ्ट', ar: 'مسودات' },
  };
  const t = (zh: string, en: string) => {
    const entry = profileTranslations[en];
    if (entry?.[language]) return entry[language]!;
    if (language === 'zh-TW') return zh;
    if (language === 'zh-CN') return zh;
    return en;
  };
  const fmtDate = (d: string) => new Date(d).toLocaleDateString((language === 'zh-TW' || language === 'zh-CN') ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

  useEffect(() => {
    if (loading || !user) return;
    setMode(resolveShortsViewMode(hasCompanyProfile));
  }, [loading, user, hasCompanyProfile]);

  useEffect(() => {
    if (!selectedVideo) {
      setSheetApplicants([]);
      return;
    }
    (async () => {
      setLoadingApplicants(true);
      const supabase = createClient();
      const { data } = await supabase.from('job_applications')
        .select('*')
        .eq('job_id', selectedVideo.id)
        .order('created_at', { ascending: false });
      const apps = (data || []) as JobApplicationRow[];
      setSheetApplicants(apps);
      setLoadingApplicants(false);
    })();
  }, [selectedVideo?.id]);

  const loadPersonalData = async (userId: string) => {
    const supabase = createClient();
    const [rr, sr, fr, ar] = await Promise.all([
      supabase.from('resume_history').select('id, file_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('saved_jobs').select('id, job_id, job_data, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('followed_companies').select('id, company_name, logo_url, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('job_applications').select('id, job_id, job_title, company_name, status, created_at').eq('applicant_user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (rr.data) setResumes(rr.data);
    if (sr.data) setSavedJobs(sr.data as SavedJob[]);
    if (fr.data) setFollowedCompanies(fr.data);
    if (ar.data) setAppliedJobs(ar.data as AppliedJobRow[]);
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

      if (videos.length > 0) {
        const ids = videos.map(v => v.id);
        const likesMap: Record<string, number> = {};
        await Promise.all(ids.map(async (id) => {
          const { count } = await supabase.from('video_likes').select('*', { count: 'exact', head: true }).eq('video_id', id);
          likesMap[id] = count || 0;
        }));
        setVideoLikes(likesMap);
        const totalLikes = Object.values(likesMap).reduce((a, b) => a + b, 0);

        const appCounts: Record<string, number> = {};
        const { data: appRows } = await supabase.from('job_applications').select('job_id').in('job_id', ids);
        (appRows || []).forEach((row: { job_id: string | null }) => {
          if (!row.job_id) return;
          appCounts[row.job_id] = (appCounts[row.job_id] || 0) + 1;
        });
        setVideoAppCounts(appCounts);
        const totalApplications = Object.values(appCounts).reduce((a, b) => a + b, 0);
        setCompanyStats({ videoCount: videos.length, followerCount, totalLikes, totalApplications });
      } else {
        setVideoAppCounts({});
        setCompanyStats({ videoCount: 0, followerCount, totalLikes: 0, totalApplications: 0 });
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

  const performTogglePublish = async (video: CompanyVideo) => {
    setTogglingVideo(video.id);
    const supabase = createClient();
    const newState = !video.is_published;
    await supabase.from('shorts_videos').update({ is_published: newState }).eq('id', video.id);
    setCompanyVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_published: newState } : v));
    if (selectedVideo?.id === video.id) setSelectedVideo(prev => prev ? { ...prev, is_published: newState } : null);
    setTogglingVideo(null);
  };

  /** 上架（草稿→發布）：先開確認視窗 */
  const requestPublishVideo = (video: CompanyVideo) => {
    if (video.is_published) return;
    setVideoManageConfirm({ action: 'publish', video });
  };

  /** 下架：先開確認視窗 */
  const requestUnpublishVideo = (video: CompanyVideo) => {
    if (!video.is_published) return;
    setVideoManageConfirm({ action: 'unpublish', video });
  };

  const performDeleteVideo = async (videoId: string) => {
    const supabase = createClient();
    await supabase.from('shorts_videos').delete().eq('id', videoId);
    const lostApps = videoAppCounts[videoId] || 0;
    setCompanyVideos(prev => prev.filter(v => v.id !== videoId));
    setSelectedVideo(null);
    setCompanyStats(prev => ({
      ...prev,
      videoCount: prev.videoCount - 1,
      totalApplications: Math.max(0, prev.totalApplications - lostApps),
    }));
    setVideoAppCounts(prev => {
      const n = { ...prev };
      delete n[videoId];
      return n;
    });
  };

  /** 刪除：先開確認視窗 */
  const requestDeleteVideo = (video: CompanyVideo) => {
    setVideoManageConfirm({ action: 'delete', video });
  };

  const confirmVideoManageAction = async () => {
    if (!videoManageConfirm) return;
    const { action, video } = videoManageConfirm;
    setVideoManageConfirm(null);
    if (action === 'delete') {
      await performDeleteVideo(video.id);
      return;
    }
    if (action === 'unpublish' || action === 'publish') {
      await performTogglePublish(video);
    }
  };

  /** 已讀取：僅在企業點「下載履歷」時標記（開啟申請列表不算） */
  const handleResumeDownloadClick = async (e: React.MouseEvent<HTMLAnchorElement>, app: JobApplicationRow) => {
    if (!app.resume_url || app.status !== 'unread') return;
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('job_applications').update({
      status: 'read',
      updated_at: new Date().toISOString(),
    }).eq('id', app.id);
    if (!error) {
      setSheetApplicants(prev => prev.map(a => (a.id === app.id ? { ...a, status: 'read' } : a)));
    }
    window.open(app.resume_url, '_blank', 'noopener,noreferrer');
  };

  const requestModeSwitch = (target: ProfileMode) => {
    if (target === mode) return;
    if (!hasCompanyProfile && target === 'company') return;
    setSwitchConfirm(target);
  };

  const confirmModeSwitch = () => {
    if (!switchConfirm) return;
    setStoredShortsViewRole(switchConfirm);
    setMode(switchConfirm);
    setSwitchConfirm(null);
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
        subtitle={
          <p className="text-[10px] text-slate-500 text-center leading-relaxed px-2">
            {t('私人後台，僅本人可見。對外請使用「公開企業主頁」。', 'Private — only you. Public profile is separate.')}
          </p>
        }
        right={hasCompanyProfile ? (
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <ModePill active={mode === 'personal'} onClick={() => requestModeSwitch('personal')} icon={User} label={t('個人', 'Me')} />
            <ModePill active={mode === 'company'} onClick={() => requestModeSwitch('company')} icon={Building2} label={t('企業', 'Company')} />
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
            <div className="flex gap-8 mt-5">
              <StatPill count={savedJobs.length} label={t('已儲存', 'Saved')} />
              <StatPill count={followedCompanies.length} label={t('追蹤', 'Following')} />
              <StatPill count={resumes.length} label={t('履歷', 'Resumes')} />
              <StatPill count={appliedJobs.length} label={t('已投遞', 'Applied')} />
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
          <div className="flex border-b border-slate-800 overflow-x-auto">
            {([
              { key: 'resumes' as PersonalTab, icon: FileText, zh: '我的履歷', en: 'Resumes' },
              { key: 'saved' as PersonalTab, icon: Bookmark, zh: '已儲存', en: 'Saved' },
              { key: 'following' as PersonalTab, icon: Building2, zh: '追蹤', en: 'Following' },
              { key: 'applied' as PersonalTab, icon: Send, zh: '投遞紀錄', en: 'Applied' },
            ]).map(({ key, icon: Icon, zh, en }) => (
              <button key={key} onClick={() => setPersonalTab(key)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap px-2 ${personalTab === key ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                <Icon size={14} />{t(zh, en)}
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

            {/* Applied Jobs */}
            {personalTab === 'applied' && (
              appliedJobs.length === 0
                ? <EmptyState icon={Send} text={t('尚未投遞任何職缺。', 'No applications submitted yet.')} />
                : appliedJobs.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Send size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{a.job_title || '—'}</p>
                      <p className="text-slate-400 text-xs truncate">{a.company_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{fmtDate(a.created_at)}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${a.status === 'unread' ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                      {a.status === 'unread' ? t('未讀取', 'Unread') : t('已讀取', 'Read')}
                    </span>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <StatCard count={companyStats.videoCount} label={t('職缺影片', 'Videos')} icon={Play} color="blue" />
                  <StatCard count={companyStats.followerCount} label={t('追蹤者', 'Followers')} icon={User} color="purple" />
                  <StatCard count={companyStats.totalLikes} label={t('總愛心', 'Likes')} icon={Heart} color="red" />
                  <StatCard count={companyStats.totalApplications} label={t('收到申請', 'Applications')} icon={Users} color="emerald" />
                </div>

                {/* 應徵者與履歷：入口為下方職缺縮圖（非獨立分頁） */}
                <div className="mb-4 p-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-slate-900/40">
                  <p className="text-cyan-100 font-semibold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0 text-cyan-300" />
                    {t('應徵者與履歷', 'Applicants & resumes')}
                  </p>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {t(
                      '請點選下方「我的職缺影片」網格中的任一支縮圖，即可開啟該職缺的管理畫面：瀏覽應徵者、下載履歷、以信箱聯絡。新應徵通知會寄到上方企業「聯絡信箱」（若已填寫）。',
                      'Tap any thumbnail in “My job videos” below to open that job: view applicants, download resumes, and email them. New applications are also emailed to your Contact Email when set.',
                    )}
                  </p>
                </div>

                {/* Upload CTA */}
                <a href="/shorts/upload"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30">
                  <Upload size={16} />
                  {t('+ 上傳新職缺影片', '+ Upload New Job Video')}
                </a>
                {companyProfile?.company_name && (
                  <Link
                    href={`/shorts/company/${encodeURIComponent(companyProfile.company_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-800/80 transition-colors"
                  >
                    <ExternalLink size={14} />
                    {t('開啟公開企業主頁（求職者看到的頁面）', 'Open public company page (for job seekers)')}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Videos — Instagram-style grid */}
          <div className="px-4 pt-4 pb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-400 text-sm font-medium">
              {t('我的職缺影片', 'My job videos')} · {t('已發布', 'Published')} <span className="text-white font-bold">{publishedCount}</span>
              {draftCount > 0 && <span className="text-slate-500 ml-2">{t('草稿', 'Drafts')} {draftCount}</span>}
            </span>
            <span className="text-slate-500 text-xs">
              {t('點縮圖 → 應徵與履歷', 'Tap thumbnail → applicants')}
            </span>
          </div>

          {companyVideos.length === 0 ? (
            <div className="px-4 py-4">
              <EmptyState icon={Play} text={t('尚未上傳任何職缺影片。點擊上方按鈕開始發布；發布後點縮圖即可查看應徵者與履歷。', 'No videos yet. Upload above, then tap a thumbnail to see applicants and resumes.')} />
            </div>
          ) : (
            <div className="px-2 pb-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
              {companyVideos.map(v => {
                const likes = videoLikes[v.id] || 0;
                const apps = videoAppCounts[v.id] || 0;
                const busy = togglingVideo === v.id;
                return (
                  <div
                    key={v.id}
                    className="relative aspect-square rounded-md overflow-hidden bg-slate-800 border border-slate-700/70"
                  >
                    {(!v.video_source_type || v.video_source_type === 'upload') ? (
                      <video src={v.video_url} className="absolute inset-0 w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-3xl">
                        {v.video_source_type === 'youtube' ? '▶' : v.video_source_type === 'instagram' ? '📸' : v.video_source_type === 'facebook' ? '📘' : '🔗'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(v)}
                      className="absolute inset-0 z-[1] cursor-pointer"
                      aria-label={t('開啟管理', 'Open')}
                    />
                    <div className="absolute bottom-0 left-0 right-0 z-[2] px-1 pb-1 pt-4 pointer-events-none bg-gradient-to-t from-black/90 to-transparent">
                      <span className="text-[8px] sm:text-[9px] text-white font-medium line-clamp-2 text-left leading-tight">{v.job_title}</span>
                    </div>
                    <div className="absolute top-0.5 left-0.5 z-[10] flex flex-col gap-0.5 pointer-events-none">
                      <span className="text-[8px] text-white/95 bg-black/55 rounded px-1 py-0.5 flex items-center gap-0.5 w-fit">
                        <Heart size={8} className="text-red-400 shrink-0" fill="currentColor" />{likes}
                      </span>
                      <span className="text-[8px] text-white/95 bg-black/55 rounded px-1 py-0.5 flex items-center gap-0.5 w-fit">
                        <Users size={8} className="text-emerald-400 shrink-0" />{apps}
                      </span>
                    </div>
                    {!v.is_published && (
                      <span className="absolute left-0.5 top-5 z-[10] text-[8px] font-bold bg-amber-600 text-white px-1 py-0.5 rounded pointer-events-none">{t('草稿', 'Draft')}</span>
                    )}
                    <div className="absolute top-0.5 right-0.5 z-[10] flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (v.is_published) requestUnpublishVideo(v);
                          else requestPublishVideo(v);
                        }}
                        className="p-1 rounded bg-black/65 hover:bg-black/90 text-white border border-white/15 disabled:opacity-50"
                        title={v.is_published ? t('下架（隱藏）', 'Unpublish') : t('發布', 'Publish')}
                      >
                        {busy ? <Loader2 size={11} className="animate-spin" /> : v.is_published ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requestDeleteVideo(v);
                        }}
                        className="p-1 rounded bg-black/65 hover:bg-red-900/90 text-red-300 border border-white/15 disabled:opacity-50"
                        title={t('刪除', 'Delete')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full-screen sheet: video + applicants */}
          {selectedVideo && (
            <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col animate-fade-in">
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-b border-slate-800 pt-safe">
                <button type="button" onClick={() => setSelectedVideo(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-300">
                  <ArrowLeft size={22} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{selectedVideo.job_title}</p>
                  <p className="text-slate-500 text-xs truncate">{selectedVideo.company_name}{selectedVideo.location ? ` · ${selectedVideo.location}` : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => (selectedVideo.is_published ? requestUnpublishVideo(selectedVideo) : requestPublishVideo(selectedVideo))}
                  disabled={togglingVideo === selectedVideo.id}
                  className="text-xs px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {selectedVideo.is_published ? t('下架', 'Unpublish') : t('發布', 'Publish')}
                </button>
                <button
                  type="button"
                  onClick={() => requestDeleteVideo(selectedVideo)}
                  className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950/50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
                {(() => {
                  const st = selectedVideo.video_source_type;
                  if (st === 'youtube') {
                    const src = toYouTubeEmbedUrl(selectedVideo.video_url);
                    return src ? <iframe src={src} className="w-full aspect-video" allow="autoplay; encrypted-media" allowFullScreen title="YouTube" /> : null;
                  }
                  if (st === 'facebook') {
                    const src = toFacebookEmbedUrl(selectedVideo.video_url);
                    return src ? <iframe src={src} className="w-full aspect-video border-0" allow="autoplay; encrypted-media" allowFullScreen title="Facebook" scrolling="no" /> : null;
                  }
                  if (st === 'instagram') {
                    return (
                      <div className="w-full py-4 flex flex-col items-center gap-2 bg-black">
                        <span className="text-3xl">📸</span>
                        <a href={normalizeInstagramUrl(selectedVideo.video_url)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm hover:underline">
                          前往 Instagram 觀看
                        </a>
                      </div>
                    );
                  }
                  if (st === 'external') {
                    return (
                      <div className="w-full py-4 flex flex-col items-center gap-2 bg-black">
                        <span className="text-3xl">🔗</span>
                        <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm hover:underline">
                          前往觀看影片
                        </a>
                      </div>
                    );
                  }
                  return <video src={selectedVideo.video_url} controls className="w-full max-h-48 bg-black object-contain" />;
                })()}
                <div className="px-4 py-3 border-b border-slate-800">
                  {selectedVideo.salary && (
                    <p className="text-slate-300 text-sm flex items-center gap-1.5"><DollarSign size={14} className="text-emerald-400 shrink-0" />{selectedVideo.salary}</p>
                  )}
                  {selectedVideo.description && <p className="text-slate-400 text-sm mt-2 leading-relaxed">{selectedVideo.description}</p>}
                </div>
                <div className="px-4 py-3">
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    {t('申請者', 'Applicants')}
                    <span className="text-slate-500 font-normal">({sheetApplicants.length})</span>
                  </h3>
                  {loadingApplicants ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
                  ) : sheetApplicants.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-6">{t('尚無申請紀錄', 'No applications yet')}</p>
                  ) : (
                    <div className="space-y-3">
                      {sheetApplicants.map(app => (
                        <div key={app.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-semibold text-sm">{app.applicant_name}</p>
                              <a href={`mailto:${app.applicant_email}`} className="text-cyan-400 text-xs break-all">{app.applicant_email}</a>
                              {app.applicant_phone && <p className="text-slate-500 text-xs mt-0.5">{app.applicant_phone}</p>}
                              <p className="text-slate-500 text-xs mt-1">{t('收到時間：', 'Received: ')}{fmtDate(app.created_at)}</p>
                            </div>
                            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${app.status === 'unread' ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                              {app.status === 'unread' ? t('未讀取', 'Unread') : t('已讀取', 'Read')}
                            </span>
                          </div>
                          {app.application_message && (
                            <p className="text-slate-300 text-xs mt-2 line-clamp-3 whitespace-pre-wrap border-t border-slate-800 pt-2">{app.application_message}</p>
                          )}
                          {app.cover_letter && (
                            <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 whitespace-pre-wrap italic">{app.cover_letter}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {app.resume_url && (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => void handleResumeDownloadClick(e, app)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg"
                              >
                                <FileText size={12} />{t('下載履歷', 'Resume')}{app.resume_file_name ? ` · ${app.resume_file_name}` : ''}
                              </a>
                            )}
                            {app.cover_letter_url && (
                              <a href={app.cover_letter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-950/40 px-2.5 py-1.5 rounded-lg">
                                <FileText size={12} />{t('求職信', 'Cover Letter')}{app.cover_letter_file_name ? ` · ${app.cover_letter_file_name}` : ''}
                              </a>
                            )}
                            <a href={`mailto:${app.applicant_email}?subject=${encodeURIComponent(t('Re: ', 'Re: ') + selectedVideo.job_title)}`} className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg">
                              <Mail size={12} />{t('回信', 'Reply')}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 切換私人後台視角：需確認 */}
      {switchConfirm && (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-fade-in"
          >
            <p className="text-white font-bold text-base mb-2">
              {switchConfirm === 'company'
                ? t('切換到企業後台？', 'Switch to company dashboard?')
                : t('切換到個人後台？', 'Switch to personal dashboard?')}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              {switchConfirm === 'company'
                ? t('將顯示職缺影片、申請與數據。之後可再切回個人履歷與投遞紀錄。', 'You will see job videos and applicants. You can switch back anytime.')
                : t('將顯示履歷、儲存職缺與投遞紀錄。公開給求職者看的企業頁不變。', 'You will see resumes and applications you sent. Your public company page is unchanged.')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSwitchConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
              >
                {t('取消', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={confirmModeSwitch}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
              >
                {t('確認切換', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除 / 上架 / 下架職缺影片：確認視窗 */}
      {videoManageConfirm && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-fade-in"
          >
            <p className="text-white font-bold text-base mb-2">
              {videoManageConfirm.action === 'delete'
                ? t('確定刪除此職缺影片？', 'Delete this job video?')
                : videoManageConfirm.action === 'unpublish'
                  ? t('確定下架（隱藏）此影片？', 'Unpublish and hide this video?')
                  : t('確定發布（上架）此影片？', 'Publish this video?')}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              {videoManageConfirm.action === 'delete'
                ? t('刪除後無法復原，相關申請紀錄也將一併移除。', 'This cannot be undone. Related application records will also be removed.')
                : videoManageConfirm.action === 'unpublish'
                  ? t('下架後將不會出現在 Shorts 動態與公開企業主頁，可隨時再發布。', 'It will no longer appear in Shorts or your public company page. You can publish again anytime.')
                  : t('發布後將出現在 Shorts 動態與公開企業主頁，求職者可瀏覽與應徵。', 'It will appear in Shorts and on your public company page. Job seekers can view and apply.')}
            </p>
            <p className="text-slate-300 text-sm font-medium mb-5 truncate" title={videoManageConfirm.video.job_title}>
              「{videoManageConfirm.video.job_title}」
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoManageConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
              >
                {t('取消', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => void confirmVideoManageAction()}
                className={
                  videoManageConfirm.action === 'delete'
                    ? 'flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500'
                    : videoManageConfirm.action === 'unpublish'
                      ? 'flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500'
                      : 'flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500'
                }
              >
                {videoManageConfirm.action === 'delete'
                  ? t('確認刪除', 'Delete')
                  : videoManageConfirm.action === 'unpublish'
                    ? t('確認下架', 'Unpublish')
                    : t('確認發布', 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const TopBar = ({
  onBack, title, right, subtitle,
}: {
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
  subtitle?: React.ReactNode;
}) => (
  <div className="flex-shrink-0 border-b border-slate-800">
    <div className="flex items-center gap-3 px-4 pt-safe py-3">
      <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={22} />
      </button>
      <h1 className="text-white font-bold text-base flex-1">{title}</h1>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
    {subtitle && <div className="px-4 pb-2.5">{subtitle}</div>}
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
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
    red: 'bg-red-900/30 text-red-400',
    emerald: 'bg-emerald-900/30 text-emerald-400',
  };
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

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
      <Icon className="w-8 h-8 text-slate-600" />
    </div>
    <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">{text}</p>
  </div>
);

export default ProfilePage;
