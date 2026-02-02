import React, { useState } from 'react';
import VideoFeed from './components/VideoFeed';
import CreatorStudio from './components/CreatorStudio';
import { INITIAL_JOBS } from './constants';
import { JobData, AppMode } from './types';
import { Home, PlusSquare, User, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FEED);
  const [jobs, setJobs] = useState<JobData[]>(INITIAL_JOBS);

  const handleJobCreated = (newJob: JobData) => {
    setJobs([newJob, ...jobs]);
    setMode(AppMode.FEED);
  };

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Main Content Area */}
      <div className="flex-1 h-full w-full relative">
        {mode === AppMode.FEED ? (
            <VideoFeed jobs={jobs} />
        ) : (
            <CreatorStudio onJobCreated={handleJobCreated} />
        )}
      </div>

      {/* Top Bar (Overlay) - Only visible on Feed for branding */}
      {mode === AppMode.FEED && (
          <div className="absolute top-0 left-0 w-full p-4 z-30 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
             <div>
                <h1 className="text-white font-black text-2xl tracking-tighter drop-shadow-lg flex items-center gap-1">
                    <span className="text-cyan-400">Job</span>Live
                </h1>
                <div className="flex gap-4 text-white/80 font-semibold text-sm mt-2 pointer-events-auto">
                    <span className="border-b-2 border-white pb-1">For You</span>
                    <span className="opacity-60">Following</span>
                </div>
             </div>
             <div className="pointer-events-auto">
                {/* Search Icon Placeholder */}
             </div>
          </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="h-16 bg-black border-t border-gray-900 flex flex-row items-center justify-around z-40 text-gray-400 pb-2">
        <button 
            className={`flex flex-col items-center gap-1 p-2 ${mode === AppMode.FEED ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setMode(AppMode.FEED)}
        >
            <Home size={24} strokeWidth={mode === AppMode.FEED ? 3 : 2} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <Briefcase size={24} />
            <span className="text-[10px] font-medium">Jobs</span>
        </button>

        <button 
            className="flex flex-col items-center justify-center -mt-6"
            onClick={() => setMode(AppMode.CREATOR)}
        >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 border-2 border-black transition-transform active:scale-95">
                <PlusSquare size={24} fill="currentColor" className="text-white" />
            </div>
        </button>

        <button 
             className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-gray-300"
        >
            <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-0 -right-0 animate-pulse"></div>
                <MessageCircleIcon size={24} />
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
};

// Helper for icon consistency in this file
const MessageCircleIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);

export default App;