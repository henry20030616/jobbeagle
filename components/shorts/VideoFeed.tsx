'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { JobData } from '@/types';
import VideoCard from './VideoCard';

interface VideoFeedProps {
  jobs: JobData[];
  followedCompanies?: Set<string>;
  savedJobIds?: Set<string>;
  onFollowChange?: (companyName: string, followed: boolean) => void;
  onSaveChange?: (jobId: string, saved: boolean, jobData?: JobData) => void;
  language?: 'zh' | 'en';
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({
  jobs,
  followedCompanies = new Set(),
  savedJobIds = new Set(),
  onFollowChange,
  onSaveChange,
  language = 'zh',
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
              // 滑到倒數第 2 張時預先觸發 load more
              if (onLoadMore && index >= jobs.length - 2) {
                onLoadMore();
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const cards = container.querySelectorAll('.video-card-snap');
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [jobs, onLoadMore]);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {jobs.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center text-white/60">
            <p className="text-lg font-semibold mb-2">No jobs found</p>
            <p className="text-sm">Start following jobs to see them here</p>
          </div>
        </div>
      ) : (
        <>
          {jobs.map((job, index) => (
            <div key={job.id} data-index={index} className="video-card-snap h-full w-full snap-start">
              <VideoCard
                job={job}
                isActive={index === activeIndex}
                isFollowed={followedCompanies.has(job.companyName)}
                isBookmarked={savedJobIds.has(job.id)}
                onFollowChange={onFollowChange}
                onSaveChange={onSaveChange}
                language={language}
              />
            </div>
          ))}
          {/* 載入更多指示器 */}
          {loadingMore && (
            <div className="h-24 w-full flex items-center justify-center bg-black shrink-0">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}
          {!hasMore && jobs.length > 0 && (
            <div className="h-24 w-full flex items-center justify-center bg-black shrink-0">
              <p className="text-white/30 text-sm">— 已看完所有職缺 —</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoFeed;
