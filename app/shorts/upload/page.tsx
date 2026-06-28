'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle,
  Video, Building2, MapPin, DollarSign, FileText, Tag,
  Mail, ExternalLink, Image, LogIn, ChevronRight, Link as LinkIcon, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import {
  detectVideoSourceType,
  toYouTubeEmbedUrl,
  sourceTypeLabel,
} from '@/lib/video-embed';
import { useLanguage } from '@/lib/language-context';
import type { AppLanguage } from '@/lib/language-context';
import type { VideoSourceType } from '@/types';

// ── Translations ─────────────────────────────────────────────────────────────
type UpKey =
  | 'pageTitle' | 'signInTitle' | 'signInDesc' | 'signInBtn'
  | 'step' | 'of' | 'next' | 'back' | 'publish' | 'publishing'
  | 'stepVideo' | 'stepInfo' | 'stepApply' | 'stepPreview'
  | 'companyName' | 'jobTitle' | 'location' | 'salary' | 'description'
  | 'tags' | 'logo' | 'contactEmail' | 'applyUrl'
  | 'applyMethodTitle' | 'applyMethodDesc'
  | 'applyEmail' | 'applyEmailDesc' | 'applyRedirect' | 'applyRedirectDesc' | 'applyNone' | 'applyNoneDesc'
  | 'previewTitle' | 'applyMethod' | 'videoSource' | 'licenseNote'
  | 'doneTitle' | 'doneDesc' | 'viewPage' | 'backToShorts' | 'uploadAnother'
  | 'confirm' | 'change' | 'selectVideo' | 'videoHint' | 'linkRecommended' | 'uploadFile';

const UP: Record<AppLanguage, Record<UpKey, string>> = {
  en: {
    pageTitle: 'Post a Job Video', signInTitle: 'Sign in to post a job video',
    signInDesc: 'Upload a recruitment video and let job seekers discover your company.',
    signInBtn: 'Sign in with Google',
    step: 'Step', of: 'of', next: 'Continue', back: 'Back',
    publish: 'Publish Now', publishing: 'Publishing…',
    stepVideo: 'Add Recruitment Video', stepInfo: 'Job Details',
    stepApply: 'Application Method', stepPreview: 'Preview & Publish',
    companyName: 'Company Name *', jobTitle: 'Job Title *',
    location: 'Location', salary: 'Salary Range',
    description: 'Job Description', tags: 'Tags (comma separated)',
    logo: 'Company Logo (optional)', contactEmail: 'Contact Email *', applyUrl: 'Application Page URL *',
    applyMethodTitle: 'Choose how applicants apply',
    applyMethodDesc: 'Select how job seekers can apply for this position',
    applyEmail: 'Quick Apply (receive résumés by email)',
    applyEmailDesc: 'Applicants send their résumé directly to your inbox via the platform',
    applyRedirect: 'Redirect to careers page',
    applyRedirectDesc: 'Applicants are sent to your external application page',
    applyNone: 'Not accepting applications yet',
    applyNoneDesc: 'Show the job info only, no applications',
    previewTitle: 'Confirm & Publish',
    applyMethod: 'Application method', videoSource: 'Video source',
    licenseNote: 'By clicking "Publish Now" you confirm that this video and job listing is owned by your company or properly licensed, and you agree to Jobbeagle displaying it for recruitment purposes.',
    doneTitle: 'Published!', doneDesc: 'Your job video is now live on Shorts.',
    viewPage: 'View company page', backToShorts: 'Back to Shorts', uploadAnother: 'Upload another job',
    confirm: 'Confirm', change: 'Change',
    selectVideo: 'Click to select a video', videoHint: 'MP4 / WebM, max 100 MB · max 90s · 9:16 recommended',
    linkRecommended: 'Paste a social link (recommended)', uploadFile: 'Upload a video file',
  },
  'zh-TW': {
    pageTitle: '上傳職缺影片', signInTitle: '企業登入後即可上傳',
    signInDesc: '上傳職缺影片、填寫公司資訊，讓更多求職者看到你們',
    signInBtn: '以 Google 帳號登入',
    step: '步驟', of: '/', next: '繼續', back: '返回',
    publish: '立即發佈', publishing: '發佈中…',
    stepVideo: '新增招募影片', stepInfo: '填寫職缺資訊',
    stepApply: '申請方式', stepPreview: '確認並發佈',
    companyName: '公司名稱 *', jobTitle: '職缺名稱 *',
    location: '工作地點', salary: '薪資範圍',
    description: '職缺描述', tags: '標籤（逗號分隔）',
    logo: '公司 Logo（選填）', contactEmail: '接收履歷的信箱 *', applyUrl: '企業申請頁網址 *',
    applyMethodTitle: '申請方式', applyMethodDesc: '選擇求職者如何申請這個職缺',
    applyEmail: '一鍵申請（接收履歷信件）', applyEmailDesc: '求職者直接透過平台發送履歷到你的信箱',
    applyRedirect: '導引到企業申請頁', applyRedirectDesc: '求職者點擊「套用」後跳轉到你們的招募頁面',
    applyNone: '暫不開放申請', applyNoneDesc: '僅展示職缺資訊，不接受申請',
    previewTitle: '確認並發佈',
    applyMethod: '申請方式', videoSource: '影片來源',
    licenseNote: '點擊「立即發佈」即代表您確認此影片與職缺內容由貴公司擁有或已取得合法授權，並同意 Jobbeagle 以嵌入或展示方式用於招募目的。',
    doneTitle: '發佈成功！', doneDesc: '你的職缺影片已上線，求職者現在可以在 Shorts 看到',
    viewPage: '查看企業頁面', backToShorts: '返回 Shorts', uploadAnother: '再上傳一個職缺',
    confirm: '確認', change: '更換',
    selectVideo: '點擊選擇影片', videoHint: '支援 MP4 / WebM，最大 100MB・最長 90 秒\n建議 9:16 直式短影音',
    linkRecommended: '貼社群連結（推薦）', uploadFile: '上傳影片檔',
  },
  'zh-CN': {
    pageTitle: '上传职位视频', signInTitle: '企业登录后即可上传',
    signInDesc: '上传招聘视频、填写公司信息，让更多求职者看到你们',
    signInBtn: '使用 Google 账号登录',
    step: '步骤', of: '/', next: '继续', back: '返回',
    publish: '立即发布', publishing: '发布中…',
    stepVideo: '添加招募视频', stepInfo: '填写职位信息',
    stepApply: '申请方式', stepPreview: '确认并发布',
    companyName: '公司名称 *', jobTitle: '职位名称 *',
    location: '工作地点', salary: '薪资范围',
    description: '职位描述', tags: '标签（逗号分隔）',
    logo: '公司 Logo（选填）', contactEmail: '接收简历的邮箱 *', applyUrl: '企业申请页网址 *',
    applyMethodTitle: '申请方式', applyMethodDesc: '选择求职者如何申请这个职位',
    applyEmail: '一键申请（接收简历邮件）', applyEmailDesc: '求职者直接通过平台发送简历到你的邮箱',
    applyRedirect: '引导到企业申请页', applyRedirectDesc: '求职者点击"套用"后跳转到你们的招募页面',
    applyNone: '暂不开放申请', applyNoneDesc: '仅展示职位信息，不接受申请',
    previewTitle: '确认并发布',
    applyMethod: '申请方式', videoSource: '视频来源',
    licenseNote: '点击"立即发布"即代表您确认此视频与职位内容由贵公司拥有或已取得合法授权，并同意 Jobbeagle 以嵌入或展示方式用于招募目的。',
    doneTitle: '发布成功！', doneDesc: '你的职位视频已上线，求职者现在可以在 Shorts 看到',
    viewPage: '查看企业页面', backToShorts: '返回 Shorts', uploadAnother: '再上传一个职位',
    confirm: '确认', change: '更换',
    selectVideo: '点击选择视频', videoHint: '支持 MP4 / WebM，最大 100MB・最长 90 秒\n建议 9:16 竖式短视频',
    linkRecommended: '粘贴社交链接（推荐）', uploadFile: '上传视频文件',
  },
  es: {
    pageTitle: 'Publicar video de empleo', signInTitle: 'Inicia sesión para publicar',
    signInDesc: 'Sube un video de reclutamiento y deja que los candidatos descubran tu empresa.',
    signInBtn: 'Iniciar sesión con Google',
    step: 'Paso', of: 'de', next: 'Continuar', back: 'Atrás',
    publish: 'Publicar ahora', publishing: 'Publicando…',
    stepVideo: 'Agregar video', stepInfo: 'Detalles del puesto',
    stepApply: 'Método de aplicación', stepPreview: 'Vista previa y publicar',
    companyName: 'Nombre de la empresa *', jobTitle: 'Título del puesto *',
    location: 'Ubicación', salary: 'Rango salarial',
    description: 'Descripción del puesto', tags: 'Etiquetas (separadas por coma)',
    logo: 'Logo de la empresa (opcional)', contactEmail: 'Email de contacto *', applyUrl: 'URL de la página de aplicación *',
    applyMethodTitle: 'Método de aplicación', applyMethodDesc: 'Elige cómo los candidatos pueden aplicar',
    applyEmail: 'Aplicación rápida (recibir currículos por email)', applyEmailDesc: 'Los candidatos envían su currículo directamente a tu bandeja de entrada',
    applyRedirect: 'Redirigir a página de empleo', applyRedirectDesc: 'Los candidatos son enviados a tu página de aplicación externa',
    applyNone: 'Sin aplicaciones por ahora', applyNoneDesc: 'Solo muestra la información del puesto',
    previewTitle: 'Confirmar y publicar',
    applyMethod: 'Método de aplicación', videoSource: 'Fuente del video',
    licenseNote: 'Al hacer clic en "Publicar ahora" confirmas que este video y oferta de empleo son de tu empresa o tienen licencia adecuada, y aceptas que Jobbeagle lo muestre para fines de reclutamiento.',
    doneTitle: '¡Publicado!', doneDesc: 'Tu video de empleo ya está disponible en Shorts.',
    viewPage: 'Ver página de empresa', backToShorts: 'Volver a Shorts', uploadAnother: 'Subir otro empleo',
    confirm: 'Confirmar', change: 'Cambiar',
    selectVideo: 'Clic para seleccionar video', videoHint: 'MP4 / WebM, máx 100 MB · máx 90s · Se recomienda 9:16',
    linkRecommended: 'Pegar enlace social (recomendado)', uploadFile: 'Subir archivo de video',
  },
  hi: {
    pageTitle: 'जॉब वीडियो पोस्ट करें', signInTitle: 'पोस्ट करने के लिए साइन इन करें',
    signInDesc: 'भर्ती वीडियो अपलोड करें और नौकरी चाहने वालों को अपनी कंपनी खोजने दें।',
    signInBtn: 'Google से साइन इन करें',
    step: 'चरण', of: 'का', next: 'जारी रखें', back: 'वापस',
    publish: 'अभी प्रकाशित करें', publishing: 'प्रकाशित हो रहा है…',
    stepVideo: 'भर्ती वीडियो जोड़ें', stepInfo: 'नौकरी विवरण',
    stepApply: 'आवेदन विधि', stepPreview: 'पूर्वावलोकन और प्रकाशित करें',
    companyName: 'कंपनी का नाम *', jobTitle: 'पद का नाम *',
    location: 'स्थान', salary: 'वेतन सीमा',
    description: 'नौकरी विवरण', tags: 'टैग (अल्पविराम से अलग)',
    logo: 'कंपनी लोगो (वैकल्पिक)', contactEmail: 'संपर्क ईमेल *', applyUrl: 'आवेदन पृष्ठ URL *',
    applyMethodTitle: 'आवेदन विधि', applyMethodDesc: 'चुनें कि आवेदक कैसे आवेदन करें',
    applyEmail: 'त्वरित आवेदन (ईमेल द्वारा)', applyEmailDesc: 'आवेदक सीधे आपके इनबॉक्स में रेज़्यूमे भेजते हैं',
    applyRedirect: 'करियर पेज पर रीडायरेक्ट', applyRedirectDesc: 'आवेदकों को आपके बाहरी आवेदन पृष्ठ पर भेजा जाता है',
    applyNone: 'अभी आवेदन स्वीकार नहीं', applyNoneDesc: 'केवल नौकरी की जानकारी दिखाएं',
    previewTitle: 'पुष्टि करें और प्रकाशित करें',
    applyMethod: 'आवेदन विधि', videoSource: 'वीडियो स्रोत',
    licenseNote: '"अभी प्रकाशित करें" पर क्लिक करके आप पुष्टि करते हैं कि यह वीडियो और नौकरी सूची आपकी कंपनी की है।',
    doneTitle: 'प्रकाशित!', doneDesc: 'आपका जॉब वीडियो Shorts पर लाइव है।',
    viewPage: 'कंपनी पेज देखें', backToShorts: 'Shorts पर वापस', uploadAnother: 'और नौकरी अपलोड करें',
    confirm: 'पुष्टि करें', change: 'बदलें',
    selectVideo: 'वीडियो चुनने के लिए क्लिक करें', videoHint: 'MP4 / WebM, अधिकतम 100 MB · अधिकतम 90 सेकंड',
    linkRecommended: 'सोशल लिंक पेस्ट करें (अनुशंसित)', uploadFile: 'वीडियो फ़ाइल अपलोड करें',
  },
  ar: {
    pageTitle: 'نشر فيديو وظيفة', signInTitle: 'سجّل الدخول للنشر',
    signInDesc: 'ارفع فيديو توظيف ودع الباحثين عن عمل يكتشفون شركتك.',
    signInBtn: 'تسجيل الدخول بـ Google',
    step: 'خطوة', of: 'من', next: 'متابعة', back: 'رجوع',
    publish: 'نشر الآن', publishing: 'جارٍ النشر…',
    stepVideo: 'إضافة فيديو التوظيف', stepInfo: 'تفاصيل الوظيفة',
    stepApply: 'طريقة التقديم', stepPreview: 'معاينة ونشر',
    companyName: 'اسم الشركة *', jobTitle: 'المسمى الوظيفي *',
    location: 'الموقع', salary: 'نطاق الراتب',
    description: 'وصف الوظيفة', tags: 'الوسوم (مفصولة بفواصل)',
    logo: 'شعار الشركة (اختياري)', contactEmail: 'البريد الإلكتروني للتواصل *', applyUrl: 'رابط صفحة التقديم *',
    applyMethodTitle: 'طريقة التقديم', applyMethodDesc: 'اختر كيف يتقدم المرشحون',
    applyEmail: 'تقديم سريع (استقبال السيرة بالبريد)', applyEmailDesc: 'يرسل المتقدمون سيرتهم مباشرة إلى بريدك',
    applyRedirect: 'توجيه إلى صفحة التوظيف', applyRedirectDesc: 'يُحوَّل المتقدمون إلى صفحة التقديم الخارجية',
    applyNone: 'لا قبول الآن', applyNoneDesc: 'اعرض معلومات الوظيفة فقط',
    previewTitle: 'تأكيد ونشر',
    applyMethod: 'طريقة التقديم', videoSource: 'مصدر الفيديو',
    licenseNote: 'بالنقر على "نشر الآن" تؤكد أن هذا الفيديو والوظيفة مملوكان لشركتك أو مرخصان بشكل قانوني.',
    doneTitle: 'تم النشر!', doneDesc: 'فيديو وظيفتك متاح الآن على Shorts.',
    viewPage: 'عرض صفحة الشركة', backToShorts: 'العودة إلى Shorts', uploadAnother: 'رفع وظيفة أخرى',
    confirm: 'تأكيد', change: 'تغيير',
    selectVideo: 'انقر لاختيار فيديو', videoHint: 'MP4 / WebM، الحد الأقصى 100 ميجابايت · 90 ثانية',
    linkRecommended: 'لصق رابط اجتماعي (مُوصى به)', uploadFile: 'رفع ملف فيديو',
  },
};

type Step = 'auth' | 'video' | 'info' | 'apply' | 'preview' | 'done';
type ApplyMethod = 'email' | 'url' | 'none';
type VideoInputMode = 'upload' | 'link';

interface FormData {
  companyName: string;
  jobTitle: string;
  location: string;
  salary: string;
  description: string;
  tags: string;
  contactEmail: string;
  applyUrl: string;
  applyMethod: ApplyMethod;
  videoUrl: string;
  videoSourceType: VideoSourceType;
  logoUrl: string;
}

const INITIAL_FORM: FormData = {
  companyName: '', jobTitle: '', location: '', salary: '',
  description: '', tags: '', contactEmail: '', applyUrl: '',
  applyMethod: 'email', videoUrl: '', videoSourceType: 'upload', logoUrl: '',
};

// 平台連結提示
const PLATFORM_HINTS: Record<string, { label: string; placeholder: string; example: string }> = {
  youtube: {
    label: 'YouTube / YouTube Shorts 連結',
    placeholder: 'https://www.youtube.com/shorts/...',
    example: '支援 youtube.com/watch?v=...、youtu.be/...、youtube.com/shorts/...',
  },
  instagram: {
    label: 'Instagram Reel / Post 連結',
    placeholder: 'https://www.instagram.com/reel/...',
    example: '必須是公開貼文，支援 /reel/ 與 /p/ 格式',
  },
  facebook: {
    label: 'Facebook 影片 / Post 連結',
    placeholder: 'https://www.facebook.com/...',
    example: '必須是公開貼文或公開影片',
  },
  external: {
    label: '外部影片連結',
    placeholder: 'https://...',
    example: '直接影片網址（.mp4）或其他平台連結',
  },
};

export default function ShortsUploadPage() {
  const { language: appLanguage } = useLanguage();
  const t = (key: UpKey) => UP[appLanguage]?.[key] ?? UP.en[key];

  const [step, setStep] = useState<Step>('auth');
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>('link');
  const [socialLinkInput, setSocialLinkInput] = useState('');
  const [socialLinkError, setSocialLinkError] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) setStep('video');
    });
  }, []);

  const set = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/shorts/upload` },
    });
  };

  // ── 社群連結確認 ────────────────────────────────────────────────────────────

  const handleConfirmSocialLink = () => {
    setSocialLinkError('');
    const trimmed = socialLinkInput.trim();
    if (!trimmed) {
      setSocialLinkError('請輸入影片連結');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setSocialLinkError('請輸入有效的完整網址（需包含 https://）');
      return;
    }
    const sourceType = detectVideoSourceType(trimmed);
    setForm(f => ({ ...f, videoUrl: trimmed, videoSourceType: sourceType }));
    setSocialLinkError('');
  };

  const handleClearSocialLink = () => {
    setSocialLinkInput('');
    setSocialLinkError('');
    setForm(f => ({ ...f, videoUrl: '', videoSourceType: 'upload' }));
  };

  // ── 影片檔上傳 ──────────────────────────────────────────────────────────────

  const uploadFile = async (file: File, type: 'video' | 'logo'): Promise<string | null> => {
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'logo' ? 'png' : 'mp4');
    const path = type === 'logo'
      ? `logos/logo-${Date.now()}.${ext}`
      : `video-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('shorts-videos')
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('尚未建立 Storage 空間。請到 Supabase → Storage → 新增 bucket「shorts-videos」並設為公開。');
      }
      throw new Error(error.message || '上傳失敗');
    }

    const { data: urlData } = supabase.storage.from('shorts-videos').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Size limit: 100 MB ──────────────────────────────────────────────
    if (file.size > 100 * 1024 * 1024) {
      setError(
        appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
          ? `影片檔案超過 100 MB（目前 ${(file.size / 1024 / 1024).toFixed(0)} MB）。請壓縮影片或改用 YouTube / Instagram 社群連結，節省儲存費用。`
          : `Video exceeds the 100 MB limit (${(file.size / 1024 / 1024).toFixed(0)} MB). Please compress or use a YouTube / Instagram link instead.`
      );
      e.target.value = '';
      return;
    }

    // ── Duration limit: 90 seconds (like Instagram Reels max) ──────────
    const checkDuration = (): Promise<number> =>
      new Promise((resolve) => {
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.onloadedmetadata = () => { resolve(vid.duration); URL.revokeObjectURL(vid.src); };
        vid.onerror = () => resolve(0); // skip if unreadable
        vid.src = URL.createObjectURL(file);
      });

    const dur = await checkDuration();
    if (dur > 90) {
      setError(
        appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
          ? `影片時長 ${Math.round(dur)} 秒，超過 90 秒上限（類 Instagram Reels 標準）。請裁剪影片後重新上傳，或貼入社群平台連結。`
          : `Video is ${Math.round(dur)}s long — the limit is 90 seconds (Instagram Reels standard). Please trim it or paste a social media link instead.`
      );
      e.target.value = '';
      return;
    }

    setUploadingVideo(true);
    setError(null);
    try {
      const url = await uploadFile(file, 'video');
      if (url) setForm(f => ({ ...f, videoUrl: url, videoSourceType: 'upload' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const url = await uploadFile(file, 'logo');
      if (url) set('logoUrl', url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── 發佈 ────────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        company_name: form.companyName,
        job_title: form.jobTitle,
        location: form.location,
        salary: form.salary,
        description: form.description,
        tags: form.tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean),
        video_url: form.videoUrl,
        video_source_type: form.videoSourceType,
        logo_url: form.logoUrl || undefined,
        contact_email: form.applyMethod === 'email' ? form.contactEmail : undefined,
        apply_url: form.applyMethod === 'url' ? form.applyUrl : undefined,
      };
      const res = await fetch('/api/shorts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '發佈失敗');
      setPublishedUrl(`/shorts/company/${encodeURIComponent(form.companyName)}`);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 目前偵測到的平台 ─────────────────────────────────────────────────────────

  const detectedType = socialLinkInput.trim()
    ? detectVideoSourceType(socialLinkInput.trim())
    : null;

  const platformHint = detectedType && detectedType !== 'upload'
    ? PLATFORM_HINTS[detectedType] ?? PLATFORM_HINTS.external
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Link href="/shorts" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg">{t('pageTitle')}</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Step: Auth */}
        {step === 'auth' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{t('signInTitle')}</h2>
              <p className="text-slate-400 text-sm">{t('signInDesc')}</p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-base transition-colors"
            >
              <LogIn size={20} />
              {t('signInBtn')}
            </button>
          </div>
        )}

        {/* Step: Video */}
        {step === 'video' && (
          <div className="space-y-5">
            <StepHeader step={1} total={4} title={t('stepVideo')} stepLabel={t('step')} ofLabel={t('of')} />

            {/* 模式切換 */}
            <div className="flex gap-2 p-1 bg-slate-800/60 rounded-xl border border-slate-700">
              {([
                { mode: 'link' as const, icon: LinkIcon, label: t('linkRecommended') },
                { mode: 'upload' as const, icon: Upload, label: t('uploadFile') },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setVideoInputMode(mode);
                    handleClearSocialLink();
                    setForm(f => ({ ...f, videoUrl: '', videoSourceType: 'upload' }));
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    videoInputMode === mode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* 貼連結 */}
            {videoInputMode === 'link' && (
              <div className="space-y-4">
                {/* 平台說明 */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    { icon: '▶', name: 'YouTube Shorts' },
                    { icon: '📸', name: 'Instagram Reel' },
                    { icon: '📘', name: 'Facebook Video' },
                  ].map(({ icon, name }) => (
                    <div key={name} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400">
                      <span className="text-xl">{icon}</span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                    <LinkIcon size={15} />
                    {platformHint ? platformHint.label : '貼上招募影片連結'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinkInput}
                      onChange={e => {
                        setSocialLinkInput(e.target.value);
                        setSocialLinkError('');
                        // 若已確認的連結與輸入不同，清空已確認
                        if (form.videoUrl && e.target.value.trim() !== form.videoUrl) {
                          setForm(f => ({ ...f, videoUrl: '', videoSourceType: 'upload' }));
                        }
                      }}
                      placeholder="https://www.youtube.com/shorts/..."
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleConfirmSocialLink}
                      disabled={!socialLinkInput.trim()}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {t('confirm')}
                    </button>
                  </div>
                  {platformHint && (
                    <p className="text-slate-500 text-xs">{platformHint.example}</p>
                  )}
                  {socialLinkError && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} /> {socialLinkError}
                    </p>
                  )}
                </div>

                {/* 確認成功狀態 */}
                {form.videoUrl && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/40">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-300 text-sm font-semibold">
                        {t('confirm')} — {sourceTypeLabel(form.videoSourceType)}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{form.videoUrl}</p>
                      <p className="text-slate-500 text-xs mt-1.5">
                        影片將以嵌入方式顯示，原貼文必須為「公開」可見。
                      </p>
                    </div>
                      <button
                      onClick={handleClearSocialLink}
                      className="text-slate-500 hover:text-white text-xs shrink-0"
                    >
                      {t('change')}
                    </button>
                  </div>
                )}

                {/* YouTube 即時預覽 */}
                {form.videoUrl && form.videoSourceType === 'youtube' && (
                  (() => {
                    const embedSrc = toYouTubeEmbedUrl(form.videoUrl);
                    return embedSrc ? (
                      <div className="rounded-xl overflow-hidden border border-slate-700">
                        <p className="px-3 py-2 text-xs text-slate-500 bg-slate-900">預覽</p>
                        <iframe
                          src={embedSrc}
                          className="w-full aspect-video"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title="YouTube 預覽"
                        />
                      </div>
                    ) : null;
                  })()
                )}

                {/* IG / FB 無法直接嵌入預覽，顯示提示 */}
                {form.videoUrl && (form.videoSourceType === 'instagram' || form.videoSourceType === 'facebook') && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-xs">
                    <span>{form.videoSourceType === 'instagram' ? '📸' : '📘'}</span>
                    <span>{sourceTypeLabel(form.videoSourceType)} 連結已確認，發布後會在 Shorts 以嵌入方式展示。</span>
                  </div>
                )}
              </div>
            )}

            {/* 上傳影片檔 */}
            {videoInputMode === 'upload' && (
              <div className="space-y-3">
                {/* Storage cost notice */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-900/20 border border-amber-500/30 text-xs text-amber-300">
                  <span className="shrink-0 mt-0.5">💡</span>
                  <span>
                    {appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
                      ? '直接上傳會佔用儲存空間與流量，建議優先使用「貼社群連結」（YouTube / IG / FB），完全免費。'
                      : 'Direct uploads use storage & bandwidth. We recommend pasting a social link (YouTube / IG / FB) instead — it\'s free.'}
                  </span>
                </div>
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                    form.videoUrl && form.videoSourceType === 'upload'
                      ? 'border-green-500/50 bg-green-900/10'
                      : 'border-slate-600 hover:border-blue-500/60 hover:bg-slate-800/30'
                  }`}
                >
                  {uploadingVideo ? (
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  ) : form.videoUrl && form.videoSourceType === 'upload' ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-green-400" />
                      <p className="text-green-300 font-medium">{appLanguage === 'zh-TW' || appLanguage === 'zh-CN' ? '影片已上傳' : 'Video uploaded'}</p>
                      <video src={form.videoUrl} className="w-full rounded-xl max-h-48 object-cover" muted />
                      <p className="text-slate-400 text-sm">{t('change')}</p>
                    </>
                  ) : (
                    <>
                      <Video className="w-12 h-12 text-slate-400" />
                      <p className="text-white font-semibold">{t('selectVideo')}</p>
                      <p className="text-slate-400 text-sm text-center whitespace-pre-line">
                        {t('videoHint')}
                      </p>
                    </>
                  )}
                </div>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
              </div>
            )}

            {error && <ErrorMsg text={error} />}

            <NextBtn
              disabled={!form.videoUrl || uploadingVideo}
              onClick={() => { setError(null); setStep('info'); }}
              label={t('next')}
            />
          </div>
        )}

        {/* Step: Job info */}
        {step === 'info' && (
          <div className="space-y-5">
            <StepHeader step={2} total={4} title={t('stepInfo')} stepLabel={t('step')} ofLabel={t('of')} />
            <Field icon={Building2} label={t('companyName')} placeholder="Jobbeagle Inc." value={form.companyName} onChange={v => set('companyName', v)} />
            <Field icon={FileText} label={t('jobTitle')} placeholder="Frontend Engineer" value={form.jobTitle} onChange={v => set('jobTitle', v)} />
            <Field icon={MapPin} label={t('location')} placeholder="New York / Remote" value={form.location} onChange={v => set('location', v)} />
            <Field icon={DollarSign} label={t('salary')} placeholder="$80,000–$120,000" value={form.salary} onChange={v => set('salary', v)} />
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <FileText size={15} />
                {t('description')}
                <span className="text-red-400 ml-0.5">*</span>
                <span className="text-slate-500 font-normal text-xs ml-auto">
                  {form.description.trim().length}/50+
                  {form.description.trim().length >= 50 && (
                    <span className="text-green-400 ml-1">✓</span>
                  )}
                </span>
              </label>
              <textarea
                rows={5}
                placeholder={
                  appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
                    ? '請詳細說明工作內容、需求技能、學歷要求、公司文化等（最少 50 字）\nAI 將根據此描述分析求職者與職缺的匹配度'
                    : 'Describe the role, required skills, qualifications, and company culture (min 50 chars). AI uses this to analyze candidate match scores.'
                }
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-blue-500 ${
                  form.description.trim().length > 0 && form.description.trim().length < 50
                    ? 'border-amber-500/60'
                    : 'border-slate-700'
                }`}
              />
              {form.description.trim().length > 0 && form.description.trim().length < 50 && (
                <p className="text-amber-400 text-xs flex items-center gap-1">
                  <span>⚠</span>
                  {appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
                    ? `還需 ${50 - form.description.trim().length} 個字以上，才能讓 AI 正確分析匹配度`
                    : `${50 - form.description.trim().length} more characters needed for AI match analysis`}
                </p>
              )}
              {form.description.trim().length === 0 && (
                <p className="text-slate-500 text-xs flex items-center gap-1">
                  <Sparkles size={11} className="text-violet-400" />
                  {appLanguage === 'zh-TW' || appLanguage === 'zh-CN'
                    ? 'AI 匹配分析依賴職缺描述，完整說明讓求職者更精準配對'
                    : 'AI match analysis relies on this description — the more detail, the better the match'}
                </p>
              )}
            </div>
            <Field icon={Tag} label={t('tags')} placeholder="React, TypeScript, Remote" value={form.tags} onChange={v => set('tags', v)} />

            {/* Logo upload */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2"><Image size={15} /> {t('logo')}</label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors ${
                  form.logoUrl ? 'border-green-500/50 bg-green-900/10' : 'border-slate-600 hover:border-blue-500/60'
                }`}
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : form.logoUrl ? (
                  <>
                    <img src={form.logoUrl} alt="logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                    <div>
                      <p className="text-green-300 text-sm font-medium">Logo uploaded</p>
                      <p className="text-slate-400 text-xs">{t('change')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Image className="w-7 h-7 text-slate-400" />
                    <p className="text-slate-400 text-sm">{t('logo')} (PNG/JPG, max 5 MB)</p>
                  </>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            {error && <ErrorMsg text={error} />}
            <div className="flex gap-3">
              <BackBtn label={t('back')} onClick={() => { setError(null); setStep('video'); }} />
              <NextBtn
                disabled={!form.companyName || !form.jobTitle || form.description.trim().length < 50}
                onClick={() => { setError(null); setStep('apply'); }}
                label={t('next')}
              />
            </div>
          </div>
        )}

        {/* Step: Apply method */}
        {step === 'apply' && (
          <div className="space-y-5">
            <StepHeader step={3} total={4} title={t('stepApply')} stepLabel={t('step')} ofLabel={t('of')} />
            <p className="text-slate-400 text-sm">{t('applyMethodDesc')}</p>
            <div className="space-y-3">
              {([
                { val: 'email', icon: Mail, title: t('applyEmail'), desc: t('applyEmailDesc') },
                { val: 'url', icon: ExternalLink, title: t('applyRedirect'), desc: t('applyRedirectDesc') },
                { val: 'none', icon: Building2, title: t('applyNone'), desc: t('applyNoneDesc') },
              ] as const).map(({ val, icon: Icon, title, desc }) => (
                <button
                  key={val}
                  onClick={() => set('applyMethod', val)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                    form.applyMethod === val ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${form.applyMethod === val ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {form.applyMethod === 'email' && (
              <Field icon={Mail} label={t('contactEmail')} placeholder="hr@yourcompany.com" value={form.contactEmail} onChange={v => set('contactEmail', v)} type="email" />
            )}
            {form.applyMethod === 'url' && (
              <Field icon={ExternalLink} label={t('applyUrl')} placeholder="https://yourcompany.com/jobs/..." value={form.applyUrl} onChange={v => set('applyUrl', v)} type="url" />
            )}
            <div className="flex gap-3">
              <BackBtn label={t('back')} onClick={() => { setError(null); setStep('info'); }} />
              <NextBtn
                disabled={
                  (form.applyMethod === 'email' && !form.contactEmail) ||
                  (form.applyMethod === 'url' && !form.applyUrl)
                }
                onClick={() => { setError(null); setStep('preview'); }}
                label={t('next')}
              />
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-5">
            <StepHeader step={4} total={4} title={t('previewTitle')} stepLabel={t('step')} ofLabel={t('of')} />
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
              {/* 影片預覽 */}
              {form.videoUrl && form.videoSourceType === 'upload' && (
                <video src={form.videoUrl} controls className="w-full aspect-video object-cover bg-black" />
              )}
              {form.videoUrl && form.videoSourceType === 'youtube' && (
                (() => {
                  const src = toYouTubeEmbedUrl(form.videoUrl);
                  return src ? (
                    <iframe src={src} className="w-full aspect-video" allow="autoplay; encrypted-media" allowFullScreen title="YouTube" />
                  ) : null;
                })()
              )}
              {form.videoUrl && (form.videoSourceType === 'instagram' || form.videoSourceType === 'facebook' || form.videoSourceType === 'external') && (
                <div className="w-full aspect-video flex flex-col items-center justify-center bg-slate-800 gap-3 text-slate-400">
                  <span className="text-4xl">
                    {form.videoSourceType === 'instagram' ? '📸' : form.videoSourceType === 'facebook' ? '📘' : '🔗'}
                  </span>
                  <p className="text-sm font-medium">{sourceTypeLabel(form.videoSourceType)} 連結</p>
                  <a href={form.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline max-w-xs truncate text-center px-4">
                    {form.videoUrl}
                  </a>
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="logo" className="w-11 h-11 rounded-full object-contain bg-white p-1 border border-slate-600" />
                  )}
                  <div>
                    <p className="text-white font-bold text-lg">{form.jobTitle}</p>
                    <p className="text-slate-400 text-sm">{form.companyName}</p>
                  </div>
                </div>
                {form.location && <p className="text-slate-300 text-sm">📍 {form.location}</p>}
                {form.salary && <p className="text-slate-300 text-sm">💰 {form.salary}</p>}
                {form.description && <p className="text-slate-300 text-sm leading-relaxed">{form.description}</p>}
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.split(/[,，\s]+/).filter(Boolean).map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-700 space-y-1">
                  <p className="text-slate-400 text-xs">
                    {t('applyMethod')}：{form.applyMethod === 'email' ? `${t('applyEmail')} (${form.contactEmail})` : form.applyMethod === 'url' ? `${t('applyRedirect')} (${form.applyUrl})` : t('applyNone')}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {t('videoSource')}：{sourceTypeLabel(form.videoSourceType)}
                  </p>
                </div>
              </div>
            </div>

            {/* License note */}
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-400 leading-relaxed">
              {t('licenseNote')}
            </div>

            {error && <ErrorMsg text={error} />}
            <div className="flex gap-3">
              <BackBtn label={t('back')} onClick={() => { setError(null); setStep('apply'); }} />
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-white font-bold transition-colors"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload size={18} />}
                {submitting ? t('publishing') : t('publish')}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('doneTitle')}</h2>
              <p className="text-slate-400 text-sm">{t('doneDesc')}</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a
                href={publishedUrl}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors"
              >
                <ExternalLink size={16} />
                {t('viewPage')}
              </a>
              <Link
                href="/shorts"
                className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-colors"
              >
                {t('backToShorts')}
              </Link>
              <button
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setSocialLinkInput('');
                  setVideoInputMode('link');
                  setStep('video');
                }}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-sm transition-colors"
              >
                {t('uploadAnother')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function StepHeader({ step, total, title, stepLabel = 'Step', ofLabel = '/' }: {
  step: number; total: number; title: string; stepLabel?: string; ofLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{stepLabel} {step} {ofLabel} {total}</p>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-blue-500' : 'bg-slate-700'}`} />
        ))}
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, placeholder, value, onChange, type = 'text',
}: {
  icon: React.ElementType; label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
        <Icon size={15} /> {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function NextBtn({ disabled, onClick, label = 'Continue' }: { disabled: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
    >
      {label} <ChevronRight size={18} />
    </button>
  );
}

function BackBtn({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
    >
      {label}
    </button>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <p className="text-red-200 text-sm">{text}</p>
    </div>
  );
}
