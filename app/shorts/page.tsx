'use client';

import React, { useState } from 'react';
import VideoFeed from '@/components/shorts/VideoFeed';
import { JobData } from '@/types';
import { Home, User, Briefcase, MessageCircle, X, AlertCircle } from 'lucide-react';

// Helper function to generate logo URL
const getLogoUrl = (companyName: string): string => {
  // Try multiple logo APIs as fallback
  const domain = companyName.toLowerCase().replace(/\s+/g, '');
  
  // Option 1: Google Favicon API (most reliable)
  return `https://www.google.com/s2/favicons?domain=${domain}.com&sz=128`;
  
  // Option 2: If Google fails, can use:
  // return `https://logo.clearbit.com/${domain}.com`;
  // return `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;
};

// Initial sample jobs
const INITIAL_JOBS: JobData[] = [
  {
    id: 'google-01',
    companyName: 'Google',
    jobTitle: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    salary: 'USD 180k - 250k / yr',
    description: 'Join the team building the future of AI. We are looking for experienced engineers to work on Gemini and large language models.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    tags: ['AI', 'React', 'Python'],
    logoUrl: getLogoUrl('Google'),
    contactEmail: 'careers@google.com'
  },
  {
    id: 'apple-01',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    location: 'Cupertino, CA',
    salary: 'USD 160k - 230k / yr',
    description: 'Design and build applications for the iOS platform. Ensure the performance, quality, and responsiveness of applications.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    tags: ['Swift', 'iOS', 'Mobile'],
    logoUrl: getLogoUrl('Apple'),
    contactEmail: 'recruiting@apple.com'
  },
  {
    id: 'microsoft-01',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Architect (Azure)',
    location: 'Redmond, WA',
    salary: 'USD 150k - 220k / yr',
    description: 'Lead the design and implementation of secure, scalable, and reliable cloud solutions on Azure.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Azure', 'Cloud', 'Architecture'],
    logoUrl: getLogoUrl('Microsoft'),
    contactEmail: 'azure-hiring@microsoft.com'
  },
];

export default function JobbeaglePage() {
  const [jobs] = useState<JobData[]>(INITIAL_JOBS);
  const [error, setError] = useState<string | null>(null);
  const [followedJobIds, setFollowedJobIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

  const handleError = (message: string) => {
    setError(message);
    // Auto-hide error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const handleFollowChange = (jobId: string, followed: boolean) => {
    setFollowedJobIds(prev => {
      const newSet = new Set(prev);
      if (followed) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  // Filter jobs based on active tab
  const displayedJobs = activeTab === 'following' 
    ? jobs.filter(job => followedJobIds.has(job.id))
    : jobs;

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[90vw]">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-100 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 h-full w-full relative">
        <VideoFeed 
          jobs={displayedJobs} 
          followedJobIds={followedJobIds}
          onFollowChange={handleFollowChange}
        />
      </div>

      {/* Top Bar (Overlay) */}
      <div className="absolute top-0 left-0 w-full p-4 z-30 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
         <div>
            <h1 className="text-white font-black text-2xl tracking-tighter drop-shadow-lg flex items-center gap-1">
                <span className="text-white">Job</span><span className="text-blue-600 dark:text-blue-500">beagle</span> <span className="text-white/80 text-lg font-normal">Shorts</span>
            </h1>
            <div className="flex gap-4 text-white/80 font-semibold text-sm mt-2 pointer-events-auto">
                <button
                  onClick={() => setActiveTab('foryou')}
                  className={`pb-1 transition-colors ${activeTab === 'foryou' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
                >
                  For You
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`pb-1 transition-colors ${activeTab === 'following' ? 'border-b-2 border-white opacity-100' : 'opacity-60 hover:opacity-80'}`}
                >
                  Following {followedJobIds.size > 0 && `(${followedJobIds.size})`}
                </button>
            </div>
         </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="h-16 bg-black border-t border-gray-900 flex flex-row items-center justify-around z-40 text-gray-400 pb-2">
        <button 
            className="flex flex-col items-center gap-1 p-2 text-white"
        >
            <Home size={24} strokeWidth={3} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <Briefcase size={24} />
            <span className="text-[10px] font-medium">Jobs</span>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-0 -right-0 animate-pulse"></div>
                <MessageCircle size={24} />
            </div>
            <span className="text-[10px] font-medium">Inbox</span>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
