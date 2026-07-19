import type { ReportType as ReportTypeCode } from '@/constants/report-products';

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

// ─── Report products: Job Fit Snapshot / Interview Strategy Guide ───

export type { ReportType } from '@/constants/report-products';
export { REPORT_CODES, normalizeReportType } from '@/constants/report-products';

type ReportType = ReportTypeCode;
export type MembershipTier = 'free' | 'standard_sub' | 'advanced_sub';

/** @deprecated FLSA removed from core product (Report Spec v3) */
export type FlsaStatus =
  | 'Exempt (Professional Exemption)'
  | 'Non-Exempt'
  | 'Exempt (Executive Exemption)';

/** @deprecated use ExpectedOfferRange */
export interface Radford2026CompensationMatrix {
  tier_25th_low: string;
  tier_50th_mid: string;
  tier_75th_high: string;
  market_region?: string;
  compensation_rationale?: string;
  candidate_salary_position?: 'below_p25' | 'p25_p50' | 'p50_p75' | 'above_p75';
  candidate_position_label?: string;
}

export interface LiteMatchPoint {
  point: string;
  description: string;
}

export interface LiteSkillGap {
  gap: string;
  description: string;
}

export type HardRequirementStatus = 'met' | 'partial' | 'missing';

export interface LiteHardRequirement {
  requirement: string;
  status: HardRequirementStatus;
}

// ─── Report Spec v3 — dual heroes: Fit Score + Expected Offer ───

export type CompletenessLevel = 'High' | 'Medium' | 'Low';
export type HardFilterStatus = 'Pass' | 'Risk' | 'Blocked' | 'Unknown';
export type FitBand = 'Strong' | 'Viable' | 'Stretch' | 'Mismatch';
export type EvidenceCoverage = 'High' | 'Medium' | 'Low';
export type SalaryEvidenceTier = 'A' | 'B' | 'C' | 'D';
export type ApplyDecisionLabel =
  | 'Apply now'
  | 'Apply after fixes'
  | 'Clarify first'
  | 'Skip';

export interface DataCompleteness {
  level: CompletenessLevel;
  missing_inputs: string[];
  confidence_notes: string;
}

export interface HardFilterItem {
  requirement: string;
  status: HardFilterStatus | HardRequirementStatus;
  evidence: string;
}

export interface HardFilter {
  status: HardFilterStatus;
  items: HardFilterItem[];
}

export interface FitScoreBreakdownItem {
  dimension: string;
  weight_pct: number;
  score: number;
  note: string;
}

export interface FitScoreBlock {
  score: number;
  band: FitBand;
  evidence_coverage: EvidenceCoverage;
  /** Prose fallback / joined form of sharp_verdict_points */
  sharp_verdict: string;
  /** Score Summary bullets (preferred in UI) */
  sharp_verdict_points?: string[];
  breakdown: FitScoreBreakdownItem[];
}

export interface ProofMap {
  strengths: LiteMatchPoint[];
  gaps: LiteSkillGap[];
  resume_actions: string[];
  screenability_note: string;
}

/** Optional TC split for Offer Strategy / Expected Offer (D24). */
export interface OfferTcBreakdown {
  base: string | null;
  bonus: string | null;
  equity: string | null;
  /** All-in TC or total cash when equity unknown */
  total: string | null;
}

export interface OfferLever {
  name: string;
  note: string;
}

export interface ExpectedOfferRange {
  posted_range: string | null;
  p25: string | null;
  p50: string | null;
  p75: string | null;
  currency: string;
  region: string;
  target_gap: string;
  evidence_tier: SalaryEvidenceTier;
  sources: string[];
  /** Short positioning line for Snapshot */
  candidate_position_label?: string;
  /** Base / bonus / equity / total when estimable */
  tc_breakdown?: OfferTcBreakdown;
}

/** Account Career Context — floors injected into every analysis (B7/B8). */
export interface CareerContext {
  target_level: string;
  location_or_remote: string;
  work_auth: string;
  target_tc: string;
  walk_away_tc: string;
  non_negotiables: string;
  signature_strengths: string;
}

/** Guide-only: upgrade of proof map into a hire case (D23). */
export interface CandidateCase {
  hire_thesis: string;
  top_facts: string[];
}

export type ProvenanceStatus = 'valid' | 'invalid' | 'unverified';

export interface ProvenanceEntry {
  label: string;
  url: string;
  date: string;
  status: ProvenanceStatus;
  kind: 'offer' | 'hiring' | 'interview';
}

export interface ProvenanceRecord {
  report_version: string;
  validated_at: string;
  entries: ProvenanceEntry[];
  invalid_url_count: number;
}

export interface ApplyDecision {
  label: ApplyDecisionLabel;
  reason: string;
  next_best_action: string;
}

export interface RoleRead {
  mission: string;
  responsibilities: string[];
  hiring_signals: string[];
}

export interface HiringInsight {
  claim: string;
  why_it_matters: string;
  source_url: string;
  date: string;
}

export interface HiringContext {
  insights: HiringInsight[];
  limitations: string[];
  validation_questions: string[];
}

export interface ConcernDefense {
  concern: string;
  why: string;
  evidence: string;
  missing_proof: string;
  answer_guide: string;
  do_not_claim: string;
}

export interface InterviewQuestionCard {
  question: string;
  predicted?: boolean;
  source_url?: string;
  source_date?: string;
  evidence?: string;
  star_outline?: string;
  missing_facts?: string;
}

/** Practice-ready STAR answer template (Strategy Guide differentiator). */
export interface StarTemplate {
  title: string;
  /** Optional interview question this template prepares for */
  for_question?: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  /** Which resume fact this template is anchored to — never invent */
  resume_anchor: string;
}

export interface InterviewPlaybook {
  reported: InterviewQuestionCard[];
  predicted: InterviewQuestionCard[];
  /** 3–4 copy-ready STAR practice templates */
  star_templates: StarTemplate[];
  /** @deprecated flat strings; prefer star_templates */
  star_outlines: string[];
  reverse_questions: string[];
  validate_before_join: string[];
}

export interface OfferStrategy {
  target: string;
  acceptable: string;
  walk_away: string;
  levers: string[];
  /** Structured levers when present (D24); UI prefers these over levers[] */
  structured_levers?: OfferLever[];
  tc_breakdown?: OfferTcBreakdown;
  script: string;
  discovery_questions: string[];
}

export interface StrategyFitSalary {
  score_implications: string;
  offer_implications: string;
  validate_with_recruiter: string[];
}

/**
 * Job Fit Snapshot — Spec v3
 * Dual heroes: fit_score + expected_offer. No FLSA. No culture-in-score.
 */
export interface LiteReport {
  job_title: string;
  company_name: string;
  /** Posting / listing date from JD when available (e.g. "2026-06-12" or "2 weeks ago") */
  job_posted_date: string;
  /** Board / URL source label, e.g. LinkedIn, Indeed */
  job_source: string;
  data_completeness: DataCompleteness;
  hard_filter: HardFilter;
  fit_score: FitScoreBlock;
  proof_map: ProofMap;
  expected_offer: ExpectedOfferRange;
  apply_decision: ApplyDecision;
  role_read: RoleRead;
  /** Snapshot-only predicted starters (no web search) */
  interview_starters: string[];

  /** @deprecated use fit_score.score */
  match_score: number;
  /** @deprecated use fit_score.sharp_verdict / apply_decision */
  recruiter_verdict?: string;
  /** @deprecated use fit_score.sharp_verdict */
  one_sentence_sharp_critique?: string;
  /** @deprecated removed from product */
  dog_breed_archetype?: string;
  /** @deprecated removed from core product */
  flsa_status?: FlsaStatus;
  /** @deprecated use expected_offer */
  radford_2026_compensation_matrix?: Radford2026CompensationMatrix;
  /** @deprecated use proof_map.strengths */
  matching_strengths?: LiteMatchPoint[];
  /** @deprecated use proof_map.gaps */
  critical_gaps?: LiteSkillGap[];
  /** @deprecated use hard_filter.items */
  hard_requirements_checklist?: LiteHardRequirement[];
}

/** Strategy Guide layer — Spec v3 (Pro + optional grounding) */
export interface StrategyIntelFields {
  strategy_fit_salary: StrategyFitSalary;
  hiring_context: HiringContext;
  concerns_defenses: ConcernDefense[];
  interview_playbook: InterviewPlaybook;
  offer_strategy: OfferStrategy;
  /** Why hire this candidate — Proof Map upgrade (D23) */
  candidate_case?: CandidateCase;
  /** Backend-validated citations (A5) */
  provenance?: ProvenanceRecord;
  report_version?: string;

  /** @deprecated mapped into hiring_context / validate_before_join */
  online_intel_warning?: string;
  /** @deprecated use hiring_context + validate_before_join */
  corporate_culture_blackbox?: string;
  /** @deprecated use interview_playbook.star_outlines / predicted */
  custom_star_interview_bank?: string[];
  /** @deprecated use offer_strategy.script */
  salary_negotiation_script?: string;
}

/**
 * Interview Strategy Guide = Snapshot + strategy layer.
 */
export type FullReport = LiteReport & StrategyIntelFields;

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_tier: MembershipTier;
  available_job_fit_snapshot_credits: number;
  available_interview_strategy_guide_credits: number;
  /** @deprecated use available_job_fit_snapshot_credits */
  available_lite_credits?: number;
  /** @deprecated use available_interview_strategy_guide_credits */
  available_full_credits?: number;
  career_context?: CareerContext | null;
  referral_code: string | null;
  device_fingerprint: string | null;
  deactivated_at?: string | null;
}

/** Chrome extension → confirm-job payload */
export interface ExtensionJobPayload {
  pageTitle: string;
  pageUrl: string;
  rawText: string;
  jobId: string;
  /** Structured fields from scrape (preferred over pageTitle parsing) */
  jobTitle?: string;
  companyName?: string;
}

export interface PreFlightJobData {
  company_name: string;
  job_title: string;
  raw_jd: string;
  linkedin_job_id: string;
  page_url?: string;
}

export interface AnalyzeRequestBody {
  report_type: ReportType;
  /** Legacy base64 URL payload */
  payload?: string;
  /** Signed handoff from POST /api/extension-capture */
  handoff_sid?: string;
  /** Legacy manual flow */
  jobDescription?: string;
  resume?: ResumeInput;
  language?: UserInputs['language'];
  device_fingerprint?: string;
  /** Mark as single-drop purchase snapshot */
  is_single_drop?: boolean;
  /** Optional override; otherwise loaded from profiles.career_context */
  career_context?: CareerContext;
}

export interface AnalyzeResponseBody {
  report: LiteReport | FullReport;
  report_type: ReportType;
  report_id: string | null;
  cached: boolean;
  model_used: string;
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
