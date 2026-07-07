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
      func: scrapeJobPageWithWait,
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

/** Wait for LinkedIn lazy-loaded job detail panel, then scrape */
async function scrapeJobPageWithWait() {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return scrapeJobPage();
}

function scrapeJobPage() {
  const pageUrl = window.location.href;
  const documentTitle = document.title;

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function firstText(root, selectors) {
    for (let i = 0; i < selectors.length; i++) {
      const nodes = root.querySelectorAll(selectors[i]);
      for (let j = 0; j < nodes.length; j++) {
        const text = cleanText(nodes[j].textContent);
        if (text.length > 1 && !/^linkedin$/i.test(text)) return text;
      }
    }
    return '';
  }

  function extractJobId() {
    const fromUrl =
      pageUrl.match(/view\/(\d+)/) ||
      pageUrl.match(/currentJobId=(\d+)/) ||
      pageUrl.match(/jobId=(\d+)/);
    if (fromUrl) return fromUrl[1];

    const linkSelectors = [
      '.jobs-search-results__list-item--active a[href*="/jobs/view/"]',
      '.job-card-list__entity-lockup--active a[href*="/jobs/view/"]',
      '.jobs-search__job-details a[href*="/jobs/view/"]',
      '.scaffold-layout__detail a[href*="/jobs/view/"]',
      'a[href*="/jobs/view/"]',
    ];
    for (let i = 0; i < linkSelectors.length; i++) {
      const link = document.querySelector(linkSelectors[i]);
      if (link && link.href) {
        const m = link.href.match(/view\/(\d+)/);
        if (m) return m[1];
      }
    }
    return 'unknown';
  }

  function findLinkedInDetailsRoot() {
    const containerSelectors = [
      '.jobs-search__job-details',
      '.jobs-search__right-rail',
      '.scaffold-layout__detail',
      '.jobs-details',
      '.jobs-details__main-content',
      'div[data-job-details]',
      '[class*="jobs-search__job-details"]',
    ];
    for (let i = 0; i < containerSelectors.length; i++) {
      const el = document.querySelector(containerSelectors[i]);
      if (!el) continue;
      const hasJobSignal =
        el.querySelector('[class*="job-title"], [class*="company-name"], [class*="jobs-description"], h1, h2');
      if (hasJobSignal) return el;
    }
    return null;
  }

  function scrapeLinkedIn() {
    const detailRoot = findLinkedInDetailsRoot() || document;
    const scoped = detailRoot === document ? document : detailRoot;

    const title = firstText(scoped, [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      'h2.t-24',
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      'main h1',
      'h1',
    ]);

    const company = firstText(scoped, [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container',
      '[data-test-job-details-company-name]',
      'a[href*="/company/"]',
    ]);

    const location = firstText(scoped, [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container',
    ]);

    let description = firstText(scoped, [
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.jobs-description-content__text',
      '#job-details',
      '[class*="jobs-description__content"]',
      '[class*="jobs-description-content"]',
      'article[class*="jobs-description"]',
    ]);

    if (description.length < 80 && scoped !== document) {
      const panelText = cleanText(scoped.innerText);
      if (panelText.length > description.length) description = panelText;
    }

    if (description.length < 80) {
      const mainDetail = document.querySelector('.scaffold-layout__detail');
      if (mainDetail) {
        const mainText = cleanText(mainDetail.innerText);
        if (mainText.length > description.length) description = mainText;
      }
    }

    const parts = [];
    if (title) parts.push('職位：' + title);
    if (company) parts.push('公司：' + company);
    if (location && location !== company) parts.push('地點：' + location);
    if (description) parts.push('職缺描述：\n' + description);

    const rawText = parts.join('\n\n');
    const pageTitle = title && company
      ? title + ' | ' + company
      : title || documentTitle;

    const hasDetailPanel = !!findLinkedInDetailsRoot();
    const isFullView = /\/jobs\/view\/\d+/.test(pageUrl) || /currentJobId=\d+/.test(pageUrl);
    const isSearchWithSelection = hasDetailPanel && title.length > 2 && description.length > 40;

    if (!isFullView && !isSearchWithSelection && rawText.length < 40) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(),
      };
    }

    return {
      pageTitle,
      pageUrl,
      rawText,
      jobId: extractJobId(),
    };
  }

  function scrape104() {
    const title =
      cleanText(document.querySelector('.job-header__title')?.textContent) ||
      cleanText(document.querySelector('h1')?.textContent);
    const company =
      cleanText(document.querySelector('.job-header__company-name')?.textContent) ||
      cleanText(document.querySelector('[data-qa="company-name"]')?.textContent);
    const salary =
      cleanText(document.querySelector('.job-header__salary')?.textContent) ||
      cleanText(document.querySelector('[data-qa="salary"]')?.textContent);
    const location = cleanText(document.querySelector('.job-header__location')?.textContent);
    const description =
      cleanText(document.querySelector('.job-description')?.textContent) ||
      cleanText(document.querySelector('[data-qa="job-description"]')?.textContent);
    const requirements =
      cleanText(document.querySelector('.job-requirement')?.textContent) ||
      cleanText(document.querySelector('[data-qa="job-requirement"]')?.textContent);

    const parts = [];
    if (title) parts.push('職位：' + title);
    if (company) parts.push('公司：' + company);
    if (salary) parts.push('薪資：' + salary);
    if (location) parts.push('地點：' + location);
    if (description) parts.push('職缺描述：\n' + description);
    if (requirements) parts.push('職務要求：\n' + requirements);

    return {
      pageTitle: title && company ? title + ' | ' + company : documentTitle,
      pageUrl,
      rawText: parts.join('\n\n'),
      jobId: extractJobId(),
    };
  }

  if (pageUrl.includes('104.com.tw')) {
    return scrape104();
  }
  if (pageUrl.includes('linkedin.com')) {
    return scrapeLinkedIn();
  }

  return {
    pageTitle: documentTitle,
    pageUrl,
    rawText: cleanText(document.body.innerText),
    jobId: extractJobId(),
  };
}
