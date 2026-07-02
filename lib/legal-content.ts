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
  lastUpdated: 'July 2, 2026',
  intro: 'Jobbeagle ("we", "us") operates jobbeagle.com, including AI job analysis and Jobbeagle Shorts. This policy explains what we collect and how we use it.',
  sections: [
    {
      title: 'Information We Collect',
      paragraphs: [
        'Account data: When you sign in with Google, we receive your name, email, and profile photo via Supabase Auth.',
        'Job seeker data: Resumes, cover letters, application messages, and AI analysis reports you submit.',
        'Employer data: Company name, description, contact email, job postings, and recruitment videos.',
        'Usage data: Page views (Google Analytics), video view counts, likes, saves, and follows.',
        'Technical data: IP address (hashed for rate limiting on AI analysis), browser type, and cookies for session management.',
      ],
    },
    {
      title: 'How We Use Your Information',
      paragraphs: [
        'Provide AI job-match analysis and Shorts browsing, application, and employer tools.',
        'Send application notifications to employers when a job seeker applies (via Resend email service).',
        'Store your analysis history, saved jobs, and application records when you are logged in.',
        'Prevent abuse through rate limits and duplicate-application checks.',
        'Improve the product based on aggregated usage patterns.',
      ],
    },
    {
      title: 'Sharing Your Information',
      paragraphs: [
        'When you apply to a job, your name, email, phone, resume, cover letter, and message are shared with the employer listed on that job posting.',
        'We use third-party services: Supabase (database & auth), Google Gemini (AI analysis), Resend (email), Vercel (hosting), Google Analytics.',
        'We do not sell your personal information to third parties.',
        'We may disclose information if required by law or to protect our rights and users.',
      ],
    },
    {
      title: 'Data Retention',
      paragraphs: [
        'Analysis reports and resumes are kept while your account is active. You may request deletion by contacting us.',
        'Job applications are retained so employers can review candidates and job seekers can view their history.',
        'Employer job postings remain until deleted by the employer or removed for policy violations.',
      ],
    },
    {
      title: 'Your Rights',
      paragraphs: [
        'You may access, update, or delete your account data by signing in and using profile settings, or by emailing us.',
        'You may withdraw consent for marketing communications at any time.',
        'Depending on your jurisdiction, you may have additional rights under GDPR, CCPA, or similar laws.',
      ],
    },
    {
      title: 'Security',
      paragraphs: [
        'We use HTTPS, Supabase Row Level Security, and authenticated API routes to protect your data.',
        'No method of transmission over the Internet is 100% secure; we cannot guarantee absolute security.',
      ],
    },
    {
      title: 'Children',
      paragraphs: [
        'Jobbeagle is not intended for users under 16. We do not knowingly collect data from children.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'Questions about this policy: contact us via the form at jobbeagle.com or email henry061680@gmail.com.',
      ],
    },
  ],
};

const PRIVACY_ZH_TW: LegalDocument = {
  title: '隱私權政策',
  lastUpdated: '2026 年 7 月 2 日',
  intro: 'Jobbeagle（「我們」）營運 jobbeagle.com，包含 AI 職缺分析與 Jobbeagle Shorts。本政策說明我們收集哪些資料及如何使用。',
  sections: [
    {
      title: '我們收集的資訊',
      paragraphs: [
        '帳號資料：使用 Google 登入時，我們透過 Supabase Auth 取得您的姓名、Email 與大頭照。',
        '求職者資料：您上傳的履歷、求職信、申請留言及 AI 分析報告。',
        '企業資料：公司名稱、簡介、聯絡信箱、職缺內容與招募影片。',
        '使用資料：頁面瀏覽（Google Analytics）、影片觀看次數、按讚、收藏與追蹤。',
        '技術資料：IP 位址（經雜湊用於 AI 分析次數限制）、瀏覽器類型及登入工作階段 Cookie。',
      ],
    },
    {
      title: '我們如何使用您的資訊',
      paragraphs: [
        '提供 AI 職缺匹配分析、Shorts 瀏覽、申請與企業管理功能。',
        '求職者申請職缺時，透過 Resend 寄送通知信給企業聯絡信箱。',
        '在您登入後儲存分析歷史、收藏職缺與申請紀錄。',
        '透過次數限制與重複申請檢查防止濫用。',
        '依彙總使用模式改善產品。',
      ],
    },
    {
      title: '資訊分享',
      paragraphs: [
        '當您申請職缺時，您的姓名、Email、電話、履歷、求職信與留言會提供給該職缺的企業。',
        '我們使用第三方服務：Supabase（資料庫與驗證）、Google Gemini（AI 分析）、Resend（Email）、Vercel（主機）、Google Analytics。',
        '我們不會將您的個人資料出售給第三方。',
        '若法律要求或為保護我們與使用者的權益，我們可能依法揭露資訊。',
      ],
    },
    {
      title: '資料保留',
      paragraphs: [
        '分析報告與履歷在帳號有效期間保留；您可聯絡我們要求刪除。',
        '求職申請紀錄保留，供企業審閱與求職者查詢自己的申請歷史。',
        '企業職缺內容保留至企業自行刪除或因違規被移除。',
      ],
    },
    {
      title: '您的權利',
      paragraphs: [
        '您可登入後於個人設定管理資料，或 Email 聯絡我們存取、更新、刪除帳號資料。',
        '您可隨時拒絕行銷通訊。',
        '依您所在司法管轄區，您可能享有 GDPR、CCPA 等額外權利。',
      ],
    },
    {
      title: '資訊安全',
      paragraphs: [
        '我們使用 HTTPS、Supabase 列級安全（RLS）及 API 驗證保護資料。',
        '網路傳輸無法保證百分之百安全。',
      ],
    },
    {
      title: '兒童',
      paragraphs: ['Jobbeagle 不針對 16 歲以下使用者，我們不會故意收集兒童資料。'],
    },
    {
      title: '聯絡我們',
      paragraphs: ['隱私相關問題：請透過 jobbeagle.com 留言表單或 henry061680@gmail.com 聯絡。'],
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: 'July 2, 2026',
  intro: 'By using Jobbeagle, you agree to these Terms. If you do not agree, please do not use the service.',
  sections: [
    {
      title: 'Service Description',
      paragraphs: [
        'Jobbeagle provides AI-powered job analysis tools and a short-video job board (Shorts) where employers post roles and job seekers browse and apply.',
        'We may update, suspend, or discontinue features at any time.',
      ],
    },
    {
      title: 'Accounts',
      paragraphs: [
        'You must provide accurate information and keep your account secure.',
        'You are responsible for all activity under your account.',
        'Employers represent that they have authority to post jobs on behalf of their organization.',
      ],
    },
    {
      title: 'Job Seeker Applications',
      paragraphs: [
        'By submitting an application, you confirm that your resume and information are truthful and that you consent to sharing them with the employer for that role.',
        'You agree not to submit false, misleading, or spam applications.',
        'Application delivery via email is not guaranteed; employers may also review applications in the Jobbeagle employer panel.',
      ],
    },
    {
      title: 'Employer Content',
      paragraphs: [
        'Employers are solely responsible for job postings, videos, and hiring decisions.',
        'You must not post fraudulent jobs, discriminatory content, or material that violates applicable law.',
        'We may remove content or suspend accounts that violate these Terms without prior notice.',
      ],
    },
    {
      title: 'AI Analysis Disclaimer',
      paragraphs: [
        'AI-generated match scores and reports are for informational purposes only and do not constitute hiring advice or guarantees.',
        'You should verify all job and salary information independently.',
      ],
    },
    {
      title: 'Intellectual Property',
      paragraphs: [
        'Jobbeagle branding, software, and design are owned by us. You may not copy or reverse-engineer the service without permission.',
        'You retain ownership of content you upload; you grant us a license to host, display, and process it to operate the service.',
      ],
    },
    {
      title: 'Limitation of Liability',
      paragraphs: [
        'The service is provided "as is" without warranties. We are not liable for hiring outcomes, employer conduct, or indirect damages.',
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
      paragraphs: ['Questions: jobbeagle.com contact form or henry061680@gmail.com.'],
    },
  ],
};

const TERMS_ZH_TW: LegalDocument = {
  title: '服務條款',
  lastUpdated: '2026 年 7 月 2 日',
  intro: '使用 Jobbeagle 即表示您同意本條款。若不同意，請勿使用本服務。',
  sections: [
    {
      title: '服務說明',
      paragraphs: [
        'Jobbeagle 提供 AI 職缺分析工具及 Shorts 短影片職缺平台，供企業發布職缺、求職者瀏覽與申請。',
        '我們可能隨時更新、暫停或終止部分功能。',
      ],
    },
    {
      title: '帳號',
      paragraphs: [
        '您應提供正確資訊並妥善保管帳號。',
        '您須對帳號下的一切活動負責。',
        '企業使用者聲明其有權代表該組織發布招聘內容。',
      ],
    },
    {
      title: '求職者申請',
      paragraphs: [
        '送出申請即表示您確認履歷與資料真實，並同意將資料提供給該職缺之企業。',
        '不得提交虛假、誤導或垃圾申請。',
        'Email 通知不保證送達；企業亦可於 Jobbeagle 企業後台查看申請。',
      ],
    },
    {
      title: '企業內容',
      paragraphs: [
        '企業對職缺內容、影片與錄用決策負全部責任。',
        '不得發布假職缺、歧視性內容或違法資訊。',
        '違反本條款之內容或帳號，我們得移除或停權，無需事先通知。',
      ],
    },
    {
      title: 'AI 分析免責',
      paragraphs: [
        'AI 匹配分數與報告僅供參考，不構成錄用建議或保證。',
        '請自行核實職缺與薪資資訊。',
      ],
    },
    {
      title: '智慧財產權',
      paragraphs: [
        'Jobbeagle 品牌、軟體與設計歸我們所有，未經許可不得複製或逆向工程。',
        '您上傳的內容仍歸您所有；您授權我們為營運服務而儲存、顯示與處理。',
      ],
    },
    {
      title: '責任限制',
      paragraphs: [
        '服務依「現狀」提供，我們不對錄用結果、企業行為或間接損害負責。',
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
      paragraphs: ['問題請透過 jobbeagle.com 留言表單或 henry061680@gmail.com。'],
    },
  ],
};

// zh-CN: adapt from zh-TW with simplified titles where needed
const PRIVACY_ZH_CN: LegalDocument = {
  ...PRIVACY_ZH_TW,
  title: '隐私权政策',
  lastUpdated: '2026 年 7 月 2 日',
  intro: 'Jobbeagle（「我们」）运营 jobbeagle.com，包含 AI 职位分析与 Jobbeagle Shorts。本政策说明我们收集哪些资料及如何使用。',
};

const TERMS_ZH_CN: LegalDocument = {
  ...TERMS_ZH_TW,
  title: '服务条款',
  lastUpdated: '2026 年 7 月 2 日',
  intro: '使用 Jobbeagle 即表示您同意本条款。若不同意，请勿使用本服务。',
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
