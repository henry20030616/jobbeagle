/**
 * JobBeagle Chrome Extension v1.3.0
 * US boards: LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs (+ 104 TW)
 * Scrape → POST /api/extension-capture → open /confirm tab
 */

const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
const CAPTURE_API = `${WEBSITE_ORIGIN}/api/extension-capture`;

/** hostname substring → origins to request */
const SITE_ORIGINS = {
  'linkedin.com': ['https://*.linkedin.com/*', 'https://www.linkedin.com/*'],
  'indeed.com': ['https://*.indeed.com/*', 'https://www.indeed.com/*'],
  'ziprecruiter.com': ['https://*.ziprecruiter.com/*', 'https://www.ziprecruiter.com/*'],
  'glassdoor.com': ['https://*.glassdoor.com/*', 'https://www.glassdoor.com/*'],
  'governmentjobs.com': [
    'https://*.governmentjobs.com/*',
    'https://www.governmentjobs.com/*',
    'https://*.schooljobs.com/*',
    'https://www.schooljobs.com/*',
  ],
  '104.com.tw': ['https://*.104.com.tw/*', 'https://www.104.com.tw/*'],
};

function detectSite(url) {
  const u = (url || '').toLowerCase();
  if (u.includes('linkedin.com')) return 'linkedin.com';
  if (u.includes('indeed.com')) return 'indeed.com';
  if (u.includes('ziprecruiter.com')) return 'ziprecruiter.com';
  if (u.includes('glassdoor.com')) return 'glassdoor.com';
  if (u.includes('governmentjobs.com') || u.includes('schooljobs.com')) {
    return 'governmentjobs.com';
  }
  if (u.includes('104.com.tw')) return '104.com.tw';
  return null;
}

chrome.runtime.onInstalled.addListener(() => {});

async function ensureHostAccess(tabUrl) {
  const site = detectSite(tabUrl);
  if (!site) return true;
  const origins = SITE_ORIGINS[site];
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

  const site = detectSite(tab.url);
  if (!site) {
    await openPreFlight(null, 'no_job_page');
    return;
  }

  const allowed = await ensureHostAccess(tab.url);
  if (!allowed) {
    await openPreFlight(null, 'site_access');
    return;
  }

  try {
    // Split-pane / SPA boards need a moment after selection
    const waitMs =
      site === 'linkedin.com' || site === 'indeed.com' || site === 'governmentjobs.com'
        ? 1500
        : 800;
    await sleep(waitMs);

    const result = await scrapeViaInjection(tab.id);
    console.log('[JobBeagle] scrape result:', JSON.stringify(result?._debug || result));

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
      console.error('[JobBeagle] scrape error:', JSON.stringify(result));
      await openPreFlight(null, 'scrape_failed');
      return;
    }

    if (!result.rawText || result.rawText.trim().length < 40) {
      console.error(
        '[JobBeagle] scrape too short:',
        result.rawText?.length ?? 0,
        JSON.stringify(result._debug || {}),
      );
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
        jobTitle: result.jobTitle || undefined,
        companyName: result.companyName || undefined,
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

async function openPreFlight(sid, errorKey) {
  const query = sid
    ? `?sid=${encodeURIComponent(sid)}`
    : errorKey
      ? `?error=${encodeURIComponent(errorKey)}`
      : '';

  await chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/confirm${query}` });
}
