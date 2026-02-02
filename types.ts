export interface BasicAnalysis {
  job_title: string;
  company_overview: string;
  business_scope: string;
  company_trends: string;
  job_summary: string;
  hard_requirements: string[];
}

export interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
}

export interface MarketItem {
  point: string;
  description: string;
}

export interface MarketAnalysis {
  industry_trends: string;
  positioning: string;
  competition_table: Competitor[];
  key_advantages: MarketItem[];
  potential_risks: MarketItem[];
}

export interface MatchPoint {
  point: string;
  description: string;
}

export interface SkillGap {
  gap: string;
  description: string;
}

export interface MatchAnalysis {
  score: number;
  matching_points: MatchPoint[];
  skill_gaps: SkillGap[];
}

export interface SalaryAnalysis {
  estimated_range: string;
  market_position: string;
  negotiation_tip: string;
  rationale: string;
}

export interface ReviewItem {
  summary: string;
  pros: string[];
  cons: string[];
}

export interface RealInterviewQuestion {
  question: string;
  job_title: string;
  year: string;
  source_url?: string;
}

export interface ReviewsAnalysis {
  company_reviews: ReviewItem;
  job_reviews: ReviewItem;
  real_interview_questions: RealInterviewQuestion[];
}

export interface Question {
  question: string;
  source: string;
  answer_guide: string;
}

export interface UsefulLink {
  title: string;
  url: string;
  description?: string;
}

export interface InterviewPreparation {
  questions: Question[];
}

export interface ReferenceData {
  deep_research: UsefulLink[];
  data_citations: UsefulLink[];
}

export interface InterviewReport {
  basic_analysis: BasicAnalysis;
  salary_analysis: SalaryAnalysis;
  reviews_analysis: ReviewsAnalysis;
  market_analysis: MarketAnalysis;
  match_analysis: MatchAnalysis;
  interview_preparation: InterviewPreparation;
  references: ReferenceData;
}

export interface ResumeInput {
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  fileName?: string;
}

export interface UserInputs {
  jobDescription: string;
  resume: ResumeInput;
  language?: 'zh' | 'en';
}

// JobLive types
export interface JobData {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  salary: string;
  description: string;
  videoUrl?: string;
  tags: string[];
  logoUrl?: string;
  isAiGenerated?: boolean;
  contactEmail?: string;
}

export interface GeneratedContent {
  script: string;
  visualDescription: string;
  thumbnailBase64?: string;
  videoUri?: string;
}

export enum AppMode {
  FEED = 'FEED',
  CREATOR = 'CREATOR'
}
