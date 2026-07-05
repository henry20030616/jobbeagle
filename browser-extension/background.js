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

    const { pageTitle, pageUrl, rawText, jobId } = results[0].result;
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      pageTitle,
      pageUrl,
      rawText,
      jobId,
    }))));

    chrome.tabs.create({
      url: `${WEBSITE_ORIGIN}/pre-flight?payload=${payload}`,
    });
  } catch (err) {
    console.error('[JobBeagle] scrape failed:', err);
    chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/pre-flight` });
  }
});

function scrapeJobPage() {
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  const rawText = document.body.innerText;

  const jobIdMatch =
    pageUrl.match(/view\/(\d+)/) ||
    pageUrl.match(/currentJobId=(\d+)/) ||
    pageUrl.match(/job\/([^/?]+)/);

  const jobId = jobIdMatch ? jobIdMatch[1] : 'unknown';

  return { pageTitle, pageUrl, rawText, jobId };
}
