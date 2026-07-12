import { describe, it, expect } from 'vitest';
import type { LiteReport } from '@/types';
import { normalizeFullReport, isFullReport } from '@/lib/normalize-lite-report';

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

describe('FullReport = Snapshot + intel', () => {
  it('normalizeFullReport keeps snapshot fields and pads STAR bank to 10', () => {
    const full = normalizeFullReport({
      match_score: 70,
      job_title: 'PM',
      company_name: 'MaiCoin',
      dog_breed_archetype: 'Beagle',
      recruiter_verdict: 'Solid',
      one_sentence_sharp_critique: 'Gap in B2B SaaS',
      matching_strengths: [{ point: 'Crypto', description: 'Exchange ops' }],
      critical_gaps: [{ gap: 'SaaS', description: 'No SaaS PM' }],
      hard_requirements_checklist: [{ requirement: '5y PM', status: 'met' }],
      interview_starters: ['Q1', 'Q2', 'Q3'],
      flsa_status: 'Exempt (Professional Exemption)',
      radford_2026_compensation_matrix: {
        tier_25th_low: '1',
        tier_50th_mid: '2',
        tier_75th_high: '3',
        compensation_rationale: 'x',
        candidate_position_label: 'y',
      },
      online_intel_warning: '',
      corporate_culture_blackbox: 'Culture notes',
      custom_star_interview_bank: ['STAR 1', 'STAR 2'],
      salary_negotiation_script: 'Ask for mid-band',
    });
    expect(full.match_score).toBe(70);
    expect(full.company_name).toBe('MaiCoin');
    expect(full.custom_star_interview_bank).toHaveLength(10);
    expect(full.corporate_culture_blackbox).toContain('Culture');
    expect(isFullReport(full)).toBe(true);
  });
});
