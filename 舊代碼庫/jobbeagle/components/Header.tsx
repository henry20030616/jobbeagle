
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BeagleIcon } from './AnalysisDashboard';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-1 rounded-lg">
              <BeagleIcon className="h-10 w-10 drop-shadow-sm" color="#cbd5e1" spotColor="#5d4037" bellyColor="#475569" />
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 mr-2">
                Jobbeagle
              </h1>
              <span className="text-xs font-normal text-slate-500">
                (職位分析米格魯)
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-1 text-sm text-amber-400 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-500/20">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Pro Analysis</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
