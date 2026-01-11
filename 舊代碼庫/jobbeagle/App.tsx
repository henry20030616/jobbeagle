
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import AnalysisDashboard from './components/AnalysisDashboard';
import { generateAnalysis } from './services/geminiService';
import { InterviewReport, UserInputs } from './types';
import { ChevronLeft } from 'lucide-react';

interface SavedReport {
  id: string;
  timestamp: number;
  report: InterviewReport;
}

const App: React.FC = () => {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [reportHistory, setReportHistory] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('reportHistory');
      if (stored) {
        setReportHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load report history", e);
    }
  }, []);

  const saveReportToHistory = (newReport: InterviewReport) => {
    const entry: SavedReport = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      report: newReport
    };
    const updatedHistory = [entry, ...reportHistory].slice(0, 10); // Keep last 10
    setReportHistory(updatedHistory);
    try {
      localStorage.setItem('reportHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save report history", e);
    }
  };

  const handleGenerate = async (inputs: UserInputs) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAnalysis(inputs);
      setReport(result);
      saveReportToHistory(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "發生未知錯誤，無法完成分析，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (selected: SavedReport) => {
    setReport(selected.report);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center animate-pulse">
             <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             {error}
          </div>
        )}

        {!report ? (
          <div className="max-w-6xl mx-auto animate-fade-in">
             <InputForm 
              onSubmit={handleGenerate} 
              isLoading={loading} 
              reportHistory={reportHistory}
              onSelectHistory={handleSelectHistory}
             />
          </div>
        ) : (
          <div>
            <button 
              onClick={handleReset}
              className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回首頁
            </button>
            <AnalysisDashboard data={report} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
