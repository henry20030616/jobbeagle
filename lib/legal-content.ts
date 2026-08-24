import type { AppLanguage } from '@/lib/language-context';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

type LegalDocKey = 'privacy' | 'terms';

const PRIVACY_EN: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: 'July 12, 2026',
  intro: 'JobBeagle ("we", "us") operates jobbeagle.com and the JobBeagle Chrome extension. This policy explains what we collect and how we use it. We do not sell personal information.',
  sections: [
    {
      title: 'Information We Collect',
      paragraphs: [
        'Account data: When you sign in with Google, we receive your name, email, and profile photo via Supabase Auth.',
        'Job seeker data: Job descriptions you paste or capture, resumes (text/PDF/DOCX) you submit for analysis, and AI analysis reports. Successful analyses automatically save a resume version in your account library (deduplicated by content) and link each report to that version.',
        'Chrome extension data: On supported job boards only, the extension reads the active job posting page (title, company, description, URL) when you click the extension icon, then sends that text to JobBeagle over HTTPS for Pre-Flight review. We do not scrape your browsing history or unrelated tabs.',
        'Technical data: IP address (for rate limiting), browser type, device fingerprint (to prevent free-credit abuse), and cookies for session management.',
        'Usage data: Page views (Google Analytics, if enabled) and product interaction metrics.',
      ],
    },
    {
      title: 'Chrome Extension — Allowed Sites',
      paragraphs: [
        'The JobBeagle Chrome extension only requests access to a whitelist of job boards: LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs.com (including SchoolJobs), and 104.com.tw, plus jobbeagle.com for handoff.',
        'We do not sell scraped job content or your resume data. Job text is used solely to provide AI analysis you request.',
        'You can revoke site access anytime in chrome://extensions → JobBeagle → Site access.',
      ],
    },
    {
      title: 'How We Use Your Information',
      paragraphs: [
        'Provide AI job-match analysis (Lite / Full reports) and Pre-Flight confirmation.',
        'Process payments and credit balances via Lemon Squeezy.',
        'Prevent abuse through rate limits, credit checks, and device-fingerprint Sybil controls.',
        'Improve the product based on aggregated usage patterns.',
      ],
    },
    {
      title: 'Sharing Your Information',
      paragraphs: [
        'We use third-party processors: Supabase (database & auth), Google Gemini (AI analysis), Lemon Squeezy (payments), Vercel (hosting), Resend (email, if enabled), Google Analytics (if enabled).',
        'We do not sell your personal information to third parties.',
        'We may disclose information if required by law or to protect our rights and users.',
      ],
    },
    {
      title: 'Data Retention & Deletion (CCPA / GDPR)',
      paragraphs: [
        'Resume versions and analysis reports are retained while your account is active so you can review history. Removing a resume from your library hides it (soft delete) but does not erase past reports that used it. Certain single-use free reports may be purged automatically after about 90 days.',
        'You may delete your account in-product via Account management (signed-in). This triggers a hard delete of your auth user, profile, resume library, analysis reports, and associated uploaded Shorts media files where applicable.',
        'California residents (CCPA) and users under similar laws may request access or deletion by using in-product delete or emailing henry061680@gmail.com.',
      ],
    },
    {
      title: 'Your Rights',
      paragraphs: [
        'You may access, update, or delete your account data by signing in and using Account management, or by emailing us.',
        'Depending on your jurisdiction, you may have additional rights under GDPR, CCPA, or similar laws.',
      ],
    },
    {
      title: 'Security',
      paragraphs: [
        'We use HTTPS, Supabase Row Level Security, authenticated API routes, webhook signature verification for payments, and rate limiting to protect the service.',
        'No method of transmission over the Internet is 100% secure; we cannot guarantee absolute security.',
      ],
    },
    {
      title: 'Children',
      paragraphs: [
        'JobBeagle is not intended for users under 16. We do not knowingly collect data from children.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'Questions about this policy: henry061680@gmail.com or the contact form on jobbeagle.com.',
      ],
    },
  ],
};

const PRIVACY_ZH_TW: LegalDocument = {
  title: '隱私權政策',
  lastUpdated: '2026 年 7 月 12 日',
  intro: 'JobBeagle（「我們」）營運 jobbeagle.com 與 JobBeagle Chrome 外掛。本政策說明我們收集哪些資料及如何使用。我們不會出售個人資料。',
  sections: [
    {
      title: '我們收集的資訊',
      paragraphs: [
        '帳號資料：使用 Google 登入時，我們透過 Supabase Auth 取得您的姓名、Email 與大頭照。',
        '求職者資料：您貼上或外掛抓取的職缺描述、上傳的履歷（文字／PDF／DOCX）與 AI 分析報告。成功分析後，系統會自動將履歷版本存入您的帳號履歷庫（依內容去重），並把每份報告與該履歷版本對應。',
        'Chrome 外掛資料：僅在您點擊外掛圖示時，於支援的職缺網站讀取當前職缺頁（職稱、公司、描述、網址），並以 HTTPS 傳至 JobBeagle 供 Pre-Flight 確認。我們不會抓取瀏覽紀錄或其他分頁。',
        '技術資料：IP（用於限流）、瀏覽器類型、裝置指紋（防止濫用免費額度）及登入 Cookie。',
        '使用資料：頁面瀏覽（若啟用 Google Analytics）與產品互動指標。',
      ],
    },
    {
      title: 'Chrome 外掛 — 允許的網站',
      paragraphs: [
        '外掛僅申請存取白名單職缺網：LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs.com（含 SchoolJobs）、104.com.tw，以及 jobbeagle.com（交接用）。',
        '我們不會販售抓取的職缺內容或您的履歷；職缺文字僅用於您主動要求的 AI 分析。',
        '您可隨時於 chrome://extensions → JobBeagle → 網站存取權限撤銷授權。',
      ],
    },
    {
      title: '我們如何使用您的資訊',
      paragraphs: [
        '提供 AI 職缺分析（Lite／Full）與 Pre-Flight 確認。',
        '透過 Lemon Squeezy 處理付款與額度。',
        '透過限流、額度檢查與裝置指紋防止濫用。',
        '依彙總使用模式改善產品。',
      ],
    },
    {
      title: '資訊分享',
      paragraphs: [
        '我們使用第三方處理者：Supabase、Google Gemini、Lemon Squeezy、Vercel、Resend（若啟用）、Google Analytics（若啟用）。',
        '我們不會將您的個人資料出售給第三方。',
        '若法律要求或為保護權益，我們可能依法揭露資訊。',
      ],
    },
    {
      title: '資料保留與刪除（CCPA／GDPR）',
      paragraphs: [
        '履歷版本與分析報告於帳號有效期間保留。從履歷庫移除為軟刪除（列表隱藏），不會抹去曾使用該履歷的歷史報告。部分免費用戶單次報告約 90 天後可能自動清除。',
        '您可於登入後至「帳戶管理」執行硬刪除：包含驗證帳號、profile、履歷庫、分析報告，以及相關上傳媒體檔案。',
        '加州 CCPA 等法規下的使用者，亦可透過站內刪除或 henry061680@gmail.com 行使權利。',
      ],
    },
    {
      title: '您的權利',
      paragraphs: [
        '您可登入後至帳戶管理刪除帳號，或 Email 聯絡我們存取、更新、刪除資料。',
        '依司法管轄區，您可能享有 GDPR、CCPA 等額外權利。',
      ],
    },
    {
      title: '資訊安全',
      paragraphs: [
        '我們使用 HTTPS、Supabase RLS、API 驗證、金流 webhook 簽章驗證與限流保護服務。',
        '網路傳輸無法保證百分之百安全。',
      ],
    },
    {
      title: '兒童',
      paragraphs: ['JobBeagle 不針對 16 歲以下使用者，我們不會故意收集兒童資料。'],
    },
    {
      title: '聯絡我們',
      paragraphs: ['隱私相關問題：henry061680@gmail.com 或 jobbeagle.com 留言表單。'],
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: 'August 24, 2026',
  intro: 'By using JobBeagle (website and Chrome extension), you agree to these Terms. If you do not agree, please do not use the service.',
  sections: [
    {
      title: 'Service Description',
      paragraphs: [
        'JobBeagle provides AI-powered job triage and analysis (Job Fit Snapshot and Interview Strategy Guide), optional confirm-job review after Chrome extension capture, and paid credit plans.',
        'We may update, suspend, or discontinue features at any time.',
      ],
    },
    {
      title: 'Chrome Extension',
      paragraphs: [
        'The extension may only be used on the job boards listed in our Privacy Policy whitelist. You must have the right to view the job posting you capture.',
        'You are responsible for confirming captured job text on the Pre-Flight page before launching analysis and consuming credits.',
        'We do not guarantee uninterrupted scraping if a job board changes its page structure or blocks automated access.',
      ],
    },
    {
      title: 'Accounts & Credits',
      paragraphs: [
        'You must provide accurate information and keep your account secure. Analysis requires Google sign-in.',
        'Free accounts receive a limited lifetime Lite allowance. Paid credits and subscriptions are fulfilled via Lemon Squeezy after successful payment.',
        'You can cancel a monthly Standard or Advanced subscription from Account management with one click. Access continues until the end of the current billing period; leftover credits remain.',
        'Credits are non-transferable. Refunds follow Lemon Squeezy and applicable law.',
      ],
    },
    {
      title: 'AI Analysis Disclaimer',
      paragraphs: [
        'AI-generated scores and reports are for informational purposes only and do not constitute hiring, legal, or financial advice.',
        'You should verify all job and salary information independently.',
      ],
    },
    {
      title: 'Acceptable Use',
      paragraphs: [
        'You agree not to abuse rate limits, create fake accounts to farm free credits, reverse-engineer the service, or use the extension to scrape non-whitelisted sites.',
        'We may suspend accounts that violate these Terms.',
      ],
    },
    {
      title: 'Intellectual Property',
      paragraphs: [
        'JobBeagle branding, software, and design are owned by us. You may not copy or reverse-engineer the service without permission.',
        'You retain ownership of content you upload; you grant us a license to host, display, and process it to operate the service.',
      ],
    },
    {
      title: 'Limitation of Liability',
      paragraphs: [
        'The service is provided "as is" without warranties. We are not liable for hiring outcomes or indirect damages.',
        'Our total liability is limited to the amount you paid us in the past 12 months, or USD $100, whichever is greater.',
      ],
    },
    {
      title: 'Governing Law',
      paragraphs: [
        'These Terms are governed by the laws of Taiwan, unless otherwise required by mandatory local law.',
        'Disputes should first be resolved through good-faith contact; unresolved disputes may be submitted to courts in Taiwan.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: ['Questions: henry061680@gmail.com or the contact form on jobbeagle.com.'],
    },
  ],
};

const TERMS_ZH_TW: LegalDocument = {
  title: '服務條款',
  lastUpdated: '2026 年 8 月 24 日',
  intro: '使用 JobBeagle（網站與 Chrome 外掛）即表示您同意本條款。若不同意，請勿使用本服務。',
  sections: [
    {
      title: '服務說明',
      paragraphs: [
        'JobBeagle 提供 AI 職缺分流與分析（Lite／Full）、Chrome 外掛抓取後的 Pre-Flight 確認，以及付費額度方案。',
        '我們可能隨時更新、暫停或終止部分功能。',
      ],
    },
    {
      title: 'Chrome 外掛',
      paragraphs: [
        '外掛僅可用於隱私權政策所列白名單職缺網；您須有權瀏覽所抓取的職缺頁。',
        '您有責任在 Pre-Flight 確認抓取內容後再啟動分析並消耗額度。',
        '若職缺網站改版或封鎖自動化存取，我們不保證抓取一定成功。',
      ],
    },
    {
      title: '帳號與額度',
      paragraphs: [
        '您應提供正確資訊並妥善保管帳號。分析需 Google 登入。',
        '免費帳號享有有限終身 Lite 額度；付費額度與訂閱於 Lemon Squeezy 付款成功後發放。',
        '您可在帳戶管理頁一鍵取消月費 Standard／Advanced 訂閱。本期結束前仍可使用；剩餘額度會保留。',
        '額度不可轉讓；退款依 Lemon Squeezy 與適用法律辦理。',
      ],
    },
    {
      title: 'AI 分析免責',
      paragraphs: [
        'AI 分數與報告僅供參考，不構成錄用、法律或財務建議。',
        '請自行核實職缺與薪資資訊。',
      ],
    },
    {
      title: '可接受使用',
      paragraphs: [
        '不得濫用限流、註冊假帳號洗免費額度、逆向工程，或將外掛用於非白名單網站。',
        '違反本條款之帳號，我們得停權。',
      ],
    },
    {
      title: '智慧財產權',
      paragraphs: [
        'JobBeagle 品牌、軟體與設計歸我們所有，未經許可不得複製或逆向工程。',
        '您上傳的內容仍歸您所有；您授權我們為營運服務而儲存、顯示與處理。',
      ],
    },
    {
      title: '責任限制',
      paragraphs: [
        '服務依「現狀」提供，我們不對錄用結果或間接損害負責。',
        '我們的總賠償責任以您過去 12 個月付費金額或 100 美元中較高者為上限。',
      ],
    },
    {
      title: '準據法',
      paragraphs: [
        '本條款以中華民國（台灣）法律為準據法（強制當地法律除外）。',
        '爭議應先善意協商；無法解決時得提交台灣法院管轄。',
      ],
    },
    {
      title: '聯絡我們',
      paragraphs: ['問題請透過 henry061680@gmail.com 或 jobbeagle.com 留言表單。'],
    },
  ],
};

// zh-CN: adapt from zh-TW with simplified titles where needed
const PRIVACY_ZH_CN: LegalDocument = {
  ...PRIVACY_ZH_TW,
  title: '隐私权政策',
  lastUpdated: '2026 年 7 月 11 日',
};

const TERMS_ZH_CN: LegalDocument = {
  ...TERMS_ZH_TW,
  title: '服务条款',
  lastUpdated: '2026 年 8 月 24 日',
};

const DOCS: Record<LegalDocKey, Partial<Record<AppLanguage, LegalDocument>>> = {
  privacy: {
    en: PRIVACY_EN,
    'zh-TW': PRIVACY_ZH_TW,
    'zh-CN': PRIVACY_ZH_CN,
    es: PRIVACY_EN,
    hi: PRIVACY_EN,
    ar: PRIVACY_EN,
  },
  terms: {
    en: TERMS_EN,
    'zh-TW': TERMS_ZH_TW,
    'zh-CN': TERMS_ZH_CN,
    es: TERMS_EN,
    hi: TERMS_EN,
    ar: TERMS_EN,
  },
};

export function getLegalDocument(type: LegalDocKey, language: AppLanguage): LegalDocument {
  const doc = DOCS[type][language] ?? DOCS[type].en!;
  return doc;
}

export const LEGAL_UI: Record<AppLanguage, { lastUpdated: string; backHome: string; privacy: string; terms: string }> = {
  en: { lastUpdated: 'Last updated', backHome: '← Back to Home', privacy: 'Privacy Policy', terms: 'Terms of Service' },
  'zh-TW': { lastUpdated: '最後更新', backHome: '← 返回首頁', privacy: '隱私權政策', terms: '服務條款' },
  'zh-CN': { lastUpdated: '最后更新', backHome: '← 返回首页', privacy: '隐私权政策', terms: '服务条款' },
  es: { lastUpdated: 'Última actualización', backHome: '← Volver al inicio', privacy: 'Política de privacidad', terms: 'Términos de servicio' },
  hi: { lastUpdated: 'अंतिम अपडेट', backHome: '← होम पर वापस', privacy: 'गोपनीयता नीति', terms: 'सेवा की शर्तें' },
  ar: { lastUpdated: 'آخر تحديث', backHome: '← العودة للرئيسية', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة' },
};
