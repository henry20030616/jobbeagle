import fs from 'node:fs';
import path from 'node:path';
import { testCases } from './dataset';
import { evaluateTestCase } from './evaluator';
import { runQualityEngine } from './quality-engine';
import { runSystemCase } from './system-runner';
import type { EngineResponse, TestCase, TestResult } from './types';

function isLiveApiEnabled(): boolean {
  return process.env.USE_LOCAL_SERVER === 'true';
}

async function executeCase(tc: TestCase): Promise<{
  data: EngineResponse;
  mode: TestResult['mode'];
}> {
  if (tc.category === 'system_funnel') {
    return { data: await runSystemCase(tc.systemCaseId ?? tc.id), mode: 'real_lib' };
  }

  if (isLiveApiEnabled()) {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: tc.jobDescription,
        resume: tc.resumeText,
        report_type: tc.reportType,
        career_context: tc.careerContext,
      }),
    });
    const json: unknown = await res.json();
    if (json && typeof json === 'object' && 'report' in json) {
      throw new Error('Live /api/analyze returned a report; map it before enabling USE_LOCAL_SERVER');
    }
    throw new Error(
      `Live /api/analyze is not used by default (got HTTP ${res.status}). Re-run without USE_LOCAL_SERVER.`,
    );
  }

  return { data: runQualityEngine(tc), mode: 'local_rubric' };
}

async function runSuite(): Promise<void> {
  console.log('\n=================================================');
  console.log('JobBeagle 100-Case PoC Validation');
  console.log('Quality: local 50+S+E+I+F rubric (not live Gemini)');
  console.log('System: real lib functions (handoff, credits, PayPal, RLS contracts)');
  console.log('=================================================\n');

  if (testCases.length !== 100) {
    throw new Error(`Dataset must contain 100 cases, got ${testCases.length}`);
  }

  const results: TestResult[] = [];

  for (const tc of testCases) {
    const started = Date.now();
    try {
      const { data, mode } = await executeCase(tc);
      const latency = Date.now() - started;
      const result = evaluateTestCase(tc, data, latency, 0, mode);
      results.push(result);
      const mark = result.status === 'PASS' ? 'PASS' : 'FAIL';
      console.log(`[${mark}] [${result.id}] ${result.name} (${result.latencyMs}ms)`);
      for (const failure of result.failures) {
        console.log(`   ${failure}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({
        id: tc.id,
        name: tc.name,
        category: tc.category,
        status: 'ERROR',
        latencyMs: Date.now() - started,
        costUsd: 0,
        failures: [message],
        mode: 'local_rubric',
      });
      console.log(`[ERROR] [${tc.id}]: ${message}`);
    }
  }

  writeReport(results);
}

function writeReport(results: TestResult[]): void {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;
  const passRate = ((passed / total) * 100).toFixed(1);

  const snapshot = results.filter((r) => r.category === 'snapshot_quality');
  const guide = results.filter((r) => r.category === 'guide_quality');
  const system = results.filter((r) => r.category === 'system_funnel');

  const snapshotPass = snapshot.filter((r) => r.status === 'PASS').length;
  const guidePass = guide.filter((r) => r.status === 'PASS').length;
  const systemPass = system.filter((r) => r.status === 'PASS').length;

  const avgLatency = (results.reduce((acc, r) => acc + r.latencyMs, 0) / total).toFixed(0);
  const rate = Number(passRate);
  const anomalies = results.filter((r) => r.status !== 'PASS');

  const scoreFloorOk = snapshot.every(
    (r) => r.score === undefined || (r.score >= 50 && r.score <= 100),
  );
  const metriclessOk = !results.some((r) =>
    r.failures.some((f) => f.includes('Impact score') || f.includes('maximum 65')),
  );
  const coachingOk = !results.some((r) => r.failures.some((f) => f.includes('resume coaching')));
  const stealthOk = !results.some((r) => r.failures.some((f) => f.includes('stealth')));
  const idempotentOk = results.find((r) => r.id === 'TC-SYS12')?.status === 'PASS';
  const poolOk = results.find((r) => r.id === 'TC-SYS08')?.status === 'PASS';

  const invariantLine = (ok: boolean) => (ok ? 'PASSED' : 'FLAGGED');

  const markdown = `# JobBeagle 100-Case PoC Validation Report

**Run Date**: ${new Date().toISOString()}
**Quality engine**: Local closed-book rubric (\`50 + S + E + I + F\`), not live Gemini Flash-Lite / Pro
**System engine**: Real workspace libraries (extension handoff, credits, PayPal parsers, route contracts)
**Payment Gateway**: PayPal REST API (Live/Sandbox) — no live charges in this run
**Model spend**: $0.000 (local rubric; live Gemini is opt-in only)

This run does **not** prove Gemini prompt quality. It proves (1) the 100-case dataset is internally consistent with JobBeagle scoring rules, and (2) the 20 system cases hit real product functions instead of echoing expected HTTP codes.

---

## 1. Executive Metrics

| Metric | Measured Value | Standard Threshold | Verdict |
| :--- | :--- | :--- | :--- |
| **Total Test Cohorts** | **${total} Cases** | 100 Cases | **${total === 100 ? 'Complete' : 'INCOMPLETE'}** |
| **Overall Pass Rate** | **${passRate}%** | >= 95.0% | **${rate >= 95 ? 'PASSED' : 'FLAGGED'}** |
| **Snapshot Quality (40)** | **${snapshotPass}/40** Pass | 40/40 | **${snapshotPass === 40 ? 'Verified' : 'Gaps'}** |
| **Guide Quality (40)** | **${guidePass}/40** Pass | 40/40 | **${guidePass === 40 ? 'Verified' : 'Gaps'}** |
| **System & PayPal (20)** | **${systemPass}/20** Pass | 20/20 | **${systemPass === 20 ? 'Verified' : 'Gaps'}** |
| **Failed / Error** | **${failed} / ${errors}** | 0 / 0 | **${failed + errors === 0 ? 'Clean' : 'Review'}** |
| **Total Model Spend** | **$0.000 USD** | <= $3.00 USD | **Local** |
| **Average Latency** | **${avgLatency} ms** | <= 4500 ms | **${Number(avgLatency) <= 4500 ? 'Passed' : 'Slow'}** |

---

## 2. Invariant Compliance Checklist

* **Strict 50-100 Scoring Floor**: **${invariantLine(scoreFloorOk)}**
* **Metricless Resume Penalty**: **${invariantLine(metriclessOk)}**
* **Zero Resume Coaching Leakage**: **${invariantLine(coachingOk)}**
* **Stealth Startup Fallback**: **${invariantLine(stealthOk)}**
* **PayPal Webhook Idempotency**: **${invariantLine(idempotentOk)}**
* **Dual Pool Isolation**: **${invariantLine(poolOk)}**

---

## 3. Detailed Results by Category

### A. Snapshot Quality (${snapshotPass}/40)

Product Beagle Scale used: 鑽石 / 藍寶 / 翡翠 / 赤銅 (spec aliases 黃金 / 白銀 / 青銅 are mapped).

${snapshot.map((r) => `* [${r.status}] \`${r.id}\` ${r.name}${r.score !== undefined ? ` — score ${r.score} ${r.dogType ?? ''}` : ''}`).join('\n')}

### B. Guide Strategy Report Quality (${guidePass}/40)

${guide.map((r) => `* [${r.status}] \`${r.id}\` ${r.name}${r.score !== undefined ? ` — score ${r.score}` : ''}`).join('\n')}

### C. System Funnel, Security & PayPal (${systemPass}/20)

${system.map((r) => `* [${r.status}] \`${r.id}\` ${r.name}`).join('\n')}

---

## 4. Anomaly Log

${
  anomalies.length === 0
    ? 'Zero anomalies detected. All 100 test cohorts satisfied acceptance criteria.'
    : anomalies.map((r) => `* **[${r.id}] ${r.name}**: ${r.failures.join('; ')}`).join('\n')
}

---

## 5. How to re-run

\`\`\`bash
npx tsx scripts/poc-runner/run.ts
\`\`\`

Do not set \`USE_LOCAL_SERVER=true\` unless you have a signed-in local session and a mapper for the live analyze payload. This suite never adds an analyze auth bypass.
`;

  fs.writeFileSync(path.join(process.cwd(), 'POC_VALIDATION_REPORT.md'), markdown, 'utf8');
  console.log('\nReport written to POC_VALIDATION_REPORT.md');
  console.log(`Pass ${passed}/${total} (${passRate}%)  fail=${failed} error=${errors}\n`);
}

void runSuite();
