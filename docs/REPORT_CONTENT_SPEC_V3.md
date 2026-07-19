# JobBeagle Report Content Spec v3（權威標準）

> **來源檔：** Desktop `JobBeagle_Report_Content_Spec_v3.xlsx` + 產品勾選決策  
> **基準日：** 2026-07-19  
> **用途：** 報告欄位、prompt、模型路由以此為準；**勾選表決策覆寫 Excel 原文**。

## 產品主張

JobBeagle 告訴使用者兩件最重要的事：

1. **Candidate Fit Score** — 競爭力有多高（0–100，可追溯）
2. **Expected Offer Range** — 合理可期待薪酬是否值得投入（含 evidence tier）

其餘欄位服務這兩個結論。

## 雙產品

| 產品 | 定位 |
|------|------|
| Job Fit Snapshot | 要不要投：分數、薪水、Apply Decision、五維 breakdown（精簡一頁） |
| Interview Strategy Guide | 面試作戰：Snapshot + Candidate Case + Hiring Context + DefenseCard + Playbook + Offer TC／Strategy |

## 模型路由（產品決策：維持現站）

| 工作 | 責任 |
|------|------|
| Job Fit Snapshot（整份） | 單次 `gemini-3.1-flash-lite` + Structured Output（**不開 Search**） |
| Interview Strategy Guide | **單次** `gemini-3.1-pro-preview` + Search（**不**先跑 Flash、不拆 P0–P9 管線） |
| 正規化／引用清理 | 後端 `normalizeLiteReport` / `normalizeFullReport` + provenance URL 驗證 |

**刻意不做（相對 Excel 原管線）：** 多階段 P0–P9、後端重算 Fit Score、獨立 Salary data service、Hard Filter 純後端 rules engine、Guide 內 Snapshot 層改回 Flash。

## Snapshot UI 決策（精簡一頁）

| 項目 | 決策 |
|------|------|
| Evidence Coverage / Hard Filter 並列 / Role Read / Screenability / Data Completeness / Posted-Expected-Target 四件套 / Interview starters | **不顯示**（payload 可保留；改 Spec） |
| Beagle Scale | **保留**（產品英雄層） |
| Apply Decision Card | **顯示** |
| Score breakdown（五維） | **顯示** |
| Resume Actions | **禁教練**：只允許 missing-proof 事實；**不**做 15 分鐘履歷修改教練；Snapshot **不強制顯示** actions 列表 |

## Guide UI／資料決策

| 項目 | 決策 |
|------|------|
| DefenseCard 風險｜證據對撞 | **做** |
| EvidenceBadge Tier 1/2/3、主張級 inline evidence、Blocked→Concerns 自動灌入 | **不做／改 Spec**（頁級 Provenance + DefenseCard 即可） |
| Candidate Case（Proof Map 升級） | **做** |
| Offer TC（Base/Bonus/Equity）＋ structured levers | **做** |
| Provenance 後端 URL／日期驗證 + report_version | **做** |
| Strength/Gap evidence spans、Search 預算產品化、Apply Decision 後端強制引用 | **不做** |

## Career Context

帳號頁可填六項底線；分析時注入 prompt；`expected_offer.target_gap` 與 `offer_strategy` 必須對齊個人目標／walk-away（有填時）。

## 刻意不做（產品層）

- FLSA 納入核心報告
- 文化契合分數／文化「真相」
- 用模型記憶假裝公司 offer
- 無來源的「真實面試題」
- 殘酷羞辱語氣；履歷 builder／履歷教練；全市場 Job Radar

## 欄位一覽（payload）

見程式 `types.ts`：`LiteReport` / `FullReport` / `CareerContext` / `CandidateCase` / `OfferTcBreakdown` / `ProvenanceRecord`。
