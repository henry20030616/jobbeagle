import type { FullReport, LiteReport, ReportType } from '@/types';
import { REPORT_CODES, normalizeReportType } from '@/constants/report-products';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';

const STORAGE_KEY = 'jb_active_report_v1';

export interface StoredReportPayload {
  report: LiteReport | FullReport;
  report_type: ReportType;
  report_id: string | null;
  /** Language used for this analysis run (UI chrome + model narrative). */
  language?: AppLanguage;
  saved_at: number;
}

export function saveReportSession(payload: Omit<StoredReportPayload, 'saved_at'>): void {
  if (typeof window === 'undefined') return;
  const body: StoredReportPayload = {
    ...payload,
    report_type: normalizeReportType(payload.report_type),
    language: payload.language
      ? normalizeReportLanguage(payload.language)
      : undefined,
    saved_at: Date.now(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(body));
  } catch (err) {
    console.warn('[report-session] save failed', err);
  }
}

export function loadReportSession(): StoredReportPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReportPayload;
    if (!parsed?.report || !parsed.report_type) return null;
    return {
      ...parsed,
      report_type: normalizeReportType(parsed.report_type),
    };
  } catch {
    return null;
  }
}

export function clearReportSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isStrategyReport(type: ReportType): boolean {
  return normalizeReportType(type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;
}
