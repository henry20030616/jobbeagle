import type { CareerContext } from '../../types';

export type ReportType = 'job_fit_snapshot' | 'interview_strategy_guide';

/** Product Beagle Scale names (zh-TW). Spec aliases 黃金/白銀/青銅 still accepted. */
export type DogType =
  | '鑽石米格魯'
  | '藍寶米格魯'
  | '翡翠米格魯'
  | '赤銅米格魯'
  | '黃金米格魯'
  | '白銀米格魯'
  | '青銅米格魯';

export type TestCategory = 'snapshot_quality' | 'guide_quality' | 'system_funnel';

export type CaseStatus = 'PASS' | 'FAIL' | 'ERROR';

export interface TestAssertions {
  minScore?: number;
  maxScore?: number;
  requiredDogType?: DogType;
  requireZeroImpact?: boolean;
  requireNoResumeCoaching?: boolean;
  requireProvenance?: boolean;
  requireLayoffWarning?: boolean;
  requireLimitations?: boolean;
  requireDealbreakerNote?: boolean;
  minStarQuestions?: number;
  requireCompBreakdown?: boolean;
  expectedStatus?: number;
  expectedErrorCode?: string;
}

export interface TestCase {
  id: string;
  category: TestCategory;
  name: string;
  reportType?: ReportType;
  expectedDogType?: DogType;
  scoreRange?: [number, number];
  resumeText: string;
  jobDescription: string;
  careerContext?: CareerContext;
  systemCaseId?: string;
  assertions: TestAssertions;
}

export interface QualityResponse {
  score: number;
  dog_type: string;
  breakdown: {
    impact: number;
    hard_skills: number;
    experience: number;
    culture: number;
  };
  score_summary: string;
  range_evaluation: {
    base_low: number;
    base_high: number;
    equity?: string;
    bonus?: string;
  };
  interview_playbook: {
    questions: Array<{ q: string; format: 'STAR' }>;
  };
  salary_intelligence: {
    base: string;
    equity: string;
    bonus: string;
  };
  limitations: string[];
  macro_risk: Record<string, string>;
  hiring_context: Record<string, string>;
  provenance: Array<{ url: string; note: string }>;
}

export interface SystemResponse {
  status: number;
  code?: string;
}

export type EngineResponse = QualityResponse | SystemResponse;

export interface TestResult {
  id: string;
  name: string;
  category: TestCategory;
  status: CaseStatus;
  score?: number;
  dogType?: string;
  latencyMs: number;
  costUsd: number;
  failures: string[];
  mode: 'local_rubric' | 'real_lib' | 'live_api';
}
