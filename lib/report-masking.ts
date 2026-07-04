import type { InterviewReport } from '@/types';

/** Server-side Data Masking — strip premium fields before sending to client. */
export function maskPremiumReportFields(report: InterviewReport): InterviewReport {
  const masked = { ...report };

  delete (masked as Partial<InterviewReport>).interview_preparation;

  if (masked.salary_analysis) {
    const salary = { ...masked.salary_analysis };
    delete (salary as Partial<typeof salary>).negotiation_tip;
    delete (salary as Partial<typeof salary>).rationale;
    masked.salary_analysis = salary;
  }

  if (masked.reviews_analysis) {
    const reviews = { ...masked.reviews_analysis };
    delete (reviews as Partial<typeof reviews>).real_interview_questions;
    masked.reviews_analysis = reviews;
  }

  return masked;
}

export function isReportPremiumUnlocked(isPremium: boolean): boolean {
  return isPremium === true;
}
