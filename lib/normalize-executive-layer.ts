import type {
  AssessmentBasis,
  CompetencyMapItem,
  CompetencyProficiency,
  CompetencyWeight,
  InsiderSignal,
  InsiderSignalSource,
  LeverageAnalysis,
  LeverageDirection,
  LeverageFactor,
  LeverageStrength,
  MarketPositioning,
  ReferenceEvidenceTier,
  RiskAssessmentItem,
  RiskCategory,
  RiskSeverity,
  SeniorityAlignment,
} from '@/types';
import { normalizeSourceDate, validateProvenanceUrl } from '@/lib/provenance';

/**
 * Executive-assessment layer normalizers.
 * Model output is untrusted: coerce enums, validate URLs, and downgrade
 * any claim that lacks the evidence it asserts.
 */

const MAX_COMPETENCIES = 6;
const MAX_RISKS = 5;
const MAX_LEVERAGE_FACTORS = 6;
const MAX_INSIDER_SIGNALS = 6;

const WEIGHTS: readonly CompetencyWeight[] = ['core', 'supporting'];
const PROFICIENCIES: readonly CompetencyProficiency[] = ['demonstrated', 'adjacent', 'absent'];
const ALIGNMENTS: readonly SeniorityAlignment[] = ['under_level', 'at_level', 'over_level', 'unclear'];
const RISK_CATEGORIES: readonly RiskCategory[] = [
  'competency',
  'seniority',
  'compensation',
  'eligibility',
  'role_stability',
];
const SEVERITIES: readonly RiskSeverity[] = ['low', 'medium', 'high'];
const BASES: readonly AssessmentBasis[] = ['resume', 'jd', 'inferred'];
const DIRECTIONS: readonly LeverageDirection[] = ['for_candidate', 'for_employer', 'neutral'];
const STRENGTHS: readonly LeverageStrength[] = ['strong', 'moderate', 'weak', 'unknown'];
const SIGNAL_SOURCES: readonly InsiderSignalSource[] = [
  'h1bdata',
  'sec_filing',
  'blind',
  'levels_fyi',
  'other',
];

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function urlOrNull(v: unknown): string | null {
  const { url } = validateProvenanceUrl(typeof v === 'string' ? v : '');
  return url || null;
}

export function normalizeCompetencyMap(raw: unknown): CompetencyMapItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: CompetencyMapItem[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const competency = str(entry.competency);
    if (!competency) continue;
    const evidence = str(entry.resume_evidence);
    let proficiency = pick(entry.proficiency, PROFICIENCIES, 'absent');
    // A "demonstrated" claim without resume evidence is unsupported.
    if (proficiency === 'demonstrated' && !evidence) proficiency = 'adjacent';
    items.push({
      competency,
      weight: pick(entry.weight, WEIGHTS, 'supporting'),
      proficiency,
      resume_evidence: proficiency === 'absent' || !evidence ? null : evidence,
    });
    if (items.length >= MAX_COMPETENCIES) break;
  }
  return items.length > 0 ? items : undefined;
}

export function normalizeMarketPositioning(raw: unknown): MarketPositioning | null {
  if (!isRecord(raw)) return null;
  const rationale = str(raw.rationale);
  if (!rationale) return null;
  return {
    seniority_alignment: pick(raw.seniority_alignment, ALIGNMENTS, 'unclear'),
    rationale,
    differentiator: str(raw.differentiator) || null,
  };
}

const SEVERITY_ORDER: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };

export function normalizeRiskAssessment(raw: unknown): RiskAssessmentItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: RiskAssessmentItem[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const statement = str(entry.statement);
    if (!statement) continue;
    if (!(RISK_CATEGORIES as readonly string[]).includes(String(entry.category))) continue;
    items.push({
      category: entry.category as RiskCategory,
      severity: pick(entry.severity, SEVERITIES, 'medium'),
      statement,
      basis: pick(entry.basis, BASES, 'inferred'),
      source_url: urlOrNull(entry.source_url),
    });
  }
  if (items.length === 0) return undefined;
  items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return items.slice(0, MAX_RISKS);
}

export function normalizeLeverageAnalysis(raw: unknown): LeverageAnalysis | null {
  if (!isRecord(raw)) return null;
  const factors: LeverageFactor[] = [];
  if (Array.isArray(raw.factors)) {
    for (const entry of raw.factors) {
      if (!isRecord(entry)) continue;
      const factor = str(entry.factor);
      const evidence = str(entry.evidence);
      if (!factor || !evidence) continue;
      factors.push({
        factor,
        direction: pick(entry.direction, DIRECTIONS, 'neutral'),
        evidence,
        source_url: urlOrNull(entry.source_url),
      });
      if (factors.length >= MAX_LEVERAGE_FACTORS) break;
    }
  }
  const bargaining_posture = str(raw.bargaining_posture);
  if (factors.length === 0 && !bargaining_posture) return null;
  return {
    candidate_leverage: pick(raw.candidate_leverage, STRENGTHS, 'unknown'),
    factors,
    bargaining_posture,
  };
}

function inferSignalSource(url: string, declared: InsiderSignalSource): InsiderSignalSource {
  if (!url) return declared;
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return declared;
  }
  if (host.endsWith('h1bdata.info')) return 'h1bdata';
  if (host.endsWith('sec.gov')) return 'sec_filing';
  if (host.endsWith('teamblind.com')) return 'blind';
  if (host.endsWith('levels.fyi')) return 'levels_fyi';
  return declared;
}

function toEvidenceTier(v: unknown): ReferenceEvidenceTier {
  return v === 1 || v === 2 || v === 3 ? v : 3;
}

export function normalizeInsiderSignals(raw: unknown): InsiderSignal[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: InsiderSignal[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const finding = str(entry.finding);
    if (!finding) continue;
    const { url } = validateProvenanceUrl(typeof entry.url === 'string' ? entry.url : '');
    // Tier 1/2 claims need a citable link; otherwise cap at forum-wind tier.
    const evidence_tier: ReferenceEvidenceTier = url ? toEvidenceTier(entry.evidence_tier) : 3;
    items.push({
      source: inferSignalSource(url, pick(entry.source, SIGNAL_SOURCES, 'other')),
      finding,
      url,
      date: normalizeSourceDate(str(entry.date)),
      evidence_tier,
    });
    if (items.length >= MAX_INSIDER_SIGNALS) break;
  }
  return items.length > 0 ? items : undefined;
}
