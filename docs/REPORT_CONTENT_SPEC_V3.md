# JobBeagle Report Content Spec v3（權威標準）

> **來源檔：** `docs/JobBeagle_Report_Content_Spec_v3.xlsx`（與桌面 v3 同步）  
> **基準日：** 2026-07-18  
> **用途：** 報告欄位、prompt、模型路由以此為準；實作不得偏離本決策。

## 產品主張

JobBeagle 告訴使用者兩件最重要的事：

1. **Candidate Fit Score** — 競爭力有多高（0–100，可追溯）
2. **Expected Offer Range** — 合理可期待薪酬是否值得投入（含 evidence tier）

其餘欄位服務這兩個結論。

## 雙產品

| 產品 | 定位 |
|------|------|
| Job Fit Snapshot | 要不要投：分數、薪水、硬條件、履歷動作、Apply Decision |
| Interview Strategy Guide | 面試作戰：深化雙核心 + Hiring Context + Concerns & Defenses + Playbook + Offer Strategy |

## 模型路由

| 工作 | 責任 |
|------|------|
| 履歷／JD 事實提取、Snapshot 文案 | `gemini-3.1-flash-lite` + Structured Output |
| 硬條件判定、算分、薪資數字鎖定、引用驗證 | **後端** |
| Strategy 判斷（公司／攻防／STAR／談判） | `gemini-3.1-pro-preview`（+ Search grounding 視需要） |

## 刻意不做

- FLSA 納入核心報告
- 文化契合分數／文化「真相」
- 用模型記憶假裝公司 offer
- 無來源的「真實面試題」
- 殘酷羞辱語氣；履歷 builder；全市場 Job Radar

## 欄位一覽（payload）

見 Excel 工作表 `Report Field Design` R9，或程式 `types.ts` 中 Snapshot／Strategy 介面。

詳細 prompt：Excel `Full Prompts`（P0–P9）。
