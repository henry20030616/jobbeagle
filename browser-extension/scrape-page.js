/**
 * JobBeagle scrape bundle — LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs (+ 104).
 * Prefer CSS selectors + structured fields; never trust list-page document titles.
 */
(function jobbeagleScrapeBundle() {
  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

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
      try {
        const nodes = root.querySelectorAll(selectors[i]);
        for (let j = 0; j < nodes.length; j++) {
          const text = cleanText(nodes[j].textContent);
          if (text.length > 1 && !isNoiseTitle(text)) return text;
        }
      } catch (_) {
        /* invalid selector — skip */
      }
    }
    return '';
  }

  function firstBlockText(root, selectors, minLen) {
    const min = minLen || 40;
    let best = '';
    for (let i = 0; i < selectors.length; i++) {
      try {
        const nodes = root.querySelectorAll(selectors[i]);
        for (let j = 0; j < nodes.length; j++) {
          const text = blockText(nodes[j].innerText || nodes[j].textContent);
          if (text.length > best.length) best = text;
        }
      } catch (_) {
        /* skip */
      }
    }
    return best.length >= min ? best : best;
  }

  function isNoiseTitle(s) {
    return /^(精選職缺|推薦職缺|jobs?\s*for\s*you|top\s*job\s*picks|job\s*search|search\s*results|linkedin|indeed|ziprecruiter|glassdoor|governmentjobs)$/i.test(
      (s || '').trim(),
    )
      || /符合.*的職缺|jobs?\s*search\s*results|home\s*\|\s*linkedin/i.test(s || '');
  }

  function looksLikeJobTitle(s) {
    if (!s || s.length < 3 || s.length > 180 || isNoiseTitle(s)) return false;
    return /analyst|engineer|manager|architect|developer|designer|scientist|intern|specialist|coordinator|director|officer|assistant|technician|nurse|teacher|clerk|accountant|attorney|analyst|專員|工程師|分析師|經理|架構|顧問|研究員|職缺/i.test(
      s,
    )
      || (!/linkedin|indeed|apply|save|share/i.test(s) && s.split(/\s+/).length <= 14);
  }

  function looksLikeCompanyName(s) {
    if (!s || s.length < 2 || s.length > 120 || isNoiseTitle(s)) return false;
    return /科技|股份|集團|銀行|大學|inc\.?|ltd\.?|llc|corp\.?|company|department|county|city of|state of|district|authority|mediatek|聯發|microsoft|google|meta|amazon|government/i.test(
      s,
    );
  }

  function extractJobId(pageUrl) {
    const fromUrl =
      pageUrl.match(/view\/(\d+)/) ||
      pageUrl.match(/currentJobId=(\d+)/) ||
      pageUrl.match(/jobId=(\d+)/i) ||
      pageUrl.match(/[?&]jk=([a-f0-9]+)/i) ||
      pageUrl.match(/[?&]vjk=([a-f0-9]+)/i) ||
      pageUrl.match(/jobListingId=(\d+)/i) ||
      pageUrl.match(/jl=(\d+)/i) ||
      pageUrl.match(/\/jobs\/(?:newprint\/)?(\d+)/i) ||
      pageUrl.match(/\/job\/([a-z0-9-]+)/i);
    if (fromUrl) return fromUrl[1];

    const linkSelectors = [
      '.jobs-search-results__list-item--active a[href*="/jobs/view/"]',
      '.scaffold-layout__detail a[href*="/jobs/view/"]',
      'a[href*="/jobs/view/"]',
      'a[href*="jk="]',
      'a[href*="jobId="]',
      'a[href*="/jobs/"]',
    ];
    for (let i = 0; i < linkSelectors.length; i++) {
      const link = document.querySelector(linkSelectors[i]);
      if (link && link.href) {
        const m =
          link.href.match(/view\/(\d+)/) ||
          link.href.match(/[?&]jk=([a-f0-9]+)/i) ||
          link.href.match(/jobId=(\d+)/i) ||
          link.href.match(/\/jobs\/(?:newprint\/)?(\d+)/i);
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

  function scrapeLargestJobBlock() {
    const vw = window.innerWidth || 1200;
    let best = '';
    const nodes = document.querySelectorAll('div, section, article, main');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const rect = el.getBoundingClientRect();
      if (rect.width < 240 || rect.height < 120) continue;
      if (rect.width < vw * 0.35 && rect.left < vw * 0.2) continue;
      const text = blockText(el.innerText || '');
      if (text.length <= best.length || text.length < 200) continue;
      if (
        !/關於該職缺|About the job|Job Description|Full Job Description|Job Details|Description of Job|Apply now|Apply$/i.test(
          text,
        )
      ) {
        continue;
      }
      if (/符合.*的職缺|jobs search|搜尋結果/i.test(text.slice(0, 100))) continue;
      best = text;
    }
    return best;
  }

  function extractCoreJd(text) {
    if (!text) return '';
    let slice = text;

    const startRe =
      /(?:關於該職缺|About the job|Job Description|Full Job Description|Description of Job)\s*/i;
    const startMatch = slice.match(startRe);
    if (startMatch && startMatch.index != null) {
      slice = slice.slice(startMatch.index + startMatch[0].length);
    }

    const endRe =
      /(?:設定相似職缺通知|展開\s*更多職缺|更多相似職缺|關於本公司|About the company|將來有興趣加入|啟用 Premium|以 \$0 的價格|尋找千里馬|刊登職缺|LinkedIn Corporation|選擇語言|Show more jobs|People also viewed|Similar jobs|公司照片)/i;
    const endMatch = slice.match(endRe);
    if (endMatch && endMatch.index != null && endMatch.index > 60) {
      slice = slice.slice(0, endMatch.index);
    }

    slice = slice.replace(/\s*[….]{1,3}\s*更多\s*$/i, '').trim();
    return blockText(slice);
  }

  function parseTitleCompanyFromDocumentTitle(documentTitle) {
    if (!documentTitle || isNoiseTitle(documentTitle.split(/\s*[|\-–]\s*/)[0] || '')) {
      return { title: '', company: '' };
    }
    const parts = (documentTitle || '')
      .split(/\s*[|\-–]\s*/)
      .map((p) => p.trim())
      .filter(
        (p) =>
          p
          && !/^linkedin$/i.test(p)
          && !/^indeed$/i.test(p)
          && !/^ziprecruiter$/i.test(p)
          && !/^glassdoor$/i.test(p)
          && !/^governmentjobs\.com$/i.test(p)
          && !isNoiseTitle(p),
      );
    if (parts.length >= 2) {
      return { title: parts[0], company: parts[1] };
    }
    if (parts.length === 1 && looksLikeJobTitle(parts[0])) {
      return { title: parts[0], company: '' };
    }
    // "Role at Company"
    const at = (documentTitle || '').match(/^(.+?)\s+at\s+(.+?)(?:\s*[|\-–]|$)/i);
    if (at) {
      return {
        title: cleanText(at[1]),
        company: cleanText(at[2]).replace(/\s*[|\-–].*$/, ''),
      };
    }
    return { title: '', company: '' };
  }

  function parseTitleCompanyFromPanel(panelText, scoped, documentTitle) {
    const fromDoc = parseTitleCompanyFromDocumentTitle(documentTitle);
    let title = fromDoc.title;
    let company = fromDoc.company;

    const cssTitle = firstText(scoped, [
      '.job-details-jobs-unified-top-card__job-title a',
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title a',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card h1 a',
      '.job-details-jobs-unified-top-card h1',
      '.jobs-unified-top-card h1',
      'h1.t-24',
      'h2.t-24',
      'h1[class*="job-title"]',
      '[data-test-job-title]',
      'main h1',
    ]);
    const cssCompany = firstText(scoped, [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      'a[data-test-app-aware-link][href*="/company/"]',
      '[data-test-job-details-company-name]',
      '.artdeco-entity-lockup__subtitle a',
      '.jobs-company__box a',
    ]);

    if (cssTitle && !isNoiseTitle(cssTitle)) title = cssTitle;
    if (cssCompany && !isNoiseTitle(cssCompany)) company = cssCompany;

    if ((!title || !company) && panelText) {
      const lines = panelText.split('\n').map((l) => l.trim()).filter(Boolean);
      const candidates = [];
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i];
        if (line.length < 2 || line.length > 160) continue;
        if (isNoiseTitle(line)) continue;
        if (
          /Apply|Save|Share|儲存|分享|Easy Apply|套用|Premium|關於該職缺|About the job|全職|Part-time|應徵|台灣|Taiwan|週前|天前|位會員|Posted|ago|followers|employees/i.test(
            line,
          )
        ) {
          continue;
        }
        candidates.push(line);
      }
      if (!company && candidates[0]) {
        if (looksLikeCompanyName(candidates[0]) || looksLikeJobTitle(candidates[1] || '')) {
          company = candidates[0];
          if (!title && candidates[1]) title = candidates[1];
        } else {
          if (!title) title = candidates[0];
          if (!company && candidates[1]) company = candidates[1];
        }
      } else if (!title && candidates[0]) {
        title = looksLikeJobTitle(candidates[0])
          ? candidates[0]
          : candidates.find(looksLikeJobTitle) || candidates[0];
      }
    }

    if (looksLikeCompanyName(title) && looksLikeJobTitle(company)) {
      const tmp = title;
      title = company;
      company = tmp;
    }

    if (isNoiseTitle(title)) title = '';
    if (isNoiseTitle(company)) company = '';

    return { title: title || '', company: company || '' };
  }

  function buildPayload(pageUrl, documentTitle, title, company, location, description, extra) {
    const parts = [];
    if (title) parts.push('職位：' + title);
    if (company) parts.push('公司：' + company);
    if (location && location !== company && location.length < 120) {
      parts.push('地點：' + location);
    }
    if (extra && extra.salary) parts.push('薪資：' + extra.salary);
    if (description) parts.push('職缺描述：\n' + description);

    const rawText = parts.join('\n\n');
    const pageTitle =
      title && company
        ? title + ' | ' + company
        : title || (!isNoiseTitle(documentTitle) ? documentTitle : title) || 'Job';

    return {
      pageTitle,
      pageUrl,
      rawText,
      jobId: extractJobId(pageUrl),
      jobTitle: title || '',
      companyName: company || '',
      _debug: {
        descLen: (description || '').length,
        titleLen: (title || '').length,
        companyLen: (company || '').length,
        rawLen: rawText.length,
        site: (extra && extra.site) || 'unknown',
      },
    };
  }

  function scrapeLinkedIn(pageUrl, documentTitle) {
    const detailRoot = findLinkedInDetailsRoot();
    const scoped = detailRoot || document;
    let panelText = detailRoot ? blockText(detailRoot.innerText) : '';

    let description = firstBlockText(
      scoped,
      [
        '.jobs-description__content',
        '.jobs-box__html-content',
        '.jobs-description-content__text',
        '.jobs-description',
        '#job-details',
        '[class*="jobs-description__content"]',
        '[class*="jobs-description-content"]',
        'article[class*="jobs-description"]',
        '[data-test-description-section]',
      ],
      40,
    );

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
    if (description.length < 120) {
      const bodyText = blockText(document.body ? document.body.innerText : '');
      if (bodyText.length > description.length) description = bodyText;
    }

    description = extractCoreJd(description);
    if (panelText) panelText = extractCoreJd(panelText) || panelText;
    if (description.length < 80 && panelText.length >= 80) {
      description = extractCoreJd(panelText);
    }

    const { title, company } = parseTitleCompanyFromPanel(
      detailRoot ? blockText(detailRoot.innerText) : description,
      scoped,
      documentTitle,
    );

    const location = firstText(scoped, [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__tertiary-description-container',
      '.jobs-unified-top-card__primary-description',
    ]);

    const payload = buildPayload(pageUrl, documentTitle, title, company, location, description, {
      site: 'linkedin',
    });

    const isJobUrl =
      /\/jobs\/view\/\d+/.test(pageUrl) ||
      /currentJobId=\d+/.test(pageUrl) ||
      /\/jobs\/collections\//.test(pageUrl);
    const hasEnough =
      payload.rawText.length >= 40
      && (title.length > 2 || description.length > 80);

    // List/featured pages with no real title+company → force user to open detail
    if ((!title || !company) && description.length < 200 && !/\/jobs\/view\/\d+/.test(pageUrl)) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
        jobTitle: '',
        companyName: '',
        _debug: {
          descLen: description.length,
          titleLen: title.length,
          companyLen: company.length,
          hasRoot: !!detailRoot,
          reason: 'missing_title_or_company_on_list',
        },
      };
    }

    if (!isJobUrl && !hasEnough) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
        jobTitle: title,
        companyName: company,
        _debug: {
          descLen: description.length,
          titleLen: title.length,
          hasRoot: !!detailRoot,
          bodyLen: ((document.body && document.body.innerText) || '').length,
        },
      };
    }

    return payload;
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

    let desc = description;
    if (requirements) desc = (desc ? desc + '\n\n' : '') + requirements;

    return buildPayload(pageUrl, documentTitle, title, company, location, desc, {
      salary,
      site: '104',
    });
  }

  function trimUsBoardNoise(text) {
    if (!text) return '';
    let slice = text;
    const endRe =
      /(?:Similar jobs|People also viewed|Recommended jobs|Other jobs you may like|Report job|Save job|Get email updates|Sign in to|Create account|Cookie|Privacy|Terms of|©\s*\d{4}|Glassdoor,?\s*Inc|Indeed,?\s*a?\s*Glassdoor|ZipRecruiter|GovernmentJobs)/i;
    const endMatch = slice.match(endRe);
    if (endMatch && endMatch.index != null && endMatch.index > 120) {
      slice = slice.slice(0, endMatch.index);
    }
    return blockText(slice);
  }

  function scrapeGenericBoard(pageUrl, documentTitle, config) {
    const fromDoc = parseTitleCompanyFromDocumentTitle(documentTitle);
    const title =
      firstText(document, config.titleSelectors) || fromDoc.title;
    const company =
      firstText(document, config.companySelectors) || fromDoc.company;
    const location = firstText(document, config.locationSelectors || []);
    const salary = firstText(document, config.salarySelectors || []);

    let description = firstBlockText(document, config.descriptionSelectors, 40);

    if (description.length < 120) {
      const largest = scrapeLargestJobBlock();
      if (largest.length > description.length) description = largest;
    }
    if (description.length < 120) {
      const main = document.querySelector('main') || document.body;
      const mainText = blockText(main ? main.innerText : '');
      if (mainText.length > description.length) description = mainText;
    }

    description = trimUsBoardNoise(description);
    if (config.coreExtract) {
      description = config.coreExtract(description) || description;
    }

    const payload = buildPayload(pageUrl, documentTitle, title, company, location, description, {
      salary,
      site: config.site,
    });

    if (!payload.rawText || payload.rawText.trim().length < 40) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
        jobTitle: title || '',
        companyName: company || '',
        _debug: payload._debug,
      };
    }
    return payload;
  }

  function scrapeIndeed(pageUrl, documentTitle) {
    return scrapeGenericBoard(pageUrl, documentTitle, {
      site: 'indeed',
      titleSelectors: [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1.jobsearch-JobInfoHeader-title span',
        'h1.jobsearch-JobInfoHeader-title',
        '.jobsearch-JobInfoHeader-title',
        'h2.jobTitle span[title]',
        'h2.jobTitle',
        '[data-testid="job-title"]',
        'h1',
      ],
      companySelectors: [
        '[data-testid="inlineHeader-companyName"] a',
        '[data-testid="inlineHeader-companyName"]',
        '[data-company-name="true"]',
        '.jobsearch-InlineCompanyRating a',
        '.jobsearch-CompanyInfoContainer a',
        '[data-testid="company-name"]',
        'div[data-company-name] a',
      ],
      locationSelectors: [
        '[data-testid="job-location"]',
        '[data-testid="inlineHeader-companyLocation"]',
        '.jobsearch-JobInfoHeader-subtitle > div',
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      ],
      salarySelectors: [
        '#salaryInfoAndJobType',
        '[data-testid="attribute_snippet_testid"]',
        '.jobsearch-JobMetadataHeader-item',
      ],
      descriptionSelectors: [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[id*="jobDescription"]',
        '.jobsearch-JobComponent-description',
        '[data-testid="jobsearch-JobComponent-description"]',
      ],
      coreExtract: (text) => {
        const m = text.match(/(?:Job Description|Full Job Description|Description)\s*/i);
        if (m && m.index != null) {
          return trimUsBoardNoise(text.slice(m.index + m[0].length));
        }
        return trimUsBoardNoise(text);
      },
    });
  }

  function scrapeZipRecruiter(pageUrl, documentTitle) {
    return scrapeGenericBoard(pageUrl, documentTitle, {
      site: 'ziprecruiter',
      titleSelectors: [
        'h1.job_title',
        'h1[class*="JobTitle"]',
        '[data-testid="job-title"]',
        '.job_title',
        'h1[aria-label]',
        'h1',
      ],
      companySelectors: [
        'a.company_name',
        '[data-testid="company-name"]',
        '.company_name',
        'a[href*="/co/"]',
        '[class*="CompanyName"]',
        'a[href*="/c/"]',
      ],
      locationSelectors: [
        '[data-testid="job-location"]',
        '.location',
        '.job_location',
        '[class*="Location"]',
      ],
      salarySelectors: ['.job_salary', '[data-testid="job-salary"]', '.salary'],
      descriptionSelectors: [
        '.jobDescriptionSection',
        '[data-testid="job-description"]',
        '#job_description',
        '.job_description',
        '[class*="JobDescription"]',
        'article',
      ],
    });
  }

  function scrapeGlassdoor(pageUrl, documentTitle) {
    return scrapeGenericBoard(pageUrl, documentTitle, {
      site: 'glassdoor',
      titleSelectors: [
        '[data-test="job-title"]',
        'h1[class*="JobDetails_jobTitle"]',
        '[class*="JobDetails_jobTitle"]',
        'h1.heading_Level1',
        'h1[data-test="jobTitle"]',
        'h1',
      ],
      companySelectors: [
        '[data-test="employer-name"]',
        '[data-test="employerName"]',
        'a[class*="EmployerProfile"]',
        '[class*="EmployerProfile_employerName"]',
        '[data-test="employer-short-name"]',
      ],
      locationSelectors: [
        '[data-test="location"]',
        '[data-test="job-location"]',
        '[class*="JobDetails_location"]',
      ],
      salarySelectors: [
        '[data-test="detailSalary"]',
        '[data-test="salary-estimate"]',
        '[class*="SalaryEstimate"]',
      ],
      descriptionSelectors: [
        '#JobDescriptionContainer',
        '.jobDescriptionContent',
        '[class*="JobDetails_jobDescription"]',
        '[data-test="description"]',
        '.desc',
        '[id*="JobDescription"]',
      ],
      coreExtract: (text) => {
        const end = text.search(
          /(?:Company Overview|What is the team|Glassdoor has millions|Show more jobs)/i,
        );
        if (end > 120) return blockText(text.slice(0, end));
        return trimUsBoardNoise(text);
      },
    });
  }

  /**
   * GovernmentJobs.com / SchoolJobs (NEOGOV) — agency postings.
   * Detail URLs: /careers/{agency}/jobs/{id}/... or ?jobId=
   */
  function scrapeGovernmentJobs(pageUrl, documentTitle) {
    const fromDoc = parseTitleCompanyFromDocumentTitle(documentTitle);

    let title =
      firstText(document, [
        '#job-details h1',
        '.jobInfo h1',
        '#main-content h1',
        '.entity-details h1',
        'h1.main-title',
        '[class*="job-title"]',
        'h1',
      ]) || fromDoc.title;

    let company =
      firstText(document, [
        '.agency-name',
        '#agency-name',
        '[class*="agency-name"]',
        '.employer-name',
        '[data-agency]',
        'a[href*="/careers/"][class*="agency"]',
      ]) || fromDoc.company;

    // NEOGOV bulletin: "DEPARTMENT\nColorado Department of Human Services"
    const bodyText = blockText(document.body ? document.body.innerText : '');
    if (!company) {
      const dept =
        bodyText.match(
          /(?:^|\n)\s*(?:DEPARTMENT|Department|AGENCY|Agency)\s*\n\s*([^\n]{2,120})/i,
        )
        || bodyText.match(
          /(?:^|\n)\s*(?:DEPARTMENT|Department|AGENCY|Agency)\s*[:：]\s*([^\n]{2,120})/i,
        );
      if (dept) company = cleanText(dept[1]);
    }

    // Agency from /careers/{slug}/
    if (!company) {
      const m = pageUrl.match(/\/careers\/([^/?#]+)/i);
      if (m && m[1] && !/^(jobs|search)$/i.test(m[1])) {
        company = m[1]
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    if (!title || isNoiseTitle(title)) {
      const h = bodyText.match(/^#\s*(.+)$/m) || bodyText.match(/\n#\s*(.+)\n/);
      // Prefer first substantial line after Job Bulletin
      const lines = bodyText.split('\n').map((l) => l.trim()).filter(Boolean);
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        if (/^(job bulletin|salary|location|job type|department|agency|opening|closing)/i.test(lines[i])) {
          continue;
        }
        if (looksLikeJobTitle(lines[i]) || (lines[i].length > 8 && lines[i].length < 120)) {
          if (!title || isNoiseTitle(title)) title = lines[i];
          break;
        }
      }
      if (h && (!title || isNoiseTitle(title))) title = cleanText(h[1]);
    }

    const location = firstText(document, [
      '.job-location',
      '[class*="location"]',
      '#location',
    ]) || (() => {
      const loc = bodyText.match(/(?:^|\n)\s*(?:LOCATION|Location)\s*\n\s*([^\n]{2,120})/i);
      return loc ? cleanText(loc[1]) : '';
    })();

    const salary = (() => {
      const s = bodyText.match(/(?:^|\n)\s*(?:SALARY|Salary)\s*\n\s*([^\n]{2,160})/i);
      return s ? cleanText(s[1]) : '';
    })();

    let description = firstBlockText(
      document,
      [
        '#job-details',
        '.job-description',
        '#maincontent',
        '#main-content',
        '.content',
        '#descriptionContainer',
        '[class*="job-description"]',
        'article',
        'main',
      ],
      80,
    );

    if (description.length < 120) {
      const start = bodyText.search(/Description of Job|Job Description|Essential Functions|Duties/i);
      if (start >= 0) {
        description = trimUsBoardNoise(bodyText.slice(start));
      } else {
        description = trimUsBoardNoise(bodyText);
      }
    } else {
      description = trimUsBoardNoise(description);
    }

    // Drop NEOGOV apply boilerplate if we can keep core
    const coreStart = description.search(/Description of Job|Department Information|Essential Duties/i);
    if (coreStart > 40 && coreStart < description.length * 0.5) {
      description = blockText(description.slice(coreStart));
    }

    const payload = buildPayload(pageUrl, documentTitle, title, company, location, description, {
      salary,
      site: 'governmentjobs',
    });

    const isDetail =
      /\/jobs\/\d+/i.test(pageUrl)
      || /[?&]jobId=\d+/i.test(pageUrl)
      || /\/jobs\/newprint\/\d+/i.test(pageUrl);

    if ((!payload.rawText || payload.rawText.length < 40) || (!isDetail && description.length < 120)) {
      return {
        error: 'NOT_JOB_DETAIL',
        pageTitle: documentTitle,
        pageUrl,
        rawText: '',
        jobId: extractJobId(pageUrl),
        jobTitle: title || '',
        companyName: company || '',
        _debug: payload._debug,
      };
    }

    return payload;
  }

  function scrapeJobPage() {
    const pageUrl = window.location.href;
    const documentTitle = document.title;
    const host = (window.location.hostname || '').toLowerCase();

    if (host.includes('104.com.tw')) {
      return scrape104(pageUrl, documentTitle);
    }
    if (host.includes('linkedin.com')) {
      return scrapeLinkedIn(pageUrl, documentTitle);
    }
    if (host.includes('indeed.com')) {
      return scrapeIndeed(pageUrl, documentTitle);
    }
    if (host.includes('ziprecruiter.com')) {
      return scrapeZipRecruiter(pageUrl, documentTitle);
    }
    if (host.includes('glassdoor.com')) {
      return scrapeGlassdoor(pageUrl, documentTitle);
    }
    if (host.includes('governmentjobs.com') || host.includes('schooljobs.com')) {
      return scrapeGovernmentJobs(pageUrl, documentTitle);
    }

    return {
      error: 'NOT_JOB_DETAIL',
      pageTitle: documentTitle,
      pageUrl,
      rawText: '',
      jobId: 'unknown',
      jobTitle: '',
      companyName: '',
    };
  }

  window.__jobbeagleScrapeSync = function __jobbeagleScrapeSync() {
    return scrapeJobPage();
  };

  window.__jobbeagleScrapePage = async function __jobbeagleScrapePage() {
    return scrapeJobPage();
  };
})();
