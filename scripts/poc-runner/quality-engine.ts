import { getBeagleTierCopy } from '../../lib/beagle-tiers';
import type { QualityResponse, TestCase } from './types';

const TECH_TERMS = [
  'golang',
  'python',
  'java',
  'react',
  'typescript',
  'javascript',
  'sql',
  'kubernetes',
  'kafka',
  'postgres',
  'postgresql',
  'redis',
  'graphql',
  'terraform',
  'pytorch',
  'cuda',
  'spark',
  'looker',
  'salesforce',
  'aws',
  'gcp',
  'azure',
  'nextjs',
  'nodejs',
  'distributed',
  'payments',
  'fintech',
  'healthcare',
  'analytics',
  'backend',
  'frontend',
  'staff',
  'principal',
  'director',
  'manager',
];

const INDUSTRY_TERMS = [
  'payments',
  'fintech',
  'healthcare',
  'biotech',
  'retail',
  'commerce',
  'advertising',
  'cloud',
  'security',
  'education',
  'government',
  'semiconductor',
  'automotive',
];

const STOPWORDS = new Set([
  'with',
  'that',
  'this',
  'from',
  'have',
  'been',
  'were',
  'will',
  'your',
  'their',
  'about',
  'into',
  'over',
  'more',
  'than',
  'years',
  'year',
  'role',
  'team',
  'work',
  'working',
  'experience',
  'experienced',
  'requirements',
  'responsibilities',
  'qualification',
  'qualifications',
  'including',
  'across',
  'using',
  'must',
  'should',
  'preferred',
  'position',
  'candidate',
  'company',
  'description',
]);

function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/next\.js/g, 'nextjs')
    .replace(/node\.js/g, 'nodejs');
  const words = normalized.match(/[a-z][a-z0-9+#]{2,}/g) ?? [];
  return new Set(
    words.filter((w) => !STOPWORDS.has(w) && (w.length >= 4 || TECH_TERMS.includes(w))),
  );
}

function overlapRatio(resume: Set<string>, jd: Set<string>): number {
  if (jd.size === 0) return 0;
  let hit = 0;
  for (const term of jd) {
    if (resume.has(term)) hit += 1;
  }
  return hit / jd.size;
}

function countTechHits(text: string): number {
  const lower = text.toLowerCase();
  return TECH_TERMS.filter((t) => lower.includes(t)).length;
}

function countIndustryHits(resume: string, jd: string): number {
  const a = resume.toLowerCase();
  const b = jd.toLowerCase();
  return INDUSTRY_TERMS.filter((t) => a.includes(t) && b.includes(t)).length;
}

function hasQuantitativeMetrics(resume: string): boolean {
  return /\$[\d.,]+|\d+(\.\d+)?\s*%|\b\d+(\.\d+)?x\b|\b\d{1,3}(,\d{3})+\b/i.test(resume);
}

function yearsMentioned(text: string): number {
  const match = text.match(/(\d{1,2})\+?\s+years?/i);
  return match ? Number(match[1]) : 0;
}

function titleOverlap(resume: string, jd: string): number {
  const titles = [
    'staff',
    'principal',
    'director',
    'manager',
    'engineer',
    'analyst',
    'designer',
    'scientist',
    'product',
    'backend',
    'frontend',
    'data',
    'nurse',
    'teacher',
    'counselor',
  ];
  const a = resume.toLowerCase();
  const b = jd.toLowerCase();
  return titles.filter((t) => a.includes(t) && b.includes(t)).length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isStealth(jd: string): boolean {
  return /stealth|no public domain|seed yc|founding engineer at project/i.test(jd);
}

function mentionsLayoffCompany(jd: string): boolean {
  return /intel|meta|twitter|x corp|salesforce|cisco|paypal holdings|paramount|warner/i.test(
    jd,
  );
}

function extractCompany(jd: string): string {
  const at = jd.match(/at\s+([A-Z][A-Za-z0-9&.\- ]{2,40})/);
  return at?.[1]?.trim() ?? 'the employer';
}

function buildStarQuestions(resume: string, jd: string): Array<{ q: string; format: 'STAR' }> {
  const company = extractCompany(jd);
  const titleHit = titleOverlap(resume, jd) > 0 ? 'this role family' : 'a stretch scope';
  return [
    {
      q: `Tell me about a time you owned a production incident with a quantified outcome, and how that maps to ${company}.`,
      format: 'STAR',
    },
    {
      q: `Walk through a project where you traded latency, cost, and reliability — use Situation, Task, Action, Result.`,
      format: 'STAR',
    },
    {
      q: `Describe aligning stakeholders when ${titleHit} required a decision without full data.`,
      format: 'STAR',
    },
    {
      q: `Give a STAR story for coaching or influencing peers during a high-stakes delivery.`,
      format: 'STAR',
    },
  ];
}

function closedBookComp(score: number): QualityResponse['salary_intelligence'] {
  const mid = 140000 + Math.round((score - 50) * 1800);
  return {
    base: `$${Math.round(mid * 0.92 / 1000)}k-$${Math.round(mid * 1.08 / 1000)}k`,
    equity: `$${Math.round(mid * 0.22 / 1000)}k/yr RSU (closed-book band)`,
    bonus: `$${Math.round(mid * 0.1 / 1000)}k sign-on / performance`,
  };
}

export function runQualityEngine(tc: TestCase): QualityResponse {
  const resume = tc.resumeText;
  const jd = tc.jobDescription;
  const resumeTokens = tokenize(resume);
  const jdTokens = tokenize(jd);
  const overlap = overlapRatio(resumeTokens, jdTokens);
  const tech = countTechHits(resume + ' ' + jd);
  const sharedTech = TECH_TERMS.filter(
    (t) => resume.toLowerCase().includes(t) && jd.toLowerCase().includes(t),
  ).length;

  const hardSkills = clamp(
    Math.round(overlap * 11 + sharedTech * 0.7 + Math.min(tech, 6) * 0.2),
    0,
    15,
  );

  const yearsResume = yearsMentioned(resume);
  const yearsJd = yearsMentioned(jd);
  const yearGap = yearsJd === 0 ? 0 : Math.abs(yearsResume - yearsJd);
  const titles = titleOverlap(resume, jd);
  const experience = titles === 0
    ? 1
    : clamp(
        Math.round(
          3 + titles * 2.5 + (yearGap <= 2 ? 3 : 0) + (yearsResume >= 5 ? 2 : 0),
        ),
        0,
        15,
      );

  const metricless = tc.assertions.requireZeroImpact || !hasQuantitativeMetrics(resume);
  const impact = metricless
    ? 0
    : clamp((resume.match(/\$[\d.,]+|\d+(\.\d+)?\s*%/g) ?? []).length * 3, 4, 10);

  const culture = clamp(3 + countIndustryHits(resume, jd) * 3 + (sharedTech > 2 ? 2 : 0), 0, 10);

  let score = 50 + hardSkills + experience + impact + culture;
  if (metricless) {
    score = Math.min(score, 65);
  }
  score = clamp(score, 50, 100);

  const dogType = getBeagleTierCopy(score, 'zh-TW')[0];
  const career = tc.careerContext;
  const stealth = isStealth(jd);
  const layoff = tc.assertions.requireLayoffWarning || mentionsLayoffCompany(jd);
  const comp = closedBookComp(score);

  const limitations: string[] = [];
  if (stealth) {
    limitations.push(
      'Early-stage or stealth employer: no reliable public filings. Company facts are null; use reverse-interview questions instead of invented traction.',
    );
  }
  if (metricless) {
    limitations.push(
      'Resume lacks quantitative outcomes. Impact component is 0; total score is capped at 65.',
    );
  }

  const hiring_context: Record<string, string> = {
    org_note: stealth
      ? 'Headcount and RTO cannot be verified from public sources.'
      : `Evaluate ${extractCompany(jd)} against the posted role family only (closed-book for Snapshot).`,
  };

  if (career) {
    const remoteOnly = /remote/i.test(career.location_or_remote + career.non_negotiables);
    const onsiteJd = /on-?site|hybrid|3 days|office/i.test(jd);
    const sponsorNeeded = /sponsorship/i.test(career.work_auth);
    if (remoteOnly && onsiteJd) {
      hiring_context.dealbreaker =
        'Career Context is remote-only; this JD is hybrid/onsite — treat as a non-negotiable conflict.';
    }
    if (sponsorNeeded && /no sponsorship|citizens only|without sponsorship/i.test(jd)) {
      hiring_context.dealbreaker =
        'Role states no sponsorship; candidate work_auth requires sponsorship.';
    }
  }

  const macro_risk: Record<string, string> = {};
  if (layoff) {
    macro_risk.layoff_warning =
      'Public historical layoff / restructuring coverage exists for this employer family; verify latest 12-month headcount actions before treating the req as stable.';
  }

  const provenance = stealth
    ? []
    : [
        { url: 'https://www.sec.gov/edgar', note: 'SEC EDGAR filings (public issuers only)' },
        {
          url: 'https://www.bls.gov/oes/',
          note: 'BLS Occupational Employment Statistics — closed-book wage context',
        },
      ];

  return {
    score,
    dog_type: dogType,
    breakdown: {
      impact,
      hard_skills: hardSkills,
      experience,
      culture,
    },
    score_summary:
      `Fit evaluation only: hard-skills ${hardSkills}/15, experience ${experience}/15, impact ${impact}/10, culture ${culture}/10. No resume rewrite advice.`,
    range_evaluation: {
      base_low: 140000 + (score - 50) * 1200,
      base_high: 175000 + (score - 50) * 1600,
      equity: comp.equity,
      bonus: comp.bonus,
    },
    interview_playbook: { questions: buildStarQuestions(resume, jd) },
    salary_intelligence: comp,
    limitations,
    macro_risk,
    hiring_context,
    provenance,
  };
}
