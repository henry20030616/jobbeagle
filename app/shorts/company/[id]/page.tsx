'use client';

/**
 * 公開企業主頁 — 任何人可瀏覽（不需登入）。
 * 與登入後的私人企業儀表板（ProfileModal 企業模式）不同。
 */
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, DollarSign, Briefcase, Play, ExternalLink,
  Mail, Building2, Loader2, Share2, CheckCircle, Grid3x3, X,
  Globe,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { JobData } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CompanyProfilePublic {
  company_name: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
}

export default function CompanyPublicPage({ params }: PageProps) {
  const { id } = use(params);
  const companyName = decodeURIComponent(id);

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [profile, setProfile] = useState<CompanyProfilePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<JobData | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: exactProf } = await supabase
        .from('company_profiles')
        .select('company_name, logo_url, description, website')
        .eq('company_name', companyName)
        .maybeSingle();

      let prof = exactProf as CompanyProfilePublic | null;
      if (!prof) {
        const { data: loose } = await supabase
          .from('company_profiles')
          .select('company_name, logo_url, description, website')
          .ilike('company_name', companyName)
          .maybeSingle();
        prof = loose as CompanyProfilePublic | null;
      }
      setProfile(prof);

      const { data } = await supabase
        .from('shorts_videos')
        .select('*')
        .ilike('company_name', companyName)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (data) {
        setJobs(data.map((v) => ({
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
        })));
      }
      setLoading(false);
    };
    load();
  }, [companyName]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = profile?.company_name || jobs[0]?.companyName || companyName;
  const avatarUrl = profile?.logo_url || jobs[0]?.logoUrl
    || `https://www.google.com/s2/favicons?domain=${displayName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;
  const postCount = jobs.length;

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* IG-style top bar */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-3 h-12 flex items-center justify-between">
          <Link href="/shorts" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-sm truncate max-w-[50%]">{displayName}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400"
            aria-label="Share"
          >
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
            {/* Profile header — Instagram-like */}
            <section className="px-4 pt-8 pb-6 border-b border-zinc-800">
              <div className="flex flex-row items-start gap-6 md:gap-10">
                <div className="flex-shrink-0 w-[77px] h-[77px] md:w-[150px] md:h-[150px] rounded-full bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden flex items-center justify-center">
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {!avatarUrl && <Building2 className="w-10 h-10 text-zinc-600" />}
                </div>
                <div className="flex-1 min-w-0 pt-1 md:pt-4">
                  <div className="hidden md:flex items-center gap-4 mb-4">
                    <h1 className="text-xl font-light tracking-tight truncate">{displayName}</h1>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
                    >
                      {copied ? '已複製連結' : '分享檔案'}
                    </button>
                  </div>
                  <h1 className="md:hidden text-lg font-semibold truncate mb-3">{displayName}</h1>

                  {/* Stats — 公開可見：貼文數 */}
                  <div className="flex gap-6 md:gap-8 mb-4 text-center md:text-left">
                    <div>
                      <span className="font-semibold text-base">{postCount}</span>
                      <span className="text-zinc-500 text-sm ml-1">則貼文</span>
                    </div>
                  </div>

                  <div className="hidden md:block space-y-1">
                    <p className="font-semibold text-sm">{displayName}</p>
                    {profile?.description && (
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-md">{profile.description}</p>
                    )}
                    {profile?.website && (
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-1"
                      >
                        <Globe size={14} />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile bio */}
              <div className="md:hidden mt-4 space-y-1">
                {profile?.description && (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{profile.description}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-400"
                  >
                    <Globe size={14} />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="md:hidden w-full mt-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-semibold"
              >
                分享此企業主頁
              </button>
            </section>

            {/* Tab strip — IG “posts grid” */}
            <div className="flex border-t border-zinc-800">
              <div className="flex-1 flex justify-center py-3 border-t border-white -mt-px">
                <span className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-white">
                  <Grid3x3 size={14} /> 影片
                </span>
              </div>
            </div>

            {/* Grid */}
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">尚無公開職缺影片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[2px] bg-zinc-900">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedVideo(job)}
                    className="relative aspect-square bg-zinc-950 group overflow-hidden"
                  >
                    <video
                      src={job.videoUrl}
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-10 h-10 text-white drop-shadow-lg" fill="white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Full-screen reel modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-safe pt-3 border-b border-zinc-900">
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400"
            >
              <X size={22} />
            </button>
            <span className="text-sm font-semibold truncate flex-1 text-center px-2">{selectedVideo.jobTitle}</span>
            <span className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <video src={selectedVideo.videoUrl} controls className="w-full max-h-[50vh] bg-black object-contain" autoPlay playsInline />
            <div className="p-4 space-y-3 max-w-lg mx-auto">
              <div>
                <h2 className="text-lg font-bold">{selectedVideo.jobTitle}</h2>
                <p className="text-zinc-400 text-sm">{selectedVideo.companyName}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                {selectedVideo.location && (
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-zinc-500" />{selectedVideo.location}</span>
                )}
                {selectedVideo.salary && (
                  <span className="flex items-center gap-1"><DollarSign size={14} className="text-zinc-500" />{selectedVideo.salary}</span>
                )}
              </div>
              {selectedVideo.description && (
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedVideo.description}</p>
              )}
              <div className="flex gap-2 pt-2">
                {selectedVideo.applyUrl ? (
                  <a
                    href={selectedVideo.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold"
                  >
                    <ExternalLink size={16} />
                    前往企業申請頁
                  </a>
                ) : selectedVideo.contactEmail ? (
                  <a
                    href={`mailto:${selectedVideo.contactEmail}?subject=應徵 ${selectedVideo.jobTitle}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold"
                  >
                    <Mail size={16} />
                    一鍵申請
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 rounded-xl text-zinc-500 text-sm">
                    <Briefcase size={16} />
                    洽詢中
                  </div>
                )}
              </div>
              <Link
                href="/shorts"
                className="block text-center text-sm text-blue-400 py-2"
              >
                在 Jobbeagle Shorts 看更多
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
