/** Chrome extension scrape failures → homepage /confirm `?error=` keys */

export const EXTENSION_SCRAPE_ERRORS = {
  not_job_detail: {
    'zh-TW':
      '請先在左側列表點選一個職缺，等右側詳情出現後再點外掛；或點「在新分頁中查看」/ 職缺標題進入完整頁面。',
    en: 'Select a job in the left list and wait for details on the right, or open the job in a full page before clicking the extension.',
  },
  scrape_failed: {
    'zh-TW':
      '職缺內容抓取失敗或太短。請在右側職缺詳情載入完成後再點外掛；或點「在新分頁中查看」打開完整職缺頁後再試。',
    en: 'Job scrape failed or content too short. Wait for the job detail panel to load, or open the job in a new tab and try again.',
  },
  capture_failed: {
    'zh-TW':
      '已抓到職缺，但傳送到 JobBeagle 伺服器失敗。請稍後再試，或到 chrome://extensions 點 JobBeagle 的「Service Worker」查看錯誤。',
    en: 'Job was scraped but server handoff failed. Retry later or inspect the extension service worker console.',
  },
  site_access: {
    'zh-TW':
      'Chrome 未允許外掛存取此職缺網站。請到 chrome://extensions → JobBeagle →「網站存取權限」→ 打開對應網站（LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs），或選「在所有網站上」。',
    en: 'Chrome blocked site access. Open chrome://extensions → JobBeagle → enable site access for LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs.',
  },
  /** Kept for sidepanel / confirm; homepage ignores this key (paste JD instead). */
  no_job_page: {
    'zh-TW':
      '此頁面不在支援清單。目前支援：LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs（與台灣 104）。請在職缺詳情頁再點外掛。',
    en: 'This page is not supported. Supported: LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs (and Taiwan 104). Open a job detail page and try again.',
  },
} as const;

export type ExtensionScrapeErrorKey = keyof typeof EXTENSION_SCRAPE_ERRORS;

export function getExtensionScrapeError(
  key: string,
  language: string,
): string | null {
  if (!(key in EXTENSION_SCRAPE_ERRORS)) return null;
  const entry = EXTENSION_SCRAPE_ERRORS[key as ExtensionScrapeErrorKey];
  return language === 'zh-TW' || language === 'zh-CN' ? entry['zh-TW'] : entry.en;
}
