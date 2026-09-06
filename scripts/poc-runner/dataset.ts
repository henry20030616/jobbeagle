import type { CareerContext } from '../../types';
import type { DogType, TestCase } from './types';

const EMPTY_CAREER: CareerContext = {
  target_level: '',
  location_or_remote: '',
  work_auth: '',
  target_tc: '',
  walk_away_tc: '',
  non_negotiables: '',
  signature_strengths: '',
};

function career(partial: Partial<CareerContext>): CareerContext {
  return { ...EMPTY_CAREER, ...partial };
}

function snapshotCase(
  id: string,
  name: string,
  dog: DogType,
  min: number,
  max: number,
  jd: string,
  resume: string,
  extra: Partial<TestCase['assertions']> = {},
): TestCase {
  return {
    id,
    category: 'snapshot_quality',
    name,
    reportType: 'job_fit_snapshot',
    expectedDogType: dog,
    scoreRange: [min, max],
    jobDescription: jd,
    resumeText: resume,
    assertions: {
      minScore: min,
      maxScore: max,
      requiredDogType: dog,
      requireNoResumeCoaching: true,
      ...extra,
    },
  };
}

function guideCase(
  id: string,
  name: string,
  jd: string,
  resume: string,
  extra: Partial<TestCase['assertions']> = {},
  ctx?: CareerContext,
): TestCase {
  return {
    id,
    category: 'guide_quality',
    name,
    reportType: 'interview_strategy_guide',
    jobDescription: jd,
    resumeText: resume,
    careerContext: ctx,
    assertions: {
      minScore: 50,
      maxScore: 100,
      minStarQuestions: 4,
      requireNoResumeCoaching: true,
      ...extra,
    },
  };
}

const STRIPE_JD = (id: string) => `
Staff Backend Engineer at Stripe (United States, hybrid 3 days in South San Francisco).
Position ID: JD-${id}. 7+ years backend experience required.
Must scale distributed Go services, Kubernetes, PostgreSQL, Kafka, and AWS payments ledgers.
Own authorization p99 latency, idempotent settlement, and PCI-scoped on-call.
Fintech / payments domain strongly preferred.
`;

const STRIPE_RESUME = (id: string) => `
Staff Backend Engineer, 9 years. Candidate ID: RES-${id}.
Spearheaded Stripe-class payments infrastructure in Go on Kubernetes / AWS.
Cut authorization p99 latency 35% and delivered $3.2M annual cloud savings.
Designed PostgreSQL + Kafka ledgers for card-network settlement at 99.99% SLA.
Mentored a backend platform group across distributed systems and fintech controls.
`;

const META_JD = (id: string) => `
Senior Product Manager, Ads Measurement at Meta (Menlo Park, hybrid RTO 3 days/week).
Position ID: JD-${id}. 6+ years product experience. SQL, experimentation, advertising measurement.
Ship incrementality and privacy-safe attribution with data science partners.
`;

const META_RESUME = (id: string) => `
Senior Product Manager, Ads Measurement at Meta, 8 years. Candidate: RES-${id}.
United States Menlo Park hybrid RTO. Incrementality, privacy-safe attribution,
SQL, experimentation, advertising measurement, data science partners.
Lifted ROAS 18%, cut wasted spend 27%, booked $12M revenue, and shipped 3 measurement launches.
6+ years product experience required — exceeded.
`;

const ANALYST_JD = (id: string) => `
Business Analyst at Capital One (McLean, VA, hybrid). Position ID: JD-${id}.
5+ years analytics. SQL, Looker dashboards, credit-risk storytelling, stakeholder management.
`;

const ANALYST_RESUME = (id: string) => `
Business Analyst at Capital One, 6 years banking analytics. Candidate: RES-${id}.
McLean VA hybrid. SQL, Looker dashboards, credit-risk storytelling, stakeholder management.
Reduced monthly close 22%, lifted collections 11%, saved $1.1M, and cut cycle time 15%.
5+ years analytics.
`;

const SWITCHER_JD = (id: string) => `
Junior Data Analyst at Shopify (Remote US). Position ID: JD-${id}.
2+ years analytics or adjacent. SQL preferred, retail / commerce curiosity, dashboards.
`;

const SWITCHER_RESUME = (id: string) => `
Staff accountant exploring analyst openings, 7 years in a retail shop. Candidate: RES-${id}.
Mostly Excel reconciliations and month-end journal entries.
Sat in on one dashboards demo. Curious about Shopify-style reporting.
`;

const TEACHER_RESUME = (id: string) => `
Elementary classroom instructor in a public district. Candidate: RES-${id}.
Wrote lesson plans, hosted family conferences, and managed a homeroom.
`;

const ML_JD = (id: string) => `
Staff Machine Learning Engineer at NVIDIA (Santa Clara, onsite). Position ID: JD-${id}.
8+ years ML. CUDA, PyTorch, GPU kernels, compiler internals. Publish-level research preferred.
`;

const NURSE_RESUME = (id: string) => `
Registered nurse in hospital med-surg units. Candidate: RES-${id}.
Patient care, charting, and night-shift coordination.
`;

const COUNSELOR_RESUME = (id: string) => `
School advisor for a suburban district. Candidate: RES-${id}.
IEP meetings, college advising, and crisis response.
`;

const METRICLESS_RESUME = (id: string) => `
Director of Operations with an extensive track record leading cross-functional teams,
transforming business strategy, and optimizing vendor management across US regions.
Collaborated with engineering and finance stakeholders for many years.
Candidate ID: RES-${id}.
`;

const EXEC_JD = (id: string) => `
Director of Operations at a US logistics company (Dallas, hybrid). Position ID: JD-${id}.
10+ years operations leadership, cross-functional programs, vendor management.
`;

const CLOSED_BOOK_JD = (id: string) => `
Senior Software Engineer at Databricks (Mountain View, hybrid). Position ID: JD-${id}.
5+ years backend. Python, Spark, cloud data platforms. Compensation posted as $170k-$220k base.
`;

const CLOSED_BOOK_RESUME = (id: string) => `
Senior Software Engineer, 6 years. Candidate: RES-${id}.
Shipped Python Spark pipelines on AWS; reduced job runtime 28% and saved $800k compute.
`;

const ANTI_JD = (id: string) => `
Marketing Operations Analyst at HubSpot (Cambridge, MA, hybrid). Position ID: JD-${id}.
3+ years marketing ops, Salesforce campaigns, lifecycle reporting.
`;

const ANTI_RESUME = (id: string) => `
Marketing operations analyst, 4 years. Candidate: RES-${id}.
Ran email sends and basic lifecycle reporting at a small shop.
Limited campaign architecture experience. No Salesforce admin work.
`;

const ZH_RESUME = (id: string) => `
資深前端工程師，7 年經驗。Candidate: RES-${id}。
使用 React、TypeScript、Next.js 建置美國電商店面，checkout 轉換率提升 16%，
年度營收影響約 $2.4M。熟悉 GraphQL 與 frontend performance。
`;

const FE_JD = (id: string) => `
Senior Frontend Engineer at Airbnb (United States, hybrid). Position ID: JD-${id}.
6+ years frontend. React, TypeScript, Next.js, GraphQL, web performance.
`;

const STEALTH_JD = (id: string) => `
Founding Engineer at Project StealthKite (Seed YC W26). 4-person team.
No public domain yet. Position: JD-${id}. Distributed backend, TypeScript, AWS.
`;

const GUIDE_RESUME = (id: string) => `
Principal Specialist with 9 years scaling mission-critical platforms. Candidate: RES-${id}.
Successfully maintained 99.99% SLA during peak load, managing $12M cloud budget
across AWS Kubernetes TypeScript services.
`;

const INTEL_JD = (id: string) => `
Senior Software Engineer at Intel (Hillsboro, OR, hybrid). Position ID: JD-${id}.
Public semiconductor employer with documented 2024-2025 restructuring / layoff waves.
5+ years C++/Python, firmware or platform software.
`;

const CISCO_JD = (id: string) => `
Staff Engineer at Cisco (San Jose, hybrid RTO). Position ID: JD-${id}.
Enterprise networking. Historical layoff / restructuring coverage in recent years.
`;

const BIGTECH_RTO = (id: string, company: string) => `
Senior / Staff Specialist at ${company} (United States, hybrid 3 days onsite RTO).
Position: JD-${id}. Must scale distributed backends, Kubernetes, and cloud spend.
`;

const L6_JD = (id: string) => `
L6 Software Engineer at Amazon (Seattle, hybrid). Position ID: JD-${id}.
Staff-equivalent. Distributed backends, AWS, $180k-$210k base plus RSU and sign-on.
`;

const DEALBREAKER_JD = (id: string) => `
Software Engineer at Salesforce (San Francisco, 3 days onsite, no remote).
Position: JD-${id}. US work authorized; no sponsorship. Java, distributed systems.
`;

const LONG_JD = (id: string) =>
  `${STRIPE_JD(id)}\n${'Additional compliance appendix. '.repeat(80)}`;

const LONG_RESUME = (id: string) =>
  `${STRIPE_RESUME(id)}\n${'Additional project appendix with AWS Kubernetes Go. '.repeat(40)}`;

export function generate100Cases(): TestCase[] {
  const cases: TestCase[] = [];
  let s = 1;
  const nextS = () => `TC-S${String(s++).padStart(2, '0')}`;

  const diamondPairs = [
    { jd: STRIPE_JD, resume: STRIPE_RESUME, label: 'Stripe Staff Backend' },
    { jd: META_JD, resume: META_RESUME, label: 'Meta Ads PM' },
    { jd: FE_JD, resume: (id: string) => `
Senior Frontend Engineer, 8 years. Candidate: RES-${id}.
React, TypeScript, Next.js, GraphQL, web performance for a US marketplace (hybrid).
Improved web performance 31%, checkout conversion 16%, and $2.1M annual lift.
6+ years frontend at Airbnb-class consumer products.
`, label: 'Frontend Next.js' },
    { jd: ANALYST_JD, resume: ANALYST_RESUME, label: 'Capital One Analyst' },
  ];
  for (const [i, pair] of diamondPairs.entries()) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Diamond Match #${i + 1} (${pair.label})`,
        '鑽石米格魯',
        90,
        100,
        pair.jd(id),
        pair.resume(id),
      ),
    );
  }

  const goldMeta = [
    ['Square', 'Senior Backend Engineer', 'Go payments'],
    ['Plaid', 'Senior Backend Engineer', 'fintech APIs'],
    ['Coinbase', 'Senior Backend Engineer', 'crypto payments'],
    ['Block', 'Senior Backend Engineer', 'seller payments'],
    ['Affirm', 'Senior Backend Engineer', 'consumer credit'],
    ['Robinhood', 'Senior Backend Engineer', 'brokerage ledgers'],
    ['SoFi', 'Senior Backend Engineer', 'lending platforms'],
    ['Chime', 'Senior Backend Engineer', 'neobank rails'],
  ] as const;
  for (const [i, [company, title, domain]] of goldMeta.entries()) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Gold Match #${i + 1} (${company})`,
        '藍寶米格魯',
        75,
        89,
        `
${title} at ${company} (United States, hybrid). Position ID: JD-${id}.
5+ years backend. Go or Python, Kubernetes, AWS, ${domain}.
Distributed systems and payments-adjacent ownership.
`,
        `
Senior Backend Engineer, 6 years. Candidate: RES-${id}.
Built AWS Kubernetes services in Go for ${domain}; reduced p99 21% and saved $640k.
Partial overlap with the posted stack; no staff-level org-wide platform ownership.
`,
      ),
    );
  }

  const silverMeta = [
    'adjacent PM to analytics',
    'frontend to full-stack',
    'support-engineer to backend',
    'BI developer to product analytics',
    'QA to SDET',
    'implementation consultant to TAM',
    'ops analyst to strategy',
    'recruiter-ops to people analytics',
    'cs-lead to onboarding PM',
    'finance-ops to revenue ops',
  ];
  for (const [i, label] of silverMeta.entries()) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Silver Match #${i + 1} (${label})`,
        '翡翠米格魯',
        60,
        74,
        SWITCHER_JD(id),
        SWITCHER_RESUME(id) + ` Transition narrative: ${label}.`,
      ),
    );
  }

  const copperPairs = [
    { jd: ML_JD, resume: TEACHER_RESUME, label: 'Teacher vs NVIDIA ML' },
    { jd: ML_JD, resume: NURSE_RESUME, label: 'Nurse vs NVIDIA ML' },
    { jd: STRIPE_JD, resume: COUNSELOR_RESUME, label: 'Counselor vs Stripe Staff' },
    { jd: META_JD, resume: TEACHER_RESUME, label: 'Teacher vs Meta PM' },
    { jd: L6_JD, resume: NURSE_RESUME, label: 'Nurse vs Amazon L6' },
    { jd: FE_JD, resume: COUNSELOR_RESUME, label: 'Counselor vs Airbnb Frontend' },
  ];
  for (const [i, pair] of copperPairs.entries()) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Bronze Match #${i + 1} (${pair.label})`,
        '赤銅米格魯',
        50,
        59,
        pair.jd(id),
        pair.resume(id),
      ),
    );
  }

  for (let i = 0; i < 4; i += 1) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Metricless Executive #${i + 1}`,
        '翡翠米格魯',
        50,
        65,
        EXEC_JD(id),
        METRICLESS_RESUME(id),
        { requireZeroImpact: true },
      ),
    );
  }

  for (let i = 0; i < 4; i += 1) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Closed Book Comp Validation #${i + 1}`,
        '藍寶米格魯',
        70,
        85,
        CLOSED_BOOK_JD(id),
        CLOSED_BOOK_RESUME(id),
      ),
    );
  }

  for (let i = 0; i < 2; i += 1) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Anti-Coaching Verification #${i + 1}`,
        '翡翠米格魯',
        55,
        70,
        ANTI_JD(id),
        ANTI_RESUME(id),
      ),
    );
  }

  for (let i = 0; i < 2; i += 1) {
    const id = nextS();
    cases.push(
      snapshotCase(
        id,
        `Snapshot - Multilingual Consistency #${i + 1}`,
        '藍寶米格魯',
        75,
        85,
        FE_JD(id),
        ZH_RESUME(id),
      ),
    );
  }

  let g = 1;
  const nextG = () => `TC-G${String(g++).padStart(2, '0')}`;
  const rtoCompanies = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Nvidia'];
  for (const [i, company] of rtoCompanies.entries()) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - BigTech RTO & Org Context #${i + 1} (${company})`,
        BIGTECH_RTO(id, company),
        GUIDE_RESUME(id),
        { requireProvenance: true, requireCompBreakdown: true },
      ),
    );
  }

  const layoffJds = [INTEL_JD, CISCO_JD, INTEL_JD, CISCO_JD, INTEL_JD, CISCO_JD];
  for (const [i, jd] of layoffJds.entries()) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Public Layoff & Restructuring Risk #${i + 1}`,
        jd(id),
        GUIDE_RESUME(id),
        { requireLayoffWarning: true, requireCompBreakdown: true },
      ),
    );
  }

  for (let i = 0; i < 6; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Stealth Startup Honest Limitations #${i + 1}`,
        STEALTH_JD(id),
        GUIDE_RESUME(id),
        { requireLimitations: true, requireCompBreakdown: true },
      ),
    );
  }

  for (let i = 0; i < 6; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Staff/Director STAR Interview Playbook #${i + 1}`,
        L6_JD(id),
        GUIDE_RESUME(id),
        { minStarQuestions: 4, requireCompBreakdown: true },
      ),
    );
  }

  for (let i = 0; i < 6; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - L5/L6 Total Compensation 3-Tier Breakdown #${i + 1}`,
        L6_JD(id),
        STRIPE_RESUME(id),
        { requireCompBreakdown: true },
      ),
    );
  }

  for (let i = 0; i < 4; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Career Context Dealbreaker Conflict #${i + 1}`,
        DEALBREAKER_JD(id),
        STRIPE_RESUME(id),
        { requireDealbreakerNote: true, requireCompBreakdown: true },
        career({
          target_level: 'Senior',
          location_or_remote: 'Remote only',
          work_auth: 'Requires H-1B sponsorship',
          target_tc: '$280000',
          walk_away_tc: '$220000',
          non_negotiables: 'Remote only; must have sponsorship',
          signature_strengths: 'Distributed Go systems',
        }),
      ),
    );
  }

  for (let i = 0; i < 4; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Provenance URL Integrity Verification #${i + 1}`,
        META_JD(id),
        META_RESUME(id),
        { requireProvenance: true, requireCompBreakdown: true },
      ),
    );
  }

  for (let i = 0; i < 2; i += 1) {
    const id = nextG();
    cases.push(
      guideCase(
        id,
        `Guide - Extreme Long Payload Stress Test #${i + 1}`,
        LONG_JD(id),
        LONG_RESUME(id),
        { requireCompBreakdown: true },
      ),
    );
  }

  const sysSpecs: Array<{
    id: string;
    name: string;
    status: number;
    code?: string;
  }> = [
    { id: 'TC-SYS01', name: 'Extension DOM Capture (LinkedIn)', status: 200 },
    { id: 'TC-SYS02', name: 'Extension Reject JD < 40 chars', status: 400, code: 'JD_TOO_SHORT' },
    { id: 'TC-SYS03', name: 'Extension HMAC sid Generation', status: 200 },
    { id: 'TC-SYS04', name: 'Expired sid (>30m) Returns 410', status: 410 },
    { id: 'TC-SYS05', name: 'Extension Capture Rate Limit (60/hr)', status: 429, code: 'RATE_LIMIT' },
    { id: 'TC-SYS06', name: 'Legacy Payload Base64 Fallback', status: 200 },
    { id: 'TC-SYS07', name: 'Snapshot Free 3 Quota Depleted', status: 402, code: 'PAYMENT_REQUIRED' },
    { id: 'TC-SYS08', name: 'Guide 0 Credit Pool Isolation', status: 402, code: 'PAYMENT_REQUIRED' },
    { id: 'TC-SYS09', name: 'Gemini 500 Credit Rollback Invariant', status: 500, code: 'ANALYSIS_ERROR' },
    { id: 'TC-SYS10', name: 'Device Fingerprint Collision Limit', status: 403, code: 'DEVICE_LIMIT' },
    { id: 'TC-SYS11', name: 'PayPal Sandbox Single Order Settlement', status: 200 },
    { id: 'TC-SYS12', name: 'PayPal Webhook Duplicate Idempotency', status: 200 },
    { id: 'TC-SYS13', name: 'Subscription First Purchase Increments Balance', status: 200 },
    { id: 'TC-SYS14', name: 'Reject Forged PayPal Webhook Signature', status: 401 },
    { id: 'TC-SYS15', name: 'Supabase RLS Cross-Tenant Report Block', status: 404 },
    { id: 'TC-SYS16', name: 'Profile API Client Credits Tampering Block', status: 400 },
    { id: 'TC-SYS17', name: 'Deactivated Account Analysis Block', status: 403, code: 'ACCOUNT_DEACTIVATED' },
    { id: 'TC-SYS18', name: 'CCPA Hard Account Data Purge Cascade', status: 200 },
    { id: 'TC-SYS19', name: 'Empty Session /report Renders Clean State', status: 200 },
    { id: 'TC-SYS20', name: 'Disabled /shorts Route Safe Redirect', status: 307 },
  ];

  for (const spec of sysSpecs) {
    cases.push({
      id: spec.id,
      category: 'system_funnel',
      name: spec.name,
      resumeText: '',
      jobDescription: '',
      systemCaseId: spec.id,
      assertions: {
        expectedStatus: spec.status,
        expectedErrorCode: spec.code,
      },
    });
  }

  return cases;
}

export const testCases = generate100Cases();
