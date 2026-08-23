'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import ProfileModal from '@/components/shorts/ProfileModal';
import { JobData } from '@/types';
import {
  Home, User, Bookmark, X, AlertCircle, Loader2, CheckCircle,
  LogIn, LogOut, Building2, ChevronDown, UserCircle2,
  Video, Upload, Users, Volume2, VolumeX,
  Search, MapPin, XCircle, Edit,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { FALLBACK_VIDEOS } from './fallback-videos';
import { setStoredShortsViewRole, setStoredAccountRole, resolveUserRole } from '@/lib/shorts-view-role';
import { useLanguage, AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BrandLogo from '@/components/BrandLogo';

const getLogoUrl = (n: string) =>
  `https://www.google.com/s2/favicons?domain=${n.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;

const PAGE_SIZE = 10;

// Translation table
const SI: Record<string, Partial<Record<AppLanguage, string>>> = {
  following:   { en: 'Following',  'zh-TW': '追蹤中',   'zh-CN': '关注中',   es: 'Siguiendo',     hi: 'अनुसरण',    ar: 'المتابَعون' },
  saved:       { en: 'Saved',      'zh-TW': '已儲存',   'zh-CN': '已收藏',   es: 'Guardado',      hi: 'सहेजा',     ar: 'محفوظ' },
  me:          { en: 'Me',         'zh-TW': '我',       'zh-CN': '我',       es: 'Yo',            hi: 'मैं',        ar: 'أنا' },
  logout:      { en: 'Logout',     'zh-TW': '登出',     'zh-CN': '退出登录', es: 'Salir',         hi: 'लॉग आउट',   ar: 'خروج' },
  login:       { en: 'Login',      'zh-TW': '登入',     'zh-CN': '登录',     es: 'Entrar',        hi: 'लॉग इन',    ar: 'دخول' },
  empLogin:    { en: 'Employer Login', 'zh-TW': '企業登入', 'zh-CN': '企业登录', es: 'Empresa',   hi: 'नियोक्ता',  ar: 'صاحب عمل' },
  talLogin:    { en: 'Job Seeker Login', 'zh-TW': '求職者登入', 'zh-CN': '求职者登录', es: 'Candidato', hi: 'उम्मीदवार', ar: 'باحث عمل' },
  home:        { en: 'Home',       'zh-TW': '首頁',     'zh-CN': '首页',     es: 'Inicio',        hi: 'होम',        ar: 'الرئيسية' },
  profile:     { en: 'Profile',    'zh-TW': '個人',     'zh-CN': '个人',     es: 'Perfil',        hi: 'प्रोफ़ाइल', ar: 'الملف' },
  noSaved:     { en: 'No saved jobs yet', 'zh-TW': '尚無儲存職缺', 'zh-CN': '暂无收藏职位', es: 'Sin guardados', hi: 'कोई सहेजी नहीं', ar: 'لا محفوظات' },
  tapBookmark: { en: 'Tap the bookmark on any video to save it', 'zh-TW': '點擊影片書籤即可儲存', 'zh-CN': '点击书签收藏', es: 'Toca el marcador', hi: 'बुकमार्क करें', ar: 'اضغط الحفظ' },
  noFollowing: { en: 'Not following any companies yet', 'zh-TW': '尚未追蹤任何企業', 'zh-CN': '暂未关注企业', es: 'Sin empresas', hi: 'कोई कंपनी नहीं', ar: 'لا متابعات' },
  tapFollow:   { en: 'Follow companies from any video to see their latest openings', 'zh-TW': '點追蹤按鈕即可訂閱企業最新職缺', 'zh-CN': '点关注按钮订阅企业职位', es: 'Sigue empresas', hi: 'फॉलो करें', ar: 'تابع الشركات' },
  dashboard:   { en: 'Company Dashboard', 'zh-TW': '企業後台', 'zh-CN': '企业后台', es: 'Panel', hi: 'डैशबोर्ड', ar: 'لوحة التحكم' },
  uploadVideo: { en: 'Upload Job Video', 'zh-TW': '上傳職缺影片', 'zh-CN': '上传职位视频', es: 'Subir Video', hi: 'वीडियो अपलोड', ar: 'رفع فيديو' },
  myCompany:   { en: 'My Company Page', 'zh-TW': '我的企業頁面', 'zh-CN': '我的企业主页', es: 'Mi Empresa', hi: 'मेरी कंपनी', ar: 'صفحة شركتي' },
  savedJobs:   { en: 'Saved Jobs', 'zh-TW': '已儲存職缺', 'zh-CN': '已收藏职位', es: 'Guardados', hi: 'सहेजी नौकरियां', ar: 'وظائف محفوظة' },
  myApps:      { en: 'My Applications', 'zh-TW': '我的申請記錄', 'zh-CN': '我的申请记录', es: 'Mis Solicitudes', hi: 'मेरे आवेदन', ar: 'طلباتي' },
  loginFirst:  { en: 'Sign in to follow companies', 'zh-TW': '登入後即可追蹤企業', 'zh-CN': '登录后关注企业', es: 'Inicia sesión', hi: 'लॉग इन करें', ar: 'سجل الدخول' },
  // Sound overlay
  tapSound:    { en: 'Tap anywhere to start with sound', 'zh-TW': '點擊任意處開始（含聲音）', 'zh-CN': '点击任意处开始（含声音）', es: 'Toca para iniciar con sonido', hi: 'ध्वनि के साथ शुरू करने के लिए टैप करें', ar: 'انقر لبدء التشغيل بالصوت' },
  soundMuted:  { en: 'Sound muted — tap 🔊 to enable', 'zh-TW': '已靜音 — 點 🔊 開啟聲音', 'zh-CN': '已静音 — 点 🔊 开启声音', es: 'Silenciado — toca 🔊', hi: 'मौन — 🔊 दबाएं', ar: 'مكتوم — اضغط 🔊' },
  tapDesc:     { en: 'Browsers require a tap before playing audio', 'zh-TW': '瀏覽器需要點擊互動才能播放聲音', 'zh-CN': '浏览器需要点击互动才能播放声音', es: 'Los navegadores requieren un toque antes de reproducir audio', hi: 'ऑडियो चलाने से पहले ब्राउज़र को टैप की आवश्यकता है', ar: 'تتطلب المتصفحات النقر قبل تشغيل الصوت' },
  tapBtn:      { en: 'Tap to Start', 'zh-TW': '點一下開始', 'zh-CN': '点击开始', es: 'Tocar para comenzar', hi: 'शुरू करने के लिए टैप करें', ar: 'انقر للبدء' },
  empTools:    { en: 'Employer Tools', 'zh-TW': '企業功能', 'zh-CN': '企业功能', es: 'Herramientas', hi: 'नियोक्ता टूल', ar: 'أدوات صاحب العمل' },
  myActivity:  { en: 'My Activity', 'zh-TW': '我的動態', 'zh-CN': '我的动态', es: 'Mi Actividad', hi: 'मेरी गतिविधि', ar: 'نشاطي' },
  acctSettings:{ en: 'Account Settings', 'zh-TW': '帳號設定', 'zh-CN': '账号设置', es: 'Configuración', hi: 'खाता सेटिंग', ar: 'إعدادات الحساب' },
  myResume:    { en: 'My Profile & Resume', 'zh-TW': '個人檔案與履歷', 'zh-CN': '个人档案与简历', es: 'Perfil y CV', hi: 'प्रोफ़ाइल और CV', ar: 'ملفي والسيرة الذاتية' },
  postAsEmp:   { en: 'Post jobs as Employer →', 'zh-TW': '企業方：發布職缺 →', 'zh-CN': '企业方：发布职位 →', es: 'Publicar como empresa →', hi: 'नियोक्ता के रूप में पोस्ट करें →', ar: 'انشر كصاحب عمل →' },
  postMgmt:    { en: 'Post jobs & manage videos', 'zh-TW': '發布職缺影片・管理申請', 'zh-CN': '发布职位视频・管理申请', es: 'Publica empleos y gestiona videos', hi: 'जॉब पोस्ट करें और वीडियो प्रबंधित करें', ar: 'انشر وظائف وأدر الفيديوهات' },
  browseApply: { en: 'Browse & apply to jobs', 'zh-TW': '瀏覽職缺・一鍵申請', 'zh-CN': '浏览职位・一键申请', es: 'Busca y aplica a empleos', hi: 'नौकरियां खोजें और आवेदन करें', ar: 'تصفح وتقدم للوظائف' },
  iAmA:        { en: 'I am a…', 'zh-TW': '我是…', 'zh-CN': '我是…', es: 'Soy un…', hi: 'मैं हूँ…', ar: 'أنا…' },
  empBadge:    { en: '🏢 Employer', 'zh-TW': '🏢 企業方', 'zh-CN': '🏢 企业方', es: '🏢 Empresa', hi: '🏢 नियोक्ता', ar: '🏢 صاحب عمل' },
  talBadge:    { en: '💼 Job Seeker', 'zh-TW': '💼 求職者', 'zh-CN': '💼 求职者', es: '💼 Candidato', hi: '💼 नौकरी खोजने वाला', ar: '💼 باحث عمल' },
  noResults:   { en: 'No jobs match your filters', 'zh-TW': '沒有符合條件的職缺', 'zh-CN': '没有符合条件的职位', es: 'Ningún empleo coincide', hi: 'कोई नौकरी मेल नहीं खाती', ar: 'لا توجد وظائف مطابقة' },
  search:      { en: 'Search', 'zh-TW': '搜尋', 'zh-CN': '搜索', es: 'Buscar', hi: 'खोजें', ar: 'بحث' },
  searchJobs:  { en: 'Search jobs…', 'zh-TW': '搜尋職缺…', 'zh-CN': '搜索职位…', es: 'Buscar empleos…', hi: 'नौकरियां खोजें…', ar: 'ابحث عن وظائف…' },
  location:    { en: 'Location', 'zh-TW': '地點', 'zh-CN': '地点', es: 'Ubicación', hi: 'स्थान', ar: 'الموقع' },
  tag:         { en: 'Tag', 'zh-TW': '標籤', 'zh-CN': '标签', es: 'Etiqueta', hi: 'टैग', ar: 'وسم' },
  clearFilters:{ en: 'Clear', 'zh-TW': '清除', 'zh-CN': '清除', es: 'Limpiar', hi: 'साफ़ करें', ar: 'مسح' },
  editVideos:  { en: 'Edit video details', 'zh-TW': '編輯影片詳情', 'zh-CN': '编辑视频详情', es: 'Editar videos', hi: 'वीडियो संपादित करें', ar: 'تعديل الفيديوهات' },
};
const t = (key: string, lang: AppLanguage) => SI[key]?.[lang] ?? SI[key]?.en ?? key;

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

  // Language
  const { language: appLang } = useLanguage();

  // UI state
  const [activeTab, setActiveTab] = useState<'foryou' | 'following' | 'saved'>('foryou');
  const [navTab, setNavTab] = useState<'home' | 'profile'>('home');

  // Follow / Save
  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedJobsData, setSavedJobsData] = useState<JobData[]>([]);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [userRole, setUserRole] = useState<'employer' | 'talent' | null>(null);

  // Deep link: scroll to a specific job video
  const [initialJobId, setInitialJobId] = useState<string | null>(null);
  const deepLinkHandledRef = useRef(false);

  // Following feed (loaded from DB)
  const [followingVideos, setFollowingVideos] = useState<JobData[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // ── Sound overlay ────────────────────────────────────────────────────────
  // Browser policy: video can't autoplay with sound without user gesture.
  // We show a full-screen overlay to collect that gesture on first visit.
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);

  // Search / filter (For You feed)
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchTag, setSearchTag] = useState('');

  useEffect(() => {
    const pref = localStorage.getItem('jobbeagle_sound_pref');
    if (pref === 'on') {
      // Returning user who already enabled sound — no overlay needed
      setShowSoundOverlay(false);
    } else if (pref === 'off') {
      // User deliberately muted — respect that
      setShowSoundOverlay(false);
    } else {
      // First visit — ask for interaction so we can play with sound
      setShowSoundOverlay(true);
    }
  }, []);

  const handleEnableSound = useCallback(() => {
    localStorage.setItem('jobbeagle_sound_pref', 'on');
    setShowSoundOverlay(false);
    // Tell all VideoCards to unmute
    window.dispatchEvent(new CustomEvent('jobbeagle:soundEnabled'));
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────
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
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let changed = false;
    const v = params.get('shorts_view');
    if (v === 'company' || v === 'personal') {
      setStoredShortsViewRole(v);
      if (v === 'company') {
        setStoredAccountRole('employer');
        setUserRole('employer');
      } else {
        setStoredAccountRole('talent');
        setUserRole('talent');
      }
      params.delete('shorts_view');
      changed = true;
    }
    if (params.get('open_profile') === '1') {
      setNavTab('profile');
      params.delete('open_profile');
      changed = true;
    }
    const accountRole = params.get('account_role');
    if (accountRole === 'employer' || accountRole === 'talent') {
      setStoredAccountRole(accountRole);
      setUserRole(accountRole);
      params.delete('account_role');
      changed = true;
    }
    const jobParam = params.get('job');
    if (jobParam && !deepLinkHandledRef.current) {
      deepLinkHandledRef.current = true;
      setInitialJobId(jobParam);
      setNavTab('home');
      setActiveTab('foryou');
      params.delete('job');
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
    if (followsRes.data) setFollowedCompanies(new Set(followsRes.data.map((r: any) => r.company_name)));
    if (savedRes.data) {
      setSavedJobIds(new Set(savedRes.data.map((r: any) => r.job_id)));
      setSavedJobsData(savedRes.data.map((r: any) => r.job_data as JobData));
    }
    if (companyRes.data) {
      setHasCompanyProfile(true);
      setCompanyName(companyRes.data.company_name || '');
    } else {
      setHasCompanyProfile(false);
      setCompanyName('');
    }
    setUserRole(resolveUserRole(!!companyRes.data));
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

  const openJobById = useCallback((jobId: string) => {
    setNavTab('home');
    setActiveTab('foryou');
    setInitialJobId(jobId);
    window.history.replaceState({}, '', `/shorts?job=${jobId}`);
  }, []);

  // Fetch deep-linked job if not already in feed
  useEffect(() => {
    if (!initialJobId) return;
    if (jobs.some(j => j.id === initialJobId)) return;
    const supabase = createClient();
    supabase
      .from('shorts_videos')
      .select('*')
      .eq('id', initialJobId)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const mapped = mapVideo(data);
          setJobs(prev => (prev.some(j => j.id === mapped.id) ? prev : [mapped, ...prev]));
        }
      });
  }, [initialJobId, jobs]);

  const loadVideos = async (cursor: string | null) => {
    try {
      if (!cursor) setLoading(true);
      const supabase = createClient();
      let query = supabase.from('shorts_videos').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(PAGE_SIZE);
      if (cursor) query = query.lt('created_at', cursor);
      const { data, error: err } = await query;
      if (!cursor && (err || !data || data.length === 0)) { setJobs(FALLBACK_VIDEOS); setHasMore(false); return; }
      if (!data || data.length === 0) { setHasMore(false); return; }
      const mapped = data.map(mapVideo);
      if (!cursor) setJobs(mapped); else setJobs(prev => [...prev, ...mapped]);
      setHasMore(data.length === PAGE_SIZE);
      lastCursorRef.current = data[data.length - 1].created_at;
    } catch { if (!cursor) setJobs(FALLBACK_VIDEOS); }
    finally { setLoading(false); }
  };

  const loadFollowingVideos = useCallback(async () => {
    if (!user) return;
    if (followedCompanies.size === 0) { setFollowingVideos([]); return; }
    setLoadingFollowing(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from('shorts_videos').select('*').in('company_name', Array.from(followedCompanies)).eq('is_published', true).order('created_at', { ascending: false });
      if (data) setFollowingVideos(data.map(mapVideo));
    } catch { /* silent */ } finally { setLoadingFollowing(false); }
  }, [user, followedCompanies]);

  useEffect(() => {
    if (activeTab === 'following') loadFollowingVideos();
  }, [activeTab, loadFollowingVideos]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || !lastCursorRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    loadVideos(lastCursorRef.current).finally(() => { loadingMoreRef.current = false; setLoadingMore(false); });
  }, [hasMore]);

  const handleFollowChange = (name: string, followed: boolean) => {
    setFollowedCompanies(prev => { const next = new Set(prev); if (followed) next.add(name); else next.delete(name); return next; });
    if (activeTab === 'following') setTimeout(loadFollowingVideos, 300);
  };

  const handleSaveChange = (jobId: string, saved: boolean, jobData?: JobData) => {
    setSavedJobIds(prev => { const next = new Set(prev); if (saved) next.add(jobId); else next.delete(jobId); return next; });
    if (saved && jobData) setSavedJobsData(prev => prev.some(j => j.id === jobId) ? prev : [...prev, jobData]);
    else if (!saved) setSavedJobsData(prev => prev.filter(j => j.id !== jobId));
  };

  const filterJobList = useCallback((list: JobData[]) => {
    const kw = searchKeyword.trim().toLowerCase();
    const loc = searchLocation.trim().toLowerCase();
    const tag = searchTag.trim().toLowerCase();
    if (!kw && !loc && !tag) return list;
    return list.filter((j) => {
      const haystack = [j.jobTitle, j.companyName, j.description, ...(j.tags || [])]
        .join(' ')
        .toLowerCase();
      const matchKw = !kw || haystack.includes(kw);
      const matchLoc = !loc || (j.location || '').toLowerCase().includes(loc);
      const matchTag = !tag || (j.tags || []).some((t) => t.toLowerCase().includes(tag));
      return matchKw && matchLoc && matchTag;
    });
  }, [searchKeyword, searchLocation, searchTag]);

  const displayedJobs = useMemo(() => {
    const base =
      activeTab === 'following' ? followingVideos :
      activeTab === 'saved' ? savedJobsData : jobs;
    return activeTab === 'foryou' ? filterJobList(base) : base;
  }, [activeTab, followingVideos, savedJobsData, jobs, filterJobList]);

  const hasActiveFilters = !!(searchKeyword.trim() || searchLocation.trim() || searchTag.trim());

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col overflow-hidden">

      {/* ── Sound overlay: full-screen, requires one tap to bypass browser autoplay policy ── */}
      {showSoundOverlay && (
        <div
          onClick={handleEnableSound}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
          style={{ background: 'linear-gradient(160deg, #0d0d1a 0%, #0a0a14 50%, #050510 100%)' }}
        >
          {/* Animated ring */}
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full border-4 border-blue-500/30 animate-ping absolute inset-0" />
            <div className="w-28 h-28 rounded-full border-2 border-blue-400/50 flex items-center justify-center relative bg-black/80">
              <Volume2 className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-3 text-center px-8">
            {t('tapSound', appLang)}
          </h2>
          <p className="text-white/50 text-sm md:text-base text-center px-12 max-w-xs leading-relaxed">
            {t('tapDesc', appLang)}
          </p>
          <div className="mt-10 px-8 py-3 rounded-2xl bg-blue-600 text-white text-base font-bold shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-colors">
            {t('tapBtn', appLang)}
          </div>
        </div>
      )}

      {/* ── PROFILE PAGE ── */}
      {navTab === 'profile' && (
        <>
          <div className="flex-1 overflow-hidden">
            <ProfileModal onClose={() => { setNavTab('home'); setActiveTab('foryou'); }} language={appLang} onPlayJob={openJobById} />
          </div>
          <BottomNav
            activeTab={activeTab} navTab={navTab}
            onNav={(tab) => { setNavTab(tab); if (tab === 'home') setActiveTab('foryou'); }}
            onTabChange={(tab) => { setActiveTab(tab); setNavTab('home'); }}
            t={(k) => t(k, appLang)}
            followCount={followedCompanies.size} savedCount={savedJobIds.size}
          />
        </>
      )}

      {/* ── MAIN FEED ── */}
      {navTab === 'home' && (
        <>
          {/* ── Top Header: Logo + Avatar (no tab pills here) ── */}
          <div className="shorts-font-large w-full flex-shrink-0 px-6 py-5 md:min-h-40 md:px-12 md:py-8 z-30 flex justify-between items-center bg-black/90 backdrop-blur-md border-b border-white/8">
            {/* Logo */}
            <div className="flex origin-left items-center gap-4 shrink-0">
              <BrandLogo size="hero" showIcon />
              <span className="text-white/80 text-4xl md:text-6xl font-semibold">Shorts</span>
            </div>

            {/* Right: language switcher + avatar */}
            <div className="flex items-center gap-4 md:gap-8 shrink-0">
              {navTab === 'home' && activeTab === 'foryou' && (
                <button
                  type="button"
                  onClick={() => setShowSearch((v) => !v)}
                  className={`p-3 md:p-6 xl:p-8 rounded-xl md:rounded-2xl xl:rounded-3xl border-2 transition-colors ${showSearch || hasActiveFilters ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/15 text-white/70 hover:text-white'}`}
                  aria-label={t('search', appLang)}
                >
                  <Search className="h-6 w-6 md:h-12 md:w-12 xl:h-[72px] xl:w-[72px]" />
                </button>
              )}
              <LanguageSwitcher variant="light" size="lg" />

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative flex items-center justify-center w-14 h-14 md:w-24 md:h-24 rounded-full ring-2 md:ring-4 ring-white/20 hover:ring-white/50 transition-all overflow-hidden bg-slate-800 shrink-0"
                    aria-label="Profile menu"
                  >
                    {user.user_metadata?.avatar_url
                      ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-lg">{(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}</span>
                    }
                    {/* Role badge */}
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black ${userRole === 'employer' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                        {/* User header */}
                        <div className="px-4 py-3.5 border-b border-white/8 flex items-center gap-3">
                          {user.user_metadata?.avatar_url
                            ? <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="" />
                            : <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><UserCircle2 size={20} className="text-slate-400" /></div>
                          }
                          <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user.user_metadata?.full_name || 'User'}</p>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${userRole === 'employer' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {userRole === 'employer' ? t('empBadge', appLang) : t('talBadge', appLang)}
                            </span>
                          </div>
                        </div>

                        {/* ── EMPLOYER MENU ── */}
                        {userRole === 'employer' && (
                          <div className="py-1.5">
                            <p className="px-4 py-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('empTools', appLang)}</p>
                            <Link href="/shorts?shorts_view=company&open_profile=1" onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors">
                              <Building2 size={15} className="text-blue-400 shrink-0" />
                              {t('dashboard', appLang)}
                            </Link>
                            <Link href="/employer/dashboard?legacy=1" onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/60 hover:text-white text-xs transition-colors">
                              <Edit size={14} className="text-slate-400 shrink-0" />
                              {t('editVideos', appLang)}
                            </Link>
                            <Link href="/shorts/upload" onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors">
                              <Upload size={15} className="text-violet-400 shrink-0" />
                              {t('uploadVideo', appLang)}
                            </Link>
                            {companyName && (
                              <Link href={`/shorts/company/${encodeURIComponent(companyName)}`} onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors">
                                <Video size={15} className="text-cyan-400 shrink-0" />
                                {t('myCompany', appLang)}
                              </Link>
                            )}
                            <div className="mx-4 my-1.5 border-t border-white/8" />
                            <button onClick={() => { setShowUserMenu(false); setNavTab('profile'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors text-left">
                              <UserCircle2 size={15} className="text-slate-400 shrink-0" />
                              {t('acctSettings', appLang)}
                            </button>
                          </div>
                        )}

                        {/* ── TALENT MENU ── */}
                        {userRole === 'talent' && (
                          <div className="py-1.5">
                            <p className="px-4 py-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('myActivity', appLang)}</p>
                            <button onClick={() => { setShowUserMenu(false); setActiveTab('saved'); setNavTab('home'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors text-left">
                              <Bookmark size={15} className="text-amber-400 shrink-0" />
                              {t('savedJobs', appLang)}
                              {savedJobIds.size > 0 && <span className="ml-auto text-xs text-white/30">{savedJobIds.size}</span>}
                            </button>
                            <button onClick={() => { setShowUserMenu(false); setNavTab('profile'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors text-left">
                              <UserCircle2 size={15} className="text-emerald-400 shrink-0" />
                              {t('myResume', appLang)}
                            </button>
                            <button onClick={() => { setShowUserMenu(false); setNavTab('profile'); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/80 hover:text-white text-sm transition-colors text-left">
                              <Video size={15} className="text-blue-400 shrink-0" />
                              {t('myApps', appLang)}
                            </button>
                            <div className="mx-4 my-1.5 border-t border-white/8" />
                            <Link href="/employer/login" onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/40 hover:text-white/70 text-xs transition-colors">
                              <Building2 size={14} className="shrink-0" />
                              {t('postAsEmp', appLang)}
                            </Link>
                          </div>
                        )}

                        {/* Logout */}
                        <div className="border-t border-white/8 py-1.5">
                          <button
                            onClick={async () => { setShowUserMenu(false); const s = createClient(); await s.auth.signOut(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-900/20 text-red-400/80 hover:text-red-300 text-sm transition-colors text-left"
                          >
                            <LogOut size={15} className="shrink-0" />
                            {t('logout', appLang)}
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
                    className="flex items-center gap-2 md:gap-4 xl:gap-5 px-5 py-3 md:px-8 md:py-6 xl:px-10 xl:py-8 bg-white/10 border-2 border-white/20 rounded-xl md:rounded-2xl xl:rounded-3xl text-white text-lg md:text-3xl xl:text-5xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    <LogIn className="w-6 h-6 md:w-12 md:h-12 xl:w-[72px] xl:h-[72px]" />
                    {t('login', appLang)}
                    <ChevronDown className="w-5 h-5 md:w-10 md:h-10 xl:w-16 xl:h-16 opacity-60" />
                  </button>
                  {showLoginMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLoginMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="p-3">
                          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest px-1 mb-2">{t('iAmA', appLang)}</p>
                          <button
                            onClick={async () => {
                              const s = createClient();
                              await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=employer` } });
                              setShowLoginMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-white text-sm text-left mb-2"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                              <Building2 size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{t('empLogin', appLang)}</p>
                              <p className="text-white/50 text-[11px]">{t('postMgmt', appLang)}</p>
                            </div>
                          </button>
                          <button
                            onClick={async () => {
                              const s = createClient();
                              await s.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts&type=talent` } });
                              setShowLoginMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 transition-colors text-white text-sm text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                              <User size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{t('talLogin', appLang)}</p>
                              <p className="text-white/50 text-[11px]">{t('browseApply', appLang)}</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search / filter bar */}
          {navTab === 'home' && activeTab === 'foryou' && showSearch && (
            <div className="w-full flex-shrink-0 px-4 py-3 bg-black/90 border-b border-white/8 z-20">
              <div className="flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="search"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={t('searchJobs', appLang)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="relative flex-1 sm:max-w-[140px]">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder={t('location', appLang)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="relative flex-1 sm:max-w-[120px]">
                  <input
                    type="text"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder={t('tag', appLang)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => { setSearchKeyword(''); setSearchLocation(''); setSearchTag(''); }}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-white/60 hover:text-white text-sm border border-white/12 hover:bg-white/5"
                  >
                    <XCircle size={14} />
                    {t('clearFilters', appLang)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Toasts */}
          {error && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-xl p-3.5 shadow-xl flex items-center gap-3 min-w-[280px] max-w-[90vw]">
                <AlertCircle className="text-red-400 shrink-0" size={18} />
                <p className="text-red-100 text-sm flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400"><X size={16} /></button>
              </div>
            </div>
          )}
          {success && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-green-900/90 backdrop-blur-md border border-green-500/50 rounded-xl p-3.5 shadow-xl flex items-center gap-3 min-w-[280px] max-w-[90vw]">
                <CheckCircle className="text-green-400 shrink-0" size={18} />
                <p className="text-green-100 text-sm flex-1">{success}</p>
                <button onClick={() => setSuccess(null)} className="text-green-400"><X size={16} /></button>
              </div>
            </div>
          )}

          {/* Feed area */}
          <div className="flex-1 min-h-0 w-full relative">
            {activeTab === 'saved' && savedJobsData.length === 0 ? (
              <EmptyState icon={Bookmark} title={t('noSaved', appLang)} hint={t('tapBookmark', appLang)} />
            ) : activeTab === 'following' && !user ? (
              <EmptyState icon={Users} title={t('loginFirst', appLang)} hint="" action={<button onClick={() => setShowLoginMenu(true)} className="mt-4 px-6 py-3 bg-white/10 border border-white/25 rounded-2xl text-white text-sm font-semibold hover:bg-white/20 transition-colors">{t('login', appLang)}</button>} />
            ) : activeTab === 'following' && followedCompanies.size === 0 ? (
              <EmptyState icon={Building2} title={t('noFollowing', appLang)} hint={t('tapFollow', appLang)} />
            ) : activeTab === 'following' && loadingFollowing ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
            ) : activeTab === 'foryou' && hasActiveFilters && displayedJobs.length === 0 ? (
              <EmptyState icon={Search} title={t('noResults', appLang)} hint="" action={
                <button type="button" onClick={() => { setSearchKeyword(''); setSearchLocation(''); setSearchTag(''); }} className="mt-4 px-6 py-3 bg-white/10 border border-white/25 rounded-2xl text-white text-sm font-semibold hover:bg-white/20 transition-colors">{t('clearFilters', appLang)}</button>
              } />
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
                initialJobId={activeTab === 'foryou' ? initialJobId : null}
              />
            )}
          </div>

          {/* Bottom Nav */}
          <BottomNav
            activeTab={activeTab} navTab={navTab}
            onNav={(tab) => { setNavTab(tab); if (tab === 'home') setActiveTab('foryou'); }}
            onTabChange={(tab) => { setActiveTab(tab); setNavTab('home'); }}
            t={(k) => t(k, appLang)}
            followCount={followedCompanies.size} savedCount={savedJobIds.size}
          />
        </>
      )}
    </div>
  );
}

// Empty state helper
function EmptyState({ icon: Icon, title, hint, action }: { icon: any; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-white/50 px-8">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      <p className="text-lg font-semibold text-white/70 text-center">{title}</p>
      {hint && <p className="text-sm text-center leading-relaxed max-w-xs">{hint}</p>}
      {action}
    </div>
  );
}

// Bottom Nav: Home | Following | Saved | Me
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
  return (
    <div
      className="shorts-font-large h-[8.5rem] md:h-[10.5rem] bg-black/95 border-t-2 border-gray-800/60 flex items-center justify-around z-40 flex-shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {([
        { id: 'foryou' as const, icon: Home,     label: t('home'),      badge: 0,          active: activeTab === 'foryou' && navTab === 'home' },
        { id: 'following' as const, icon: Users, label: t('following'), badge: followCount, active: activeTab === 'following' && navTab === 'home' },
        { id: 'saved' as const, icon: Bookmark,  label: t('saved'),     badge: savedCount,  active: activeTab === 'saved' && navTab === 'home' },
      ]).map(({ id, icon: Icon, label, badge, active }) => (
        <button key={id} onClick={() => onTabChange(id)}
          className="flex flex-col items-center gap-2 px-3 py-2 min-w-[4.5rem] text-white transition-colors">
          <div className="relative">
            <Icon className="h-[4.5rem] w-[4.5rem] fill-white text-white md:h-[5.4rem] md:w-[5.4rem]" strokeWidth={active ? 2.75 : 2} />
            {badge > 0 && (
              <span className="shorts-nav-badge absolute left-full top-0 ml-0.5 flex h-[2.1rem] min-w-[2.1rem] items-center justify-center rounded-full bg-blue-500 px-1 font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <span className="shorts-nav-label font-bold leading-none text-white">{label}</span>
        </button>
      ))}
      <button onClick={() => onNav('profile')}
        className="flex flex-col items-center gap-2 px-3 py-2 min-w-[4.5rem] text-white transition-colors">
        <User className="h-[4.5rem] w-[4.5rem] fill-white text-white md:h-[5.4rem] md:w-[5.4rem]" strokeWidth={navTab === 'profile' ? 2.75 : 2} />
        <span className="shorts-nav-label font-bold leading-none text-white">{t('me')}</span>
      </button>
    </div>
  );
}
