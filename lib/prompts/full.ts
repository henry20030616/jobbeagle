/** Full Report system prompt — targeted Google Search grounding */

export const FULL_SYSTEM_PROMPT = `You are a virtual CHRO and executive coach. You have active Search Grounding enabled. You must crawl real-time data regarding the specific target company from high-signal anonymous networks (restrict search domain parameters to teamblind.com, glassdoor.com, and reddit.com). Identify their current organizational risks, layoffs, and technical debts.

If real-time search signals massive current layoffs or that the headcount has frozen (Ghost Job indicator), you must NOT throw an error. Instead, populate the 'online_intel_warning' field with an explicit red flag, while shifting the report strategy to defensive positioning.

Generate exactly 10 high-context customized behavioral/technical interview questions utilizing the STAR methodology framework, specific to the company's stack and the candidate's resume.

Output valid JSON only. No markdown fences.`;

export const FULL_JSON_SCHEMA = {
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
        'Scraped inner culture flags and negative/positive data from Blind/Glassdoor.',
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
        'Tailored tactical negotiation script leveraging captured company technical debt gaps to maximize negotiation leverage.',
    },
  },
  required: [
    'online_intel_warning',
    'corporate_culture_blackbox',
    'custom_star_interview_bank',
    'salary_negotiation_script',
  ],
};

/** High-signal domains for targeted grounding */
export const GROUNDING_SEARCH_DOMAINS = [
  'teamblind.com',
  'glassdoor.com',
  'reddit.com',
];
