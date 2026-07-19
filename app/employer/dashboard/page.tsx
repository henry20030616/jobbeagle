'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, Video, Edit, Trash2, Eye, EyeOff, 
  Plus, Building2, LogOut, AlertCircle, Loader2,
  X, CheckCircle, Users, ChevronRight, Link as LinkIcon, Heart,
} from 'lucide-react';
import { detectVideoSourceType, sourceTypeLabel, toYouTubeEmbedUrl } from '@/lib/video-embed';
import { useLanguage } from '@/lib/language-context';
import type { VideoSourceType } from '@/types';
import BrandLogo from '@/components/BrandLogo';

const ED = {
  en:     { hub: 'Employer Hub', logout: 'Logout', myVideos: 'My Job Videos', postNew: 'Post New Job', applicants: 'Applicants', published: 'Published', draft: 'Draft', views: 'views', likes: 'likes', applications: 'applications', publish: 'Publish', unpublish: 'Unpublish', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this video?', noVideos: 'No job videos yet', noVideosHint: 'Click "Post New Job" to upload your first recruitment video.', deleteSuccess: 'Video deleted', publishSuccess: 'Video published', unpublishSuccess: 'Video unpublished', applicantsTitle: 'Applicants & Resumes', applicantsDesc: 'View applicants and download resumes from the Shorts employer panel — the same account you use here.', viewApplicants: 'View Applicants', manageInShorts: 'Manage in Shorts', legacyHint: 'Video editing only — applicants are managed in Shorts.', errLoad: 'Failed to load', errDelete: 'Delete failed', errOp: 'Operation failed', saveSuccess: 'Changes saved' },
  'zh-TW':{ hub: '企業中心', logout: '登出', myVideos: '我的職缺影片', postNew: '發布新職缺', applicants: '應徵者', published: '已發布', draft: '草稿', views: '觀看', likes: '讚', applications: '申請', publish: '發布', unpublish: '下架', edit: '編輯', delete: '刪除', confirmDelete: '確定要刪除這個影片嗎？', noVideos: '尚未發布任何影片', noVideosHint: '點擊「發布新職缺」上傳第一支招募影片。', deleteSuccess: '影片已刪除', publishSuccess: '影片已發布', unpublishSuccess: '影片已下架', applicantsTitle: '應徵者與履歷', applicantsDesc: '查看誰投遞履歷、下載履歷，請前往 Shorts 企業後台（與本站帳號相同）。若已設定聯絡信箱，新應徵也會寄信通知。', viewApplicants: '前往查看應徵', manageInShorts: '在 Shorts 管理', legacyHint: '僅供編輯影片 — 應徵者請在 Shorts 後台查看。', errLoad: '載入失敗', errDelete: '刪除失敗', errOp: '操作失敗', saveSuccess: '已儲存修改' },
  'zh-CN':{ hub: '企业中心', logout: '登出', myVideos: '我的职位视频', postNew: '发布新职位', applicants: '应聘者', published: '已发布', draft: '草稿', views: '观看', likes: '赞', applications: '申请', publish: '发布', unpublish: '下架', edit: '编辑', delete: '删除', confirmDelete: '确定要删除这个视频吗？', noVideos: '尚未发布任何视频', noVideosHint: '点击「发布新职位」上传第一个招聘视频。', deleteSuccess: '视频已删除', publishSuccess: '视频已发布', unpublishSuccess: '视频已下架', applicantsTitle: '应聘者与简历', applicantsDesc: '查看谁投递了简历，请前往 Shorts 企业后台（与本站账号相同）。若已设置联系邮箱，新应聘也会发邮件通知。', viewApplicants: '前往查看应聘', manageInShorts: '在 Shorts 管理', legacyHint: '仅供编辑视频 — 应聘者请在 Shorts 后台查看。', errLoad: '加载失败', errDelete: '删除失败', errOp: '操作失败', saveSuccess: '已保存修改' },
  es:     { hub: 'Centro de empleadores', logout: 'Cerrar sesión', myVideos: 'Mis videos de empleo', postNew: 'Publicar nuevo empleo', applicants: 'Candidatos', published: 'Publicado', draft: 'Borrador', views: 'vistas', likes: 'me gusta', applications: 'solicitudes', publish: 'Publicar', unpublish: 'Despublicar', edit: 'Editar', delete: 'Eliminar', confirmDelete: '¿Eliminar este video?', noVideos: 'Sin videos todavía', noVideosHint: 'Haz clic en "Publicar nuevo empleo" para subir tu primer video.', deleteSuccess: 'Video eliminado', publishSuccess: 'Video publicado', unpublishSuccess: 'Video despublicado', applicantsTitle: 'Candidatos y currículos', applicantsDesc: 'Consulta los candidatos y descarga currículos en el panel Shorts (misma cuenta).', viewApplicants: 'Ver candidatos', manageInShorts: 'Gestionar en Shorts', legacyHint: 'Solo edición de videos — los candidatos se gestionan en Shorts.', errLoad: 'Error al cargar', errDelete: 'Error al eliminar', errOp: 'Operación fallida', saveSuccess: 'Cambios guardados' },
  hi:     { hub: 'नियोक्ता केंद्र', logout: 'लॉगआउट', myVideos: 'मेरे जॉब वीडियो', postNew: 'नई नौकरी पोस्ट करें', applicants: 'आवेदक', published: 'प्रकाशित', draft: 'ड्राफ्ट', views: 'व्यूज', likes: 'लाइक', applications: 'आवेदन', publish: 'प्रकाशित करें', unpublish: 'हटाएं', edit: 'संपादित करें', delete: 'हटाएं', confirmDelete: 'यह वीडियो हटाएं?', noVideos: 'अभी कोई जॉब वीडियो नहीं', noVideosHint: 'पहला भर्ती वीडियो पोस्ट करने के लिए "नई नौकरी पोस्ट करें" पर क्लिक करें।', deleteSuccess: 'वीडियो हटाया गया', publishSuccess: 'वीडियो प्रकाशित', unpublishSuccess: 'वीडियो हटाया गया', applicantsTitle: 'आवेदक और रेज़्यूमे', applicantsDesc: 'Shorts पैनल में आवेदक देखें और रेज़्यूमे डाउनलोड करें (एक ही खाता)।', viewApplicants: 'आवेदक देखें', manageInShorts: 'Shorts में प्रबंधित करें', legacyHint: 'केवल वीडियो संपादन — आवेदक Shorts में देखें।', errLoad: 'लोड विफल', errDelete: 'हटाना विफल', errOp: 'ऑपरेशन विफल', saveSuccess: 'परिवर्तन सहेजे गए' },
  ar:     { hub: 'مركز أصحاب العمل', logout: 'تسجيل الخروج', myVideos: 'فيديوهات الوظائف', postNew: 'نشر وظيفة جديدة', applicants: 'المتقدمون', published: 'منشور', draft: 'مسودة', views: 'مشاهدة', likes: 'إعجاب', applications: 'طلبات', publish: 'نشر', unpublish: 'إلغاء النشر', edit: 'تعديل', delete: 'حذف', confirmDelete: 'حذف هذا الفيديو؟', noVideos: 'لا توجد فيديوهات بعد', noVideosHint: 'انقر "نشر وظيفة جديدة" لرفع أول فيديو توظيف.', deleteSuccess: 'تم حذف الفيديو', publishSuccess: 'تم نشر الفيديو', unpublishSuccess: 'تم إلغاء نشر الفيديو', applicantsTitle: 'المتقدمون والسير الذاتية', applicantsDesc: 'اعرض المتقدمين وحمّل السير الذاتية من لوحة Shorts (نفس الحساب).', viewApplicants: 'عرض المتقدمين', manageInShorts: 'إدارة في Shorts', legacyHint: 'تحرير الفيديو فقط — المتقدمون في Shorts.', errLoad: 'فشل التحميل', errDelete: 'فشل الحذف', errOp: 'فشلت العملية', saveSuccess: 'تم حفظ التغييرات' },
} as const;

// EditVideoModal translations
const EMD = {
  en:     { title: 'Edit Job Info', basicInfo: 'Basic Info', jobDesc: 'Job Description', applyMethod: 'Application Method', videoMedia: 'Video & Media', companyName: 'Company Name', jobTitle: 'Job Title', location: 'Location', salary: 'Salary', description: 'Description', tags: 'Tags (comma separated)', logo: 'Logo', video: 'Video', applyEmail: '📧 Email', applyExt: '🔗 External Link', applyNone: '🚫 Not Accepting', descNeeds: (n: number) => `${n} more chars needed`, descOk: (n: number) => `${n} chars ✓`, descHint: '✨ More detail → better AI matching', descPlaceholder: 'Describe the role, responsibilities, and skills… (min 50 chars)', orPasteUrl: 'or paste video URL', orPasteLogoUrl: 'or paste logo URL', uploaded: '✓ Uploaded', save: 'Save Changes', saving: 'Saving…', cancel: 'Cancel', errRequired: 'Please fill in job title, description, and video URL', errDescLen: 'Job description must be at least 50 characters (needed for AI matching)', errEmail: 'Please enter a valid email address', errUrl: 'Please enter a valid URL (must start with https://)', errSave: 'Save failed: ', errLogoSize: (mb: number) => `Logo must not exceed ${mb}MB`, errVideoSize: (mb: number) => `Video must not exceed ${mb}MB`, errLogoUpload: 'Logo upload failed: ', errVideoUpload: 'Video upload failed: ', errGeneral: 'Upload failed, please try again' },
  'zh-TW':{ title: '編輯影片資訊', basicInfo: '基本資訊', jobDesc: '職位描述', applyMethod: '申請方式', videoMedia: '影片與媒體', companyName: '公司名稱', jobTitle: '職位名稱', location: '地點', salary: '薪資', description: '描述', tags: '標籤（逗號分隔）', logo: 'Logo', video: '影片', applyEmail: '📧 Email', applyExt: '🔗 外部連結', applyNone: '🚫 暫不開放', descNeeds: (n: number) => `還需 ${n} 字`, descOk: (n: number) => `${n} 字 ✓`, descHint: '✨ 描述越詳細，AI 匹配分析越準確', descPlaceholder: '詳細描述職位要求、職責與技能要求… （至少 50 字）', orPasteUrl: '或直接輸入影片 URL', orPasteLogoUrl: '或貼上 Logo URL', uploaded: '✓ 已上傳', save: '儲存修改', saving: '儲存中…', cancel: '取消', errRequired: '請填寫職位名稱、描述與影片連結', errDescLen: '職位描述至少需要 50 個字元（AI 匹配分析需要足夠的職位資訊）', errEmail: '請輸入有效的電子信箱格式', errUrl: '請輸入有效的申請網址（需包含 https://）', errSave: '儲存失敗：', errLogoSize: (mb: number) => `Logo 請勿超過 ${mb}MB`, errVideoSize: (mb: number) => `影片請勿超過 ${mb}MB`, errLogoUpload: 'Logo 上傳失敗：', errVideoUpload: '影片上傳失敗：', errGeneral: '上傳失敗，請稍後再試' },
  'zh-CN':{ title: '编辑影片资讯', basicInfo: '基本信息', jobDesc: '职位描述', applyMethod: '申请方式', videoMedia: '视频与媒体', companyName: '公司名称', jobTitle: '职位名称', location: '地点', salary: '薪资', description: '描述', tags: '标签（逗号分隔）', logo: 'Logo', video: '视频', applyEmail: '📧 Email', applyExt: '🔗 外部链接', applyNone: '🚫 暂不开放', descNeeds: (n: number) => `还需 ${n} 字`, descOk: (n: number) => `${n} 字 ✓`, descHint: '✨ 描述越详细，AI 匹配越准确', descPlaceholder: '详细描述职位要求、职责与技能要求… （至少 50 字）', orPasteUrl: '或直接输入视频 URL', orPasteLogoUrl: '或粘贴 Logo URL', uploaded: '✓ 已上传', save: '保存修改', saving: '保存中…', cancel: '取消', errRequired: '请填写职位名称、描述与视频链接', errDescLen: '职位描述至少需要 50 个字符', errEmail: '请输入有效的电子邮箱格式', errUrl: '请输入有效的申请网址（需包含 https://）', errSave: '保存失败：', errLogoSize: (mb: number) => `Logo 请勿超过 ${mb}MB`, errVideoSize: (mb: number) => `视频请勿超过 ${mb}MB`, errLogoUpload: 'Logo 上传失败：', errVideoUpload: '视频上传失败：', errGeneral: '上传失败，请稍后再试' },
  es:     { title: 'Editar información del empleo', basicInfo: 'Info básica', jobDesc: 'Descripción del puesto', applyMethod: 'Método de aplicación', videoMedia: 'Video y medios', companyName: 'Nombre de empresa', jobTitle: 'Título del puesto', location: 'Ubicación', salary: 'Salario', description: 'Descripción', tags: 'Etiquetas (separadas por coma)', logo: 'Logo', video: 'Video', applyEmail: '📧 Email', applyExt: '🔗 Enlace externo', applyNone: '🚫 Sin aplicaciones', descNeeds: (n: number) => `Faltan ${n} caracteres`, descOk: (n: number) => `${n} caracteres ✓`, descHint: '✨ Más detalle → mejor emparejamiento AI', descPlaceholder: 'Describe el rol, responsabilidades y habilidades… (mín 50 caracteres)', orPasteUrl: 'o pega URL del video', orPasteLogoUrl: 'o pega URL del logo', uploaded: '✓ Subido', save: 'Guardar cambios', saving: 'Guardando…', cancel: 'Cancelar', errRequired: 'Por favor completa título, descripción y URL del video', errDescLen: 'La descripción debe tener al menos 50 caracteres', errEmail: 'Por favor ingresa un email válido', errUrl: 'Por favor ingresa una URL válida (debe comenzar con https://)', errSave: 'Error al guardar: ', errLogoSize: (mb: number) => `El logo no debe superar ${mb}MB`, errVideoSize: (mb: number) => `El video no debe superar ${mb}MB`, errLogoUpload: 'Error al subir logo: ', errVideoUpload: 'Error al subir video: ', errGeneral: 'Error de subida, intenta de nuevo' },
  hi:     { title: 'जॉब जानकारी संपादित करें', basicInfo: 'बुनियादी जानकारी', jobDesc: 'नौकरी विवरण', applyMethod: 'आवेदन विधि', videoMedia: 'वीडियो और मीडिया', companyName: 'कंपनी का नाम', jobTitle: 'पद का नाम', location: 'स्थान', salary: 'वेतन', description: 'विवरण', tags: 'टैग (अल्पविराम से अलग)', logo: 'लोगो', video: 'वीडियो', applyEmail: '📧 Email', applyExt: '🔗 बाहरी लिंक', applyNone: '🚫 स्वीकार नहीं', descNeeds: (n: number) => `${n} और अक्षर चाहिए`, descOk: (n: number) => `${n} अक्षर ✓`, descHint: '✨ विस्तृत विवरण → बेहतर AI मिलान', descPlaceholder: 'भूमिका, जिम्मेदारियां और कौशल का वर्णन करें… (न्यूनतम 50 अक्षर)', orPasteUrl: 'या वीडियो URL पेस्ट करें', orPasteLogoUrl: 'या लोगो URL पेस्ट करें', uploaded: '✓ अपलोड हुआ', save: 'परिवर्तन सहेजें', saving: 'सहेजा जा रहा है…', cancel: 'रद्द करें', errRequired: 'कृपया नौकरी का नाम, विवरण और वीडियो URL भरें', errDescLen: 'नौकरी विवरण कम से कम 50 अक्षर होना चाहिए', errEmail: 'कृपया एक मान्य ईमेल दर्ज करें', errUrl: 'कृपया एक मान्य URL दर्ज करें (https:// से शुरू होना चाहिए)', errSave: 'सहेजना विफल: ', errLogoSize: (mb: number) => `लोगो ${mb}MB से अधिक नहीं होना चाहिए`, errVideoSize: (mb: number) => `वीडियो ${mb}MB से अधिक नहीं होना चाहिए`, errLogoUpload: 'लोगो अपलोड विफल: ', errVideoUpload: 'वीडियो अपलोड विफल: ', errGeneral: 'अपलोड विफल, बाद में पुनः प्रयास करें' },
  ar:     { title: 'تعديل معلومات الوظيفة', basicInfo: 'المعلومات الأساسية', jobDesc: 'وصف الوظيفة', applyMethod: 'طريقة التقديم', videoMedia: 'الفيديو والوسائط', companyName: 'اسم الشركة', jobTitle: 'المسمى الوظيفي', location: 'الموقع', salary: 'الراتب', description: 'الوصف', tags: 'الوسوم (مفصولة بفواصل)', logo: 'الشعار', video: 'الفيديو', applyEmail: '📧 بريد إلكتروني', applyExt: '🔗 رابط خارجي', applyNone: '🚫 لا قبول', descNeeds: (n: number) => `${n} حرف إضافي مطلوب`, descOk: (n: number) => `${n} حرف ✓`, descHint: '✨ كلما كان الوصف أكثر تفصيلاً كلما كان التطابق AI أفضل', descPlaceholder: 'صف الدور والمسؤوليات والمهارات… (50 حرف على الأقل)', orPasteUrl: 'أو الصق رابط الفيديو', orPasteLogoUrl: 'أو الصق رابط الشعار', uploaded: '✓ تم الرفع', save: 'حفظ التغييرات', saving: 'جارٍ الحفظ…', cancel: 'إلغاء', errRequired: 'يرجى ملء اسم الوظيفة والوصف ورابط الفيديو', errDescLen: 'يجب أن يتضمن الوصف 50 حرفًا على الأقل', errEmail: 'يرجى إدخال بريد إلكتروني صحيح', errUrl: 'يرجى إدخال URL صالح (يجب أن يبدأ بـ https://)', errSave: 'فشل الحفظ: ', errLogoSize: (mb: number) => `يجب ألا يتجاوز الشعار ${mb}MB`, errVideoSize: (mb: number) => `يجب ألا يتجاوز الفيديو ${mb}MB`, errLogoUpload: 'فشل رفع الشعار: ', errVideoUpload: 'فشل رفع الفيديو: ', errGeneral: 'فشل الرفع، حاول مرة أخرى' },
};

interface VideoData {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  salary: string | null;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  logo_url: string | null;
  tags: string[];
  contact_email: string | null;
  is_published: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
}

interface CompanyData {
  id: string;
  company_name: string;
  company_email: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  description: string | null;
}

export default function EmployerDashboard() {
  const { language: appLanguage } = useLanguage();
  const td = ED[appLanguage] ?? ED.en;

  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('legacy') !== '1') {
      router.replace('/shorts?shorts_view=company&open_profile=1');
    }
  }, [loading, user, router]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/employer/login');
      return;
    }

    setUser(user);
    await loadCompanyAndVideos(user.id, user);
  };

  const loadCompanyAndVideos = async (userId: string, user: any) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 從 company_profiles 載入企業資訊（統一數據來源，不再用 companies 表）
      const { data: profileData, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        // 首次登入自動建立 company_profile
        const { data: newProfile, error: createError } = await supabase
          .from('company_profiles')
          .upsert({
            user_id: userId,
            company_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '新企業',
            contact_email: user?.email || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (createError) throw createError;

        setCompany({
          id: newProfile.id,
          company_name: newProfile.company_name,
          company_email: newProfile.contact_email ?? null,
          company_website: newProfile.website ?? null,
          company_logo_url: newProfile.logo_url ?? null,
          description: newProfile.description ?? null,
        });
      } else {
        setCompany({
          id: profileData.id,
          company_name: profileData.company_name,
          company_email: profileData.contact_email ?? null,
          company_website: profileData.website ?? null,
          company_logo_url: profileData.logo_url ?? null,
          description: profileData.description ?? null,
        });
      }

      // 載入影片列表（用 company_user_id 確保與 Shorts 後台資料一致）
      const { data: videosData, error: videosError } = await supabase
        .from('shorts_videos')
        .select('*')
        .eq('company_user_id', userId)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;
      const list = videosData || [];
      setVideos(list);

      if (list.length > 0) {
        const ids = list.map((v) => v.id);
        const { data: appRows } = await supabase
          .from('job_applications')
          .select('job_id')
          .in('job_id', ids);
        const counts: Record<string, number> = {};
        (appRows || []).forEach((row: { job_id: string | null }) => {
          if (row.job_id) counts[row.job_id] = (counts[row.job_id] || 0) + 1;
        });
        setApplicationCounts(counts);
      } else {
        setApplicationCounts({});
      }
    } catch (err: any) {
      setError(err.message || td.errLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/employer/login');
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(td.confirmDelete)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('shorts_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      setSuccess(td.deleteSuccess);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || td.errDelete);
    }
  };

  const handleTogglePublish = async (videoId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('shorts_videos')
        .update({ is_published: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, is_published: !currentStatus } : v
      ));
      setSuccess(currentStatus ? td.unpublishSuccess : td.publishSuccess);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || td.errOp);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <BrandLogo size="nav" showIcon />
                  <span className="text-white text-lg font-bold">{td.hub}</span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">{company?.company_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{td.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Legacy edit mode banner */}
        <div className="mb-6 p-4 rounded-xl border border-amber-500/35 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-amber-200/90 text-sm">{td.legacyHint}</p>
          <Link
            href="/shorts?shorts_view=company&open_profile=1"
            className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            {td.manageInShorts}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Applicants section */}
        <div className="mb-8 p-4 sm:p-5 rounded-xl border border-cyan-500/35 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base">{td.applicantsTitle}</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">{td.applicantsDesc}</p>
            </div>
          </div>
          <Link
            href="/shorts?shorts_view=company&open_profile=1"
            className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
          >
            {td.viewApplicants}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Post New Job Button → redirects to /shorts/upload */}
        <div className="mb-8">
          <Link
            href="/shorts/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>{td.postNew}</span>
          </Link>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">{td.noVideos}</p>
            <p className="text-slate-500 text-sm">{td.noVideosHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-700 relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.job_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      video.is_published 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/50'
                    }`}>
                      {video.is_published ? td.published : td.draft}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 line-clamp-1">{video.job_title}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.view_count} {td.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {video.like_count ?? 0} {td.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {applicationCounts[video.id] ?? 0} {td.applications}
                    </span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingVideo(video)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      title={td.edit}
                    >
                      <Edit className="w-4 h-4" />
                      <span>{td.edit}</span>
                    </button>
                    <button
                      onClick={() => handleTogglePublish(video.id, video.is_published)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        video.is_published
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50'
                      }`}
                    >
                      {video.is_published ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>{td.unpublish}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>{td.publish}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


      {/* Edit Modal */}
      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSuccess={() => {
            setEditingVideo(null);
            if (user) loadCompanyAndVideos(user.id, user);
            setSuccess(td.saveSuccess);
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}


// Edit Video Modal — full fields including apply_url / apply_method
function EditVideoModal({
  video,
  onClose,
  onSuccess,
}: {
  video: VideoData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { language: appLanguage } = useLanguage();
  const em = EMD[appLanguage] ?? EMD.en;

  const getInitialApplyMethod = (): 'email' | 'url' | 'none' => {
    if ((video as any).apply_url) return 'url';
    if (video.contact_email) return 'email';
    return 'none';
  };

  const [applyMethod, setApplyMethod] = useState<'email' | 'url' | 'none'>(getInitialApplyMethod());
  const [formData, setFormData] = useState({
    company_name: video.company_name,
    job_title: video.job_title,
    location: video.location || '',
    salary: video.salary || '',
    description: video.description,
    video_url: video.video_url,
    thumbnail_url: video.thumbnail_url || '',
    logo_url: video.logo_url || '',
    tags: (video.tags || []).join(', '),
    contact_email: video.contact_email || '',
    apply_url: (video as any).apply_url || '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  const BUCKET = 'shorts-videos';
  const MAX_VIDEO_MB = 100;
  const MAX_LOGO_MB = 5;

  const getUploadError = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if (typeof e.error === 'string') return e.error;
      if (e.error && typeof e.error === 'object' && typeof (e.error as Record<string, unknown>).message === 'string') return (e.error as Record<string, unknown>).message as string;
    }
    return em.errGeneral;
  };

  const uploadToSupabase = async (file: File, folder: 'video' | 'logos'): Promise<string> => {
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || (folder === 'video' ? 'mp4' : 'png');
    const path = folder === 'video' ? `video-${Date.now()}.${ext}` : `logos/logo-${Date.now()}.${ext}`;
    const options: { cacheControl: string; upsert: boolean; contentType?: string } = { cacheControl: '3600', upsert: true };
    if (file.type) options.contentType = file.type;
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, options);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(null); setLogoUploadSuccess(false);
    if (file.size > MAX_LOGO_MB * 1024 * 1024) { setError(em.errLogoSize(MAX_LOGO_MB)); return; }
    setUploadingLogo(true);
    try {
      const url = await uploadToSupabase(file, 'logos');
      setFormData(prev => ({ ...prev, logo_url: url }));
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
    } catch (err) { setError(em.errLogoUpload + getUploadError(err)); }
    finally { setUploadingLogo(false); e.target.value = ''; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(null); setVideoUploadSuccess(false);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setError(em.errVideoSize(MAX_VIDEO_MB)); return; }
    setUploadingFile(true);
    try {
      const url = await uploadToSupabase(file, 'video');
      setFormData(prev => ({ ...prev, video_url: url }));
      setVideoUploadSuccess(true);
      setTimeout(() => setVideoUploadSuccess(false), 3000);
    } catch (err) { setError(em.errVideoUpload + getUploadError(err)); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.job_title?.trim() || !formData.description?.trim() || !formData.video_url?.trim()) {
      setError(em.errRequired);
      return;
    }
    if (formData.description.trim().length < 50) {
      setError(em.errDescLen);
      return;
    }
    if (applyMethod === 'email' && formData.contact_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())) {
      setError(em.errEmail);
      return;
    }
    if (applyMethod === 'url' && formData.apply_url?.trim()) {
      try { new URL(formData.apply_url.trim()); } catch { setError(em.errUrl); return; }
    }
    try {
      setUploading(true);
      const supabase = createClient();
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const updatePayload: Record<string, any> = {
        job_title: formData.job_title.trim(),
        company_name: formData.company_name.trim(),
        location: formData.location?.trim() || null,
        salary: formData.salary?.trim() || null,
        description: formData.description.trim(),
        video_url: formData.video_url.trim(),
        thumbnail_url: formData.thumbnail_url?.trim() || null,
        logo_url: formData.logo_url?.trim() || null,
        tags: tagsArray,
        contact_email: applyMethod === 'email' ? (formData.contact_email?.trim() || null) : null,
        apply_url: applyMethod === 'url' ? (formData.apply_url?.trim() || null) : null,
      };
      const { data, error } = await supabase.from('shorts_videos').update(updatePayload).eq('id', video.id).select('id').single();
      if (error) { setError(em.errSave + (error.message || em.errGeneral)); return; }
      if (!data) { setError(em.errSave + em.errGeneral); return; }
      onSuccess();
      onClose();
    } catch (err) {
      setError(em.errSave + getUploadError(err));
    } finally {
      setUploading(false);
    }
  };

  const descLen = formData.description.trim().length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{em.title}</h2>
              <p className="text-slate-400 text-xs mt-0.5">{video.job_title}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="rounded-xl bg-slate-700/40 border border-slate-600/50 p-4 space-y-4">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{em.basicInfo}</p>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.companyName} <span className="text-red-400">*</span></label>
                <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.jobTitle} <span className="text-red-400">*</span></label>
                <input type="text" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.location}</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Remote / Taipei" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.salary}</label>
                  <input type="text" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="USD 150k–220k / yr" />
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="rounded-xl bg-slate-700/40 border border-slate-600/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{em.jobDesc} <span className="text-red-400">*</span></p>
                <span className={`text-xs font-medium ${descLen >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {descLen < 50 ? em.descNeeds(50 - descLen) : em.descOk(descLen)}
                </span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white text-sm focus:outline-none resize-none leading-relaxed ${descLen < 50 && descLen > 0 ? 'border-amber-500/60 focus:border-amber-400' : 'border-slate-600 focus:border-blue-500'}`}
                placeholder={em.descPlaceholder}
              />
              <p className="text-slate-500 text-xs">{em.descHint}</p>
            </div>

            {/* Apply Method */}
            <div className="rounded-xl bg-slate-700/40 border border-slate-600/50 p-4 space-y-3">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{em.applyMethod}</p>
              <div className="flex gap-2">
                {(['email', 'url', 'none'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setApplyMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${applyMethod === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    {m === 'email' ? em.applyEmail : m === 'url' ? em.applyExt : em.applyNone}
                  </button>
                ))}
              </div>
              {applyMethod === 'email' && (
                <input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="careers@company.com" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              )}
              {applyMethod === 'url' && (
                <input type="url" value={formData.apply_url} onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })} placeholder="https://company.com/careers/apply" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              )}
            </div>

            {/* Video + Media */}
            <div className="rounded-xl bg-slate-700/40 border border-slate-600/50 p-4 space-y-3">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{em.videoMedia}</p>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.video} <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" accept="video/mp4,video/webm" onChange={handleFileChange} disabled={uploadingFile} className="flex-1 min-w-0 text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs" />
                    {uploadingFile && <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
                    {videoUploadSuccess && <span className="text-emerald-400 text-xs shrink-0">{em.uploaded}</span>}
                  </div>
                  <input type="url" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder={em.orPasteUrl} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.tags}</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="AI, React, Remote" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">{em.logo}</label>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input type="file" accept="image/*" onChange={handleLogoFileChange} disabled={uploadingLogo} className="flex-1 min-w-0 text-[11px] text-slate-400 file:mr-1.5 file:py-1 file:px-2 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:text-xs" />
                      {uploadingLogo && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />}
                      {logoUploadSuccess && <span className="text-emerald-400 text-xs shrink-0">✓</span>}
                    </div>
                    <input type="url" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder={em.orPasteLogoUrl} className="w-full px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || descLen < 50}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />{em.saving}</> : em.save}
              </button>
              <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors">
                {em.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
