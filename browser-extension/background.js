/**
 * JobBeagle Chrome Extension — Unified Master Spec 2026
 * Read-only fuzzy text scrape → pre-flight handoff (zero DOM injection)
 */

const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
// Dev: const WEBSITE_ORIGIN = 'http://localhost:3000';

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  const isLinkedIn = tab.url.includes('linkedin.com/jobs');
  const is104 = tab.url.includes('104.com.tw/job/');

  if (!isLinkedIn && !is104) {
    chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/pre-flight` });
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJobPage,
    });

    if (!results || !results[0]?.result) return;

    const result = results[0].result;

    if (result.error === 'NOT_JOB_DETAIL') {
      chrome.tabs.create({
        url: `${WEBSITE_ORIGIN}/pre-flight?error=not_job_detail`,
      });
      return;
    }

    if (!result.rawText || result.rawText.trim().length < 40) {
      chrome.tabs.create({
        url: `${WEBSITE_ORIGIN}/pre-flight?error=scrape_failed`,
      });
      return;
    }

    const { pageTitle, pageUrl, rawText, jobId } = result;
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      pageTitle,
      pageUrl,
      rawText,
      jobId,
    }))));

    chrome.tabs.create({
      url: `${WEBSITE_ORIGIN}/pre-flight?payload=${encodeURIComponent(payload)}`,
    });
  } catch (err) {
    console.error('[JobBeagle] scrape failed:', err);
    chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/pre-flight?error=scrape_failed` });
  }
});

function scrapeJobPage() {
  const pageTitle = document.title;
  const pageUrl = window.location.href;

  const jobIdMatch =
    pageUrl.match(/view\/(\d+)/) ||
    pageUrl.match(/currentJobId=(\d+)/) ||
    pageUrl.match(/job\/([^/?]+)/);

  const jobId = jobIdMatch ? jobIdMatch[1] : 'unknown';

  const isLinkedInDetail =
    /\/jobs\/view\/\d+/.test(pageUrl) ||
    /currentJobId=\d+/.test(pageUrl);

  if (pageUrl.includes('linkedin.com/jobs') && !isLinkedInDetail) {
    return { error: 'NOT_JOB_DETAIL', pageTitle, pageUrl, rawText: '', jobId };
  }

  let rawText = '';

  if (pageUrl.includes('104.com.tw')) {
    const title =
      document.querySelector('.job-header__title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() || '';
    const company =
      document.querySelector('.job-header__company-name')?.textContent?.trim() ||
      document.querySelector('[data-qa="company-name"]')?.textContent?.trim() || '';
    const salary =
      document.querySelector('.job-header__salary')?.textContent?.trim() ||
      document.querySelector('[data-qa="salary"]')?.textContent?.trim() || '';
    const location =
      document.querySelector('.job-header__location')?.textContent?.trim() || '';
    const description =
      document.querySelector('.job-description')?.textContent?.trim() ||
      document.querySelector('[data-qa="job-description"]')?.textContent?.trim() || '';
    const requirements =
      document.querySelector('.job-requirement')?.textContent?.trim() ||
      document.querySelector('[data-qa="job-requirement"]')?.textContent?.trim() || '';

    const parts = [];
    if (title) parts.push(`職位：${title}`);
    if (company) parts.push(`公司：${company}`);
    if (salary) parts.push(`薪資：${salary}`);
    if (location) parts.push(`地點：${location}`);
    if (description) parts.push(`職缺描述：\n${description}`);
    if (requirements) parts.push(`職務要求：\n${requirements}`);
    rawText = parts.join('\n\n');
  } else if (pageUrl.includes('linkedin.com')) {
    const title =
      document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
      document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() || '';
    const company =
      document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
      document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim() ||
      document.querySelector('[data-test-job-details-company-name]')?.textContent?.trim() ||
      document.querySelector('a[href*="/company/"]')?.textContent?.trim() || '';
    const location =
      document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim() ||
      document.querySelector('.jobs-unified-top-card__bullet')?.textContent?.trim() || '';
    const description =
      document.querySelector('.jobs-description__content')?.textContent?.trim() ||
      document.querySelector('.jobs-box__html-content')?.textContent?.trim() ||
      document.querySelector('#job-details')?.textContent?.trim() ||
      document.querySelector('[class*="jobs-description"]')?.textContent?.trim() || '';

    const parts = [];
    if (title) parts.push(`職位：${title}`);
    if (company) parts.push(`公司：${company}`);
    if (location) parts.push(`地點：${location}`);
    if (description) parts.push(`職缺描述：\n${description}`);
    rawText = parts.join('\n\n');

    if (!rawText.trim()) {
      rawText = document.body.innerText || '';
    }
  } else {
    rawText = document.body.innerText || '';
  }

  return { pageTitle, pageUrl, rawText, jobId };
}
