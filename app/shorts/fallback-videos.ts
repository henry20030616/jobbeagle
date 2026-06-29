/**
 * Fallback videos shown when the database has no published jobs yet.
 * Replace videoUrl and job details with real content for production.
 */

import type { JobData } from '@/types';

function getLogoUrl(companyName: string): string {
  const domain = companyName.toLowerCase().replace(/\s+/g, '');
  return `https://www.google.com/s2/favicons?domain=${domain}.com&sz=128`;
}

export const FALLBACK_VIDEOS: JobData[] = [
  {
    id: 'demo-1',
    companyName: 'Demo Corp',
    jobTitle: 'Software Engineer',
    location: 'Remote',
    salary: 'Competitive',
    description: 'Sample job listing — replace with real published videos from your database.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Demo', 'Engineering'],
    logoUrl: getLogoUrl('Demo Corp'),
    contactEmail: 'careers@demo.com',
  },
  {
    id: 'demo-2',
    companyName: 'Sample Inc',
    jobTitle: 'Product Designer',
    location: 'Hybrid · Taipei',
    salary: 'DOE',
    description: 'Placeholder feed item. Upload your first job video to replace this demo content.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['Demo', 'Design'],
    logoUrl: getLogoUrl('Sample Inc'),
    contactEmail: 'hello@sample.com',
  },
];
