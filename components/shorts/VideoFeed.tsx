'use client';

import React, { useRef, useEffect, useState } from 'react';
import { JobData } from '@/types';
import VideoCard from './VideoCard';

interface VideoFeedProps {
  jobs: JobData[];
  followedJobIds?: Set<string>;
  onFollowChange?: (jobId: string, followed: boolean) => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ jobs, followedJobIds = new Set(), onFollowChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // High-performance scroll detection
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6, // Trigger when 60% of the card is visible
      }
    );

    const cards = container.querySelectorAll('.video-card-snap');
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [jobs]);

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
        jobs.map((job, index) => (
          <div key={job.id} data-index={index} className="video-card-snap h-full w-full snap-start">
              <VideoCard 
                  job={job} 
                  isActive={index === activeIndex}
                  isFollowed={followedJobIds.has(job.id)}
                  onFollowChange={onFollowChange}
              />
          </div>
        ))
      )}
    </div>
  );
};

export default VideoFeed;
