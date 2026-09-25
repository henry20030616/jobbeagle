import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Golden Dataset - Dynamic Leverage Validation', () => {
  const GOLDEN_DIR = join(__dirname, '../../tests/fixtures/golden-reports');

  const highLeverageReports = [
    'high-leverage-diamond-1.json',
    'high-leverage-sapphire-2.json',
    'high-leverage-diamond-3.json',
  ];

  const midLeverageReports = [
    'mid-leverage-silver-4.json',
    'mid-leverage-gold-5.json',
    'mid-leverage-silver-6.json',
    'mid-leverage-gold-7.json',
  ];

  const lowLeverageReports = [
    'low-leverage-bronze-8.json',
    'low-leverage-bronze-9.json',
    'low-leverage-bronze-10.json',
  ];

  describe('High Leverage Reports (Diamond/Sapphire, score >= 85)', () => {
    highLeverageReports.forEach((filename) => {
      it(`${filename} should have confident negotiation tone`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        expect(report.fit_score.score).toBeGreaterThanOrEqual(85);

        const script = report.offer_strategy?.script || '';
        
        // High leverage indicators
        expect(script.toLowerCase()).toMatch(/i'm targeting|i'm seeking|based on my/i);
        expect(script).toMatch(/\$\d+K/); // Should mention specific numbers
        
        // Should reference quantified achievements
        expect(script.toLowerCase()).toMatch(/reduced|increased|grew|improved|saved|generated/i);
        expect(script).toMatch(/\d+%|\$\d+[MK]/); // Quantified impact
        
        // Should cite market data
        expect(script.toLowerCase()).toMatch(/levels\.fyi|glassdoor|market data|comparable/i);
        
        // Confident close
        expect(script.toLowerCase()).toMatch(/how does that align|does that fit|how does that compare/i);
      });

      it(`${filename} should have target >= p50 market rate`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        const target = parseCompensation(report.offer_strategy?.target || '');
        const p50 = parseCompensation(report.expected_offer?.p50 || '');

        if (target > 0 && p50 > 0) {
          expect(target).toBeGreaterThanOrEqual(p50);
        }
      });
    });
  });

  describe('Mid Leverage Reports (Silver/Gold, score 65-84)', () => {
    midLeverageReports.forEach((filename) => {
      it(`${filename} should have balanced negotiation tone`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        expect(report.fit_score.score).toBeGreaterThanOrEqual(65);
        expect(report.fit_score.score).toBeLessThan(85);

        const script = report.offer_strategy?.script || '';
        
        // Balanced indicators
        expect(script.toLowerCase()).toMatch(/i'm targeting|i'm hoping|given my/i);
        expect(script.toLowerCase()).toMatch(/interested in|excited about|also/i);
        
        // Should mention growth or learning
        expect(script.toLowerCase()).toMatch(/growth|career|opportunities|progression|understand/i);
        
        // Flexible but grounded
        expect(script.toLowerCase()).toMatch(/align|fit|budget|range/i);
      });

      it(`${filename} should have target near p50-p75 range`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        const target = parseCompensation(report.offer_strategy?.target || '');
        const p50 = parseCompensation(report.expected_offer?.p50 || '');
        const p75 = parseCompensation(report.expected_offer?.p75 || '');

        if (target > 0 && p50 > 0 && p75 > 0) {
          expect(target).toBeGreaterThanOrEqual(p50 * 0.95); // Allow 5% buffer
          expect(target).toBeLessThanOrEqual(p75 * 1.1); // Allow 10% stretch
        }
      });
    });
  });

  describe('Low Leverage Reports (Bronze, score < 65)', () => {
    lowLeverageReports.forEach((filename) => {
      it(`${filename} should have humble negotiation tone`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        expect(report.fit_score.score).toBeLessThan(65);

        const script = report.offer_strategy?.script || '';
        
        // Humble indicators
        expect(script.toLowerCase()).toMatch(/i'm excited|i'm interested|i'm hoping|i'd love/i);
        expect(script.toLowerCase()).toMatch(/learn|grow|opportunity|develop/i);
        
        // Ask-first approach
        expect(script.toLowerCase()).toMatch(/would|could|is it possible|fit within/i);
        
        // Emphasis on growth/mentorship
        expect(script.toLowerCase()).toMatch(/mentorship|training|learning|career development/i);
      });

      it(`${filename} should have target <= p75 market rate`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        const target = parseCompensation(report.offer_strategy?.target || '');
        const p75 = parseCompensation(report.expected_offer?.p75 || '');

        if (target > 0 && p75 > 0) {
          expect(target).toBeLessThanOrEqual(p75);
        }
      });

      it(`${filename} should not have overly aggressive language`, () => {
        const content = readFileSync(join(GOLDEN_DIR, filename), 'utf-8');
        const report = JSON.parse(content);

        const script = report.offer_strategy?.script || '';
        
        // Should NOT have aggressive patterns
        const aggressivePatterns = [
          /i require|i demand|i need/i,
          /won't accept|unacceptable/i,
          /must have|must be/i,
        ];

        aggressivePatterns.forEach((pattern) => {
          expect(script).not.toMatch(pattern);
        });
      });
    });
  });

  describe('Cross-report Dynamic Leverage consistency', () => {
    it('high leverage scripts should be more confident than low leverage', () => {
      const high = JSON.parse(
        readFileSync(join(GOLDEN_DIR, highLeverageReports[0]), 'utf-8')
      );
      const low = JSON.parse(
        readFileSync(join(GOLDEN_DIR, lowLeverageReports[0]), 'utf-8')
      );

      const highScript = high.offer_strategy?.script || '';
      const lowScript = low.offer_strategy?.script || '';

      // High should have more quantified achievements
      const highNumbers = (highScript.match(/\d+%|\$\d+[MK]/g) || []).length;
      const lowNumbers = (lowScript.match(/\d+%|\$\d+[MK]/g) || []).length;
      
      expect(highNumbers).toBeGreaterThanOrEqual(lowNumbers);

      // Low should have more humble/learning keywords
      const learningKeywords = ['learn', 'grow', 'excited', 'hoping', 'interested'];
      const lowLearningCount = learningKeywords.filter((kw) =>
        lowScript.toLowerCase().includes(kw)
      ).length;

      expect(lowLearningCount).toBeGreaterThan(0);
    });
  });
});

/**
 * Helper: Parse compensation string to number
 * "$120K" -> 120000
 * "$2.5M" -> 2500000
 */
function parseCompensation(str: string): number {
  const match = str.match(/\$?([\d.]+)\s*([KM])/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (unit === 'K') return value * 1000;
  if (unit === 'M') return value * 1000000;
  return value;
}
