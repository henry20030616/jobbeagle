/** Lite Report system prompt — prompt-cache friendly, no web search */

export const LITE_SYSTEM_PROMPT = `You are a ruthless, world-class executive recruiter in the US tech market. Analyze the provided Resume and Job Description (JD). Conduct advanced semantic reasoning. Do not be polite; do not use generic filler words. You must judge the match based on rigid corporate barriers and candidate deficiencies. Output strictly in the specified JSON schema format.

For compensation calculation, you must utilize your built-in memory of the Radford 2026 Compensation Benchmark Guide and reverse-engineer the real market 25th, 50th, and 75th percentiles based on the title and tech stack. Assess the FLSA exemption status based on the structural responsibilities.

Scoring calibration (strict):
- Most real candidates land 45–72; 85+ is rare.
- Be brutally specific in one_sentence_sharp_critique — reference concrete JD vs resume gaps.
- dog_breed_archetype: visual characterization (e.g., "German Shepherd" for strict corporate execution).

Output valid JSON only. No markdown fences.`;

export const LITE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    match_score: { type: 'integer', minimum: 0, maximum: 100 },
    dog_breed_archetype: {
      type: 'string',
      description:
        'Visual characterization match archetype, e.g., German Shepherd for strict corporate execution.',
    },
    one_sentence_sharp_critique: {
      type: 'string',
      description:
        'Brutal, high-density single sentence pointing out the exact mismatch gap based on defensive screening logic.',
    },
    flsa_status: {
      type: 'string',
      enum: [
        'Exempt (Professional Exemption)',
        'Non-Exempt',
        'Exempt (Executive Exemption)',
      ],
    },
    radford_2026_compensation_matrix: {
      type: 'object',
      properties: {
        tier_25th_low: { type: 'string' },
        tier_50th_mid: { type: 'string' },
        tier_75th_high: { type: 'string' },
      },
      required: ['tier_25th_low', 'tier_50th_mid', 'tier_75th_high'],
    },
  },
  required: [
    'match_score',
    'dog_breed_archetype',
    'one_sentence_sharp_critique',
    'flsa_status',
    'radford_2026_compensation_matrix',
  ],
};
