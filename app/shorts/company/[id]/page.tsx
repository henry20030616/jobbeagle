'use client';

/**
 * 公開企業主頁 — Instagram 官方粉絲專頁風格
 * 任何人可瀏覽；登入後可追蹤公司、一鍵申請
 */
import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, DollarSign, Briefcase, Play, ExternalLink,
  Mail, Building2, Loader2, Share2, CheckCircle, Grid3x3, X,
  Globe, UserPlus, UserCheck, Eye, Heart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useLanguage } from '@/lib/language-context';
import { JobData } from '@/types';

// ── Extract YouTube video ID → thumbnail URL ────────────────────────────────
function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1).split('?')[0];
    else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) id = u.pathname.replace('/shorts/', '').split('?')[0];
      else id = u.searchParams.get('v') || '';
    }
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

const CP = {
  en:     { posts: 'posts', followers: 'followers', views: 'views', share: 'Share', copied: 'Copied!', jobs: 'Job Openings', noJobs: 'No job openings at this time.', follow: 'Follow', following: 'Following', applyExternal: 'Apply on Company Site', applyEmail: 'Quick Apply', inquire: 'Inquire', moreOnShorts: 'Explore more on Jobbeagle Shorts' },
  'zh-TW':{ posts: '則影片', followers: '追蹤者', views: '觀看', share: '分享', copied: '已複製！', jobs: '職缺', noJobs: '目前沒有公開職缺。', follow: '追蹤', following: '已追蹤', applyExternal: '前往企業申請頁', applyEmail: '一鍵申請', inquire: '洽詢中', moreOnShorts: '在 Jobbeagle Shorts 看更多' },
  'zh-CN':{ posts: '个视频', followers: '关注者', views: '观看', share: '分享', copied: '已复制！', jobs: '职位', noJobs: '目前没有公开职位。', follow: '关注', following: '已关注', applyExternal: '前往企业申请页', applyEmail: '一键申请', inquire: '洽询中', moreOnShorts: '在 Jobbeagle Shorts 看更多' },
  es:     { posts: 'publicaciones', followers: 'seguidores', views: 'vistas', share: 'Compartir', copied: '¡Copiado!', jobs: 'Empleos', noJobs: 'No hay empleos disponibles.', follow: 'Seguir', following: 'Siguiendo', applyExternal: 'Aplicar en Empresa', applyEmail: 'Aplicar', inquire: 'Consultar', moreOnShorts: 'Ver más en Jobbeagle Shorts' },
  hi:     { posts: 'पोस्ट', followers: 'फॉलोअर', views: 'व्यूज', share: 'शेयर', copied: 'कॉपी!', jobs: 'नौकरियां', noJobs: 'अभी कोई नौकरी उपलब्ध नहीं।', follow: 'फॉलो', following: 'फॉलोइंग', applyExternal: 'आवेदन करें', applyEmail: 'शीघ्र आवेदन', inquire: 'पूछताछ', moreOnShorts: 'Jobbeagle Shorts पर और देखें' },
  ar:     { posts: 'منشور', followers: 'متابع', views: 'مشاهدة', share: 'مشاركة', copied: 'تم!', jobs: 'الوظائف', noJobs: 'لا توجد وظائف متاحة حالياً.', follow: 'متابعة', following: 'تتابع', applyExternal: 'تقديم في الشركة', applyEmail: 'تقديم سريع', inquire: 'استفسار', moreOnShorts: 'استكشف المزيد في Jobbeagle Shorts' },
} as const;

interface PageProps { params: Promise<{ id: string }>; }
interface CompanyProfilePublic {
  company_name: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
}

export default function CompanyPublicPage({ params }: PageProps) {
  const { id } = use(params);
  const companyName = decodeURIComponent(id);
  const { language: appLanguage } = useLanguage();
  const tc = CP[appLanguage] ?? CP.en;

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [profile, setProfile] = useState<CompanyProfilePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<JobData | null>(null);

  // Auth + Follow state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Fetch user in parallel with data
      const [profileRes, videosRes, followerRes, userRes] = await Promise.all([
        supabase.from('company_profiles').select('company_name, logo_url, description, website').eq('company_name', companyName).maybeSingle(),
        supabase.from('shorts_videos').select('*').ilike('company_name', companyName).eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('followed_companies').select('*', { count: 'exact', head: true }).eq('company_name', companyName),
        supabase.auth.getUser(),
      ]);

      let prof = profileRes.data as CompanyProfilePublic | null;
      if (!prof) {
        // loose match
        const { data: loose } = await supabase.from('company_profiles').select('company_name, logo_url, description, website').ilike('company_name', companyName).maybeSingle();
        prof = loose as CompanyProfilePublic | null;
      }
      setProfile(prof);

      if (videosRes.data) {
        const mapped = videosRes.data.map((v) => ({
          id: v.id,
          companyName: v.company_name,
          jobTitle: v.job_title,
          location: v.location || '',
          salary: v.salary || '',
          description: v.description || '',
          videoUrl: v.video_url,
          videoSourceType: v.video_source_type || 'upload',
          tags: v.tags || [],
          logoUrl: v.logo_url || `https://www.google.com/s2/favicons?domain=${v.company_name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`,
          contactEmail: v.contact_email || undefined,
          applyUrl: v.apply_url || undefined,
          viewCount: v.view_count || 0,
        }));
        setJobs(mapped as JobData[]);
        setTotalViews(videosRes.data.reduce((s, v) => s + (v.view_count || 0), 0));
      }

      setFollowerCount(followerRes.count ?? 0);

      const u = userRes.data.user;
      setCurrentUser(u);
      if (u) {
        const { data: followRow } = await supabase.from('followed_companies').select('id').eq('user_id', u.id).eq('company_name', companyName).maybeSingle();
        setIsFollowing(!!followRow);
      }

      setLoading(false);
    };
    load();
  }, [companyName]);

  const handleFollow = useCallback(async () => {
    if (!currentUser) {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${window.location.pathname}` } });
      return;
    }
    setFollowLoading(true);
    const supabase = createClient();
    const logoUrl = profile?.logo_url ?? null;
    if (isFollowing) {
      await supabase.from('followed_companies').delete().eq('user_id', currentUser.id).eq('company_name', companyName);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from('followed_companies').upsert({ user_id: currentUser.id, company_name: companyName, logo_url: logoUrl }, { onConflict: 'user_id,company_name' });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  }, [currentUser, isFollowing, companyName, profile]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = profile?.company_name || jobs[0]?.companyName || companyName;
  const avatarUrl = profile?.logo_url || jobs[0]?.logoUrl
    || `https://www.google.com/s2/favicons?domain=${displayName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;
  const postCount = jobs.length;

  // Helper: get best thumbnail for a job
  const getThumb = (job: JobData & { viewCount?: number }): string | null => {
    if (job.videoSourceType === 'youtube' && job.videoUrl) return getYouTubeThumbnail(job.videoUrl);
    return null;
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-3 h-12 flex items-center justify-between">
          <Link href="/shorts" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-sm truncate max-w-[50%]">{displayName}</span>
          <button type="button" onClick={handleCopyLink} className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400" aria-label="Share">
            {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Share2 size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-9 h-9 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Profile header — Instagram-style ─────────────── */}
            <section className="px-4 pt-8 pb-6 border-b border-zinc-800">
              <div className="flex flex-row items-start gap-6 md:gap-10">
                {/* Avatar */}
                <div className="flex-shrink-0 w-20 h-20 md:w-[150px] md:h-[150px] rounded-full bg-zinc-900 ring-2 ring-zinc-700 overflow-hidden flex items-center justify-center shadow-xl">
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Right side info */}
                <div className="flex-1 min-w-0 pt-1 md:pt-4">
                  {/* Desktop: name row */}
                  <div className="hidden md:flex items-center gap-4 mb-5 flex-wrap">
                    <h1 className="text-xl font-light tracking-tight truncate">{displayName}</h1>
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isFollowing ? 'bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-red-900/20 hover:border-red-500/40 hover:text-red-300' : 'bg-white text-black hover:bg-zinc-200'}`}
                    >
                      {followLoading ? <Loader2 size={14} className="animate-spin" /> : isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                      {isFollowing ? tc.following : tc.follow}
                    </button>
                    <button type="button" onClick={handleCopyLink} className="px-3 py-2 text-sm font-semibold rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800">
                      {copied ? tc.copied : tc.share}
                    </button>
                  </div>

                  {/* Mobile: name */}
                  <h1 className="md:hidden text-lg font-semibold truncate mb-3">{displayName}</h1>

                  {/* Stats */}
                  <div className="flex gap-6 md:gap-8 mb-4">
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-base text-white">{postCount}</p>
                      <p className="text-zinc-500 text-xs">{tc.posts}</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-base text-white">{followerCount.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">{tc.followers}</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-base text-white">{totalViews.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">{tc.views}</p>
                    </div>
                  </div>

                  {/* Desktop bio */}
                  <div className="hidden md:block space-y-1">
                    <p className="font-semibold text-sm">{displayName}</p>
                    {profile?.description && (
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-md">{profile.description}</p>
                    )}
                    {profile?.website && (
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-1">
                        <Globe size={14} />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile bio + follow button */}
              <div className="md:hidden mt-4 space-y-2">
                {profile?.description && (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{profile.description}</p>
                )}
                {profile?.website && (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-400">
                    <Globe size={14} />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {/* Mobile follow + share row */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${isFollowing ? 'bg-zinc-800 border border-zinc-600 text-zinc-200' : 'bg-white text-black hover:bg-zinc-100'}`}
                  >
                    {followLoading ? <Loader2 size={14} className="animate-spin" /> : isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {isFollowing ? tc.following : tc.follow}
                  </button>
                  <button type="button" onClick={handleCopyLink} className="flex-1 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold">
                    {copied ? tc.copied : tc.share}
                  </button>
                </div>
              </div>
            </section>

            {/* Tab strip */}
            <div className="flex border-t border-zinc-800">
              <div className="flex-1 flex justify-center py-3 border-t-2 border-white -mt-px">
                <span className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-white">
                  <Grid3x3 size={14} /> {tc.jobs}
                </span>
              </div>
            </div>

            {/* Video Grid — 3-column */}
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">{tc.noJobs}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[2px] bg-zinc-950">
                {(jobs as (JobData & { viewCount?: number })[]).map((job) => {
                  const thumb = getThumb(job);
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedVideo(job)}
                      className="relative aspect-[9/16] bg-zinc-900 group overflow-hidden"
                    >
                      {/* Thumbnail */}
                      {thumb ? (
                        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                      ) : job.videoSourceType === 'upload' ? (
                        <video
                          src={job.videoUrl}
                          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          muted playsInline preload="metadata"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
                          {job.logoUrl && <img src={job.logoUrl} className="w-10 h-10 rounded-full object-contain" alt="" />}
                          <span className="text-2xl">{job.videoSourceType === 'instagram' ? '📸' : job.videoSourceType === 'facebook' ? '📘' : '▶'}</span>
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded-full p-3">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                      </div>

                      {/* Job title at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight drop-shadow">{job.jobTitle}</p>
                      </div>

                      {/* View count badge */}
                      {job.viewCount && job.viewCount > 0 ? (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 rounded-md px-1.5 py-0.5">
                          <Eye size={10} className="text-white/80" />
                          <span className="text-white text-[10px] font-medium">{job.viewCount >= 1000 ? `${(job.viewCount / 1000).toFixed(1)}k` : job.viewCount}</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Full-screen job modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 border-b border-zinc-900" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <button type="button" onClick={() => setSelectedVideo(null)} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400">
              <X size={22} />
            </button>
            <span className="text-sm font-semibold truncate flex-1 text-center px-2">{selectedVideo.jobTitle}</span>
            <span className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <video src={selectedVideo.videoUrl} controls className="w-full max-h-[55vh] bg-black object-contain" autoPlay playsInline />
            <div className="p-5 space-y-4 max-w-lg mx-auto">
              {/* Company row */}
              <div className="flex items-center gap-3">
                <img src={avatarUrl} className="w-10 h-10 rounded-full border border-zinc-700 object-cover bg-zinc-900" alt="" />
                <div>
                  <h2 className="text-base font-bold leading-tight">{selectedVideo.jobTitle}</h2>
                  <p className="text-zinc-400 text-sm">{selectedVideo.companyName}</p>
                </div>
              </div>

              {/* Location + salary */}
              <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                {selectedVideo.location && <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg"><MapPin size={13} className="text-zinc-500" />{selectedVideo.location}</span>}
                {selectedVideo.salary && <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg"><span className="text-zinc-500 text-xs font-bold">$</span>{selectedVideo.salary}</span>}
              </div>

              {/* Description */}
              {selectedVideo.description && (
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900/50 rounded-xl p-3.5">{selectedVideo.description}</p>
              )}

              {/* Tags */}
              {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.tags.map((tag: string) => (
                    <span key={tag} className="text-xs text-blue-400 bg-blue-900/20 border border-blue-500/30 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-2.5 pt-1">
                {selectedVideo.applyUrl ? (
                  <a href={selectedVideo.applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white text-sm font-bold transition-colors shadow-lg">
                    <ExternalLink size={16} />
                    {tc.applyExternal}
                  </a>
                ) : selectedVideo.contactEmail ? (
                  <a href={`mailto:${selectedVideo.contactEmail}?subject=${encodeURIComponent(`Applying for ${selectedVideo.jobTitle}`)}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-white text-sm font-bold transition-colors shadow-lg">
                    <Mail size={16} />
                    {tc.applyEmail}
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-800 rounded-2xl text-zinc-500 text-sm border border-zinc-700">
                    <Briefcase size={16} />
                    {tc.inquire}
                  </div>
                )}
              </div>

              <Link href="/shorts" className="block text-center text-sm text-blue-400 py-2 hover:text-blue-300 transition-colors">
                {tc.moreOnShorts}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
