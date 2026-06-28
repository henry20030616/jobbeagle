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

/** JobBeagle 評分拆解：總分 = base(50) + S + E + I + F，範圍 50–100 */
export interface MatchScoreComponents {
  base: number;
  /** 硬技能／ATS 關鍵字，0–15 */
  hard_skills_S: number;
  /** 經驗深度／職涯路徑，0–15 */
  experience_E: number;
  /** 量化成果，0–10；履歷無可驗證數據時必為 0 */
  impact_metrics_I: number;
  /** 文化／產業契合，0–10 */
  culture_fit_F: number;
}

export interface MatchAnalysis {
  score: number;
  /** 與 score 一致：50 + S + E + I + F（API 正規化後必有） */
  score_components?: MatchScoreComponents;
  /** 鑽石/黃金/白銀/青銅米格魯（或英文對應） */
  dog_type?: string;
  /** 資深人資視角短評 */
  recruiter_insight?: string;
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
  language?: 'en' | 'zh-TW' | 'zh-CN' | 'es' | 'hi' | 'ar';
}

// Jobbeagle Shorts types

/** 影片來源類型：upload = 上傳原檔；youtube / instagram / facebook = 社群連結；external = 其他外部連結 */
export type VideoSourceType = 'upload' | 'youtube' | 'instagram' | 'facebook' | 'external';

export interface JobData {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  salary: string;
  description: string;
  videoUrl?: string;
  /** 影片來源類型，未設定時預設為 upload（向下相容舊資料） */
  videoSourceType?: VideoSourceType;
  tags: string[];
  logoUrl?: string;
  isAiGenerated?: boolean;
  contactEmail?: string;
  applyUrl?: string;
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
