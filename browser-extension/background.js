/**
 * JobBeagle Chrome Extension v1.1.5
 * Scrape → POST /api/extension-capture → Side Panel (or tab) pre-flight
 */

const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
// Dev: const WEBSITE_ORIGIN = 'http://localhost:3000';

const CAPTURE_API = `${WEBSITE_ORIGIN}/api/extension-capture`;
const LINKEDIN_ORIGINS = ['https://*.linkedin.com/*', 'https://www.linkedin.com/*'];

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});

async function ensureHostAccess(tabUrl) {
  if (!tabUrl.includes('linkedin.com') && !tabUrl.includes('104.com.tw')) {
    return true;
  }
  const origins = tabUrl.includes('linkedin.com')
    ? LINKEDIN_ORIGINS
    : ['https://*.104.com.tw/*', 'https://www.104.com.tw/*'];

  try {
    const has = await chrome.permissions.contains({ origins });
    if (has) return true;
    return chrome.permissions.request({ origins });
  } catch (e) {
    console.warn('[JobBeagle] permission request failed:', e);
    return true;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  const isLinkedIn = tab.url.includes('linkedin.com');
  const is104 = tab.url.includes('104.com.tw/job/');

  if (!isLinkedIn && !is104) {
    await openPreFlight(tab.id, null, 'no_job_page');
    return;
  }

  const allowed = await ensureHostAccess(tab.url);
  if (!allowed) {
    await openPreFlight(tab.id, null, 'site_access');
    return;
  }

  try {
    const result = await scrapeViaInjection(tab.id);

    if (!result || result.error === 'SCRAPE_SCRIPT_MISSING') {
      console.error('[JobBeagle] scrape script missing:', result);
      await openPreFlight(tab.id, null, 'scrape_failed');
      return;
    }

    if (result.error === 'NOT_JOB_DETAIL') {
      await openPreFlight(tab.id, null, 'not_job_detail');
      return;
    }

    if (!result.rawText || result.rawText.trim().length < 40) {
      console.error('[JobBeagle] scrape too short:', result.rawText?.length, result._debug);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[JobBeagle] scrape failed:', msg);
    if (/cannot access|permission|denied/i.test(msg)) {
      await openPreFlight(tab.id, null, 'site_access');
    } else {
      await openPreFlight(tab.id, null, 'scrape_failed');
    }
  }
});

/** Load scrape bundle then invoke (files+func forbidden in one call; two calls OK) */
async function scrapeViaInjection(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['scrape-page.js'],
  });

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if (typeof window.__jobbeagleScrapePage !== 'function') {
        return { error: 'SCRAPE_SCRIPT_MISSING' };
      }
      return await window.__jobbeagleScrapePage();
    },
  });

  return results?.[0]?.result;
}

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
