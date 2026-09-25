import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Golden Dataset - ATS Resolution Box Validation', () => {
  const GOLDEN_DIR = join(__dirname, '../../tests/fixtures/golden-reports');
  const goldenFiles = [
    'high-leverage-diamond-1.json',
    'high-leverage-sapphire-2.json',
    'high-leverage-diamond-3.json',
    'mid-leverage-silver-4.json',
    'mid-leverage-gold-5.json',
    'mid-leverage-silver-6.json',
    'mid-leverage-gold-7.json',
    'low-leverage-bronze-8.json',
    'low-leverage-bronze-9.json',
    'low-leverage-bronze-10.json',
  ];

  goldenFiles.forEach((filename) => {
    describe(`${filename}`, () => {
      let report: any;

      beforeAll(() => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        report = JSON.parse(content);
      });

      it('should have ats_critical_gaps with exactly 2-3 gaps', () => {
        const atsGaps = report.role_team_insights?.ats_critical_gaps;
        expect(atsGaps).toBeDefined();
        expect(atsGaps.detected_count).toBeGreaterThanOrEqual(2);
        expect(atsGaps.detected_count).toBeLessThanOrEqual(3);
        expect(atsGaps.gaps).toHaveLength(atsGaps.detected_count);
      });

      it('should have valid gap types (keyword_missing, quantification_weak, experience_unclear)', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        const validTypes = ['keyword_missing', 'quantification_weak', 'experience_unclear'];
        
        gaps.forEach((gap: any) => {
          expect(validTypes).toContain(gap.gap_type);
        });
      });

      it('should have non-empty JD requirements (quoted from original JD)', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        
        gaps.forEach((gap: any) => {
          expect(gap.jd_requirement).toBeTruthy();
          expect(gap.jd_requirement.length).toBeGreaterThan(10);
          // Should read like a quoted requirement
          expect(typeof gap.jd_requirement).toBe('string');
        });
      });

      it('should have specific resume weaknesses (not generic)', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        
        gaps.forEach((gap: any) => {
          expect(gap.resume_weakness).toBeTruthy();
          expect(gap.resume_weakness.length).toBeGreaterThan(20);
          // Should mention "resume" or specific content
          expect(gap.resume_weakness.toLowerCase()).toMatch(/resume|cv|doesn't|never|no |lacks/);
        });
      });

      it('should have actionable fix strategies (interview talking points)', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        
        gaps.forEach((gap: any) => {
          expect(gap.fix_strategy).toBeTruthy();
          expect(gap.fix_strategy.length).toBeGreaterThan(30);
          // Should be an interview script
          expect(gap.fix_strategy.toLowerCase()).toMatch(/interview|in the interview|when asked/i);
        });
      });

      it('should have valid severity (critical or major)', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        
        gaps.forEach((gap: any) => {
          expect(['critical', 'major']).toContain(gap.severity);
        });
      });

      it('should not have fabricated or invented JD requirements', () => {
        const gaps = report.role_team_insights?.ats_critical_gaps?.gaps || [];
        
        // Red flags for fabrication (overly generic or suspiciously specific without context)
        const suspiciousPatterns = [
          /must have exactly \d+ years/i,  // Overly rigid
          /required to know all of/i,       // Unrealistic
        ];

        gaps.forEach((gap: any) => {
          suspiciousPatterns.forEach((pattern) => {
            expect(gap.jd_requirement).not.toMatch(pattern);
          });
        });
      });
    });
  });

  describe('Cross-report consistency checks', () => {
    it('all reports should follow the same ATS schema structure', () => {
      goldenFiles.forEach((filename) => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);
        const atsGaps = report.role_team_insights?.ats_critical_gaps;

        expect(atsGaps).toHaveProperty('detected_count');
        expect(atsGaps).toHaveProperty('gaps');
        expect(Array.isArray(atsGaps.gaps)).toBe(true);

        atsGaps.gaps.forEach((gap: any) => {
          expect(gap).toHaveProperty('gap_type');
          expect(gap).toHaveProperty('jd_requirement');
          expect(gap).toHaveProperty('resume_weakness');
          expect(gap).toHaveProperty('fix_strategy');
          expect(gap).toHaveProperty('severity');
        });
      });
    });
  });
});
