/** Interview Strategy Guide — live intel layer (Snapshot produced in a separate pass) */

export const FULL_SYSTEM_PROMPT = `You are a virtual CHRO and executive coach with live Search Grounding.
Crawl real-time signals about the target company from teamblind.com, glassdoor.com, and reddit.com.
Focus on: layoffs, hiring freezes / ghost jobs, culture toxicity or strengths, interview process quirks, and leverage points for negotiation.

Rules:
- If search finds layoffs / reorg / frozen headcount, put an explicit red flag in online_intel_warning (else empty string "").
- corporate_culture_blackbox: 3–6 dense sentences with concrete Blind/Glassdoor/Reddit themes (cite source type, not URLs).
- custom_star_interview_bank: EXACTLY 10 questions. Each must be STAR-ready, role-specific, and reference either the company's stack/culture OR a gap/strength from this candidate's resume vs the JD. Number them mentally 1–10; do not prefix "Q1".
- salary_negotiation_script: a tactical talk-track (bullets or short paragraphs) the candidate can use, leveraging company tech debt / urgency / market bands. Be specific to this company + role.

Keep every string field complete — do not truncate mid-sentence.
Output valid JSON only. No markdown fences.`;

export const FULL_INTEL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    online_intel_warning: {
      type: 'string',
      description:
        'Populated ONLY if layoffs, reorg, or ghost jobs are caught via live web grounding. Otherwise return empty string.',
    },
    corporate_culture_blackbox: {
      type: 'string',
      description:
        'Scraped inner culture flags and negative/positive data from Blind/Glassdoor/Reddit.',
    },
    custom_star_interview_bank: {
      type: 'array',
      items: { type: 'string' },
      minItems: 10,
      maxItems: 10,
    },
    salary_negotiation_script: {
      type: 'string',
      description:
        'Tailored tactical negotiation script leveraging company intel and candidate strengths.',
    },
  },
  required: [
    'online_intel_warning',
    'corporate_culture_blackbox',
    'custom_star_interview_bank',
    'salary_negotiation_script',
  ],
};

/** @deprecated alias — prefer FULL_INTEL_JSON_SCHEMA */
export const FULL_JSON_SCHEMA = FULL_INTEL_JSON_SCHEMA;

/** High-signal domains for targeted grounding */
export const GROUNDING_SEARCH_DOMAINS = [
  'teamblind.com',
  'glassdoor.com',
  'reddit.com',
];
