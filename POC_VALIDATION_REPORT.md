# JobBeagle 100-Case PoC Validation Report

**Run Date**: 2026-09-06T10:41:30.623Z
**Quality engine**: Local closed-book rubric (`50 + S + E + I + F`), not live Gemini Flash-Lite / Pro
**System engine**: Real workspace libraries (extension handoff, credits, PayPal parsers, route contracts)
**Payment Gateway**: PayPal REST API (Live/Sandbox) — no live charges in this run
**Model spend**: $0.000 (local rubric; live Gemini is opt-in only)

This run does **not** prove Gemini prompt quality. It proves (1) the 100-case dataset is internally consistent with JobBeagle scoring rules, and (2) the 20 system cases hit real product functions instead of echoing expected HTTP codes.

---

## 1. Executive Metrics

| Metric | Measured Value | Standard Threshold | Verdict |
| :--- | :--- | :--- | :--- |
| **Total Test Cohorts** | **100 Cases** | 100 Cases | **Complete** |
| **Overall Pass Rate** | **100.0%** | >= 95.0% | **PASSED** |
| **Snapshot Quality (40)** | **40/40** Pass | 40/40 | **Verified** |
| **Guide Quality (40)** | **40/40** Pass | 40/40 | **Verified** |
| **System & PayPal (20)** | **20/20** Pass | 20/20 | **Verified** |
| **Failed / Error** | **0 / 0** | 0 / 0 | **Clean** |
| **Total Model Spend** | **$0.000 USD** | <= $3.00 USD | **Local** |
| **Average Latency** | **0 ms** | <= 4500 ms | **Passed** |

---

## 2. Invariant Compliance Checklist

* **Strict 50-100 Scoring Floor**: **PASSED**
* **Metricless Resume Penalty**: **PASSED**
* **Zero Resume Coaching Leakage**: **PASSED**
* **Stealth Startup Fallback**: **PASSED**
* **PayPal Webhook Idempotency**: **PASSED**
* **Dual Pool Isolation**: **PASSED**

---

## 3. Detailed Results by Category

### A. Snapshot Quality (40/40)

Product Beagle Scale used: 鑽石 / 藍寶 / 翡翠 / 赤銅 (spec aliases 黃金 / 白銀 / 青銅 are mapped).

* [PASS] `TC-S01` Snapshot - Diamond Match #1 (Stripe Staff Backend) — score 99 鑽石米格魯
* [PASS] `TC-S02` Snapshot - Diamond Match #2 (Meta Ads PM) — score 91 鑽石米格魯
* [PASS] `TC-S03` Snapshot - Diamond Match #3 (Frontend Next.js) — score 90 鑽石米格魯
* [PASS] `TC-S04` Snapshot - Diamond Match #4 (Capital One Analyst) — score 90 鑽石米格魯
* [PASS] `TC-S05` Snapshot - Gold Match #1 (Square) — score 86 藍寶米格魯
* [PASS] `TC-S06` Snapshot - Gold Match #2 (Plaid) — score 86 藍寶米格魯
* [PASS] `TC-S07` Snapshot - Gold Match #3 (Coinbase) — score 87 藍寶米格魯
* [PASS] `TC-S08` Snapshot - Gold Match #4 (Block) — score 87 藍寶米格魯
* [PASS] `TC-S09` Snapshot - Gold Match #5 (Affirm) — score 82 藍寶米格魯
* [PASS] `TC-S10` Snapshot - Gold Match #6 (Robinhood) — score 82 藍寶米格魯
* [PASS] `TC-S11` Snapshot - Gold Match #7 (SoFi) — score 82 藍寶米格魯
* [PASS] `TC-S12` Snapshot - Gold Match #8 (Chime) — score 82 藍寶米格魯
* [PASS] `TC-S13` Snapshot - Silver Match #1 (adjacent PM to analytics) — score 65 翡翠米格魯
* [PASS] `TC-S14` Snapshot - Silver Match #2 (frontend to full-stack) — score 65 翡翠米格魯
* [PASS] `TC-S15` Snapshot - Silver Match #3 (support-engineer to backend) — score 65 翡翠米格魯
* [PASS] `TC-S16` Snapshot - Silver Match #4 (BI developer to product analytics) — score 65 翡翠米格魯
* [PASS] `TC-S17` Snapshot - Silver Match #5 (QA to SDET) — score 65 翡翠米格魯
* [PASS] `TC-S18` Snapshot - Silver Match #6 (implementation consultant to TAM) — score 65 翡翠米格魯
* [PASS] `TC-S19` Snapshot - Silver Match #7 (ops analyst to strategy) — score 65 翡翠米格魯
* [PASS] `TC-S20` Snapshot - Silver Match #8 (recruiter-ops to people analytics) — score 65 翡翠米格魯
* [PASS] `TC-S21` Snapshot - Silver Match #9 (cs-lead to onboarding PM) — score 65 翡翠米格魯
* [PASS] `TC-S22` Snapshot - Silver Match #10 (finance-ops to revenue ops) — score 65 翡翠米格魯
* [PASS] `TC-S23` Snapshot - Bronze Match #1 (Teacher vs NVIDIA ML) — score 55 赤銅米格魯
* [PASS] `TC-S24` Snapshot - Bronze Match #2 (Nurse vs NVIDIA ML) — score 55 赤銅米格魯
* [PASS] `TC-S25` Snapshot - Bronze Match #3 (Counselor vs Stripe Staff) — score 55 赤銅米格魯
* [PASS] `TC-S26` Snapshot - Bronze Match #4 (Teacher vs Meta PM) — score 54 赤銅米格魯
* [PASS] `TC-S27` Snapshot - Bronze Match #5 (Nurse vs Amazon L6) — score 55 赤銅米格魯
* [PASS] `TC-S28` Snapshot - Bronze Match #6 (Counselor vs Airbnb Frontend) — score 55 赤銅米格魯
* [PASS] `TC-S29` Snapshot - Metricless Executive #1 — score 65 翡翠米格魯
* [PASS] `TC-S30` Snapshot - Metricless Executive #2 — score 65 翡翠米格魯
* [PASS] `TC-S31` Snapshot - Metricless Executive #3 — score 65 翡翠米格魯
* [PASS] `TC-S32` Snapshot - Metricless Executive #4 — score 65 翡翠米格魯
* [PASS] `TC-S33` Snapshot - Closed Book Comp Validation #1 — score 76 藍寶米格魯
* [PASS] `TC-S34` Snapshot - Closed Book Comp Validation #2 — score 76 藍寶米格魯
* [PASS] `TC-S35` Snapshot - Closed Book Comp Validation #3 — score 76 藍寶米格魯
* [PASS] `TC-S36` Snapshot - Closed Book Comp Validation #4 — score 76 藍寶米格魯
* [PASS] `TC-S37` Snapshot - Anti-Coaching Verification #1 — score 65 翡翠米格魯
* [PASS] `TC-S38` Snapshot - Anti-Coaching Verification #2 — score 65 翡翠米格魯
* [PASS] `TC-S39` Snapshot - Multilingual Consistency #1 — score 76 藍寶米格魯
* [PASS] `TC-S40` Snapshot - Multilingual Consistency #2 — score 76 藍寶米格魯

### B. Guide Strategy Report Quality (40/40)

* [PASS] `TC-G01` Guide - BigTech RTO & Org Context #1 (Google) — score 67
* [PASS] `TC-G02` Guide - BigTech RTO & Org Context #2 (Meta) — score 67
* [PASS] `TC-G03` Guide - BigTech RTO & Org Context #3 (Amazon) — score 67
* [PASS] `TC-G04` Guide - BigTech RTO & Org Context #4 (Apple) — score 67
* [PASS] `TC-G05` Guide - BigTech RTO & Org Context #5 (Microsoft) — score 67
* [PASS] `TC-G06` Guide - BigTech RTO & Org Context #6 (Nvidia) — score 67
* [PASS] `TC-G07` Guide - Public Layoff & Restructuring Risk #1 — score 61
* [PASS] `TC-G08` Guide - Public Layoff & Restructuring Risk #2 — score 61
* [PASS] `TC-G09` Guide - Public Layoff & Restructuring Risk #3 — score 61
* [PASS] `TC-G10` Guide - Public Layoff & Restructuring Risk #4 — score 61
* [PASS] `TC-G11` Guide - Public Layoff & Restructuring Risk #5 — score 61
* [PASS] `TC-G12` Guide - Public Layoff & Restructuring Risk #6 — score 61
* [PASS] `TC-G13` Guide - Stealth Startup Honest Limitations #1 — score 64
* [PASS] `TC-G14` Guide - Stealth Startup Honest Limitations #2 — score 64
* [PASS] `TC-G15` Guide - Stealth Startup Honest Limitations #3 — score 64
* [PASS] `TC-G16` Guide - Stealth Startup Honest Limitations #4 — score 64
* [PASS] `TC-G17` Guide - Stealth Startup Honest Limitations #5 — score 64
* [PASS] `TC-G18` Guide - Stealth Startup Honest Limitations #6 — score 64
* [PASS] `TC-G19` Guide - Staff/Director STAR Interview Playbook #1 — score 63
* [PASS] `TC-G20` Guide - Staff/Director STAR Interview Playbook #2 — score 63
* [PASS] `TC-G21` Guide - Staff/Director STAR Interview Playbook #3 — score 63
* [PASS] `TC-G22` Guide - Staff/Director STAR Interview Playbook #4 — score 63
* [PASS] `TC-G23` Guide - Staff/Director STAR Interview Playbook #5 — score 63
* [PASS] `TC-G24` Guide - Staff/Director STAR Interview Playbook #6 — score 63
* [PASS] `TC-G25` Guide - L5/L6 Total Compensation 3-Tier Breakdown #1 — score 86
* [PASS] `TC-G26` Guide - L5/L6 Total Compensation 3-Tier Breakdown #2 — score 86
* [PASS] `TC-G27` Guide - L5/L6 Total Compensation 3-Tier Breakdown #3 — score 86
* [PASS] `TC-G28` Guide - L5/L6 Total Compensation 3-Tier Breakdown #4 — score 86
* [PASS] `TC-G29` Guide - L5/L6 Total Compensation 3-Tier Breakdown #5 — score 86
* [PASS] `TC-G30` Guide - L5/L6 Total Compensation 3-Tier Breakdown #6 — score 86
* [PASS] `TC-G31` Guide - Career Context Dealbreaker Conflict #1 — score 78
* [PASS] `TC-G32` Guide - Career Context Dealbreaker Conflict #2 — score 78
* [PASS] `TC-G33` Guide - Career Context Dealbreaker Conflict #3 — score 78
* [PASS] `TC-G34` Guide - Career Context Dealbreaker Conflict #4 — score 78
* [PASS] `TC-G35` Guide - Provenance URL Integrity Verification #1 — score 91
* [PASS] `TC-G36` Guide - Provenance URL Integrity Verification #2 — score 91
* [PASS] `TC-G37` Guide - Provenance URL Integrity Verification #3 — score 91
* [PASS] `TC-G38` Guide - Provenance URL Integrity Verification #4 — score 91
* [PASS] `TC-G39` Guide - Extreme Long Payload Stress Test #1 — score 99
* [PASS] `TC-G40` Guide - Extreme Long Payload Stress Test #2 — score 99

### C. System Funnel, Security & PayPal (20/20)

* [PASS] `TC-SYS01` Extension DOM Capture (LinkedIn)
* [PASS] `TC-SYS02` Extension Reject JD < 40 chars
* [PASS] `TC-SYS03` Extension HMAC sid Generation
* [PASS] `TC-SYS04` Expired sid (>30m) Returns 410
* [PASS] `TC-SYS05` Extension Capture Rate Limit (60/hr)
* [PASS] `TC-SYS06` Legacy Payload Base64 Fallback
* [PASS] `TC-SYS07` Snapshot Free 3 Quota Depleted
* [PASS] `TC-SYS08` Guide 0 Credit Pool Isolation
* [PASS] `TC-SYS09` Gemini 500 Credit Rollback Invariant
* [PASS] `TC-SYS10` Device Fingerprint Collision Limit
* [PASS] `TC-SYS11` PayPal Sandbox Single Order Settlement
* [PASS] `TC-SYS12` PayPal Webhook Duplicate Idempotency
* [PASS] `TC-SYS13` Subscription First Purchase Increments Balance
* [PASS] `TC-SYS14` Reject Forged PayPal Webhook Signature
* [PASS] `TC-SYS15` Supabase RLS Cross-Tenant Report Block
* [PASS] `TC-SYS16` Profile API Client Credits Tampering Block
* [PASS] `TC-SYS17` Deactivated Account Analysis Block
* [PASS] `TC-SYS18` CCPA Hard Account Data Purge Cascade
* [PASS] `TC-SYS19` Empty Session /report Renders Clean State
* [PASS] `TC-SYS20` Disabled /shorts Route Safe Redirect

---

## 4. Anomaly Log

Zero anomalies detected. All 100 test cohorts satisfied acceptance criteria.

---

## 5. How to re-run

```bash
npx tsx scripts/poc-runner/run.ts
```

Do not set `USE_LOCAL_SERVER=true` unless you have a signed-in local session and a mapper for the live analyze payload. This suite never adds an analyze auth bypass.
