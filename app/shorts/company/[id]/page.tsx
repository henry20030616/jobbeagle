'use client';

/**
 * 企業公開主頁 — Instagram 官方粉絲專頁風格
 */
import React, { useState, useEffect, use, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, DollarSign, Play, ExternalLink,
  Mail, Building2, Loader2, Share2, CheckCircle, Grid3x3, X,
  Globe, UserPlus, UserCheck, Eye, Briefcase,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useLanguage } from '@/lib/language-context';
import { JobData } from '@/types';

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
  en:     { posts: 'posts', followers: 'followers', views: 'views', share: 'Share', copied: 'Copied!', noJobs: 'No openings right now.', follow: 'Follow', unfollow: 'Following', applyExternal: 'Apply Now', applyEmail: 'Quick Apply', inquire: 'Inquire', moreOnShorts: 'More on Jobbeagle Shorts', jobs: 'Jobs', allJobs: 'All', openJobs: 'Open to apply', watchOnShorts: 'Watch on Shorts' },
  'zh-TW':{ posts: '部影片', followers: '追蹤者', views: '觀看', share: '分享', copied: '已複製！', noJobs: '目前沒有公開職缺。', follow: '追蹤', unfollow: '已追蹤', applyExternal: '前往申請', applyEmail: '一鍵申請', inquire: '洽詢', moreOnShorts: 'Jobbeagle Shorts 看更多', jobs: '職缺', allJobs: '全部', openJobs: '開放申請', watchOnShorts: '在 Shorts 觀看' },
  'zh-CN':{ posts: '个视频', followers: '关注者', views: '观看', share: '分享', copied: '已复制！', noJobs: '暂无公开职位。', follow: '关注', unfollow: '已关注', applyExternal: '前往申请', applyEmail: '一键申请', inquire: '洽询', moreOnShorts: 'Jobbeagle Shorts 看更多', jobs: '职位', allJobs: '全部', openJobs: '开放申请', watchOnShorts: '在 Shorts 观看' },
  es:     { posts: 'videos', followers: 'seguidores', views: 'vistas', share: 'Compartir', copied: '¡Copiado!', noJobs: 'Sin vacantes.', follow: 'Seguir', unfollow: 'Siguiendo', applyExternal: 'Solicitar', applyEmail: 'Aplicar', inquire: 'Consultar', moreOnShorts: 'Más en Jobbeagle Shorts', jobs: 'Empleos', allJobs: 'Todos', openJobs: 'Abiertos', watchOnShorts: 'Ver en Shorts' },
  hi:     { posts: 'वीडियो', followers: 'फॉलोअर', views: 'व्यूज', share: 'शेयर', copied: 'कॉपी!', noJobs: 'कोई नौकरी नहीं।', follow: 'फॉलो', unfollow: 'फॉलोइंग', applyExternal: 'आवेदन करें', applyEmail: 'शीघ्र आवेदन', inquire: 'पूछें', moreOnShorts: 'Jobbeagle Shorts पर', jobs: 'नौकरियां', allJobs: 'सभी', openJobs: 'खुली', watchOnShorts: 'Shorts पर देखें' },
  ar:     { posts: 'فيديو', followers: 'متابع', views: 'مشاهدة', share: 'مشاركة', copied: 'تم!', noJobs: 'لا وظائف حالياً.', follow: 'متابعة', unfollow: 'تتابع', applyExternal: 'تقدم الآن', applyEmail: 'تقديم سريع', inquire: 'استفسار', moreOnShorts: 'المزيد في Jobbeagle Shorts', jobs: 'وظائف', allJobs: 'الكل', openJobs: 'مفتوحة', watchOnShorts: 'شاهد على Shorts' },
} as const;

interface PageProps { params: Promise<{ id: string }>; }
interface CompanyProfilePublic { company_name: string; logo_url: string | null; description: string | null; website: string | null; }

type JobItem = JobData & { viewCount?: number };

export default function CompanyPublicPage({ params }: PageProps) {
  const { id } = use(params);
  const companyName = decodeURIComponent(id);
  const { language: appLanguage } = useLanguage();
  const tc = CP[appLanguage] ?? CP.en;

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [profile, setProfile] = useState<CompanyProfilePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<JobItem | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [jobFilter, setJobFilter] = useState<'all' | 'open'>('all');

  const displayedJobs = useMemo(() => {
    if (jobFilter === 'open') {
      return jobs.filter((j) => !!(j.applyUrl || j.contactEmail));
    }
    return jobs;
  }, [jobs, jobFilter]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [profileRes, videosRes, followerRes, userRes] = await Promise.all([
        supabase.from('company_profiles').select('company_name, logo_url, description, website').eq('company_name', companyName).maybeSingle(),
        supabase.from('shorts_videos').select('*').ilike('company_name', companyName).eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('followed_companies').select('*', { count: 'exact', head: true }).eq('company_name', companyName),
        supabase.auth.getUser(),
      ]);

      let prof = profileRes.data as CompanyProfilePublic | null;
      if (!prof) {
        const { data: loose } = await supabase.from('company_profiles').select('company_name, logo_url, description, website').ilike('company_name', companyName).maybeSingle();
        prof = loose as CompanyProfilePublic | null;
      }
      setProfile(prof);

      if (videosRes.data) {
        const mapped: JobItem[] = videosRes.data.map((v) => ({
          id: v.id, companyName: v.company_name, jobTitle: v.job_title,
          location: v.location || '', salary: v.salary || '',
          description: v.description || '', videoUrl: v.video_url,
          videoSourceType: v.video_source_type || 'upload', tags: v.tags || [],
          logoUrl: v.logo_url || `https://www.google.com/s2/favicons?domain=${v.company_name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`,
          contactEmail: v.contact_email || undefined, applyUrl: v.apply_url || undefined,
          viewCount: v.view_count || 0,
        }));
        setJobs(mapped);
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

  const getThumb = (job: JobItem): string | null => {
    if (job.videoSourceType === 'youtube' && job.videoUrl) return getYouTubeThumbnail(job.videoUrl);
    return null;
  };

  // Emoji icon for embed type
  const embedIcon = (type: string) =>
    type === 'instagram' ? '📸' : type === 'facebook' ? '📘' : type === 'youtube' ? '▶️' : '🎬';

  return (
    <div className="min-h-[100dvh] text-white" style={{ background: '#000' }}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-xl mx-auto px-4 h-[52px] flex items-center justify-between gap-3">
          <Link href="/shorts" className="p-2 -ml-2 rounded-full hover:bg-white/8 transition-colors text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-semibold text-[15px] truncate flex-1 text-center">{displayName}</span>
          <button type="button" onClick={handleCopyLink} className="p-2 -mr-2 rounded-full hover:bg-white/8 transition-colors text-white/70 hover:text-white">
            {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Share2 size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto pb-28">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ) : (
          <>
            {/* ── Profile Section ── */}
            <section className="px-5 pt-7 pb-6">
              {/* Avatar + stats row */}
              <div className="flex items-center gap-5 mb-5">
                {/* Avatar with gradient ring */}
                <div className="shrink-0 relative">
                  <div className="w-[86px] h-[86px] rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
                    <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex items-center justify-around">
                  <StatItem value={jobs.length} label={tc.posts} />
                  <StatItem value={followerCount} label={tc.followers} />
                  <StatItem value={totalViews} label={tc.views} />
                </div>
              </div>

              {/* Name + bio */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-[15px] leading-tight">{displayName}</h1>
                  {/* Verified / employer badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full px-2 py-0.5 font-medium">
                    <Building2 size={10} />
                    Employer
                  </span>
                </div>
                {profile?.description && (
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{profile.description}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Globe size={13} />
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-[9px] rounded-xl text-[13px] font-bold transition-all ${
                    isFollowing
                      ? 'border text-white/80 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                  }`}
                  style={isFollowing ? { borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' } : {}}
                >
                  {followLoading
                    ? <Loader2 size={14} className="animate-spin" />
                    : isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />
                  }
                  {isFollowing ? tc.unfollow : tc.follow}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-4 py-[9px] rounded-xl text-[13px] font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {copied ? <><CheckCircle size={14} className="text-emerald-400" /> {tc.copied}</> : <><Share2 size={14} /> {tc.share}</>}
                </button>
              </div>
            </section>

            {/* ── Divider / Tab ── */}
            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex justify-center gap-6 py-3 border-t-2 border-white -mt-px">
                <button
                  type="button"
                  onClick={() => setJobFilter('all')}
                  className={`flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase transition-colors ${jobFilter === 'all' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Grid3x3 size={13} />
                  {tc.allJobs}
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('open')}
                  className={`flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase transition-colors ${jobFilter === 'open' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Briefcase size={13} />
                  {tc.openJobs}
                </button>
              </div>
            </div>

            {/* ── Video Grid ── */}
            {displayedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Building2 className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{tc.noJobs}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3" style={{ gap: '2px', background: 'rgba(255,255,255,0.04)' }}>
                {displayedJobs.map((job) => {
                  const thumb = getThumb(job);
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedVideo(job)}
                      className="relative group overflow-hidden bg-zinc-950"
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      {/* Media */}
                      {thumb ? (
                        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : job.videoSourceType === 'upload' && job.videoUrl ? (
                        <video src={job.videoUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        /* Embed placeholder — gradient card with logo + icon */
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                          {job.logoUrl && (
                            <img src={job.logoUrl} className="w-8 h-8 rounded-full object-contain bg-black/40" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <span className="text-xl">{embedIcon(job.videoSourceType || '')}</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          <Play size={16} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Job title overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                        <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{job.jobTitle}</p>
                      </div>

                      {/* View count */}
                      {job.viewCount && job.viewCount > 0 ? (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.65)' }}>
                          <Eye size={9} className="text-white/60" />
                          <span className="text-[10px] text-white/80 font-medium">{job.viewCount >= 1000 ? `${(job.viewCount / 1000).toFixed(1)}k` : job.viewCount}</span>
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

      {/* ── Full-screen job detail modal ── */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
          {/* Modal header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <button type="button" onClick={() => setSelectedVideo(null)} className="p-2 -ml-2 rounded-full hover:bg-white/8 transition-colors text-white/60 hover:text-white">
              <X size={20} />
            </button>
            <span className="text-[14px] font-semibold truncate flex-1 text-center px-3">{selectedVideo.jobTitle}</span>
            <span className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Video */}
            <div className="relative" style={{ background: '#000' }}>
              {selectedVideo.videoSourceType === 'upload' && selectedVideo.videoUrl ? (
                <video src={selectedVideo.videoUrl} controls className="w-full max-h-[55vh] object-contain" autoPlay playsInline style={{ display: 'block' }} />
              ) : (
                <div className="w-full h-[55vh] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
                  <div className="text-center">
                    <span className="text-5xl">{embedIcon(selectedVideo.videoSourceType || '')}</span>
                    <p className="text-white/40 text-sm mt-3">External video</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="px-5 py-5 space-y-4 max-w-lg mx-auto">
              {/* Company row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-[16px] leading-tight">{selectedVideo.jobTitle}</h2>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedVideo.companyName}</p>
                </div>
              </div>

              {/* Location + salary chips */}
              {(selectedVideo.location || selectedVideo.salary) && (
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.location && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                      <MapPin size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />{selectedVideo.location}
                    </span>
                  )}
                  {selectedVideo.salary && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                      <DollarSign size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />{selectedVideo.salary}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {selectedVideo.description && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedVideo.description}</p>
                </div>
              )}

              {/* Tags */}
              {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedVideo.tags.map((tag: string) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: 'rgb(147,197,253)', border: '1px solid rgba(59,130,246,0.2)' }}>#{tag}</span>
                  ))}
                </div>
              )}

              <Link
                href={`/shorts?job=${encodeURIComponent(selectedVideo.id)}`}
                className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] mb-3"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 32px rgba(124,58,237,0.25)' }}
              >
                <Play size={17} fill="white" />
                {tc.watchOnShorts}
              </Link>

              {/* Apply CTA */}
              <div className="pt-1">
                {selectedVideo.applyUrl ? (
                  <a href={selectedVideo.applyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>
                    <ExternalLink size={17} />
                    {tc.applyExternal}
                  </a>
                ) : selectedVideo.contactEmail ? (
                  <a href={`mailto:${selectedVideo.contactEmail}?subject=${encodeURIComponent(`Applying for ${selectedVideo.jobTitle}`)}`}
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', boxShadow: '0 8px 32px rgba(8,145,178,0.3)' }}>
                    <Mail size={17} />
                    {tc.applyEmail}
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-[14px]" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Briefcase size={15} />
                    {tc.inquire}
                  </div>
                )}
              </div>

              <Link href={`/shorts?job=${encodeURIComponent(selectedVideo.id)}`} className="block text-center py-3 text-[13px] font-medium" style={{ color: 'rgb(96,165,250)' }}>
                {tc.watchOnShorts}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat item sub-component
function StatItem({ value, label }: { value: number; label: string }) {
  const display = value >= 10000
    ? `${(value / 1000).toFixed(0)}k`
    : value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : value;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[17px] font-bold text-white">{display}</span>
      <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
    </div>
  );
}
