'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, Video, Edit, Trash2, Eye, EyeOff, 
  Plus, Building2, LogOut, AlertCircle, Loader2,
  X, CheckCircle, Users, ChevronRight, Link as LinkIcon,
} from 'lucide-react';
import { detectVideoSourceType, sourceTypeLabel, toYouTubeEmbedUrl } from '@/lib/video-embed';
import type { VideoSourceType } from '@/types';

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
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

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

      // #region agent log
      console.log(`[DBG-D] company_profiles query | found=${!!profileData} err=${profileError?.code} msg=${profileError?.message}`);
      // #endregion
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

        // #region agent log
        console.log(`[DBG-D] company_profiles upsert | success=${!createError} err=${createError?.code} msg=${createError?.message}`);
        // #endregion
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
      setVideos(videosData || []);
    } catch (err: any) {
      setError(err.message || '載入失敗');
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
    if (!confirm('確定要刪除這個影片嗎？')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('shorts_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      setSuccess('影片已刪除');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || '刪除失敗');
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
      setSuccess(currentStatus ? '影片已下架' : '影片已發布');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || '操作失敗');
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
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-blue-400" />
              <div>
                <Link href="/" className="block">
                  <h1 className="text-xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer">
                    <span className="text-white">Job</span><span className="text-blue-400">beagle</span> 企業中心
                  </h1>
                </Link>
                <p className="text-slate-400 text-sm">{company?.company_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>登出</span>
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

        {/* 應徵管理：與 Shorts 企業後台同一處（最小改動：由此進入） */}
        <div className="mb-8 p-4 sm:p-5 rounded-xl border border-cyan-500/35 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base">應徵者與履歷</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                在此中心管理影片；查看誰投遞、下載履歷請前往 Shorts 的企業後台（與求職者使用同一支帳號登入）。
                若已設定聯絡信箱，新應徵也會寄信通知。
              </p>
            </div>
          </div>
          <Link
            href="/shorts?shorts_view=company&open_profile=1"
            className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
          >
            前往查看應徵
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Upload Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>上傳新影片</span>
          </button>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">還沒有影片</p>
            <p className="text-slate-500 text-sm">點擊上方按鈕上傳您的第一個招聘影片</p>
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
                      {video.is_published ? '已發布' : '草稿'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 line-clamp-1">{video.job_title}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-slate-500 text-xs mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.view_count}
                    </span>
                    <span>•</span>
                    <span>{new Date(video.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingVideo(video)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      title="編輯"
                    >
                      <Edit className="w-4 h-4" />
                      <span>編輯</span>
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
                          <span>下架</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>發布</span>
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

      {/* Upload Modal */}
      {showUploadModal && !editingVideo && (
        <UploadVideoModal
          companyId={company?.id || ''}
          userId={user?.id || ''}
          companyName={company?.company_name || ''}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            if (user) loadCompanyAndVideos(user.id, user);
            setSuccess('影片上傳成功');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSuccess={() => {
            setEditingVideo(null);
            if (user) loadCompanyAndVideos(user.id, user);
            setSuccess('已儲存修改');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}

// Upload Video Modal Component
function UploadVideoModal({ 
  companyId, 
  userId,
  companyName, 
  onClose, 
  onSuccess 
}: { 
  companyId: string;
  userId: string;
  companyName: string; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    company_name: companyName,
    job_title: '',
    location: '',
    salary: '',
    description: '',
    video_url: '',
    video_source_type: 'upload' as VideoSourceType,
    thumbnail_url: '',
    logo_url: '',
    tags: '',
    contact_email: '',
  });
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'link'>('link');
  const [socialLinkInput, setSocialLinkInput] = useState('');
  const [socialLinkError, setSocialLinkError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  const handleConfirmSocialLink = () => {
    setSocialLinkError('');
    const trimmed = socialLinkInput.trim();
    if (!trimmed) { setSocialLinkError('請輸入影片連結'); return; }
    try { new URL(trimmed); } catch { setSocialLinkError('請輸入有效的完整網址（需包含 https://）'); return; }
    const st = detectVideoSourceType(trimmed);
    setFormData(prev => ({ ...prev, video_url: trimmed, video_source_type: st }));
    setSocialLinkError('');
  };

  const BUCKET = 'shorts-videos';
  const MAX_VIDEO_MB = 50;
  const MAX_LOGO_MB = 5;

  const getUploadError = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if (typeof e.error === 'string') return e.error;
      if (e.error && typeof e.error === 'object' && typeof (e.error as Record<string, unknown>).message === 'string') return (e.error as Record<string, unknown>).message as string;
    }
    return '上傳失敗，請稍後再試';
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
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLogoUploadSuccess(false);
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setError(`Logo 請勿超過 ${MAX_LOGO_MB}MB`);
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadToSupabase(file, 'logos');
      setFormData(prev => ({ ...prev, logo_url: url }));
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
    } catch (err) {
      const msg = getUploadError(err);
      console.error('[Upload] Logo upload error:', err);
      setError('Logo 上傳失敗：' + msg);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setVideoUploadSuccess(false);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`影片請勿超過 ${MAX_VIDEO_MB}MB`);
      return;
    }
    setUploadingFile(true);
    try {
      const url = await uploadToSupabase(file, 'video');
      setFormData(prev => ({ ...prev, video_url: url }));
      setVideoUploadSuccess(true);
      setTimeout(() => setVideoUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[Upload] Video upload error:', err);
      setError('影片上傳失敗：' + getUploadError(err));
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.job_title || !formData.description || !formData.video_url) {
      setError('請填寫職位名稱、描述，並上傳影片或輸入影片連結');
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('shorts_videos')
        .insert({
          company_id: companyId || undefined,
          company_user_id: userId,
          job_title: formData.job_title,
          company_name: formData.company_name || companyName,
          location: formData.location || null,
          salary: formData.salary || null,
          description: formData.description,
          video_url: formData.video_url,
          video_source_type: formData.video_source_type || 'upload',
          thumbnail_url: formData.thumbnail_url || null,
          logo_url: formData.logo_url || null,
          tags: tagsArray,
          contact_email: formData.contact_email || null,
          is_published: true,
        });

      if (error) throw error;

      onSuccess();
    } catch (err: any) {
      setError(err.message || '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">上傳新影片</h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                公司名稱 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="例如：Google Taiwan"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                職位名稱 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="例如：Senior Software Engineer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">地點</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="例如：Mountain View, CA"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">薪資</label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="例如：USD 180k - 250k / yr"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                職位描述 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="詳細描述這個職位的要求和職責..."
                required
              />
            </div>

            {/* ── 影片 ── */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                影片 <span className="text-red-400">*</span>
              </label>
              {/* 模式切換 */}
              <div className="flex gap-1.5 p-1 bg-slate-700/60 rounded-lg border border-slate-600 mb-3">
                {([
                  { mode: 'link' as const, icon: LinkIcon, label: '貼社群連結' },
                  { mode: 'upload' as const, icon: Upload, label: '上傳影片檔' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setVideoInputMode(mode);
                      setSocialLinkInput('');
                      setSocialLinkError('');
                      setFormData(prev => ({ ...prev, video_url: '', video_source_type: 'upload' }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      videoInputMode === mode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>

              {/* 貼連結模式 */}
              {videoInputMode === 'link' && (
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs">支援 YouTube Shorts、Instagram Reel、Facebook 影片連結</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinkInput}
                      onChange={e => {
                        setSocialLinkInput(e.target.value);
                        setSocialLinkError('');
                        if (formData.video_url && e.target.value.trim() !== formData.video_url) {
                          setFormData(prev => ({ ...prev, video_url: '', video_source_type: 'upload' }));
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="https://www.youtube.com/shorts/..."
                    />
                    <button
                      type="button"
                      onClick={handleConfirmSocialLink}
                      disabled={!socialLinkInput.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      確認
                    </button>
                  </div>
                  {socialLinkError && <p className="text-red-400 text-xs">{socialLinkError}</p>}
                  {formData.video_url && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-500/40 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-medium">{sourceTypeLabel(formData.video_source_type)}</span>
                      <span className="text-slate-400 truncate">{formData.video_url}</span>
                    </div>
                  )}
                  {/* YouTube 預覽 */}
                  {formData.video_url && formData.video_source_type === 'youtube' && (
                    (() => {
                      const src = toYouTubeEmbedUrl(formData.video_url);
                      return src ? (
                        <div className="rounded-lg overflow-hidden border border-slate-600">
                          <iframe src={src} className="w-full aspect-video" allow="autoplay; encrypted-media" allowFullScreen title="預覽" />
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
              )}

              {/* 上傳檔案模式 */}
              {videoInputMode === 'upload' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleFileChange}
                      disabled={uploadingFile}
                      className="flex-1 min-w-0 text-sm text-slate-400 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:disabled:opacity-50"
                    />
                    {uploadingFile && <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />}
                    {videoUploadSuccess && <span className="text-green-400 text-sm font-medium shrink-0">✓ 影片已上傳</span>}
                  </div>
                  <p className="text-slate-500 text-xs">或直接輸入影片直連 URL（.mp4）：</p>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value, video_source_type: 'upload' })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">縮圖連結</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleLogoFileChange}
                      disabled={uploadingLogo}
                      className="flex-1 min-w-0 text-sm text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:disabled:opacity-50"
                    />
                    {uploadingLogo && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />}
                    {logoUploadSuccess && <span className="text-green-400 text-sm font-medium shrink-0">✓ Logo 已上傳</span>}
                  </div>
                  <p className="text-slate-500 text-xs">或輸入已有 Logo 連結：</p>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">標籤（用逗號分隔）</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="AI, React, Python"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">聯絡信箱</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="careers@company.com"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>上傳中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>上傳影片</span>
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

// Edit Video Modal
function EditVideoModal({
  video,
  onClose,
  onSuccess,
}: {
  video: VideoData;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);

  const BUCKET = 'shorts-videos';
  const MAX_VIDEO_MB = 50;
  const MAX_LOGO_MB = 5;

  const getUploadError = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
      if (typeof e.error === 'string') return e.error;
      if (e.error && typeof e.error === 'object' && typeof (e.error as Record<string, unknown>).message === 'string') return (e.error as Record<string, unknown>).message as string;
    }
    return '上傳失敗，請稍後再試';
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
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLogoUploadSuccess(false);
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setError(`Logo 請勿超過 ${MAX_LOGO_MB}MB`);
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadToSupabase(file, 'logos');
      setFormData(prev => ({ ...prev, logo_url: url }));
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[Edit] Logo upload error:', err);
      setError('Logo 上傳失敗：' + getUploadError(err));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setVideoUploadSuccess(false);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`影片請勿超過 ${MAX_VIDEO_MB}MB`);
      return;
    }
    setUploadingFile(true);
    try {
      const url = await uploadToSupabase(file, 'video');
      setFormData(prev => ({ ...prev, video_url: url }));
      setVideoUploadSuccess(true);
      setTimeout(() => setVideoUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[Edit] Video upload error:', err);
      setError('影片上傳失敗：' + getUploadError(err));
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.job_title?.trim() || !formData.description?.trim() || !formData.video_url?.trim()) {
      setError('請填寫職位名稱、描述與影片連結');
      return;
    }
    try {
      setUploading(true);
      const supabase = createClient();
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { data, error } = await supabase
        .from('shorts_videos')
        .update({
          job_title: formData.job_title.trim(),
          company_name: formData.company_name.trim(),
          location: formData.location?.trim() || null,
          salary: formData.salary?.trim() || null,
          description: formData.description.trim(),
          video_url: formData.video_url.trim(),
          thumbnail_url: formData.thumbnail_url?.trim() || null,
          logo_url: formData.logo_url?.trim() || null,
          tags: tagsArray,
          contact_email: formData.contact_email?.trim() || null,
        })
        .eq('id', video.id)
        .select('id')
        .single();
      if (error) {
        console.error('[Edit] Save error:', error);
        setError('儲存失敗：' + (error.message || '請稍後再試'));
        return;
      }
      if (!data) {
        setError('儲存失敗：無法更新（請確認已登入且此影片屬於您的公司）');
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getUploadError(err);
      console.error('[Edit] Save exception:', err);
      setError('儲存失敗：' + msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">編輯影片</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">公司名稱 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">職位名稱 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">地點</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">薪資</label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">職位描述 <span className="text-red-400">*</span></label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">影片 <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="file" accept="video/mp4,video/webm" onChange={handleFileChange} disabled={uploadingFile} className="flex-1 min-w-0 text-sm text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white" />
                  {uploadingFile && <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />}
                  {videoUploadSuccess && <span className="text-emerald-400 text-sm shrink-0">✓ 影片已上傳</span>}
                </div>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">縮圖連結</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleLogoFileChange} disabled={uploadingLogo} className="flex-1 min-w-0 text-sm text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-600 file:text-white" />
                    {uploadingLogo && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />}
                    {logoUploadSuccess && <span className="text-emerald-400 text-sm shrink-0">✓ Logo 已上傳</span>}
                  </div>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">標籤（逗號分隔）</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">聯絡信箱</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2" role="alert">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" />儲存中...</> : <>儲存修改</>}
              </button>
              <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
