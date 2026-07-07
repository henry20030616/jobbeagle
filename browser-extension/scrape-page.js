/**
 * Injected scrape bundle — runs in page context via chrome.scripting.executeScript.
 * Exposes window.__jobbeagleScrapePage() for the service worker.
 */
(function jobbeagleScrapeBundle() {
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

  function extractJobId(pageUrl) {
    const fromUrl =
      pageUrl.match(/view\/(\d+)/) ||
      pageUrl.match(/currentJobId=(\d+)/) ||
      pageUrl.match(/jobId=(\d+)/);
    if (fromUrl) return fromUrl[1];

    const linkSelectors = [
      '.jobs-search-results__list-item--active a[href*="/jobs/view/"]',
      '.job-card-list__entity-lockup--active a[href*="/jobs/view/"]',
      '.jobs-search-results-list__list-item--active a[href*="/jobs/view/"]',
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
      '[class*="jobs-details__container"]',
    ];
    for (let i = 0; i < containerSelectors.length; i++) {
      const el = document.querySelector(containerSelectors[i]);
      if (!el) continue;
      const hasJobSignal = el.querySelector(
        '[class*="job-title"], [class*="company-name"], [class*="jobs-description"], h1, h2',
      );
      if (hasJobSignal) return el;
    }
    return null;
  }

  function scrapeLinkedIn(pageUrl, documentTitle) {
    const detailRoot = findLinkedInDetailsRoot() || document;
    const scoped = detailRoot === document ? document : detailRoot;

    const title = firstText(scoped, [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      'h1.t-24',
      'h2.t-24',
      'main h1',
      'h1',
    ]);

    const company = firstText(scoped, [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '[data-test-job-details-company-name]',
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
      '[data-test-description-section]',
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
    const pageTitle = title && company ? title + ' | ' + company : title || documentTitle;

    const hasDetailPanel = !!findLinkedInDetailsRoot();
    const isFullView = /\/jobs\/view\/\d+/.test(pageUrl) || /currentJobId=\d+/.test(pageUrl);
    const isSearchWithSelection = hasDetailPanel && title.length > 2 && description.length > 40;

    if (!isFullView && !isSearchWithSelection && rawText.length < 40) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
      };
    }

    return {
      pageTitle,
      pageUrl,
      rawText,
      jobId: extractJobId(pageUrl),
    };
  }

  function scrape104(pageUrl, documentTitle) {
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
      jobId: extractJobId(pageUrl),
    };
  }

  function scrapeJobPage() {
    const pageUrl = window.location.href;
    const documentTitle = document.title;

    if (pageUrl.includes('104.com.tw')) {
      return scrape104(pageUrl, documentTitle);
    }
    if (pageUrl.includes('linkedin.com')) {
      return scrapeLinkedIn(pageUrl, documentTitle);
    }

    return {
      pageTitle: documentTitle,
      pageUrl,
      rawText: cleanText(document.body.innerText),
      jobId: extractJobId(pageUrl),
    };
  }

  window.__jobbeagleScrapePage = async function __jobbeagleScrapePage() {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return scrapeJobPage();
  };
})();
