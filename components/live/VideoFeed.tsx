'use client';

import React, { useRef, useEffect, useState } from 'react';
import { JobData } from '@/types';
import VideoCard from './VideoCard';

interface VideoFeedProps {
  jobs: JobData[];
}

const VideoFeed: React.FC<VideoFeedProps> = ({ jobs }) => {
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
      {jobs.map((job, index) => (
        <div key={job.id} data-index={index} className="video-card-snap h-full w-full snap-start">
            <VideoCard 
                job={job} 
                isActive={index === activeIndex} 
            />
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
