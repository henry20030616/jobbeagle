/**
 * JobBeagle Chrome Extension v1.1
 * Scrape → POST /api/extension-capture → Side Panel (or tab) pre-flight
 */

const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
// Dev: const WEBSITE_ORIGIN = 'http://localhost:3000';

const CAPTURE_API = `${WEBSITE_ORIGIN}/api/extension-capture`;

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  const isLinkedIn = tab.url.includes('linkedin.com/jobs');
  const is104 = tab.url.includes('104.com.tw/job/');

  if (!isLinkedIn && !is104) {
    await openPreFlight(tab.id, null, 'no_job_page');
    return;
  }

  try {
    // files + func 必須在同一次 executeScript，否則第二次注入拿不到 __jobbeagleScrapePage
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scrape-page.js'],
      func: async () => {
        if (typeof window.__jobbeagleScrapePage !== 'function') {
          return { error: 'SCRAPE_SCRIPT_MISSING' };
        }
        return window.__jobbeagleScrapePage();
      },
    });

    const result = results?.[0]?.result;
    if (!result || result.error === 'SCRAPE_SCRIPT_MISSING') {
      console.error('[JobBeagle] scrape script not injected:', result);
      await openPreFlight(tab.id, null, 'scrape_failed');
      return;
    }

    if (result.error === 'NOT_JOB_DETAIL') {
      await openPreFlight(tab.id, null, 'not_job_detail');
      return;
    }

    if (!result.rawText || result.rawText.trim().length < 40) {
      await openPreFlight(tab.id, null, 'scrape_failed');
      return;
    }

    const captureRes = await fetch(CAPTURE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageTitle: result.pageTitle,
        pageUrl: result.pageUrl,
        rawText: result.rawText,
        jobId: result.jobId,
      }),
    });

    const captureData = await captureRes.json().catch(() => ({}));

    if (!captureRes.ok || !captureData.sid) {
      console.error('[JobBeagle] capture API failed:', captureRes.status, captureData);
      await openPreFlight(tab.id, null, 'capture_failed');
      return;
    }

    await openPreFlight(tab.id, captureData.sid, null);
  } catch (err) {
    console.error('[JobBeagle] scrape failed:', err);
    await openPreFlight(tab.id, null, 'scrape_failed');
  }
});

async function openPreFlight(tabId, sid, errorKey) {
  const query = sid
    ? `?sid=${encodeURIComponent(sid)}`
    : errorKey
      ? `?error=${encodeURIComponent(errorKey)}`
      : '';

  const sidePanelPath = sid
    ? `sidepanel.html?sid=${encodeURIComponent(sid)}`
    : errorKey
      ? `sidepanel.html?error=${encodeURIComponent(errorKey)}`
      : 'sidepanel.html';

  try {
    if (chrome.sidePanel?.setOptions && chrome.sidePanel?.open) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: sidePanelPath,
        enabled: true,
      });
      await chrome.sidePanel.open({ tabId });
      return;
    }
  } catch (e) {
    console.warn('[JobBeagle] side panel unavailable, opening tab:', e);
  }

  chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/pre-flight${query}` });
}
