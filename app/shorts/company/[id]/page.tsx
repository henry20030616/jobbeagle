'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, DollarSign, Briefcase, Play, ExternalLink,
  Mail, Building2, Loader2, Share2, Copy, CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { JobData } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyPage({ params }: PageProps) {
  const { id } = use(params);
  const companyName = decodeURIComponent(id);

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<JobData | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
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

  const logoUrl = jobs[0]?.logoUrl || `https://www.google.com/s2/favicons?domain=${companyName.toLowerCase().replace(/\s+/g, '')}.com&sz=128`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/shorts" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Jobbeagle Shorts</span>
        </Link>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
        >
          {copied ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} />}
          {copied ? '已複製' : '分享'}
        </button>
      </div>

      {/* Company Hero */}
      <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center border-b border-slate-800">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl mb-4 overflow-hidden">
          <img
            src={logoUrl}
            alt={companyName}
            className="w-16 h-16 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{companyName}</h1>
        <p className="text-slate-400 text-sm">{jobs.length} 個職缺影片</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Share2 size={16} />
            分享企業頁面
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 py-5 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">此企業尚無公開職缺影片</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedVideo?.id === job.id}
                onSelect={() => setSelectedVideo(selectedVideo?.id === job.id ? null : job)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, isSelected, onSelect }: { job: JobData; isSelected: boolean; onSelect: () => void }) {
  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
      {/* Video player (lazy) */}
      {isSelected && (
        <video
          src={job.videoUrl}
          controls
          autoPlay
          className="w-full aspect-[9/16] max-h-64 object-cover bg-black"
        />
      )}

      {/* Thumbnail / play button */}
      {!isSelected && (
        <button
          onClick={onSelect}
          className="w-full aspect-video bg-slate-800 flex items-center justify-center relative group"
        >
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-blue-600/80 transition-colors">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <span className="text-white font-semibold text-sm drop-shadow">{job.jobTitle}</span>
          </div>
        </button>
      )}

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-white font-bold text-lg">{job.jobTitle}</h3>
            <p className="text-slate-400 text-sm">{job.companyName}</p>
          </div>
          {isSelected && (
            <button onClick={onSelect} className="text-slate-500 hover:text-white text-xs flex-shrink-0">收起</button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-slate-300 text-sm mb-3">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-slate-500" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign size={14} className="text-slate-500" />
              {job.salary}
            </span>
          )}
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">
                {tag}
              </span>
            ))}
          </div>
        )}

        {isSelected && job.description && (
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{job.description}</p>
        )}

        {/* Apply buttons */}
        <div className="flex gap-2">
          {job.applyUrl ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold transition-colors"
            >
              <ExternalLink size={15} />
              套用（前往企業申請頁）
            </a>
          ) : job.contactEmail ? (
            <a
              href={`mailto:${job.contactEmail}?subject=應徵 ${job.jobTitle}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold transition-colors"
            >
              <Mail size={15} />
              一鍵申請
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 rounded-xl text-slate-400 text-sm cursor-not-allowed">
              <Briefcase size={15} />
              洽詢中
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
