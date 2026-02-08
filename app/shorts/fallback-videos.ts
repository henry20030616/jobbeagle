/**
 * Jobbeagle Shorts - 預設／後備影片（當資料庫沒有影片時顯示）
 *
 * 替換方式：把下面 4 筆的影片網址與職缺資訊改成你的真實影片與內容即可。
 * - videoUrl：必填，影片的實際網址（建議使用直連、可公開存取的 MP4 連結）
 * - companyName、jobTitle、description：建議填真實職缺資訊
 * - 其餘欄位可依需要填寫或留空
 */

import type { JobData } from '@/types';

function getLogoUrl(companyName: string): string {
  const domain = companyName.toLowerCase().replace(/\s+/g, '');
  return `https://www.google.com/s2/favicons?domain=${domain}.com&sz=128`;
}

export const FALLBACK_VIDEOS: JobData[] = [
  {
    id: 'video-1',
    companyName: '公司名稱 A',
    jobTitle: '職缺標題 A',
    location: '工作地點',
    salary: '薪資範圍（可選）',
    description: '職缺說明：請替換成真實的職位描述。',
    videoUrl: 'https://你的影片網址-1.mp4',
    tags: ['標籤1', '標籤2'],
    logoUrl: getLogoUrl('公司名稱 A'),
    contactEmail: 'contact@company.com',
  },
  {
    id: 'video-2',
    companyName: '公司名稱 B',
    jobTitle: '職缺標題 B',
    location: '工作地點',
    salary: '薪資範圍（可選）',
    description: '職缺說明：請替換成真實的職位描述。',
    videoUrl: 'https://你的影片網址-2.mp4',
    tags: ['標籤1', '標籤2'],
    logoUrl: getLogoUrl('公司名稱 B'),
    contactEmail: 'contact@company.com',
  },
  {
    id: 'video-3',
    companyName: '公司名稱 C',
    jobTitle: '職缺標題 C',
    location: '工作地點',
    salary: '薪資範圍（可選）',
    description: '職缺說明：請替換成真實的職位描述。',
    videoUrl: 'https://你的影片網址-3.mp4',
    tags: ['標籤1', '標籤2'],
    logoUrl: getLogoUrl('公司名稱 C'),
    contactEmail: 'contact@company.com',
  },
  {
    id: 'video-4',
    companyName: '公司名稱 D',
    jobTitle: '職缺標題 D',
    location: '工作地點',
    salary: '薪資範圍（可選）',
    description: '職缺說明：請替換成真實的職位描述。',
    videoUrl: 'https://你的影片網址-4.mp4',
    tags: ['標籤1', '標籤2'],
    logoUrl: getLogoUrl('公司名稱 D'),
    contactEmail: 'contact@company.com',
  },
];
