# Golden Dataset & Quality Assurance Tools

This directory contains quality assurance tools and golden datasets for JobBeagle report validation.

## 📁 Directory Structure

```
tests/fixtures/golden-reports/       # 10 curated test reports
  ├── high-leverage-diamond-1.json   # Score 92, Meta SWE
  ├── high-leverage-sapphire-2.json  # Score 88, Stripe PM
  ├── high-leverage-diamond-3.json   # Score 90, Airbnb DS
  ├── mid-leverage-silver-4.json     # Score 74, Capital One BA
  ├── mid-leverage-gold-5.json       # Score 71, Adobe PM
  ├── mid-leverage-silver-6.json     # Score 68, Walmart DA
  ├── mid-leverage-gold-7.json       # Score 70, Target MA
  ├── low-leverage-bronze-8.json     # Score 58, State Farm Junior DA
  ├── low-leverage-bronze-9.json     # Score 62, HubSpot CS Associate
  └── low-leverage-bronze-10.json    # Score 55, FedEx Ops Coordinator

scripts/qa/
  └── red-team-validator.mjs         # Adversarial quality audit script

__tests__/integration/
  ├── golden-dataset-ats.test.ts     # ATS Resolution Box validation (71 tests)
  └── golden-dataset-leverage.test.ts # Dynamic Leverage validation (24 tests)
```

## 🎯 Purpose

### Golden Dataset
- **Regression testing baseline**: Ensures future changes don't break existing quality
- **Training data**: Examples of high-quality reports across leverage tiers
- **Documentation**: Demonstrates expected output format and content

### Test Coverage
- **95 automated tests** validating:
  - ATS gaps (2-3 per report, correct types, non-fabricated requirements)
  - Dynamic Leverage (tone matches candidate leverage level)
  - Schema consistency across all reports

## 🚀 Usage

### Run Automated Tests

```bash
# Run all Golden Dataset tests (95 tests)
npm test -- __tests__/integration/golden-dataset

# Run only ATS tests (71 tests)
npm test -- __tests__/integration/golden-dataset-ats

# Run only Dynamic Leverage tests (24 tests)
npm test -- __tests__/integration/golden-dataset-leverage
```

### Red Team Validation (Offline QA)

**Purpose**: Deep adversarial validation using LLM to catch issues that automated tests miss.

```bash
# Batch validate all golden reports
npm run qa:red-team-batch

# Validate single report
npm run qa:red-team -- path/to/report.json --resume path/to/resume.txt

# With API key for actual LLM validation (not mock)
GEMINI_API_KEY=your_key npm run qa:red-team-batch
```

**What Red Team Checks**:
1. ❌ Fabricated facts (invented news, salary numbers, layoffs)
2. ❌ Unverifiable claims (no URL provenance)
3. ❌ Contradictions (conflicting statements across pages)
4. ❌ Hallucinations (invented job titles, experience not in resume)
5. ❌ Impractical advice (vague negotiation scripts, generic STAR)

**Output Severity Levels**:
- `critical`: Reject publication (fabricated facts)
- `major`: Manual review required (missing provenance)
- `minor`: Log and monitor (minor imprecision)
- `pass`: No issues detected

## 📊 Golden Dataset Statistics

| Leverage Tier | Count | Score Range | Example Companies |
|--------------|-------|-------------|-------------------|
| **High** (Diamond/Sapphire) | 3 | 85-92 | Meta, Stripe, Airbnb |
| **Mid** (Silver/Gold) | 4 | 65-84 | Capital One, Adobe, Walmart |
| **Low** (Bronze) | 3 | 50-64 | State Farm, HubSpot, FedEx |

### Key Features Validated

✅ **ATS Resolution Box** (new feature):
- 2-3 gaps per report
- Valid gap types: `keyword_missing`, `quantification_weak`, `experience_unclear`
- JD requirements quoted verbatim (no fabrication)
- Specific resume weaknesses identified
- Actionable fix strategies (interview talking points)
- Severity: `critical` or `major`

✅ **Dynamic Leverage** (new feature):
- **High leverage**: Confident tone, specific numbers, cites Levels.fyi, assertive close
- **Mid leverage**: Balanced tone, emphasizes growth, flexible but grounded
- **Low leverage**: Humble tone, asks for budget, emphasizes learning

## 🔄 Maintaining Golden Dataset

### When to Update
- After major prompt changes (Layer 2)
- After schema changes (Layer 1)
- When adding new product features
- When fixing quality regressions

### How to Add New Reports
1. Generate a real report from production
2. Manually review and validate quality
3. Remove PII and anonymize if needed
4. Add to `tests/fixtures/golden-reports/`
5. Run tests: `npm test -- golden-dataset`
6. Update this README with new statistics

### Quality Standards
Each golden report must have:
- ✅ No fabricated facts (verifiable claims only)
- ✅ ATS gaps with real JD quotes
- ✅ Negotiation script matching leverage tier
- ✅ Interview questions grounded in resume
- ✅ Consistent schema structure

## 🛠️ Troubleshooting

### Tests Failing
```bash
# Check which specific test failed
npm test -- golden-dataset --reporter=verbose

# Validate schema manually
node -e "console.log(JSON.parse(require('fs').readFileSync('tests/fixtures/golden-reports/high-leverage-diamond-1.json')))"
```

### Red Team Script Issues
```bash
# Run with debug output
DEBUG=* npm run qa:red-team-batch

# Check GEMINI_API_KEY is set (optional, will use mock if not)
echo $GEMINI_API_KEY
```

## 📈 CI/CD Integration

These tests run automatically on:
- Every PR (GitHub Actions)
- Before deployment (Vercel)
- Post-deployment smoke tests

**Threshold**: ≥95% pass rate required for merge.

## 📝 Related Documentation

- [PERFECT_REPORT_METHODOLOGY.md](../../docs/PERFECT_REPORT_METHODOLOGY.md) - Complete methodology
- [REPORT_ARCHITECTURE_AUDIT.md](../../docs/REPORT_ARCHITECTURE_AUDIT.md) - System architecture
- [Trinity Architecture](../../docs/TRINITY_ARCHITECTURE_COMPLETE.md) - Schema+Prompt+UI alignment

---

**Last Updated**: 2026-09-25  
**Test Coverage**: 95 automated tests + Red Team validation  
**Status**: ✅ All tests passing
