# JobBeagle — Interview Strategy Guide (Pages 1–5) UI Layout & Component Spec

> **Target:** Cursor Agent / Front-end Developer  
> **Source of Truth:** Excel《Jobbeagle報告範圍》最新修訂版  
> **Design System:** Dark Slate Theme, Border-rendered Boxed Cards, Dual-column Responsive Grid, High-density Typography (mirrored from Page 1 `LiteReportDashboard`).

## Global rules

1. Pages 2–5 must reuse Page 1 card/grid/CSS/typography.
2. Page 1 frozen except mandatory ATS Rejection Warning in Critical Gaps.
3. Pages 2–3 must not repeat numeric salary prediction ranges from Page 1.
4. Honest fallback UI when web grounding is thin — never fake data/URLs.

## Implementation map

| Page | Nav tab id | Component |
|------|------------|-----------|
| 1 Snapshot + ATS | `snapshot` | `LiteReportDashboard` |
| 2 Role & Team | `hiring` | `GuideStrategyPages` → Page2 |
| 3 Company Truth | `interview` | `GuideStrategyPages` → Page3 |
| 4 Interview & Comp | `salary` | `GuideStrategyPages` → Page4 |
| 5 References | `provenance` | `GuideStrategyPages` → Page5 |

Shared chrome: `components/guide/GuideSlideChrome.tsx`  
Schema fields: `ats_warning`, `role_team_insights`, `company_truth`, `reference_citations` in `types.ts` + Full/Lite prompts + normalize.
