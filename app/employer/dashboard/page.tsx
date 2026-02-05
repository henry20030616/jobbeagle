'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { 
  Upload, Video, Edit, Trash2, Eye, EyeOff, 
  Plus, Building2, LogOut, AlertCircle, Loader2,
  X, CheckCircle
} from 'lucide-react';

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
    await loadCompanyAndVideos(user.id);
  };

  const loadCompanyAndVideos = async (userId: string) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 載入企業資訊
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') {
        throw companyError;
      }

      // 如果企業不存在，建立新企業
      if (!companyData) {
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            user_id: userId,
            company_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '新企業',
            company_email: user.email,
          })
          .select()
          .single();

        if (createError) throw createError;
        setCompany(newCompany);
      } else {
        setCompany(companyData);
      }

      // 載入影片列表
      if (companyData || !companyError) {
        const companyId = companyData?.id || (await supabase.from('companies').select('id').eq('user_id', userId).single()).data?.id;
        
        if (companyId) {
          const { data: videosData, error: videosError } = await supabase
            .from('shorts_videos')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

          if (videosError) throw videosError;
          setVideos(videosData || []);
        }
      }
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
                <h1 className="text-xl font-bold text-white">
                  <span className="text-white">Job</span><span className="text-blue-400">beagle</span> 企業中心
                </h1>
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
      {showUploadModal && (
        <UploadVideoModal
          companyId={company?.id!}
          companyName={company?.company_name || ''}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadCompanyAndVideos(user.id);
            setSuccess('影片上傳成功');
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
  companyName, 
  onClose, 
  onSuccess 
}: { 
  companyId: string; 
  companyName: string; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    job_title: '',
    location: '',
    salary: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    logo_url: '',
    tags: '',
    contact_email: '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.job_title || !formData.description || !formData.video_url) {
      setError('請填寫必填欄位：職位名稱、描述、影片連結');
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
          company_id: companyId,
          job_title: formData.job_title,
          company_name: companyName,
          location: formData.location || null,
          salary: formData.salary || null,
          description: formData.description,
          video_url: formData.video_url,
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

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                影片連結 <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/video.mp4"
                required
              />
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
                <label className="block text-slate-300 text-sm font-medium mb-2">Logo 連結</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
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
