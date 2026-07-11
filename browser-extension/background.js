/**
 * JobBeagle Chrome Extension v1.1.6
 * Scrape → POST /api/extension-capture → open pre-flight tab
 */

const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
const CAPTURE_API = `${WEBSITE_ORIGIN}/api/extension-capture`;
const LINKEDIN_ORIGINS = ['https://*.linkedin.com/*', 'https://www.linkedin.com/*'];

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
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
    return Boolean(await chrome.permissions.request({ origins }));
  } catch (e) {
    console.warn('[JobBeagle] permission request failed:', e);
    return true;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  const isLinkedIn = tab.url.includes('linkedin.com');
  const is104 = tab.url.includes('104.com.tw');

  if (!isLinkedIn && !is104) {
    await openPreFlight(null, 'no_job_page');
    return;
  }

  const allowed = await ensureHostAccess(tab.url);
  if (!allowed) {
    await openPreFlight(null, 'site_access');
    return;
  }

  try {
    // Wait briefly so LinkedIn right-pane DOM can settle
    await sleep(600);

    const result = await scrapeViaInjection(tab.id);

    if (!result || result.error === 'SCRAPE_SCRIPT_MISSING') {
      console.error('[JobBeagle] scrape script missing:', result);
      await openPreFlight(null, 'scrape_failed');
      return;
    }

    if (result.error === 'NOT_JOB_DETAIL') {
      await openPreFlight(null, 'not_job_detail');
      return;
    }

    if (result.error) {
      console.error('[JobBeagle] scrape error:', result);
      await openPreFlight(null, 'scrape_failed');
      return;
    }

    if (!result.rawText || result.rawText.trim().length < 40) {
      console.error('[JobBeagle] scrape too short:', result.rawText?.length, result._debug);
      await openPreFlight(null, 'scrape_failed');
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
      await openPreFlight(null, 'capture_failed');
      return;
    }

    await openPreFlight(captureData.sid, null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[JobBeagle] scrape failed:', msg);
    if (/cannot access|permission|denied|host/i.test(msg)) {
      await openPreFlight(null, 'site_access');
    } else {
      await openPreFlight(null, 'scrape_failed');
    }
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Two-step inject (Chrome forbids files+func in one call).
 * Uses sync scrape + JSON round-trip so the result always serializes.
 */
async function scrapeViaInjection(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['scrape-page.js'],
  });

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      try {
        if (typeof window.__jobbeagleScrapeSync !== 'function') {
          return JSON.stringify({ error: 'SCRAPE_SCRIPT_MISSING' });
        }
        const data = window.__jobbeagleScrapeSync();
        return JSON.stringify(data ?? { error: 'SCRAPE_EMPTY' });
      } catch (e) {
        return JSON.stringify({
          error: 'SCRAPE_RUNTIME',
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
  });

  const raw = results?.[0]?.result;
  if (raw == null) {
    throw new Error('Scrape returned empty (injection failed)');
  }
  if (typeof raw === 'string') {
    return JSON.parse(raw);
  }
  return raw;
}

/** Always open a normal tab — more reliable than Side Panel iframe */
async function openPreFlight(sid, errorKey) {
  const query = sid
    ? `?sid=${encodeURIComponent(sid)}`
    : errorKey
      ? `?error=${encodeURIComponent(errorKey)}`
      : '';

  await chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/pre-flight${query}` });
}
