/**
 * JobBeagle scrape bundle — keep this resilient; prefer fallbacks over cleverness.
 */
(function jobbeagleScrapeBundle() {
  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  /** Keep line breaks for JD readability */
  function blockText(value) {
    return (value || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t\f\v]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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

  function firstBlockText(root, selectors, minLen) {
    const min = minLen || 40;
    let best = '';
    for (let i = 0; i < selectors.length; i++) {
      const nodes = root.querySelectorAll(selectors[i]);
      for (let j = 0; j < nodes.length; j++) {
        const text = blockText(nodes[j].innerText || nodes[j].textContent);
        if (text.length > best.length) best = text;
      }
    }
    return best.length >= min ? best : best;
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
      '.jobs-search__job-details--container',
      '.jobs-search__job-details',
      '.jobs-details',
      '.job-view-layout',
      '.scaffold-layout__detail',
      '.jobs-search__right-rail',
      '.jobs-details__main-content',
      'div[data-job-details]',
      '[data-view-name="job-details"]',
      '[class*="jobs-search__job-details"]',
      '[class*="jobs-details__container"]',
      'main',
    ];
    for (let i = 0; i < containerSelectors.length; i++) {
      const el = document.querySelector(containerSelectors[i]);
      if (!el) continue;
      const len = cleanText(el.innerText).length;
      const hasJobSignal = el.querySelector(
        '[class*="job-title"], [class*="company-name"], [class*="jobs-description"], #job-details, h1, h2',
      );
      if (hasJobSignal || len > 300) return el;
    }
    return null;
  }

  /** Largest visible job-like text block (works for split-pane AND full /jobs/view) */
  function scrapeLargestJobBlock() {
    const vw = window.innerWidth || 1200;
    let best = '';
    const nodes = document.querySelectorAll('div, section, article, main');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const rect = el.getBoundingClientRect();
      if (rect.width < 240 || rect.height < 120) continue;
      // Skip tiny left rail cards; allow full-page content that starts near left
      if (rect.width < vw * 0.35 && rect.left < vw * 0.2) continue;
      const text = blockText(el.innerText || '');
      if (text.length <= best.length || text.length < 200) continue;
      if (!/Apply|Easy Apply|套用|儲存|儲存職缺|分享|Save|關於該職缺|About the job|Job Description/i.test(text)) {
        continue;
      }
      if (/符合.*的職缺|jobs search|搜尋結果/i.test(text.slice(0, 100))) continue;
      best = text;
    }
    return best;
  }

  function parseTitleCompanyFromPanel(panelText, scoped) {
    let title = firstText(scoped, [
      '.job-details-jobs-unified-top-card__job-title a',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title a',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card h1 a',
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      'h1.t-24',
      'h2.t-24',
      'main h1',
      'h1',
    ]);
    let company = firstText(scoped, [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '[data-test-job-details-company-name]',
    ]);

    if ((!title || !company) && panelText) {
      const lines = panelText.split('\n').map((l) => l.trim()).filter(Boolean);
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const line = lines[i];
        if (line.length < 3 || line.length > 160) continue;
        if (/Apply|Save|Share|儲存|分享|Easy Apply|套用|Premium|關於該職缺|About the job/i.test(line)) {
          continue;
        }
        if (!title) {
          title = line;
          continue;
        }
        if (!company && line !== title && !/^\d|ago|前|·|申請人|applicants/i.test(line)) {
          company = line;
          break;
        }
      }
    }

    return { title: title || '', company: company || '' };
  }

  function scrapeLinkedIn(pageUrl, documentTitle) {
    const detailRoot = findLinkedInDetailsRoot();
    const scoped = detailRoot || document;
    let panelText = detailRoot ? blockText(detailRoot.innerText) : '';

    let description = firstBlockText(scoped, [
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.jobs-description-content__text',
      '.jobs-description',
      '#job-details',
      '[class*="jobs-description__content"]',
      '[class*="jobs-description-content"]',
      'article[class*="jobs-description"]',
      '[data-test-description-section]',
    ], 40);

    if (description.length < 80 && panelText.length > description.length) {
      description = panelText;
    }

    if (description.length < 120) {
      const largest = scrapeLargestJobBlock();
      if (largest.length > description.length) {
        description = largest;
        if (!panelText) panelText = largest;
      }
    }

    // Last resort: whole page text (still better than empty)
    if (description.length < 120) {
      const bodyText = blockText(document.body ? document.body.innerText : '');
      if (bodyText.length > description.length) description = bodyText;
    }

    const { title, company } = parseTitleCompanyFromPanel(panelText || description, scoped);

    const location = firstText(scoped, [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__tertiary-description-container',
    ]);

    const parts = [];
    if (title) parts.push('職位：' + title);
    if (company) parts.push('公司：' + company);
    if (location && location !== company) parts.push('地點：' + location);
    if (description) parts.push('職缺描述：\n' + description);

    const rawText = parts.join('\n\n');
    const pageTitle = title && company ? title + ' | ' + company : title || documentTitle;

    const isJobUrl =
      /\/jobs\/view\/\d+/.test(pageUrl) ||
      /currentJobId=\d+/.test(pageUrl) ||
      /\/jobs\/collections\//.test(pageUrl);
    const hasEnough = rawText.length >= 40 && (title.length > 2 || description.length > 120);

    if (!isJobUrl && !hasEnough) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
        _debug: {
          descLen: description.length,
          titleLen: title.length,
          hasRoot: !!detailRoot,
          bodyLen: (document.body && document.body.innerText || '').length,
        },
      };
    }

    return {
      pageTitle,
      pageUrl,
      rawText,
      jobId: extractJobId(pageUrl),
      _debug: {
        descLen: description.length,
        titleLen: title.length,
        companyLen: company.length,
        hasRoot: !!detailRoot,
        rawLen: rawText.length,
      },
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
      blockText(document.querySelector('.job-description')?.innerText) ||
      blockText(document.querySelector('[data-qa="job-description"]')?.innerText);
    const requirements =
      blockText(document.querySelector('.job-requirement')?.innerText) ||
      blockText(document.querySelector('[data-qa="job-requirement"]')?.innerText);

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
      rawText: blockText(document.body ? document.body.innerText : ''),
      jobId: extractJobId(pageUrl),
    };
  }

  window.__jobbeagleScrapeSync = function __jobbeagleScrapeSync() {
    return scrapeJobPage();
  };

  window.__jobbeagleScrapePage = async function __jobbeagleScrapePage() {
    return scrapeJobPage();
  };
})();
