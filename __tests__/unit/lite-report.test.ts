import { describe, it, expect } from 'vitest';
import type { LiteReport } from '@/types';

describe('LiteReport schema', () => {
  it('validates enriched lite fields', () => {
    const report: LiteReport = {
      match_score: 68,
      job_title: 'Senior Business Analyst',
      company_name: 'Acme Corp',
      dog_breed_archetype: 'German Shepherd',
      recruiter_verdict: 'Strong analytics background but thin on enterprise migration evidence.',
      one_sentence_sharp_critique: 'You lack the required Kubernetes depth for this Staff SRE role.',
      matching_strengths: [
        { point: 'AI project delivery', description: 'Led two LLM pilots with measurable ROI.' },
      ],
      critical_gaps: [
        { gap: 'Enterprise migration', description: 'No SAP or legacy cutover ownership listed.' },
      ],
      hard_requirements_checklist: [
        { requirement: '5+ years BA experience', status: 'met' },
        { requirement: 'SAP migration', status: 'missing' },
      ],
      interview_starters: [
        'Walk me through a requirements doc you owned end-to-end.',
        'How did you handle conflicting stakeholders?',
        'Describe a data migration you led.',
      ],
      flsa_status: 'Exempt (Professional Exemption)',
      radford_2026_compensation_matrix: {
        tier_25th_low: '$145K',
        tier_50th_mid: '$175K',
        tier_75th_high: '$210K',
        market_region: 'San Francisco Bay Area',
        compensation_rationale: 'Staff-level IC band for Bay Area tech.',
        candidate_salary_position: 'p25_p50',
        candidate_position_label: 'At 4 YOE you likely land P35–P45; push toward P50.',
      },
    };
    expect(report.match_score).toBeGreaterThanOrEqual(0);
    expect(report.matching_strengths).toHaveLength(1);
    expect(report.interview_starters).toHaveLength(3);
    expect(report.radford_2026_compensation_matrix.tier_50th_mid).toBeTruthy();
  });
});
