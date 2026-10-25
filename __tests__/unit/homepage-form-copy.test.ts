import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HOMEPAGE_FORM_COPY,
  getHomepageFormCopy,
} from '@/constants/homepage-form-copy';

describe('homepage form copy', () => {
  it('keeps desktop and mobile on the same English strings', () => {
    const t = getHomepageFormCopy('en');
    expect(t.generate).toBe('AI Strategy Analysis');
    expect(t.upload).toBe('Click to upload Resume');
    expect(t.reportTypeStep).toBe('3. Choose report type');
    expect(t.launchStep).toBe('4. Launch');
    expect(t.jobUrlPlaceholder).toBe(
      'Paste the full job posting: company name, job title, requirements, and responsibilities\nDo not paste only a URL or a short excerpt\nYou can also install the Chrome extension to capture the posting in one click',
    );
    expect(t.snapshotBlurb).toMatch(/hard requirements|missing keywords|pay band/i);
    expect(t.strategyBlurb).toMatch(/web search/i);
    expect(t.sampleLink).toBe('View report samples');
    expect(t.featuresAccordion).toBe('Jobbeagle advantages');
    expect(t.uploadSupport).toBe(
      'Supports .pdf, .doc, .docx, .txt, .md\n(Max 4MB)',
    );
  });

  it('puts the Max 4MB resume note on its own line in every language', () => {
    expect(HOMEPAGE_FORM_COPY['zh-TW'].uploadSupport).toBe(
      '支援 .pdf, .doc, .docx, .txt, .md\n(Max 4MB)',
    );
    expect(HOMEPAGE_FORM_COPY['zh-CN'].uploadSupport).toBe(
      '支持 .pdf, .doc, .docx, .txt, .md\n(最大 4MB)',
    );
    expect(HOMEPAGE_FORM_COPY.en.uploadSupport).toBe(
      'Supports .pdf, .doc, .docx, .txt, .md\n(Max 4MB)',
    );
    expect(HOMEPAGE_FORM_COPY.es.uploadSupport).toBe(
      'Compatible con .pdf, .doc, .docx, .txt, .md\n(Máx 4MB)',
    );
    expect(HOMEPAGE_FORM_COPY.hi.uploadSupport).toBe(
      '.pdf, .doc, .docx, .txt, .md सपोर्ट करता है\n(अधिकतम 4MB)',
    );
    expect(HOMEPAGE_FORM_COPY.ar.uploadSupport).toBe(
      'يدعم .pdf و .doc و .docx و .txt و .md\n(حتى 4MB)',
    );
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.uploadSupport).toMatch(/\n\([^)]*4MB\)\s*$/u);
      expect(copy.upload).not.toMatch(/4MB/);
    }
    expect(HOMEPAGE_FORM_COPY['zh-TW'].upload).toBe('點擊上傳履歷');
    const form = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    expect(form).toMatch(/className="upload-support[^"]*whitespace-pre-line/);
  });

  it('does not advertise the backend score floor to customers', () => {
    const scoreBand = /50\s*[–-]\s*100|0\s*[–-]\s*100|不低於\s*50|不低于\s*50/;
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.snapshotBlurb).not.toMatch(scoreBand);
      expect(copy.strategyBlurb).not.toMatch(scoreBand);
    }
  });

  it('puts live web search on Guide, not Fit Snapshot', () => {
    const noWebPitch =
      /no web|closed-book|flash-lite|不上網|不聯網|不联网|sin búsqueda|वेब सर्च नहीं|بلا بحث/i;
    const webSearchPitch = /web search|網搜|网搜|búsqueda web|वेब सर्च|الويب/i;
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.snapshotBlurb).not.toMatch(noWebPitch);
      expect(copy.snapshotBlurb).not.toMatch(webSearchPitch);
      expect(copy.strategyBlurb).toMatch(webSearchPitch);
    }
  });

  it('states Snapshot and Guide value, not a generic match line', () => {
    const zh = HOMEPAGE_FORM_COPY['zh-TW'];
    expect(zh.snapshotBlurb).toMatch(/硬性門檻/);
    expect(zh.snapshotBlurb).toMatch(/關鍵字/);
    expect(zh.snapshotBlurb).toMatch(/薪資/);
    expect(zh.strategyBlurb).toMatch(/網搜/);
    expect(zh.strategyBlurb).toMatch(/真題|對答/);
    expect(zh.strategyBlurb).toMatch(/談薪|落點/);
  });

  it('calls a job opening 職位, not 席', () => {
    expect(HOMEPAGE_FORM_COPY['zh-TW'].matchAnalysisDesc).toBe(
      '對照職缺硬性門檻與履歷事實，判斷這職位是否真正適合你，並標示落差所在，作為應徵決策依據。',
    );
    expect(HOMEPAGE_FORM_COPY['zh-CN'].matchAnalysisDesc).toBe(
      '对照职位硬性门槛与简历事实，判断这职位是否真正适合你，并标示落差所在，作为应征决策依据。',
    );
    expect(HOMEPAGE_FORM_COPY['zh-TW'].snapshotBlurb).toContain('此職位市場薪資水準');
    expect(HOMEPAGE_FORM_COPY['zh-CN'].snapshotBlurb).toContain('此职位市场薪资水准');
    for (const copy of [HOMEPAGE_FORM_COPY['zh-TW'], HOMEPAGE_FORM_COPY['zh-CN']]) {
      expect(JSON.stringify(copy)).not.toMatch(/席位|這席|该席|該席|此席|一席|本席|这席/);
    }
  });

  it('covers every app language', () => {
    expect(Object.keys(HOMEPAGE_FORM_COPY).sort()).toEqual(
      ['ar', 'en', 'es', 'hi', 'zh-CN', 'zh-TW'].sort(),
    );
  });

  it('does not end the job-paste placeholder with an ellipsis', () => {
    const expected: Record<keyof typeof HOMEPAGE_FORM_COPY, string> = {
      'zh-TW':
        '請貼上完整職缺正文：公司名稱、職缺名稱，以及條件與職責\n請勿只貼網址或片段\n也可安裝 Chrome 外掛，一鍵抓取職缺內容',
      'zh-CN':
        '请粘贴完整职位正文：公司名称、职位名称，以及条件与职责\n请勿只贴网址或片段\n也可安装 Chrome 插件，一键抓取职位内容',
      en: 'Paste the full job posting: company name, job title, requirements, and responsibilities\nDo not paste only a URL or a short excerpt\nYou can also install the Chrome extension to capture the posting in one click',
      es: 'Pega la oferta completa: empresa, puesto, requisitos y responsabilidades\nNo pegues solo una URL o un extracto\nTambién puedes instalar la extensión de Chrome para capturar la oferta en un clic',
      hi: 'पूरी जॉब पोस्टिंग पेस्ट करें: कंपनी नाम, पदनाम, आवश्यकताएँ और जिम्मेदारियाँ\nकेवल URL या छोटा अंश न पेस्ट करें\nChrome एक्सटेंशन इंस्टॉल करके एक क्लिक में जॉब पोस्टिंग कैप्चर भी कर सकते हैं',
      ar: 'الصق إعلان الوظيفة بالكامل: اسم الشركة والمسمى والمتطلبات والمسؤوليات\nلا تلصق الرابط فقط أو مقتطفًا قصيرًا\nيمكنك أيضًا تثبيت إضافة Chrome لالتقاط الإعلان بنقرة واحدة',
    };
    for (const [lang, placeholder] of Object.entries(expected)) {
      expect(HOMEPAGE_FORM_COPY[lang as keyof typeof HOMEPAGE_FORM_COPY].jobUrlPlaceholder).toBe(
        placeholder,
      );
    }
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.jobUrlPlaceholder).not.toMatch(/\.{3}|…/u);
    }
    expect(HOMEPAGE_FORM_COPY['zh-TW'].jobUrlPlaceholder).toMatch(/^請貼上完整職缺正文：/);
    expect(HOMEPAGE_FORM_COPY['zh-TW'].jobUrlPlaceholder).toMatch(/\n請勿只貼網址或片段\n/);
    expect(HOMEPAGE_FORM_COPY['zh-TW'].jobUrlPlaceholder).not.toContain('請貼職缺正文，不要貼連結');
  });

  it('keeps the existing paste instructions and reminds users they can install the Chrome extension', () => {
    const chromeReminder: Record<keyof typeof HOMEPAGE_FORM_COPY, RegExp> = {
      'zh-TW': /也可安裝 Chrome 外掛，一鍵抓取職缺內容/,
      'zh-CN': /也可安装 Chrome 插件，一键抓取职位内容/,
      en: /install the Chrome extension to capture the posting in one click/,
      es: /extensión de Chrome/,
      hi: /Chrome एक्सटेंशन/,
      ar: /إضافة Chrome/,
    };
    for (const [lang, reminder] of Object.entries(chromeReminder)) {
      const placeholder = HOMEPAGE_FORM_COPY[lang as keyof typeof HOMEPAGE_FORM_COPY].jobUrlPlaceholder;
      expect(placeholder).toMatch(reminder);
      expect(placeholder.split('\n')).toHaveLength(3);
      expect(placeholder).not.toMatch(/一間/);
      expect(placeholder).not.toMatch(/chromewebstore\.google\.com|Lemon Squeezy/i);
    }
    const overlay = readFileSync(join(process.cwd(), 'components/SmartInputArea.tsx'), 'utf8');
    expect(overlay).toContain('getHomepageFormCopy');
    expect(overlay).toContain('jobUrlPlaceholder');
    expect(overlay).toContain('<ul');
    expect(overlay).toContain('list-disc');
    expect(overlay).toContain('<li');
    expect(overlay).not.toContain('PLACEHOLDER_ZH');
    expect(overlay).not.toContain('jdEmptyHint');
    expect(overlay).not.toContain('jd-empty-hint');
  });
});

