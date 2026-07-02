'use client';

import React from 'react';
import { InterviewReport } from '@/types';
import { AppLanguage } from '@/lib/language-context';
import ReportPager from './report/ReportPager';
import { buildSlides } from './report/slides';

export { BeagleIcon, cleanText, getScoreInfo, SafeContentList } from './report/report-shared';

interface DashboardProps {
  data: InterviewReport;
  language?: AppLanguage;
}

const AnalysisDashboard: React.FC<DashboardProps> = ({ data, language = 'en' }) => {
  const { slides, labels } = buildSlides(data, language);

  return (
    <div className="animate-fade-in mx-auto mb-20 max-w-5xl px-2 md:px-4">
      <ReportPager labels={labels}>{slides}</ReportPager>
    </div>
  );
};

export default AnalysisDashboard;
