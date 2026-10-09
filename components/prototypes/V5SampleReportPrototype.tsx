'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Landmark,
  Scale,
  SearchCheck,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { SampleMark } from '@/components/SampleMark';
import { REPORT_SLIDE_SURFACE } from '@/constants/report-frame';
import type { AppLanguage } from '@/lib/language-context';

type GuideTab =
  'decision' | 'selection' | 'interview' | 'compensation' | 'sources';

interface V5SampleProps {
  language: AppLanguage;
}

const SECTION_LABEL =
  'text-sm font-bold uppercase tracking-[0.18em] text-indigo-300';
const PANEL =
  'rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 to-slate-950/80 shadow-[0_16px_45px_-32px_rgba(99,102,241,0.7)]';
const REPORT_SURFACE =
  'overflow-hidden bg-[radial-gradient(circle_at_80%_-10%,rgba(79,70,229,0.16),transparent_34%),linear-gradient(180deg,#020617_0%,#050817_100%)] shadow-[0_32px_100px_-48px_rgba(37,99,235,0.65)]';

function usePrototypeCopy(language: AppLanguage) {
  const isZh = language === 'zh-TW' || language === 'zh-CN';
  return React.useCallback(
    (zh: string, en: string) => (isZh ? zh : en),
    [isZh],
  );
}

function PrototypeDisclosure({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <p className="max-w-5xl text-sm leading-relaxed text-slate-500">
      {t(
        'AI 產生的候選人決策支援，依據你提供的履歷、職缺說明、Career Context，以及標示出的公開來源。這不是 Amazon 的招聘決定，JobBeagle 也不代表 Amazon。',
        'AI-generated candidate decision support based on the supplied resume, job description, Career Context, and cited public sources where shown. This is not an Amazon hiring decision, and JobBeagle is not affiliated with Amazon.',
      )}
    </p>
  );
}

function EvidenceBadge({
  tone,
  children,
}: {
  tone: 'verified' | 'proxy' | 'unknown';
  children: React.ReactNode;
}) {
  const tones = {
    verified: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    proxy: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    unknown: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function V5ReportHeader({
  language,
  title,
  subtitle,
}: V5SampleProps & { title: string; subtitle: string }) {
  const t = usePrototypeCopy(language);
  return (
    <header className="relative overflow-hidden border-b border-slate-700/90 px-7 py-6">
      <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className={SECTION_LABEL}>{title}</p>
          <h1 className="mt-2 flex items-center gap-3 text-4xl font-black leading-tight text-white">
            <BriefcaseBusiness className="h-7 w-7 shrink-0 text-indigo-300" />
            Senior Product Manager - Tech, Payments
          </h1>
          <p className="mt-2 flex items-center gap-2 text-xl text-slate-300">
            <Building2 className="h-5 w-5 text-slate-500" />
            Amazon · Seattle, WA / Arlington, VA
          </p>
          <p className="mt-1 text-base text-slate-500">
            {t(
              '公開職缺資料來自搜尋索引；目前 live status 尚未確認。',
              'Public job details were recovered from a search index; current live status is unverified.',
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <SampleMark />
          <span className="rounded-full border border-slate-600 bg-slate-950/80 px-4 py-2 text-sm font-bold uppercase tracking-widest text-slate-300">
            {subtitle}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <PrototypeDisclosure language={language} />
      </div>
    </header>
  );
}

function RecommendationBlock({
  language,
  pageLabel,
}: V5SampleProps & { pageLabel?: string }) {
  const t = usePrototypeCopy(language);
  return (
    <section className="border-b border-slate-700/90 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 px-7 py-6">
      <div className="grid grid-cols-[1fr_auto] gap-8">
        <div>
          {pageLabel ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {pageLabel}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <p className={SECTION_LABEL}>{t('Decision', 'Decision')}</p>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
              {t('1 項投遞前確認', '1 pre-application check')}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-300" />
            <h2 className="text-4xl font-black text-amber-100">
              {t('有條件投遞', 'Conditional go')}
            </h2>
          </div>
          <p className="mt-4 max-w-5xl text-xl leading-relaxed text-slate-200">
            {t(
              '你的支付產品、roadmap 與量化成果足以支持投遞。首要硬條件是確認 JD 明列的 Bachelor’s degree；技術決策深度與 restricted-payment 經驗則是後續甄選風險，不應被視為已證實。',
              'Your payments-product, roadmap, and quantified-impact evidence supports pursuing the role. The first hard gate is the JD’s stated bachelor’s-degree requirement; technical-decision depth and restricted-payment experience remain selection risks, not proven strengths.',
            )}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-base">
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">
              <span className="font-bold">
                {t('符合學位條件 → ', 'Degree confirmed → ')}
              </span>
              {t(
                '確認職缺仍有效後投遞。',
                'Confirm the role is still live, then apply.',
              )}
            </p>
            <p className="rounded-lg border border-slate-600 bg-slate-950/60 px-4 py-3 text-slate-300">
              <span className="font-bold">
                {t('不符合學位條件 → ', 'No degree → ')}
              </span>
              {t(
                '先確認是否接受 equivalent experience。',
                'Ask whether equivalent experience is accepted.',
              )}
            </p>
          </div>
        </div>
        <div className="flex min-w-52 flex-col items-center justify-center rounded-2xl border border-indigo-400/40 bg-slate-950/70 px-7 py-5 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {t('Fit Score', 'Fit Score')}
          </p>
          <p className="mt-1 text-7xl font-black tabular-nums text-indigo-200">
            76
          </p>
          <p className="text-xl font-bold text-white">
            {t('具競爭力', 'Competitive')}
          </p>
          <p className="mt-3 max-w-48 text-xs leading-relaxed text-slate-500">
            {t(
              '啟發式匹配指數，不是錄取機率',
              'Heuristic match index—not a hiring probability',
            )}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {t('證據信心：中等', 'Evidence confidence: Medium')}
          </p>
        </div>
      </div>
    </section>
  );
}

function RequirementCard({
  language,
  title,
  status,
  requirement,
  evidence,
  consequence,
}: V5SampleProps & {
  title: string;
  status: 'unknown' | 'adjacent';
  requirement: string;
  evidence: string;
  consequence: string;
}) {
  const t = usePrototypeCopy(language);
  const unknown = status === 'unknown';
  return (
    <article className={`${PANEL} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-bold ${
            unknown
              ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
              : 'border-sky-400/40 bg-sky-500/10 text-sky-200'
          }`}
        >
          {unknown ? t('未確認', 'Unknown') : t('相鄰證據', 'Adjacent')}
        </span>
      </div>
      <p className="mt-3 border-l-2 border-slate-600 pl-3 text-sm leading-relaxed text-slate-400">
        “{requirement}”
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-base leading-relaxed">
        <div className="rounded-lg bg-slate-950/45 p-3">
          <dt className="font-bold text-slate-400">
            {t('履歷目前證明', 'What your resume proves')}
          </dt>
          <dd className="mt-1 text-slate-300">{evidence}</dd>
        </div>
        <div className="rounded-lg bg-slate-950/45 p-3">
          <dt className="font-bold text-slate-400">
            {t('你接下來要做', 'What to do')}
          </dt>
          <dd className="mt-1 text-slate-300">{consequence}</dd>
        </div>
      </dl>
    </article>
  );
}

function SnapshotBody({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <>
      <RecommendationBlock language={language} />

      <div className="grid grid-cols-2 divide-x divide-slate-700/90 border-b border-slate-700/90">
        <section className="p-7">
          <p className={SECTION_LABEL}>
            {t('Qualification gates', 'Qualification gates')}
          </p>
          <div className="mt-4 space-y-4">
            <RequirementCard
              language={language}
              title={t('Bachelor’s degree', 'Bachelor’s degree')}
              status="unknown"
              requirement="Bachelor’s degree"
              evidence={t(
                '履歷沒有列出學位資料。材料未提供證據，不代表候選人沒有學位。',
                'The resume does not list degree information. Missing evidence does not mean the candidate lacks the degree.',
              )}
              consequence={t(
                '這是明列的 Basic Qualification；先由候選人確認。',
                'This is a stated Basic Qualification; the candidate should verify it first.',
              )}
            />
            <RequirementCard
              language={language}
              title={t(
                'Technical product strategy',
                'Technical product strategy',
              )}
              status="adjacent"
              requirement="Experience contributing to engineering discussions around technology decisions and strategy related to a product"
              evidence={t(
                '與 engineering、risk、legal 推出 card-retry 與 ACH exception workflow；未說明親自主張的 architecture、API 或 system tradeoff。',
                'Shipped card-retry and ACH exception workflows with engineering, risk, and legal; the resume does not identify a specific architecture, API, or system tradeoff the candidate influenced.',
              )}
              consequence={t(
                '不阻止投遞，但會是主要面試證據問題。',
                'Not an application blocker, but a primary interview evidence question.',
              )}
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            {t(
              '材料對其他已識別的 Basic Qualifications 有支持證據；這不代表 JobBeagle 已獨立驗證。',
              'The materials contain supporting evidence for the other identified Basic Qualifications; this is not independent verification.',
            )}
          </p>
        </section>

        <section className="p-7">
          <p className={SECTION_LABEL}>
            {t('Advancement case', 'Advancement case')}
          </p>
          <p className="mt-4 text-xl leading-relaxed text-slate-200">
            {t(
              '你的核心優勢不是泛用的「跨部門合作」，而是已在支付產品中擁有 roadmap，並把 card-retry／ACH workflow 轉成 2.1 個百分點的 payment-success improvement。這組「支付領域＋端到端交付＋量化結果」足以支持進入 recruiter screen。',
              'Your case is not generic cross-functional collaboration. You owned a payments roadmap and converted card-retry and ACH workflow work into a 2.1-point payment-success improvement. That combination supports a credible recruiter-screen case.',
            )}
          </p>
          <div className="mt-5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5">
            <p className="font-bold text-indigo-100">
              {t('最重要的準備問題', 'Most important evidence question')}
            </p>
            <p className="mt-2 text-lg text-slate-200">
              {t(
                '你需要證明自己不只是協調 engineering，而是曾參與具體技術決策與 tradeoff。',
                'You need to prove that you did more than coordinate engineering—that you influenced a specific technical decision and tradeoff.',
              )}
            </p>
          </div>
          <div className="mt-5">
            <p className="font-bold text-slate-300">
              {t('Do not overstate', 'Do not overstate')}
            </p>
            <ul className="mt-2 space-y-2 text-base text-slate-400">
              <li>
                •{' '}
                {t(
                  'ACH exception workflow 不等於 SNAP ownership。',
                  'ACH exception workflow is not SNAP ownership.',
                )}
              </li>
              <li>
                •{' '}
                {t(
                  '與 engineering 合作不等於 architecture ownership。',
                  'Working with engineering is not architecture ownership.',
                )}
              </li>
              <li>
                •{' '}
                {t(
                  'VP steering committee 不等於 regulator engagement。',
                  'A VP steering committee is not regulator engagement.',
                )}
              </li>
            </ul>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-[1.35fr_1fr] divide-x divide-slate-700/90 border-b border-slate-700/90">
        <div className="p-7">
          <p className={SECTION_LABEL}>
            {t('Compensation check', 'Compensation check')}
          </p>
          <div className="mt-4 flex items-start gap-4">
            <CircleDollarSign className="h-10 w-10 shrink-0 text-amber-300" />
            <div>
              <h3 className="text-2xl font-bold text-white">
                {t(
                  '目前無法判斷是否能跨過 $260K TC 底線',
                  'Cannot yet determine whether the role clears the $260K TC floor',
                )}
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-slate-300">
                {t(
                  '搜尋索引中的 JD 顯示跨美國地區 base $136.1K–$235.2K，並可能另含 equity／sign-on。Base range 不能直接和 $300K Target TC 或 $260K Walk-away TC 比較。',
                  'The indexed JD shows a cross-US base range of $136.1K–$235.2K and possible equity/sign-on. A base-only range cannot be compared directly with the $300K target or $260K walk-away TC.',
                )}
              </p>
              <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-base text-slate-400">
                {t(
                  '需要確認：internal level、Seattle／Arlington location band、first-year sign-on、equity vesting 與 steady-state TC。',
                  'Need to confirm: internal level, Seattle/Arlington location band, first-year sign-on, equity vesting, and steady-state TC.',
                )}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <EvidenceBadge tone="verified">
                    {t('個人底線', 'Your floor')}
                  </EvidenceBadge>
                  <p className="mt-2 text-xl font-black text-white">$260K TC</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <EvidenceBadge tone="verified">
                    {t('職缺揭露', 'Job posting')}
                  </EvidenceBadge>
                  <p className="mt-2 text-xl font-black text-white">
                    $136.1K–$235.2K
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('Base，非 TC', 'Base, not TC')}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <EvidenceBadge tone="unknown">
                    {t('比較結果', 'Comparison')}
                  </EvidenceBadge>
                  <p className="mt-2 text-xl font-black text-amber-100">
                    {t('尚不能判斷', 'Not yet comparable')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-7">
          <p className={SECTION_LABEL}>
            {t('五維摘要', 'Five-dimension summary')}
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                label: t('硬條件／可行性', 'Hard requirements'),
                status: t('部分證據', 'Partial'),
                tone: 'unknown' as const,
              },
              {
                label: t('職級／範圍／年資', 'Level / scope / tenure'),
                status: t('有支持', 'Supported'),
                tone: 'verified' as const,
              },
              {
                label: t('核心產品能力', 'Core product skills'),
                status: t('有支持', 'Supported'),
                tone: 'verified' as const,
              },
              {
                label: t('支付領域', 'Payments domain'),
                status: t('有支持', 'Supported'),
                tone: 'verified' as const,
              },
              {
                label: t('量化成果', 'Proven impact'),
                status: t('強證據', 'Strong evidence'),
                tone: 'verified' as const,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <EvidenceBadge tone={item.tone}>{item.status}</EvidenceBadge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-7 py-6">
        <p className={SECTION_LABEL}>
          {t('24-hour action plan', '24-hour action plan')}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            t(
              '確認 Bachelor’s degree 條件。',
              'Confirm the bachelor’s-degree requirement.',
            ),
            t(
              '確認職缺仍有效；若符合條件就投遞。',
              'Confirm the role is still live; if eligible, apply.',
            ),
            t(
              '準備一個 technical tradeoff ownership 的 payment story。',
              'Prepare one payments story that proves technical tradeoff ownership.',
            ),
          ].map((item, index) => (
            <div key={item} className={`${PANEL} flex items-start gap-3 p-4`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-black text-indigo-200">
                {index + 1}
              </span>
              <p className="text-base leading-relaxed text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function V5SampleSnapshot({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <article className={`${REPORT_SURFACE} ${REPORT_SLIDE_SURFACE}`}>
      <V5ReportHeader
        language={language}
        title={t('Job Fit Snapshot', 'Job Fit Snapshot')}
        subtitle={t('專業範例', 'Professional sample')}
      />
      <SnapshotBody language={language} />
    </article>
  );
}

function GuidePageHeader({
  language,
  eyebrow,
  title,
  description,
  icon,
}: V5SampleProps & {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-slate-700/90 px-7 py-6">
      <span className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3 text-indigo-200">
        {icon}
      </span>
      <div>
        <p className={SECTION_LABEL}>{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-black text-white">{title}</h2>
        <p className="mt-2 max-w-5xl text-lg leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function DecisionBrief({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <>
      <RecommendationBlock
        language={language}
        pageLabel={t(
          '第 1 頁，共 5 頁 · 決策摘要',
          'Page 1 of 5 · Decision Brief',
        )}
      />
      <section className="grid grid-cols-2 divide-x divide-slate-700/90">
        <div className="p-7">
          <p className={SECTION_LABEL}>
            {t('External research check', 'External research check')}
          </p>
          <p className="mt-3 text-3xl font-black text-slate-100">
            {t('決策不變', 'Decision unchanged')}
          </p>
          <p className="mt-2 text-lg text-slate-400">
            {t(
              '外部資料釐清了薪資可比性，但沒有解除 team-level 的不確定性。',
              'External data clarified compensation comparability but did not resolve team-level uncertainty.',
            )}
          </p>
          <ul className="mt-5 space-y-3 text-lg text-slate-300">
            <li>
              •{' '}
              {t(
                '公開薪酬只能在 internal level 確認後使用。',
                'Public compensation is usable only after the internal level is confirmed.',
              )}
            </li>
            <li>
              •{' '}
              {t(
                '沒有找到直接支持目標 team 穩定性或工作方式的資料。',
                'No decision-grade evidence was found for the target team’s stability or operating model.',
              )}
            </li>
          </ul>
        </div>
        <div className="p-7">
          <p className={SECTION_LABEL}>{t('Pursuit plan', 'Pursuit plan')}</p>
          <ol className="mt-4 space-y-4">
            {[
              t('確認學位後投遞。', 'Confirm the degree, then apply.'),
              t(
                'Recruiter screen 先確認 level、location band 與 package mix。',
                'Use the recruiter screen to confirm level, location band, and package mix.',
              ),
              t(
                '面試準備集中在 technical product judgment。',
                'Focus interview preparation on technical product judgment.',
              ),
            ].map((item, index) => (
              <li
                key={item}
                className={`${PANEL} flex items-center gap-4 p-4 text-lg text-slate-200`}
              >
                <span className="font-black text-indigo-300">{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function RoleSelectionPage({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <>
      <GuidePageHeader
        language={language}
        eyebrow={t('Page 2 of 5', 'Page 2 of 5')}
        title={t('Role & Selection', 'Role & Selection')}
        description={t(
          '這個職位要交付什麼，以及你為什麼可能進入下一輪。',
          'What this hire must deliver, and why your evidence may advance you.',
        )}
        icon={<Target className="h-7 w-7" />}
      />
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 p-7">
        <section className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t('The hiring mandate', 'The hiring mandate')}
          </p>
          <p className="mt-4 text-xl leading-relaxed text-slate-200">
            {t(
              '擁有北美支付接受與客戶體驗 roadmap，在 customer access、purchase success、cost、compliance 與技術限制之間做產品取捨。',
              'Own the North America payments-acceptance roadmap and make product tradeoffs across customer access, purchase success, cost, compliance, and technical constraints.',
            )}
          </p>
          <ol className="mt-5 space-y-4 text-lg text-slate-300">
            <li>
              <span className="font-bold text-white">1.</span>{' '}
              {t(
                '建立 restricted-payment roadmap 與 success metrics。',
                'Build a restricted-payment roadmap and success metrics.',
              )}
            </li>
            <li>
              <span className="font-bold text-white">2.</span>{' '}
              {t(
                '協調 engineering、business、design 與 compliance 完成 launch。',
                'Coordinate engineering, business, design, and compliance through launch.',
              )}
            </li>
            <li>
              <span className="font-bold text-white">3.</span>{' '}
              {t(
                '用 payment data 和 technical constraints 排定優先順序。',
                'Prioritize with payment data and technical constraints.',
              )}
            </li>
          </ol>
          <p className="mt-5 text-sm text-slate-500">
            {t(
              'Basis：JD + JobBeagle assessment',
              'Basis: JD + JobBeagle assessment',
            )}
          </p>
        </section>
        <section className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t('Your recruiter case', 'Your recruiter case')}
          </p>
          <p className="mt-4 text-xl leading-relaxed text-slate-200">
            {t(
              '4 年 payments ownership、約 $420M 年交易量範圍，以及 2.1 個百分點的 payment-success improvement，能直接支持 roadmap、delivery 與 payment KPI 三個甄選標準。',
              'Four years of payments ownership, roughly $420M in annual volume, and a 2.1-point payment-success improvement directly support the roadmap, delivery, and payments-KPI selection criteria.',
            )}
          </p>
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
            <p className="font-bold text-amber-100">
              {t(
                'Most important evidence question',
                'Most important evidence question',
              )}
            </p>
            <p className="mt-2 text-lg text-slate-200">
              {t(
                '你對 technology decisions／strategy 的直接貢獻有多深？',
                'How deep was your direct contribution to technology decisions and strategy?',
              )}
            </p>
          </div>
        </section>
      </div>
      <section className="px-7 pb-7">
        <div className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t(
              'Unknowns to resolve in the first call',
              'Unknowns to resolve in the first call',
            )}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              t('Internal level 尚未確認。', 'Internal level is unconfirmed.'),
              t(
                'Growth、backfill 或 team reallocation 尚未確認。',
                'Growth, backfill, or team reallocation is unconfirmed.',
              ),
              t(
                'Government-benefit 是 day-one expectation 或可延伸能力尚未確認。',
                'Whether government-benefit experience is day-one or learnable is unconfirmed.',
              ),
            ].map((item) => (
              <p
                key={item}
                className="rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-base text-slate-300"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ProofTheme({
  language,
  number,
  title,
  judgment,
  evidence,
  probes,
  action,
  warning,
}: V5SampleProps & {
  number: number;
  title: string;
  judgment: string;
  evidence: string;
  probes: string[];
  action: string;
  warning: string;
}) {
  const t = usePrototypeCopy(language);
  return (
    <article className={`${PANEL} p-5`}>
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xl font-black text-indigo-200">
          {number}
        </span>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-300">
            {judgment}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-base">
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="font-bold text-emerald-200">
            {t('最適合使用的故事', 'Best story to use')}
          </p>
          <p className="mt-1 text-slate-300">{evidence}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
          <p className="font-bold text-slate-300">
            {t('可能的追問', 'Likely follow-ups')}
          </p>
          <ul className="mt-1 space-y-1 text-slate-400">
            {probes.map((probe) => (
              <li key={probe}>• {probe}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
        <span className="font-bold">
          {t('準備動作：', 'Preparation action: ')}
        </span>
        {action}
      </div>
      <p className="mt-4 border-l-2 border-amber-400/70 pl-3 text-sm text-amber-100">
        <span className="font-bold">
          {t('回答界線：', 'Answer boundary: ')}
        </span>
        {warning}
      </p>
    </article>
  );
}

function InterviewPage({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <>
      <GuidePageHeader
        language={language}
        eyebrow={t('Page 3 of 5', 'Page 3 of 5')}
        title={t('Interview Proof Plan', 'Interview Proof Plan')}
        description={t(
          '不是猜題；用履歷事實證明最可能被驗證的三個判斷。',
          'Not a question dump: prove the three judgments most likely to be tested using real resume evidence.',
        )}
        icon={<ShieldCheck className="h-7 w-7" />}
      />
      <div className="grid grid-cols-3 gap-5 p-7">
        <ProofTheme
          language={language}
          number={1}
          title={t('Technical product judgment', 'Technical product judgment')}
          judgment={t(
            '證明你能在 payment success、reliability、fraud、cost 與 engineering complexity 間做取捨。',
            'Prove you can trade off payment success, reliability, fraud, cost, and engineering complexity.',
          )}
          evidence={t(
            'Card-retry 與 ACH exception workflow；2.1pp payment-success improvement。',
            'Card-retry and ACH exception workflow; 2.1-point payment-success improvement.',
          )}
          probes={[
            'Which constraint changed your preferred solution?',
            'What did engineering disagree with?',
          ]}
          action={t(
            '補上你親自做出的技術取捨、反對意見，以及方案改變的原因。',
            'Write down the technical tradeoff you personally made, the disagreement, and why the solution changed.',
          )}
          warning={t(
            '合作交付不等於 architecture ownership。',
            'Cross-functional delivery is not architecture ownership.',
          )}
        />
        <ProofTheme
          language={language}
          number={2}
          title={t('Payments domain judgment', 'Payments domain judgment')}
          judgment={t(
            '證明既有 card／ACH 經驗如何轉移到 restricted payment methods。',
            'Show how card/ACH experience transfers to restricted payment methods.',
          )}
          evidence={t(
            'ACH exception、reconciliation roadmap、risk／legal cooperation。',
            'ACH exception handling, reconciliation roadmap, and risk/legal collaboration.',
          )}
          probes={[
            'What changes with a restricted tender?',
            'Which compliance partner would you involve first?',
          ]}
          action={t(
            '準備一張 transferable／non-transferable 經驗清單，避免把 card／ACH 經驗說成 SNAP 經驗。',
            'Prepare a transferable-versus-non-transferable list so card/ACH experience is not overstated as SNAP experience.',
          )}
          warning={t(
            '不要聲稱過去擁有 SNAP／government-benefit product。',
            'Do not claim prior SNAP or government-benefit ownership.',
          )}
        />
        <ProofTheme
          language={language}
          number={3}
          title={t('Executive prioritization', 'Executive prioritization')}
          judgment={t(
            '證明你能在沒有直接權限時，建立共同優先順序。',
            'Prove you can align priorities without direct authority.',
          )}
          evidence={t(
            '每季向 VP steering committee 提案。',
            'Quarterly presentations to a VP steering committee.',
          )}
          probes={[
            'Who disagreed and what changed the decision?',
            'What did you deprioritize?',
          ]}
          action={t(
            '補上反對者、被放棄的選項，以及你用哪個指標促成決策。',
            'Add the dissenter, the option you deprioritized, and the metric that changed the decision.',
          )}
          warning={t(
            '內部 VP committee 不等於 regulator engagement。',
            'An internal VP committee is not regulator engagement.',
          )}
        />
      </div>
      <section className="grid grid-cols-2 gap-5 px-7 pb-7">
        <div className={`${PANEL} p-5`}>
          <p className={SECTION_LABEL}>
            {t('90 秒回答骨架', '90-second answer structure')}
          </p>
          <ol className="mt-3 grid grid-cols-4 gap-2 text-sm text-slate-300">
            {[
              t('15 秒：情境與目標', '15s · Context + goal'),
              t('25 秒：你的判斷', '25s · Your decision'),
              t('30 秒：取捨與阻力', '30s · Tradeoff + tension'),
              t('20 秒：結果與反思', '20s · Result + learning'),
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-lg border border-slate-700 bg-slate-950/55 p-3"
              >
                <span className="mr-1 font-black text-indigo-300">
                  {index + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-500">
            {t(
              '沒有找到可重現的 team-specific 題目，因此不以泛用 Amazon 題庫冒充情報。',
              'No reproducible team-specific questions were found, so generic Amazon questions are not presented as intelligence.',
            )}
          </p>
        </div>
        <div className={`${PANEL} p-5`}>
          <p className={SECTION_LABEL}>
            {t('Questions to ask', 'Questions to ask')}
          </p>
          <ul className="mt-3 space-y-2 text-base text-slate-300">
            <li>
              • What are the first two payment outcomes this hire must improve?
            </li>
            <li>
              • Which technical or compliance dependency delays the roadmap?
            </li>
            <li>
              • How does the loop test product judgment versus architecture
              depth?
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function CompensationPage({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  return (
    <>
      <GuidePageHeader
        language={language}
        eyebrow={t('Page 4 of 5', 'Page 4 of 5')}
        title={t('Compensation & Offer', 'Compensation & Offer')}
        description={t(
          '先判斷資料是否可比，再談 anchor；不把公開數字冒充 Amazon offer。',
          'Test comparability before anchoring; never present public data as an Amazon offer.',
        )}
        icon={<Scale className="h-7 w-7" />}
      />
      <div className="grid grid-cols-[0.9fr_1.1fr] gap-5 p-7">
        <section className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>{t('Floor test', 'Floor test')}</p>
          <div className="mt-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-300" />
            <h3 className="text-3xl font-black text-amber-100">
              {t('Partially comparable', 'Partially comparable')}
            </h3>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            {t(
              '公開資料顯示 $300K Target TC 可能落在 Amazon Senior PM 的自報情境內，但 requisition level 尚未確認，因此不能當成可直接使用的 market anchor。',
              'Public data suggests the $300K target may fit a self-reported Amazon Senior PM scenario, but the requisition level is unconfirmed, so it is not yet a defensible market anchor.',
            )}
          </p>
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-base text-slate-300">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
              <EvidenceBadge tone="verified">
                {t('職缺揭露', 'Job posting')}
              </EvidenceBadge>
              <p>$136.1K–$235.2K cross-US base</p>
              <EvidenceBadge tone="proxy">
                {t('自報參考', 'Self-reported proxy')}
              </EvidenceBadge>
              <p>Amazon PM L6, high-$200Ks to low-$300Ks annual TC</p>
              <EvidenceBadge tone="unknown">
                {t('尚未確認', 'Unconfirmed')}
              </EvidenceBadge>
              <p>
                internal level, first-year sign-on, vesting, location adjustment
              </p>
            </div>
          </div>
        </section>
        <section className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t('Negotiation sequence', 'Negotiation sequence')}
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              t('Discover level', 'Discover level'),
              t('Confirm location band', 'Confirm location band'),
              t('Compare package mix', 'Compare package mix'),
              t('Validate comparator', 'Validate comparator'),
              t('Anchor / counter', 'Anchor / counter'),
            ].map((step, index) => (
              <div
                key={step}
                className="flex min-h-28 flex-col justify-between rounded-lg border border-slate-700 bg-slate-950/60 p-3"
              >
                <span className="text-sm font-black text-indigo-300">
                  {index + 1}
                </span>
                <p className="text-sm font-bold text-slate-200">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5">
            <p className="font-bold text-indigo-100">
              {t('Recruiter wording', 'Recruiter wording')}
            </p>
            <p className="mt-2 text-lg leading-relaxed text-slate-200">
              “Before I anchor, could you confirm the internal level and the
              first-year mix across base, sign-on, and vested equity? If this
              role maps to the public L6 comparator set, my target is around
              $300K total compensation, but I want to compare the package on the
              same first-year and steady-state basis.”
            </p>
          </div>
        </section>
      </div>
      <section className="px-7 pb-7">
        <p className={SECTION_LABEL}>
          {t('Offer decision rules', 'Offer decision rules')}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-5">
          {[
            [
              t('先統一比較口徑', 'Normalize first'),
              t(
                '分別計算第一年 TC 與穩態 TC；不要用 sign-on 掩蓋後續落差。',
                'Calculate first-year and steady-state TC separately; do not let sign-on hide a later drop.',
              ),
            ],
            [
              t('何時 counter', 'When to counter'),
              t(
                '職級與地點確認後，若 package 低於 $300K target，先用可比市場資料與 payments impact 提出調整。',
                'After level and location are confirmed, counter below the $300K target using comparable market data and payments impact.',
              ),
            ],
            [
              t('何時停止', 'When to walk away'),
              t(
                'Best-and-final 的穩態 TC 若仍低於 $260K 底線，除非你主動修改 Career Context，否則停止談判。',
                'If best-and-final steady-state TC remains below the $260K floor, stop unless you intentionally revise your Career Context.',
              ),
            ],
          ].map(([title, body], index) => (
            <div key={title} className={`${PANEL} p-5`}>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-black text-indigo-200">
                  {index + 1}
                </span>
                <p className="font-bold text-white">{title}</p>
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-400">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SourcesPage({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  const sources = [
    {
      title: 'Amazon indexed job description',
      url: 'https://www.amazon.jobs/en/jobs/2937950/senior-product-manager-tech-north-america-payments-acceptance-experience',
      tone: 'verified' as const,
      tag: t(
        'Indexed copy · Live status unverified',
        'Indexed copy · Live status unverified',
      ),
      supports: t(
        'Responsibilities、Basic Qualifications、location、cross-US base range',
        'Responsibilities, Basic Qualifications, location, and cross-US base range',
      ),
      limit: t(
        '不能僅憑搜尋索引聲稱職缺仍在招聘。',
        'The search index does not establish that the role is still live.',
      ),
    },
    {
      title: 'Levels.fyi — Amazon Product Manager, United States',
      url: 'https://www.levels.fyi/companies/amazon/salaries/product-manager/locations/united-states',
      tone: 'proxy' as const,
      tag: t(
        'Self-reported · Scenario proxy',
        'Self-reported · Scenario proxy',
      ),
      supports: t(
        'L6 compensation composition 與 approximate annual TC context',
        'L6 compensation composition and approximate annual TC context',
      ),
      limit: t(
        'Requisition level 未確認；不同更新頁面的數值與 taxonomy 可能不同。',
        'Requisition level is unconfirmed; values and taxonomy vary by update page.',
      ),
    },
    {
      title: 'Reuters — Amazon corporate workforce reductions',
      url: 'https://www.reuters.com/legal/litigation/amazon-cuts-16000-jobs-globally-broader-restructuring-2026-01-28/',
      tone: 'proxy' as const,
      tag: t('Company-level only', 'Company-level only'),
      supports: t(
        '約 30,000 corporate reductions across rounds',
        'Approximately 30,000 corporate reductions across rounds',
      ),
      limit: t(
        '沒有證據直接連結 Payments Acceptance team。',
        'No evidence directly links the target Payments Acceptance team.',
      ),
    },
  ];
  return (
    <>
      <GuidePageHeader
        language={language}
        eyebrow={t('Page 5 of 5', 'Page 5 of 5')}
        title={t('Employer Checks & Sources', 'Employer Checks & Sources')}
        description={t(
          '只保留會改變決策的公司訊號，並把證據範圍與限制放在同一畫面。',
          'Keep only decision-relevant employer signals, with scope and limitations visible alongside each source.',
        )}
        icon={<SearchCheck className="h-7 w-7" />}
      />
      <section className="grid grid-cols-2 gap-5 p-7">
        <div className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t('Team diligence checklist', 'Team diligence checklist')}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <SearchCheck className="h-8 w-8 shrink-0 text-indigo-300" />
            <div>
              <p className="text-xl font-bold text-white">
                {t(
                  '在流程中取得三個答案',
                  'Get three answers during the process',
                )}
              </p>
              <ul className="mt-3 space-y-2 text-base leading-relaxed text-slate-300">
                <li>
                  •{' '}
                  {t(
                    '這是 growth、backfill 或 team reallocation？',
                    'Is this growth, backfill, or team reallocation?',
                  )}
                </li>
                <li>
                  •{' '}
                  {t(
                    '前 6 個月最重要的兩個 payment outcomes 是什麼？',
                    'Which two payment outcomes matter most in the first six months?',
                  )}
                </li>
                <li>
                  •{' '}
                  {t(
                    'Manager tenure、決策方式與實際 RTO 規範為何？',
                    'What are the manager tenure, decision model, and actual RTO expectations?',
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className={`${PANEL} p-6`}>
          <p className={SECTION_LABEL}>
            {t('External context boundary', 'External context boundary')}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <Landmark className="h-8 w-8 shrink-0 text-amber-300" />
            <div>
              <p className="text-xl font-bold text-white">
                {t(
                  '公司級裁員不是 team-level 證據',
                  'Company layoffs are not team-level evidence',
                )}
              </p>
              <p className="mt-2 text-lg leading-relaxed text-slate-300">
                {t(
                  'Reuters 的公司級報導只能提供背景，不能證明 Payments Acceptance team 不穩定。由於沒有可重現的 team headcount、attrition 或 manager-tenure 資料，此訊號不改變投遞建議。',
                  'Reuters provides company-level context, not evidence that Payments Acceptance is unstable. With no reproducible team headcount, attrition, or manager-tenure data, this signal does not change the pursuit decision.',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="px-7 pb-7">
        <p className={SECTION_LABEL}>
          {t(
            'Source audit · Retrieved 2026-10-06',
            'Source audit · Retrieved 2026-10-06',
          )}
        </p>
        <div className="mt-4 space-y-4">
          {sources.map((source, index) => (
            <article
              key={source.url}
              className={`${PANEL} grid grid-cols-[auto_1fr_auto] items-start gap-4 p-5`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-black text-slate-300">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{source.title}</h3>
                <div className="mt-2">
                  <EvidenceBadge tone={source.tone}>{source.tag}</EvidenceBadge>
                </div>
                <p className="mt-3 text-base text-slate-300">
                  <span className="font-bold">
                    {t('Supports：', 'Supports: ')}
                  </span>
                  {source.supports}
                </p>
                <p className="mt-1 text-base text-slate-500">
                  <span className="font-bold">
                    {t('Limitation：', 'Limitation: ')}
                  </span>
                  {source.limit}
                </p>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                aria-label={t(
                  `開啟來源：${source.title}`,
                  `Open source: ${source.title}`,
                )}
                className="rounded-lg border border-slate-600 p-2 text-slate-300 transition hover:border-indigo-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function V5SampleGuide({ language }: V5SampleProps) {
  const t = usePrototypeCopy(language);
  const [tab, setTab] = React.useState<GuideTab>('decision');
  const tabs: Array<{ id: GuideTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'decision',
      label: t('Decision Brief', 'Decision Brief'),
      icon: <FileCheck2 className="h-5 w-5" />,
    },
    {
      id: 'selection',
      label: t('Role & Selection', 'Role & Selection'),
      icon: <Target className="h-5 w-5" />,
    },
    {
      id: 'interview',
      label: t('Interview Proof Plan', 'Interview Proof Plan'),
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      id: 'compensation',
      label: t('Compensation & Offer', 'Compensation & Offer'),
      icon: <Scale className="h-5 w-5" />,
    },
    {
      id: 'sources',
      label: t('Employer Checks & Sources', 'Employer Checks & Sources'),
      icon: <SearchCheck className="h-5 w-5" />,
    },
  ];

  return (
    <article className={`${REPORT_SURFACE} ${REPORT_SLIDE_SURFACE}`}>
      <V5ReportHeader
        language={language}
        title={t('Interview Strategy Guide', 'Interview Strategy Guide')}
        subtitle={t('五頁專業範例', 'Five-page professional sample')}
      />
      <nav
        aria-label={t('Guide 頁面', 'Guide pages')}
        role="tablist"
        className="grid grid-cols-5 gap-2 border-b border-slate-700/90 bg-slate-900/70 px-6 py-4"
      >
        {tabs.map((item, index) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              id={`guide-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`guide-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`group inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                active
                  ? 'border-indigo-400 bg-indigo-500/20 text-white shadow-[0_10px_30px_-18px_rgba(129,140,248,0.9)]'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className={`tabular-nums ${active ? 'text-indigo-200' : 'text-slate-600 group-hover:text-slate-400'}`}
              >
                0{index + 1}
              </span>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div
        key={tab}
        id={`guide-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`guide-tab-${tab}`}
        className="motion-safe:animate-fade-in"
      >
        {tab === 'decision' ? <DecisionBrief language={language} /> : null}
        {tab === 'selection' ? <RoleSelectionPage language={language} /> : null}
        {tab === 'interview' ? <InterviewPage language={language} /> : null}
        {tab === 'compensation' ? (
          <CompensationPage language={language} />
        ) : null}
        {tab === 'sources' ? <SourcesPage language={language} /> : null}
      </div>
    </article>
  );
}
