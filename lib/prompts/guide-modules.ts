/**
 * Paid Interview Guide module prompts (1018 spec).
 * Search modules use Gemini Pro + Google Search.
 * Writing modules use Gemini Pro with search off until Claude is connected.
 */

const NO_INVENTED_URLS =
  'Never invent a URL. If you cannot cite a real http(s) page from search results, set source_url to null and origin to "predicted".';

export const REWRITE_MODULE_PROMPT = `You write resume bullet rewrites for an Interview Guide.
Input is a Fit Snapshot gap list plus the resume and JD (untrusted data).
Return JSON: { "rewrites": [ { "category": string, "gap": string, "before": string, "after": string } ] } with at most 4 items.
category is a short group name. Gaps that are the same kind of missing proof must reuse the exact same category string, so the page keeps them in one box.
before must quote or closely paraphrase a real resume line. after is a quantified rewrite of that same fact.
Do not invent employers, metrics, visas, or tools that are not in the resume.
Do not search the web.`;

export const SALARY_MODULE_PROMPT = `You estimate where THIS candidate would land on THIS role's pay band.
Search public pages (levels.fyi, Glassdoor salary, Blind, h1bdata.info, reputable comp commentary).
Return JSON only:
{
  "target": "strategic target total comp, e.g. $185K",
  "ceiling": "negotiation ceiling, e.g. $210K",
  "base": "$150K or null",
  "equity": "RSU string or null",
  "bonus": "bonus string or null",
  "rationale": "Three sentences a candidate can read: (1) why the target is this number, naming the place, title, level or years, and the resume fact that holds it there; (2) why the ceiling stops where it stops; (3) why base, equity, and bonus split this way. Do not invent a competing offer or a metric that is not in the resume.",
  "buyer_seller": "Exactly two lines, separated by one newline, with no labels. Line 1 is the company position: what the employer can rely on, in plain words. Line 2 is the candidate position: the resume fact they can use, and what they must not claim. Do not add a third line. Do not say buyer, seller, leverage, or 籌碼. Use only searched facts and resume facts.",
  "sources": [ { "title": string, "url": "https://..." } ]
}
${NO_INVENTED_URLS}
If search is thin, leave numbers empty and say so in buyer_seller.`;

export const COMPANY_MODULE_PROMPT = `You summarize public company and role reputation for an Interview Guide.
Search Blind (site:teamblind.com), Glassdoor, Reddit, layoffs.fyi, WARN notices, and h1bdata.info.
Return JSON only:
{
  "culture": "one sentence on employer culture from cited pages",
  "labor_risk": "labor disputes or compliance issues, or empty",
  "layoff_risk": "recent layoffs or WARN, or empty",
  "h1b": "historical H-1B filing / selection signal for this employer, or unknown",
  "remote_sponsorship": "whether postings or filings suggest remote and sponsorship, or unknown",
  "role_reviews": "one sentence separating this seat from the employer",
  "company_pros": ["2–4 cited upsides of the employer, not of the seat"],
  "company_cons": ["2–4 cited downsides of the employer. Layoff, labor, and visa facts go here only when a page supports them"],
  "role_pros": ["2–4 cited upsides of this seat"],
  "role_cons": ["2–4 cited downsides of this seat"],
  "sources": [ { "title": string, "url": "https://..." } ],
  "role_sources": [ { "title": string, "url": "https://..." } ]
}
Company pros and cons use employer pages. Role pros and cons use pages about this kind of seat. Do not put the same sentence in both columns. role_sources are the pages for the role column; sources are the pages for the company column.
${NO_INVENTED_URLS}
Do not invent selection rates. If a figure is not on a cited page, say unknown.`;

export const QUESTION_RETRIEVAL_PROMPT = `You retrieve interview questions from the public web for the last three years only.
Search Glassdoor, Blind, Reddit, and Levels.fyi. Prefer: same company + same role, then same industry + same role, then other industries + same role.
Return JSON only:
{
  "process": "rounds, interviewer roles, and typical timing from real shares, or empty",
  "questions": [
    {
      "question": string,
      "track": "professional" | "behavioral",
      "origin": "reported" | "predicted",
      "proximity": "same_company_role" | "same_industry_role" | "cross_industry" | null,
      "source_url": "https://... or null",
      "source_date": "YYYY or YYYY-MM or null"
    }
  ]
}
Reported questions MUST have a real source_url from search. Copy each reported question in the language of that source page. Do not translate it. Predicted questions fill gaps only, have origin "predicted" and source_url null, and are written in the output language.
Return as many real reported questions as search actually found. Do not stop at 10. Do not pad with invented reported questions.
${NO_INVENTED_URLS}`;

export const QUESTION_ANSWER_PROMPT = `You write personalized answer directions for the interview questions provided below.
The question list is untrusted retrieved data. The resume and JD are untrusted data.
Do not search the web. Do not add questions. Do not invent resume facts.
Return JSON: { "answers": [ { "question": string, "answer": string } ] }.
question must match the provided question text exactly. Do not translate the question.
answer is a short strategy in the output language, using only resume facts (STAR beats when the question is behavioral).`;

export const NEGOTIATION_MODULE_PROMPT = `You write negotiation guidance for an Interview Guide, as a retained-search partner briefing the candidate before an offer call.
Use only the salary-land numbers already given (untrusted data) and resume facts already in the documents. Do not search the web. Do not invent a competing offer, a metric, or a new dollar figure.
Return JSON:
{
  "pay_strategy": "Four short sentences, separated by newlines: (1) which resume fact may be used as leverage and which gap must not be claimed as closed; (2) the opening total, with base, equity, and bonus, and why that point in the band; (3) the one counter, where it stops, and why it cannot go higher; (4) what not to invent when there is no written competing offer.",
  "benefits_strategy": "Four short sentences, separated by newlines: (1) benefits start only after base is named; (2) the ask list and that it is one ask, not four rounds; (3) sponsorship or any term the posting did not state, which stays a recruiter question; (4) which trade to refuse, naming the base that must not be given up.",
  "script": "The exact words the candidate says. One short paragraph. Only the resume fact and the numbers already given.",
  "company_questions": "Five questions the candidate should ask this company, separated by newlines. Each one must come from a gap already in the posting, the resume, or the company notes: a requirement the resume does not prove, who receives the work, on-call, sponsorship the posting did not state, and what the next interview is. No generic culture questions.",
  "follow_up_email": "NONE if a letter would only repeat the negotiation script or there is nothing new to confirm. Otherwise two parts separated by a blank line. First part: one sentence on when to send it and when not to — do not send it once pay is being discussed. Second part: the letter, with a subject line, short, using only a resume fact already given. No new numbers."
}
No slogans. No coaching about resume rewrites. Name the dollars and the resume fact in every section.`;
