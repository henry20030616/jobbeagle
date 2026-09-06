import { getBeagleTierCopy } from '../../lib/beagle-tiers';
import type {
  QualityResponse,
  SystemResponse,
  TestCase,
  TestResult,
} from './types';

const COACHING_KEYWORDS = [
  'revise your resume',
  'consider adding',
  'rewrite this bullet',
  'suggestions for your resume',
  '修改履歷',
  '建議改寫',
] as const;

const DOG_ALIASES: Record<string, string> = {
  鑽石米格魯: '鑽石米格魯',
  黃金米格魯: '藍寶米格魯',
  藍寶米格魯: '藍寶米格魯',
  白銀米格魯: '翡翠米格魯',
  翡翠米格魯: '翡翠米格魯',
  青銅米格魯: '赤銅米格魯',
  赤銅米格魯: '赤銅米格魯',
  'Diamond Beagle': '鑽石米格魯',
  'Sapphire Beagle': '藍寶米格魯',
  'Emerald Beagle': '翡翠米格魯',
  'Copper Beagle': '赤銅米格魯',
};

export function canonicalDogType(name: string | undefined): string {
  if (!name) return '';
  return DOG_ALIASES[name] ?? name;
}

export function dogTypeForScore(score: number): string {
  return getBeagleTierCopy(score, 'zh-TW')[0];
}

function isSystemResponse(data: QualityResponse | SystemResponse): data is SystemResponse {
  return 'status' in data && typeof data.status === 'number' && !('score' in data);
}

function isQualityResponse(data: QualityResponse | SystemResponse): data is QualityResponse {
  return 'score' in data && typeof data.score === 'number';
}

export function evaluateTestCase(
  testCase: TestCase,
  responseData: QualityResponse | SystemResponse,
  latencyMs: number,
  costUsd: number,
  mode: TestResult['mode'],
): TestResult {
  const failures: string[] = [];

  if (testCase.category === 'system_funnel') {
    if (!isSystemResponse(responseData)) {
      failures.push('System case did not return a status payload');
    } else {
      if (
        testCase.assertions.expectedStatus !== undefined
        && responseData.status !== testCase.assertions.expectedStatus
      ) {
        failures.push(
          `Status mismatch: expected ${testCase.assertions.expectedStatus}, got ${responseData.status}`,
        );
      }
      if (
        testCase.assertions.expectedErrorCode
        && responseData.code !== testCase.assertions.expectedErrorCode
      ) {
        failures.push(
          `Error code mismatch: expected ${testCase.assertions.expectedErrorCode}, got ${responseData.code ?? 'undefined'}`,
        );
      }
    }
    return {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      status: failures.length === 0 ? 'PASS' : 'FAIL',
      latencyMs,
      costUsd,
      failures,
      mode,
    };
  }

  if (!isQualityResponse(responseData)) {
    failures.push('Quality case did not return a scored report payload');
    return {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      status: 'FAIL',
      latencyMs,
      costUsd,
      failures,
      mode,
    };
  }

  const score = responseData.score;
  const dogType = responseData.dog_type;

  if (!Number.isFinite(score) || score < 50 || score > 100) {
    failures.push(`Score ${score} violates strict 50-100 floor/ceiling rule`);
  }

  if (testCase.assertions.minScore !== undefined && score < testCase.assertions.minScore) {
    failures.push(`Score ${score} below expected min ${testCase.assertions.minScore}`);
  }
  if (testCase.assertions.maxScore !== undefined && score > testCase.assertions.maxScore) {
    failures.push(`Score ${score} above expected max ${testCase.assertions.maxScore}`);
  }

  if (testCase.assertions.requiredDogType) {
    const expected = canonicalDogType(testCase.assertions.requiredDogType);
    const actual = canonicalDogType(dogType);
    if (actual !== expected) {
      failures.push(
        `Dog type mismatch: expected ${testCase.assertions.requiredDogType} (canonical ${expected}), got ${dogType}`,
      );
    }
  }

  if (testCase.assertions.requireZeroImpact) {
    const impact = responseData.breakdown.impact;
    if (impact > 0) {
      failures.push(`Impact score must be 0 for metricless resumes, got ${impact}`);
    }
    if (score > 65) {
      failures.push(`Metricless resume received score ${score}, exceeding maximum 65 cap`);
    }
  }

  if (testCase.assertions.requireNoResumeCoaching) {
    const serialized = JSON.stringify(responseData).toLowerCase();
    for (const kw of COACHING_KEYWORDS) {
      if (serialized.includes(kw)) {
        failures.push(`Detected forbidden resume coaching phrase: "${kw}"`);
      }
    }
  }

  if (testCase.reportType === 'interview_strategy_guide') {
    const questions = responseData.interview_playbook.questions;
    if (
      testCase.assertions.minStarQuestions
      && questions.length < testCase.assertions.minStarQuestions
    ) {
      failures.push(
        `Insufficient STAR interview questions: expected >= ${testCase.assertions.minStarQuestions}, got ${questions.length}`,
      );
    }

    if (testCase.assertions.requireCompBreakdown) {
      const comp = responseData.salary_intelligence;
      if (!comp.base || !comp.equity || !comp.bonus) {
        failures.push('Compensation breakdown missing Base, RSU, or Sign-on elements');
      }
    }

    if (testCase.assertions.requireLimitations) {
      if (responseData.limitations.length === 0) {
        failures.push('Stealth startup analysis failed to trigger honest limitations/fallback');
      }
    }

    if (testCase.assertions.requireLayoffWarning) {
      const risks = JSON.stringify({
        ...responseData.macro_risk,
        ...responseData.hiring_context,
      }).toLowerCase();
      if (!risks.includes('layoff') && !risks.includes('restructuring') && !risks.includes('裁員')) {
        failures.push('Failed to identify verified historical layoff/restructuring event');
      }
    }

    if (testCase.assertions.requireProvenance) {
      const urls = responseData.provenance.filter((p) => /^https?:\/\//i.test(p.url));
      if (urls.length === 0) {
        failures.push('Provenance missing at least one http(s) citation URL');
      }
    }

    if (testCase.assertions.requireDealbreakerNote) {
      const blob = JSON.stringify({
        ...responseData.hiring_context,
        ...responseData.macro_risk,
      }).toLowerCase();
      if (
        !blob.includes('remote')
        && !blob.includes('onsite')
        && !blob.includes('sponsor')
        && !blob.includes('dealbreaker')
        && !blob.includes('non-negotiable')
      ) {
        failures.push('Career-context dealbreaker was not surfaced in hiring context');
      }
    }
  }

  return {
    id: testCase.id,
    name: testCase.name,
    category: testCase.category,
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    score,
    dogType,
    latencyMs,
    costUsd,
    failures,
    mode,
  };
}
