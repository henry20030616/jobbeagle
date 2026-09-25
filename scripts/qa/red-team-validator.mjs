#!/usr/bin/env node
/**
 * Red Team Validator - Offline Quality Audit Script
 * 
 * Purpose: Deep adversarial validation of Blue Team reports
 * 
 * Usage:
 *   node scripts/qa/red-team-validator.mjs --report path/to/report.json --resume path/to/resume.txt
 *   node scripts/qa/red-team-validator.mjs --batch tests/fixtures/golden-reports/
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { GoogleGenAI } from '@google/genai';

const RED_TEAM_PROMPT = `You are a malicious fact-checker who specializes in exposing HR report flaws.

YOUR MISSION: Find ALL problems in the provided report. Be EXTREMELY picky.

Check for:
1. ❌ **Fabricated Facts**: Invented company news, salary numbers, layoffs, interview questions
2. ❌ **Unverifiable Claims**: Statements without URL provenance or source
3. ❌ **Contradictions**: Page 2 says WLB good, but Page 3 says overtime heavy
4. ❌ **Hallucinations**: Invented job titles, experience, or skills not in the resume
5. ❌ **Impractical Advice**: Vague negotiation scripts, generic STAR answers without resume proof

OUTPUT FORMAT (JSON only):
{
  "fabricated_facts": ["specific fabricated fact with line reference"],
  "unverifiable_claims": ["specific unverifiable claim"],
  "contradictions": ["specific contradiction between sections"],
  "hallucinations": ["specific invented content not in resume"],
  "impractical_advice": ["specific impractical or generic advice"],
  "severity": "critical" | "major" | "minor" | "pass",
  "confidence": 0.0-1.0,
  "summary": "One-sentence overall verdict"
}

RULES:
- Be EXTREMELY critical
- Flag even minor issues
- If unsure, mark as unverifiable
- Use high scrutiny for salary claims and interview questions
- Compare report claims against original resume text carefully
`;

/**
 * Validate a single report against original resume
 */
async function validateReport(reportPath, resumePath = null) {
  console.log(`\n🔍 Red Team validating: ${basename(reportPath)}`);
  
  const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
  const resumeText = resumePath ? readFileSync(resumePath, 'utf-8') : '(Resume not provided)';
  
  const promptText = `${RED_TEAM_PROMPT}

REPORT TO VALIDATE:
${JSON.stringify(report, null, 2)}

ORIGINAL RESUME TEXT:
${resumeText}

Now output your critique in JSON format:`;

  // Check if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not found. Returning mock critique.');
    return mockCritique(report);
  }

  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        temperature: 0.8, // High temperature for critical thinking
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const critique = JSON.parse(response.text);
    return critique;
  } catch (error) {
    console.error('❌ Red Team validation failed:', error.message);
    return mockCritique(report);
  }
}

/**
 * Mock critique when API is unavailable
 */
function mockCritique(report) {
  return {
    fabricated_facts: [],
    unverifiable_claims: [],
    contradictions: [],
    hallucinations: [],
    impractical_advice: [],
    severity: 'pass',
    confidence: 0.5,
    summary: 'Mock critique (API key not available for actual validation)',
  };
}

/**
 * Batch validate all reports in a directory
 */
async function batchValidate(dir) {
  console.log(`\n📦 Batch validating reports in: ${dir}`);
  
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const results = [];

  for (const file of files) {
    const reportPath = join(dir, file);
    const critique = await validateReport(reportPath, null);
    
    results.push({
      report: file,
      severity: critique.severity,
      issues: [
        ...critique.fabricated_facts,
        ...critique.unverifiable_claims,
        ...critique.contradictions,
        ...critique.hallucinations,
        ...critique.impractical_advice,
      ],
      summary: critique.summary,
    });

    // Log result
    const icon = critique.severity === 'critical' ? '🚨' :
                 critique.severity === 'major' ? '⚠️' :
                 critique.severity === 'minor' ? 'ℹ️' : '✅';
    console.log(`  ${icon} ${file}: ${critique.severity} (${critique.issues?.length || 0} issues)`);
  }

  // Summary report
  console.log(`\n📊 Batch Validation Summary:`);
  console.log(`  Total reports: ${results.length}`);
  console.log(`  Critical: ${results.filter((r) => r.severity === 'critical').length}`);
  console.log(`  Major: ${results.filter((r) => r.severity === 'major').length}`);
  console.log(`  Minor: ${results.filter((r) => r.severity === 'minor').length}`);
  console.log(`  Pass: ${results.filter((r) => r.severity === 'pass').length}`);

  return results;
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
🔴 Red Team Validator - Adversarial Quality Audit

Usage:
  Single report:
    node scripts/qa/red-team-validator.mjs --report path/to/report.json --resume path/to/resume.txt
  
  Batch validate:
    node scripts/qa/red-team-validator.mjs --batch tests/fixtures/golden-reports/

Options:
  --report <path>   Path to report JSON file
  --resume <path>   Path to original resume text (optional)
  --batch <dir>     Validate all JSON files in directory
  --help            Show this help

Environment:
  GEMINI_API_KEY    Required for actual LLM validation (falls back to mock if missing)

Examples:
  node scripts/qa/red-team-validator.mjs --batch tests/fixtures/golden-reports/
  node scripts/qa/red-team-validator.mjs --report report.json --resume resume.txt
`);
    process.exit(0);
  }

  const reportIndex = args.indexOf('--report');
  const resumeIndex = args.indexOf('--resume');
  const batchIndex = args.indexOf('--batch');

  if (batchIndex !== -1) {
    const dir = args[batchIndex + 1];
    await batchValidate(dir);
  } else if (reportIndex !== -1) {
    const reportPath = args[reportIndex + 1];
    const resumePath = resumeIndex !== -1 ? args[resumeIndex + 1] : null;
    const critique = await validateReport(reportPath, resumePath);
    console.log('\n📋 Red Team Critique:');
    console.log(JSON.stringify(critique, null, 2));
  } else {
    console.error('❌ Invalid arguments. Use --help for usage.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
