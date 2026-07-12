import { describe, it, expect } from 'vitest';
import {
  REPORT_CODES,
  normalizeReportType,
  reportLabel,
} from '@/constants/report-products';
import { normalizeCheckoutPlanType } from '@/constants/checkout-plans';

describe('report terminology', () => {
  it('normalizes legacy and canonical report types', () => {
    expect(normalizeReportType('lite')).toBe(REPORT_CODES.JOB_FIT_SNAPSHOT);
    expect(normalizeReportType('job_fit_snapshot')).toBe(REPORT_CODES.JOB_FIT_SNAPSHOT);
    expect(normalizeReportType('full')).toBe(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE);
    expect(normalizeReportType('interview_strategy_guide')).toBe(
      REPORT_CODES.INTERVIEW_STRATEGY_GUIDE,
    );
  });

  it('labels match product names', () => {
    expect(reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT)).toBe('Job Fit Snapshot');
    expect(reportLabel('full')).toBe('Interview Strategy Guide');
  });

  it('normalizes checkout plan codes', () => {
    expect(normalizeCheckoutPlanType('single_lite')).toBe('single_job_fit_snapshot');
    expect(normalizeCheckoutPlanType('single_full')).toBe('single_interview_strategy_guide');
  });
});
