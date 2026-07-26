import type { FullReport, LiteReport } from '@/types';
import type { AppLanguage } from '@/lib/report-language';

/** Narrative overlays merged onto the English sample base (enums / numbers stay). */
export type SampleLocalePack = {
  snapshot: Partial<LiteReport>;
  guide: Partial<FullReport>;
};

const ZH_TW: SampleLocalePack = {
  snapshot: {
    data_completeness: {
      level: 'High',
      missing_inputs: [],
      confidence_notes: '職缺與履歷完整度足夠，可產出可信快照。',
    },
    hard_filter: {
      status: 'Risk',
      items: [
        {
          requirement: '5+ 年 BA／產品營運經驗',
          status: 'Pass',
          evidence: '履歷列出金融科技營運相關約 6 年經驗',
        },
        {
          requirement: 'SQL + 儀表板擁有權',
          status: 'Pass',
          evidence: '履歷明確寫出 Looker + SQL',
        },
        {
          requirement: '支付／ACH 領域',
          status: 'Risk',
          evidence: '偏銀行營運相鄰經驗；ACH 未明示',
        },
      ],
    },
    fit_score: {
      score: 78,
      band: 'Strong',
      evidence_coverage: 'High',
      sharp_verdict:
        '分析與跨部門協作故事對此 Senior BA 職缺很強。職級與年資對齊高階擁有權。主要缺口是 ACH／清算深度相對銀行營運相鄰經驗。',
      sharp_verdict_points: [
        '核心適配：SQL／Looker 擁有權、可量化營運成果、跨職能協調，對齊此 JD 核心範疇。',
        '職級／年資對齊：六年金融科技營運經驗，是進入高階擁有權的自然一步，而非硬衝職稱。',
        '主要缺口：支付 ACH／清算深度；履歷偏銀行營運相鄰，篩選者可能深挖退票與支付軌道熟悉度。',
      ],
      breakdown: [
        {
          dimension: '硬性條件／可行性',
          weight_pct: 30,
          score: 72,
          note: '72：年資與 SQL 必備條件已達，但 ACH／清算擁有權僅屬相鄰銀行營運，故硬性可行性落在七十多分。',
        },
        {
          dimension: '職級／範疇／年資',
          weight_pct: 25,
          score: 80,
          note: '80：六年金融科技營運清楚對齊 Senior BA 範疇——自然晉升，不是硬衝職稱。',
        },
        {
          dimension: '核心技能／工具',
          weight_pct: 20,
          score: 85,
          note: '85：SQL、Looker、Jira 與利害關係人節奏皆有證據，符合此 JD 日常工具。',
        },
        {
          dimension: '領域／職能經驗',
          weight_pct: 15,
          score: 70,
          note: '70：金融科技營運扎實，但相對此 JD 的清算焦點，支付軌道／ACH 深度偏薄。',
        },
        {
          dimension: '可驗證成果',
          weight_pct: 10,
          score: 82,
          note: '82：履歷上有可量化週期與錯誤率改善，可轉移到此營運分析職缺。',
        },
      ],
    },
    proof_map: {
      strengths: [
        {
          point: '可量化營運改善',
          description: '以 SQL + Looker 流程將對帳週期縮短 28%。',
          skill_kind: 'hard',
        },
        {
          point: '跨職能協調',
          description: '帶領工程、風險與客服每週 triage 長達 18 個月。',
          skill_kind: 'soft',
        },
        {
          point: '需求紀律',
          description: '主導三個平台上線的 PRD 與驗收標準。',
          skill_kind: 'hard',
        },
        {
          point: '利害關係人溝通',
          description: '高階主管可用的狀態包，用於月度業務檢視。',
          skill_kind: 'soft',
        },
      ],
      gaps: [
        {
          gap: 'ACH／支付軌道深度',
          description: 'JD 強調 ACH 退票與清算；履歷偏銀行營運相鄰。',
          skill_kind: 'hard',
        },
        {
          gap: '供應商／處理商管理',
          description: '未見具名處理商或 NACHA 合規擁有權。',
          skill_kind: 'hard',
        },
        {
          gap: '美國法規關鍵字',
          description: '關鍵字篩選可能漏掉 Reg E／退票用語。',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        '所附履歷未證明 ACH／退票擁有權。',
        '未證明具名支付處理商經驗。',
      ],
      screenability_note: '營運關鍵字強；支付軌道關鍵字偏薄。',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary: '履歷在 ACH／退票／清算／NACHA 等此 JD 核心關鍵字上偏薄。',
      missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
    },
    expected_offer: {
      posted_range: null,
      p25: '$145K',
      p50: '$165K',
      p75: '$190K',
      currency: 'USD',
      region: '美國 · 友善遠端',
      target_gap:
        '美國遠端金融科技營運 Senior BA 相近現金區間多落於此帶；談判前請確認雇主核定區間。',
      evidence_tier: 'C',
      sources: ['美國 Senior BA／金融科技營運市場基準'],
      candidate_predicted_offer: '$155K',
      candidate_position_label:
        '偏中下帶：核心 BA 證據扎實，但 ACH／支付擁有權偏薄，現金可能低於座位中位。',
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '約 $20K／年',
        sign_on: '市場常見 $10K–$20K',
        total: '約 $185K TC',
      },
    },
    apply_decision: {
      label: 'Apply after fixes',
      reason:
        '你在需求擁有權、可量化營運影響力與利害關係人協調上已過 Senior BA 門檻，此職缺值得推進。主要競爭風險是 ACH／支付軌道證據偏薄，而 JD 把支付營運深度當核心。先確認該領域要求有多硬再投——否則篩選者可能把你排在支付原生候選人後面。',
      next_best_action: '先向招募確認 ACH／退票擁有權是必備還是加分，再投入完整投遞週期。',
    },
    role_read: {
      mission: '擁有支付營運改善的需求與分析。',
      responsibilities: [
        '把營運痛點轉成優先排序的 backlog',
        '與工程合作清算／退票流程',
        '發布週期與錯誤率 KPI',
      ],
      hiring_signals: [
        '預期高階擁有權，而非初階工單分流',
        '偏好支付領域勝於泛用 BA',
        'SQL 是必備，不是加分項',
      ],
    },
    interview_starters: [
      '請分享你改善對帳或清算流程的一次經驗。',
      '工程產能不足時，你如何排優先級？',
      '請說說利害關係人真正會用的儀表板經驗。',
    ],
  },
  guide: {
    strategy_fit_salary: {
      score_implications:
        '78 分若清楚表述 ACH 相鄰經驗，多半能過多數篩選；預期第二輪會有領域深挖。',
      offer_implications: '證據等級 C——先探索再錨定。支付擁有權可信後再瞄準中帶。',
      validate_with_recruiter: [
        'ACH／退票經驗是必備還是加分？',
        '此職缺核定職級帶是 Senior BA 還是 Staff？',
        '此團隊總酬如何拆現金與獎金？',
      ],
    },
    hiring_context: {
      insights: [
        {
          claim: '金融科技營運團隊正招聘能橋接產品與清算營運的分析師。',
          why_it_matters: '面試官會深挖跨職能交付，而不只是 SQL。',
          source_url: 'https://www.reuters.com',
          date: '2026-06',
        },
        {
          claim: '友善遠端的美國金融科技職缺仍要求非同步書面表達清晰。',
          why_it_matters: '面試請帶一份精簡的 KPI 成果一頁紙。',
          source_url: 'https://www.bloomberg.com',
          date: '2026-05',
        },
      ],
      limitations: [
        '此示範樣本未使用特定公司 IR 文件。',
        '招聘脈絡主張視為公開市場背景，而非內部情報。',
      ],
      validation_questions: [
        '此職缺為何現在開缺——補缺還是新範疇？',
        '這次任用 90 天成功長什麼樣？',
      ],
    },
    concerns_defenses: [
      {
        concern: 'ACH／支付軌道證據偏薄',
        why: 'JD 強調清算與退票擁有權。',
        evidence: '履歷有銀行營運 + 對帳週期改善。',
        missing_proof: '具名 ACH 退票或處理商擁有權。',
        answer_guide:
          '橋接：「上一份工作我擁有與支付清算相鄰的對帳 SLA。我會用同樣的 SQL + 利害關係人節奏這樣上手 ACH 退票……」',
        do_not_claim: '不要虛構你沒有擔任過的 NACHA 或處理商職稱。',
      },
      {
        concern: '高階範疇 vs IC 分析師習慣',
        why: '履歷職稱組合可能讀起來偏中階。',
        evidence: '帶領跨職能 triage 18 個月；高階狀態包。',
        missing_proof: '人數或預算擁有權。',
        answer_guide: '以「無職權影響力」開場：你主持的節奏、你打通的決策、你擁有的指標。',
        do_not_claim: '若你是 IC，不要聲稱有管人範疇。',
      },
      {
        concern: '薪酬預期 vs 未驗證區間',
        why: '無刊登區間；候選人可能過度錨定。',
        evidence: '僅有 C 級市場帶。',
        missing_proof: '招募確認的核定現金區間。',
        answer_guide: '先問核定區間，再用可量化成果定位中帶。',
        do_not_claim: '不要虛構公司特定 TC 數字。',
      },
    ],
    interview_playbook: {
      reported: [
        {
          question: '描述一次你與工程在清算優先級上意見不合的經驗。',
          predicted: false,
          source_url: 'https://www.glassdoor.com/Interview/index.htm',
          source_date: '2026-05',
          source_name: 'Glassdoor',
          category: 'behavioral',
          interviewer_intent: '清算風險下的衝突處理。',
          star_blueprint:
            'S：工程想延後清算熱修 · T：守住關帳日 · A：影響×風險打分 + 薄 MVP · R：熱修上線、無 sev-1',
          dos_donts: '不要把工程講成壞人；聚焦風險與客戶影響。',
        },
      ],
      predicted: [
        {
          question: '請從頭到尾說明你如何改善一個失效的營運流程。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考驗端到端擁有權與可量化影響力。',
          star_blueprint: 'S：對帳積壓 · T：縮短週期 · A：SQL + 節奏 · R：−28%',
          dos_donts: '用指標開場；不要虛構 ACH 處理商職稱。',
        },
        {
          question: '說說利害關係人忽略你儀表板的一次經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考驗無職權影響力。',
          star_blueprint: 'S：被忽略的報告 · T：高階採用 · A：5 個 KPI + MBR · R：連續三個月被引用',
          dos_donts: '不要聲稱有管人範疇。',
        },
        {
          question: '描述一次你協調風險與客服優先級衝突的經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '跨職能取捨判斷。',
          star_blueprint: 'S：雙 P0 · T：守住清算 · A：影響×風險拆分 · R：無 sev-1',
          dos_donts: '不要抹黑任一利害關係人。',
        },
        {
          question: '說說你曾經對利害關係人的需求說不的經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '在不傷信任下設界線。',
          star_blueprint:
            'S：客服要虛榮指標 · T：保持決策有用 · A：提替代 KPI + 負責人 · R：延後請求、MBR 維持精準',
          dos_donts: '語氣不要輕蔑；講清楚你守住的取捨。',
        },
        {
          question: '前 60 天你會如何上手 ACH 退票？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '學習計畫，且不虛構過去 ACH 擁有權。',
          star_blueprint: '第 1–2 週 shadow · 第 3–4 週 SQL 地圖 · 第 5–8 週擁有一個 KPI',
          dos_donts: '不要聲稱沒擔任過的 NACHA 職稱。',
          missing_facts: '準備學習計畫，不要虛構過去 ACH 職稱。',
        },
        {
          question: '你會如何設計清算週期的 KPI 包？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '指標設計與利害關係人可用性。',
          star_blueprint: '定義分子／分母 · 負責人 · 每週檢視節奏',
          dos_donts: '避免沒有行動負責人的虛榮指標。',
        },
        {
          question: '請說明你如何分流退票例外暴增。',
          predicted: true,
          category: 'technical',
          interviewer_intent: '模糊情境下的營運事故結構。',
          star_blueprint: '穩定 · 根因分群 · 臨時控制 · 永久修復',
          dos_donts: '不要虛構處理商後台經驗。',
        },
        {
          question: '在自己不擁有合規的情況下，你會如何驗證與 NACHA 相關的控制？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '在 BA 範疇內與風險／合規合作。',
          star_blueprint:
            '對齊控制負責人 · 定義證據清單 · 每週例外檢視 · 缺口上升通報',
          dos_donts: '不要聲稱自己是 NACHA 負責人。',
        },
        {
          question: '當清算 SLA 告急時，你如何估算並排序工程需求？',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'SLA 壓力下的產品／營運優先級。',
          star_blueprint:
            '量化 SLA 燒損 · 估工程成本 · 提 MVP vs 完整修復 · 與風險＋工程對齊',
          dos_donts: '不要虛構無法辯護的產能數字。',
        },
      ],
      star_templates: [
        {
          title: '對帳週期改善',
          for_question: '請從頭到尾說明你如何改善一個失效的營運流程。',
          situation: '月結對帳要 9 天，卡住財務關帳。',
          task: '在不加人力下縮短週期。',
          action: '建立 SQL 例外佇列 + Looker triage 看板；與工程／客服每週兩次。',
          result: '兩季內週期縮短 28%；錯誤外洩下降 15%。',
          resume_anchor: '可量化營運改善',
        },
        {
          title: '優先級利害衝突',
          for_question: '工程產能不足時，你如何排優先級？',
          situation: '風險與客服同 sprint 都自稱 P0。',
          task: '守住清算可靠度，同時交付客服小勝。',
          action: '用影響×風險打分；客服薄 MVP，清算熱修同列車。',
          result: '雙方接受取捨；下一季無 sev-1。',
          resume_anchor: '跨職能協調',
        },
        {
          title: '儀表板採用',
          for_question: '說說利害關係人忽略你儀表板的一次經驗。',
          situation: '先前儀表板兩週後就被忽略。',
          task: '做出高階每週會打開的 KPI 包。',
          action: '砍到 5 個指標、加上負責人與下一步，掛進 MBR 議程。',
          result: '連續三個月月會被引用。',
          resume_anchor: '利害關係人溝通',
        },
      ],
      star_outlines: [],
      reverse_questions: [
        '這次任用未來兩季要解決什麼問題？',
        '前 90 天成功如何衡量？',
        '目前最痛的支付流程是退票、清算還是爭議？',
      ],
      validate_before_join: [
        '確認營運分析夥伴的 on-call／事故負荷。',
        '詢問產品路線圖延遲多常影響清算 SLA。',
      ],
    },
    candidate_case: {
      hire_thesis:
        '雇用已能交付的營運分析擁有權：SQL／Looker 節奏、可量化週期改善、高階可用的協調——再用結構化 60 天計畫補上 ACH 缺口。',
      top_facts: [
        '以 SQL + Looker 將對帳週期縮短 28%',
        '帶領工程／風險／客服每週 triage 18 個月',
        '高階狀態包用於月度業務檢視',
      ],
    },
    offer_strategy: {
      target: '確認後瞄準核定現金區間中帶',
      acceptable: '若股票／遠端彈性強，可接受中下帶',
      walk_away: '探索後低於書面底線，或範疇低於 Senior BA',
      levers: ['範疇', '簽約金', '遠端彈性', '職級定級'],
      structured_levers: [
        { name: '範疇', note: '確認是 Senior BA 擁有權而非工單分流' },
        { name: '簽約金', note: '現金落中下、股票爬坡時可橋接' },
        { name: '遠端彈性', note: '地點彈性時可與到辦公室權衡' },
        { name: '職級定級', note: '錨定 TC 前先鎖職級' },
      ],
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '約 $20K／年',
        sign_on: '市場常見 $10K–$20K',
        total: '約 $185K TC',
      },
      script:
        '謝謝——在我報數字前，這個地點這個職級的核定現金區間是多少？根據相近 Senior BA 金融科技營運職缺與我的週期／KPI 擁有權，確認範疇後我會瞄準中帶。',
      discovery_questions: [
        '這個地點這個職級的核定區間是多少？',
        '總酬如何拆現金、獎金與股票？',
      ],
    },
    role_team_insights: {
      role_content_refined: [
        '端到端擁有支付營運改善的需求',
        '把營運痛點轉成優先工程 backlog',
        '發布週期與錯誤率 KPI 包',
      ],
      requirements_refined: [
        'SQL 能力是必備',
        '高階擁有權——不是初階工單分流',
        '偏好支付領域勝於泛用 BA',
      ],
      rto_official: '混合制——每週到辦公室 3 天（依 JD）',
      rto_employee_reality: '論壇提到跨職能節奏頻繁；關帳／事故週加班會升高。',
      next_title_1_3yr: 'Lead BA／支付營運產品負責人',
      career_path_basis:
        '公司未公開內部職等表 — 依 Levels.fyi／LinkedIn 的 Senior BA→Lead BA 路徑，以及美國金融科技營運就業市場職涯階梯推估（本頁不顯示薪資金額）。',
      promotion_skill_gaps: [
        '具名 ACH／退票擁有權',
        '處理商／供應商管理證據',
        '組織層級衝突協調',
      ],
      team_sample_insufficient: false,
    },
    company_truth: {
      current_strategy:
        '近期重心是清算可靠度與例外自動化：降低 ACH 退票失敗、加快關帳，並用 AI 輔助分流，讓營運分析師用週期 KPI 帶隊，而不是只救火工單。',
      competitors: [
        {
          name: 'Stripe',
          strengths:
            '開發者友善軌道、美國 ACH／卡覆蓋廣，產品團隊想自助接支付時品牌很強。',
          weaknesses:
            '大型企業清算／退票擁有權較不像「營運分析師原生」；複雜 B2B 對帳常仍要大量客製。',
        },
        {
          name: 'Adyen',
          strengths:
            '統一商務堆疊與全球收單強，當 Northstar 客戶要跨境擴張時很有威脅。',
          weaknesses:
            '企業銷售週期較重；中型美國 ACH 營運團隊有時偏好更輕、偏美國的處理商。',
        },
        {
          name: 'Block（Square）',
          strengths:
            '中小商家密度與現金流產品，與 Northstar 也在搶的小型商戶量重疊。',
          weaknesses:
            '較少聚焦大規模退票／清算分析職缺；企業級 BA／營運工具敘事較薄。',
        },
      ],
      insider_voice: [
        '友善遠端職缺仍要求精準書面狀態包',
        '面試官深挖跨職能交付，而不只是 SQL 題',
      ],
      forum_sample_thin: false,
      layoff_legal_flags: [],
      interviewer_strategy_questions: [
        '此職缺為何現在開缺——補缺還是新範疇？',
        '此團隊 12 個月營運優先事項是什麼？',
        '過去一年營運人數如何變化？',
      ],
    },
  },
};

const ZH_CN: SampleLocalePack = {
  snapshot: {
    data_completeness: {
      level: 'High',
      missing_inputs: [],
      confidence_notes: '职位与简历完整度足够，可产出可信快照。',
    },
    hard_filter: {
      status: 'Risk',
      items: [
        {
          requirement: '5+ 年 BA／产品运营经验',
          status: 'Pass',
          evidence: '简历列出金融科技运营相关约 6 年经验',
        },
        {
          requirement: 'SQL + 仪表板所有权',
          status: 'Pass',
          evidence: '简历明确写出 Looker + SQL',
        },
        {
          requirement: '支付／ACH 领域',
          status: 'Risk',
          evidence: '偏银行运营相邻经验；ACH 未明示',
        },
      ],
    },
    fit_score: {
      score: 78,
      band: 'Strong',
      evidence_coverage: 'High',
      sharp_verdict:
        '分析与跨部门协作故事对此 Senior BA 职位很强。职级与年资对齐高阶所有权。主要缺口是 ACH／清算深度相对银行运营相邻经验。',
      sharp_verdict_points: [
        '核心适配：SQL／Looker 所有权、可量化运营成果、跨职能协调，对齐此 JD 核心范畴。',
        '职级／年资对齐：六年金融科技运营经验，是进入高阶所有权的自然一步，而非硬冲职称。',
        '主要缺口：支付 ACH／清算深度；简历偏银行运营相邻，筛选者可能深挖退票与支付轨道熟悉度。',
      ],
      breakdown: [
        {
          dimension: '硬性条件／可行性',
          weight_pct: 30,
          score: 72,
          note: '72：年资与 SQL 必备条件已达，但 ACH／清算所有权仅属相邻银行运营，故硬性可行性落在七十多分。',
        },
        {
          dimension: '职级／范畴／年资',
          weight_pct: 25,
          score: 80,
          note: '80：六年金融科技运营清楚对齐 Senior BA 范畴——自然晋升，不是硬冲职称。',
        },
        {
          dimension: '核心技能／工具',
          weight_pct: 20,
          score: 85,
          note: '85：SQL、Looker、Jira 与利益相关者节奏皆有证据，符合此 JD 日常工具。',
        },
        {
          dimension: '领域／职能经验',
          weight_pct: 15,
          score: 70,
          note: '70：金融科技运营扎实，但相对此 JD 的清算焦点，支付轨道／ACH 深度偏薄。',
        },
        {
          dimension: '可验证成果',
          weight_pct: 10,
          score: 82,
          note: '82：简历上有可量化周期与错误率改善，可转移到此运营分析职位。',
        },
      ],
    },
    proof_map: {
      strengths: [
        {
          point: '可量化运营改善',
          description: '以 SQL + Looker 流程将对账周期缩短 28%。',
          skill_kind: 'hard',
        },
        {
          point: '跨职能协调',
          description: '带领工程、风险与客服每周 triage 长达 18 个月。',
          skill_kind: 'soft',
        },
        {
          point: '需求纪律',
          description: '主导三个平台上线的 PRD 与验收标准。',
          skill_kind: 'hard',
        },
        {
          point: '利益相关者沟通',
          description: '高管可用的状态包，用于月度业务检视。',
          skill_kind: 'soft',
        },
      ],
      gaps: [
        {
          gap: 'ACH／支付轨道深度',
          description: 'JD 强调 ACH 退票与清算；简历偏银行运营相邻。',
          skill_kind: 'hard',
        },
        {
          gap: '供应商／处理商管理',
          description: '未见具名处理商或 NACHA 合规所有权。',
          skill_kind: 'hard',
        },
        {
          gap: '美国法规关键字',
          description: '关键字筛选可能漏掉 Reg E／退票用语。',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        '所附简历未证明 ACH／退票所有权。',
        '未证明具名支付处理商经验。',
      ],
      screenability_note: '运营关键字强；支付轨道关键字偏薄。',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary: '简历在 ACH／退票／清算／NACHA 等此 JD 核心关键字上偏薄。',
      missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
    },
    expected_offer: {
      posted_range: null,
      p25: '$145K',
      p50: '$165K',
      p75: '$190K',
      currency: 'USD',
      region: '美国 · 友好远程',
      target_gap:
        '美国远程金融科技运营 Senior BA 相近现金区间多落于此带；谈判前请确认雇主核定区间。',
      evidence_tier: 'C',
      sources: ['美国 Senior BA／金融科技运营市场基准'],
      candidate_predicted_offer: '$155K',
      candidate_position_label:
        '偏中下带：核心 BA 证据扎实，但 ACH／支付所有权偏薄，现金可能低于座位中位。',
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '约 $20K／年',
        sign_on: '市场常见 $10K–$20K',
        total: '约 $185K TC',
      },
    },
    apply_decision: {
      label: 'Apply after fixes',
      reason:
        '你在需求所有权、可量化运营影响力与利益相关者协调上已过 Senior BA 门槛，此职位值得推进。主要竞争风险是 ACH／支付轨道证据偏薄，而 JD 把支付运营深度当核心。先确认该领域要求有多硬再投——否则筛选者可能把你排在支付原生候选人后面。',
      next_best_action: '先向招聘确认 ACH／退票所有权是必备还是加分，再投入完整投递周期。',
    },
    role_read: {
      mission: '拥有支付运营改善的需求与分析。',
      responsibilities: [
        '把运营痛点转成优先排序的 backlog',
        '与工程合作清算／退票流程',
        '发布周期与错误率 KPI',
      ],
      hiring_signals: [
        '预期高阶所有权，而非初级工单分流',
        '偏好支付领域胜于泛用 BA',
        'SQL 是必备，不是加分项',
      ],
    },
    interview_starters: [
      '请分享你改善对账或清算流程的一次经验。',
      '工程产能不足时，你如何排优先级？',
      '请说说利益相关者真正会用的仪表板经验。',
    ],
  },
  guide: {
    strategy_fit_salary: {
      score_implications:
        '78 分若清楚表述 ACH 相邻经验，多半能过多数筛选；预期第二轮会有领域深挖。',
      offer_implications: '证据等级 C——先探索再锚定。支付所有权可信后再瞄准中带。',
      validate_with_recruiter: [
        'ACH／退票经验是必备还是加分？',
        '此职位核定职级带是 Senior BA 还是 Staff？',
        '此团队总酬如何拆现金与奖金？',
      ],
    },
    hiring_context: {
      insights: [
        {
          claim: '金融科技运营团队正招聘能桥接产品与清算运营的分析师。',
          why_it_matters: '面试官会深挖跨职能交付，而不只是 SQL。',
          source_url: 'https://www.reuters.com',
          date: '2026-06',
        },
        {
          claim: '友好远程的美国金融科技职位仍要求异步书面表达清晰。',
          why_it_matters: '面试请带一份精简的 KPI 成果一页纸。',
          source_url: 'https://www.bloomberg.com',
          date: '2026-05',
        },
      ],
      limitations: [
        '此示范样本未使用特定公司 IR 文件。',
        '招聘脉络主张视为公开市场背景，而非内部情报。',
      ],
      validation_questions: [
        '此职位为何现在开缺——补缺还是新范畴？',
        '这次任用 90 天成功长什么样？',
      ],
    },
    concerns_defenses: [
      {
        concern: 'ACH／支付轨道证据偏薄',
        why: 'JD 强调清算与退票所有权。',
        evidence: '简历有银行运营 + 对账周期改善。',
        missing_proof: '具名 ACH 退票或处理商所有权。',
        answer_guide:
          '桥接：「上一份工作我拥有与支付清算相邻的对账 SLA。我会用同样的 SQL + 利益相关者节奏这样上手 ACH 退票……」',
        do_not_claim: '不要虚构你没有担任过的 NACHA 或处理商职称。',
      },
      {
        concern: '高阶范畴 vs IC 分析师习惯',
        why: '简历职称组合可能读起来偏中阶。',
        evidence: '带领跨职能 triage 18 个月；高管状态包。',
        missing_proof: '人数或预算所有权。',
        answer_guide: '以「无职权影响力」开场：你主持的节奏、你打通的决策、你拥有的指标。',
        do_not_claim: '若你是 IC，不要声称有管人范畴。',
      },
      {
        concern: '薪酬预期 vs 未验证区间',
        why: '无刊登区间；候选人可能过度锚定。',
        evidence: '仅有 C 级市场带。',
        missing_proof: '招聘确认的核定现金区间。',
        answer_guide: '先问核定区间，再用可量化成果定位中带。',
        do_not_claim: '不要虚构公司特定 TC 数字。',
      },
    ],
    interview_playbook: {
      reported: [
        {
          question: '描述一次你与工程在清算优先级上意见不合的经验。',
          predicted: false,
          source_url: 'https://www.glassdoor.com/Interview/index.htm',
          source_date: '2026-05',
          source_name: 'Glassdoor',
          category: 'behavioral',
          interviewer_intent: '清算风险下的冲突处理。',
          star_blueprint:
            'S：工程想延后清算热修 · T：守住关账日 · A：影响×风险打分 + 薄 MVP · R：热修上线、无 sev-1',
          dos_donts: '不要把工程讲成坏人；聚焦风险与客户影响。',
        },
      ],
      predicted: [
        {
          question: '请从头到尾说明你如何改善一个失效的运营流程。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考验端到端所有权与可量化影响力。',
          star_blueprint: 'S：对账积压 · T：缩短周期 · A：SQL + 节奏 · R：−28%',
          dos_donts: '用指标开场；不要虚构 ACH 处理商标题。',
        },
        {
          question: '说说利益相关者忽略你仪表板的一次经验。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考验无职权影响力。',
          star_blueprint: 'S：被忽略的报告 · T：高管采用 · A：5 个 KPI + MBR · R：连续三个月被引用',
          dos_donts: '不要声称有管人范畴。',
        },
        {
          question: '描述一次你协调风险与客服优先级冲突的经验。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '跨职能取舍判断。',
          star_blueprint: 'S：双 P0 · T：守住清算 · A：影响×风险拆分 · R：无 sev-1',
          dos_donts: '不要抹黑任一利益相关者。',
        },
        {
          question: '说说你曾经对利益相关者的需求说不的经验。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '在不伤信任下设界限。',
          star_blueprint:
            'S：客服要虚荣指标 · T：保持决策有用 · A：提替代 KPI + 负责人 · R：延后请求、MBR 维持精准',
          dos_donts: '语气不要轻蔑；讲清楚你守住的取舍。',
        },
        {
          question: '前 60 天你会如何上手 ACH 退票？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '学习计划，且不虚构过去 ACH 所有权。',
          star_blueprint: '第 1–2 周 shadow · 第 3–4 周 SQL 地图 · 第 5–8 周拥有一个 KPI',
          dos_donts: '不要声称没担任过的 NACHA 职称。',
          missing_facts: '准备学习计划，不要虚构过去 ACH 职称。',
        },
        {
          question: '你会如何设计清算周期的 KPI 包？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '指标设计与利益相关者可用性。',
          star_blueprint: '定义分子／分母 · 负责人 · 每周检视节奏',
          dos_donts: '避免没有行动负责人的虚荣指标。',
        },
        {
          question: '请说明你如何分流退票例外暴增。',
          predicted: true,
          category: 'technical',
          interviewer_intent: '模糊情境下的运营事故结构。',
          star_blueprint: '稳定 · 根因分群 · 临时控制 · 永久修复',
          dos_donts: '不要虚构处理商后台经验。',
        },
        {
          question: '在自己不拥有合规的情况下，你会如何验证与 NACHA 相关的控制？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '在 BA 范畴内与风险／合规合作。',
          star_blueprint:
            '对齐控制负责人 · 定义证据清单 · 每周例外检视 · 缺口上升通报',
          dos_donts: '不要声称自己是 NACHA 负责人。',
        },
        {
          question: '当清算 SLA 告急时，你如何估算并排序工程需求？',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'SLA 压力下的产品／运营优先级。',
          star_blueprint:
            '量化 SLA 烧损 · 估工程成本 · 提 MVP vs 完整修复 · 与风险＋工程对齐',
          dos_donts: '不要虚构无法辩护的产能数字。',
        },
      ],
      star_templates: [
        {
          title: '对账周期改善',
          for_question: '请从头到尾说明你如何改善一个失效的运营流程。',
          situation: '月结对账要 9 天，卡住财务关账。',
          task: '在不加人力下缩短周期。',
          action: '建立 SQL 例外队列 + Looker triage 看板；与工程／客服每周两次。',
          result: '两季内周期缩短 28%；错误外泄下降 15%。',
          resume_anchor: '可量化运营改善',
        },
        {
          title: '优先级利害冲突',
          for_question: '工程产能不足时，你如何排优先级？',
          situation: '风险与客服同 sprint 都自称 P0。',
          task: '守住清算可靠度，同时交付客服小胜。',
          action: '用影响×风险打分；客服薄 MVP，清算热修同列车。',
          result: '双方接受取舍；下一季无 sev-1。',
          resume_anchor: '跨职能协调',
        },
        {
          title: '仪表板采用',
          for_question: '说说利益相关者忽略你仪表板的一次经验。',
          situation: '先前仪表板两周后就被忽略。',
          task: '做出高管每周会打开的 KPI 包。',
          action: '砍到 5 个指标、加上负责人与下一步，挂进 MBR 议程。',
          result: '连续三个月月会被引用。',
          resume_anchor: '利益相关者沟通',
        },
      ],
      star_outlines: [],
      reverse_questions: [
        '这次任用未来两季要解决什么问题？',
        '前 90 天成功如何衡量？',
        '目前最痛的支付流程是退票、清算还是争议？',
      ],
      validate_before_join: [
        '确认运营分析伙伴的 on-call／事故负荷。',
        '询问产品路线图延迟多常影响清算 SLA。',
      ],
    },
    candidate_case: {
      hire_thesis:
        '雇用已能交付的运营分析所有权：SQL／Looker 节奏、可量化周期改善、高管可用的协调——再用结构化 60 天计划补上 ACH 缺口。',
      top_facts: [
        '以 SQL + Looker 将对账周期缩短 28%',
        '带领工程／风险／客服每周 triage 18 个月',
        '高管状态包用于月度业务检视',
      ],
    },
    offer_strategy: {
      target: '确认后瞄准核定现金区间中带',
      acceptable: '若股票／远程弹性强，可接受中下带',
      walk_away: '探索后低于书面底线，或范畴低于 Senior BA',
      levers: ['范畴', '签约金', '远程弹性', '职级定级'],
      structured_levers: [
        { name: '范畴', note: '确认是 Senior BA 所有权而非工单分流' },
        { name: '签约金', note: '现金落中下、股票爬坡时可桥接' },
        { name: '远程弹性', note: '地点弹性时可与到办公室权衡' },
        { name: '职级定级', note: '锚定 TC 前先锁职级' },
      ],
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '约 $20K／年',
        sign_on: '市场常见 $10K–$20K',
        total: '约 $185K TC',
      },
      script:
        '谢谢——在我报数字前，这个地点这个职级的核定现金区间是多少？根据相近 Senior BA 金融科技运营职位与我的周期／KPI 所有权，确认范畴后我会瞄准中带。',
      discovery_questions: [
        '这个地点这个职级的核定区间是多少？',
        '总酬如何拆现金、奖金与股票？',
      ],
    },
    role_team_insights: {
      role_content_refined: [
        '端到端拥有支付运营改善的需求',
        '把运营痛点转成优先工程 backlog',
        '发布周期与错误率 KPI 包',
      ],
      requirements_refined: [
        'SQL 能力是必备',
        '高阶所有权——不是初级工单分流',
        '偏好支付领域胜于泛用 BA',
      ],
      rto_official: '混合制——每周到办公室 3 天（依 JD）',
      rto_employee_reality: '论坛提到跨职能节奏频繁；关账／事故周加班会升高。',
      next_title_1_3yr: 'Lead BA／支付运营产品负责人',
      career_path_basis:
        '公司未公开内部职等表 — 依 Levels.fyi／LinkedIn 的 Senior BA→Lead BA 路径，以及美国金融科技运营就业市场职涯阶梯推估（本页不显示薪酬金额）。',
      promotion_skill_gaps: [
        '具名 ACH／退票所有权',
        '处理商／供应商管理证据',
        '组织层级冲突协调',
      ],
      team_sample_insufficient: false,
    },
    company_truth: {
      current_strategy:
        '近期重心是清算可靠度与例外自动化：降低 ACH 退票失败、加快关账，并用 AI 辅助分流，让运营分析师用周期 KPI 带队，而不是只救火工单。',
      competitors: [
        {
          name: 'Stripe',
          strengths:
            '开发者友好轨道、美国 ACH／卡覆盖广，产品团队想自助接支付时品牌很强。',
          weaknesses:
            '大型企业清算／退票所有权较不像「运营分析师原生」；复杂 B2B 对账常仍要大量定制。',
        },
        {
          name: 'Adyen',
          strengths:
            '统一商务堆叠与全球收单强，当 Northstar 客户要跨境扩张时很有威胁。',
          weaknesses:
            '企业销售周期较重；中型美国 ACH 运营团队有时偏好更轻、偏美国的处理商。',
        },
        {
          name: 'Block（Square）',
          strengths:
            '中小商家密度与现金流产品，与 Northstar 也在抢的小型商户量重叠。',
          weaknesses:
            '较少聚焦大规模退票／清算分析职位；企业级 BA／运营工具叙事较薄。',
        },
      ],
      insider_voice: [
        '友好远程职位仍要求精准书面状态包',
        '面试官深挖跨职能交付，而不只是 SQL 题',
      ],
      forum_sample_thin: false,
      layoff_legal_flags: [],
      interviewer_strategy_questions: [
        '此职位为何现在开缺——补缺还是新范畴？',
        '此团队 12 个月运营优先事项是什么？',
        '过去一年运营人数如何变化？',
      ],
    },
  },
};

/** Spanish / Hindi / Arabic — full Snapshot + Guide narrative (same structure). */
const ES: SampleLocalePack = {
  snapshot: {
    data_completeness: {
      level: 'High',
      missing_inputs: [],
      confidence_notes: 'JD y CV lo bastante completos para un Snapshot confiable.',
    },
    hard_filter: {
      status: 'Risk',
      items: [
        {
          requirement: '5+ años de experiencia BA / ops de producto',
          status: 'Pass',
          evidence: '6 años en roles de ops fintech en el CV',
        },
        {
          requirement: 'Propiedad de SQL + dashboards',
          status: 'Pass',
          evidence: 'Looker + SQL citados en el CV',
        },
        {
          requirement: 'Dominio pagos / ACH',
          status: 'Risk',
          evidence: 'Ops bancarias adyacentes; ACH no explícito',
        },
      ],
    },
    fit_score: {
      score: 78,
      band: 'Strong',
      evidence_coverage: 'High',
      sharp_verdict:
        'Historia analítica y de stakeholders fuerte para este Senior BA. Nivel y tenure alinean con ownership sénior. Brecha principal: profundidad ACH/settlement vs ops bancarias adyacentes.',
      sharp_verdict_points: [
        'Encaje BA fuerte: ownership SQL/Looker, wins cuantificados y facilitación cross-funcional mapean al alcance del JD.',
        'Nivel/tenure alinean: seis años de ops fintech son un paso natural a ownership sénior.',
        'Brecha principal: profundidad ACH/settlement; el CV es ops bancarias adyacentes, así que pedirán fluidez en returns/rails.',
      ],
      breakdown: [
        {
          dimension: 'Requisitos duros / factibilidad',
          weight_pct: 30,
          score: 72,
          note: '72 porque YOE y SQL se cumplen, pero ownership ACH/settlement es solo adyacente.',
        },
        {
          dimension: 'Nivel / alcance / tenure',
          weight_pct: 25,
          score: 80,
          note: '80 porque seis años de ops fintech mapean limpio a Senior BA.',
        },
        {
          dimension: 'Skills / herramientas core',
          weight_pct: 20,
          score: 85,
          note: '85 porque SQL, Looker, Jira y rituales de stakeholders están evidenciados.',
        },
        {
          dimension: 'Dominio / función',
          weight_pct: 15,
          score: 70,
          note: '70 porque ops fintech es sólido, pero rails/ACH es fino frente al foco de settlement.',
        },
        {
          dimension: 'Resultados probados',
          weight_pct: 10,
          score: 82,
          note: '82 porque wins de cycle-time y error-rate transfieren a este asiento.',
        },
      ],
    },
    proof_map: {
      strengths: [
        {
          point: 'Mejoras de ops cuantificadas',
          description: 'Redujo el ciclo de reconciliación 28% con SQL + Looker.',
          skill_kind: 'hard',
        },
        {
          point: 'Facilitación cross-funcional',
          description: 'Lideró triage semanal con eng, risk y CX durante 18 meses.',
          skill_kind: 'soft',
        },
        {
          point: 'Disciplina de requisitos',
          description: 'Dueño de PRDs y criterios de aceptación en tres lanzamientos.',
          skill_kind: 'hard',
        },
        {
          point: 'Comunicación con stakeholders',
          description: 'Packs ejecutivos usados en revisiones mensuales de negocio.',
          skill_kind: 'soft',
        },
      ],
      gaps: [
        {
          gap: 'Profundidad ACH / rails de pagos',
          description: 'El JD enfatiza returns y settlement; el CV es ops bancarias adyacentes.',
          skill_kind: 'hard',
        },
        {
          gap: 'Gestión de vendor / processor',
          description: 'Sin ownership nombrado de processor o NACHA.',
          skill_kind: 'hard',
        },
        {
          gap: 'Keywords regulatorios US',
          description: 'Un screen por keywords puede perder Reg E / returns.',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        'Ownership ACH/returns no evidenciado en el CV.',
        'Experiencia con processor de pagos no evidenciada.',
      ],
      screenability_note: 'Keywords de ops fuertes; rails de pagos finos.',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary:
        'El CV es ligero en keywords ACH / returns / settlement / NACHA que este JD trata como core.',
      missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
    },
    expected_offer: {
      posted_range: null,
      p25: '$145K',
      p50: '$165K',
      p75: '$190K',
      currency: 'USD',
      region: 'EE. UU. · Friendly remoto',
      target_gap:
        'Para asientos Senior BA fintech-ops remotos en EE. UU., el cash comparable suele caer en esta banda; confirma el rango aprobado antes de negociar.',
      evidence_tier: 'C',
      sources: ['Benchmark de mercado Senior BA / fintech ops (EE. UU.)'],
      candidate_predicted_offer: '$155K',
      candidate_position_label:
        'Medio-bajo: prueba BA sólida, pero ownership ACH/pagos fino probablemente limita el cash bajo el punto medio.',
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '$20K / año est.',
        sign_on: '$10K–$20K norma de mercado',
        total: '~$185K TC',
      },
    },
    apply_decision: {
      label: 'Apply after fixes',
      reason:
        'Superas el listón Senior BA en ownership de requisitos, impacto de ops cuantificado y facilitación de stakeholders, así que vale la pena. El riesgo principal es prueba fina de ACH/rails frente a un JD que trata profundidad de pagos como core. Postula tras confirmar qué tan duro es ese requisito — o te dejarán detrás de peers payments-native.',
      next_best_action:
        'Aclara con el reclutador si ownership ACH/returns es required o preferred antes de invertir un ciclo completo.',
    },
    role_read: {
      mission: 'Poseer requisitos y analytics para mejoras de ops de pagos.',
      responsibilities: [
        'Traducir dolor de ops a backlog priorizado',
        'Partner con eng en workflows de settlement / returns',
        'Publicar KPIs de cycle time y error rate',
      ],
      hiring_signals: [
        'Se espera ownership sénior, no triage junior',
        'Dominio de pagos preferido sobre BA genérico',
        'SQL es must-have, no nice-to-have',
      ],
    },
    interview_starters: [
      'Cuéntame una vez que mejoraste un workflow de reconciliación o settlement.',
      '¿Cómo priorizas cuando la capacidad de eng es escasa?',
      'Háblame de un dashboard que los stakeholders sí usaron.',
    ],
  },
  guide: {
    strategy_fit_salary: {
      score_implications:
        'Con 78 deberías pasar la mayoría de screens si enmarcas bien la adyacencia ACH; espera deep-dive de dominio en ronda 2.',
      offer_implications:
        'Evidencia tier C — discovery antes de anclar. Apunta mid-band cuando ownership de pagos sea creíble.',
      validate_with_recruiter: [
        '¿Experiencia ACH/returns es required o preferred?',
        '¿Qué banda de nivel está aprobada (Senior BA vs Staff)?',
        '¿Cómo se parte TC entre cash y bonus en este equipo?',
      ],
    },
    hiring_context: {
      insights: [
        {
          claim: 'Equipos de ops fintech contratan analistas que unen producto y settlement ops.',
          why_it_matters: 'Los entrevistadores probarán entrega cross-funcional, no solo SQL.',
          source_url: 'https://www.reuters.com',
          date: '2026-06',
        },
        {
          claim: 'Roles fintech remotos en EE. UU. aún exigen claridad escrita async.',
          why_it_matters: 'Lleva un one-pager de tus wins de KPI a la entrevista.',
          source_url: 'https://www.bloomberg.com',
          date: '2026-05',
        },
      ],
      limitations: [
        'Este sample demo no usó un filing IR de empresa específica.',
        'Trata las claims de hiring-context como contexto de mercado público.',
      ],
      validation_questions: [
        '¿Por qué está abierto este rol ahora — backfill o nuevo alcance?',
        '¿Cómo se ve el éxito a 90 días para este hire?',
      ],
    },
    concerns_defenses: [
      {
        concern: 'Prueba fina de ACH / rails de pagos',
        why: 'El JD enfatiza ownership de settlement y returns.',
        evidence: 'Ops bancarias + win de cycle-time de reconciliación en el CV.',
        missing_proof: 'Ownership nombrado de ACH returns o processor.',
        answer_guide:
          'Puente: “En mi último rol poseí SLAs de reconciliación adyacentes a settlement. Así rampéo ACH returns con el mismo ritual SQL + stakeholders.”',
        do_not_claim: 'No inventes títulos NACHA o de processor que no tuviste.',
      },
      {
        concern: 'Alcance sénior vs hábitos de analista IC',
        why: 'La mezcla de títulos en el CV puede leerse mid-level.',
        evidence: 'Lideró triage cross-funcional 18 meses; packs ejecutivos.',
        missing_proof: 'Ownership de headcount o presupuesto.',
        answer_guide:
          'Lidera con influencia sin autoridad: rituales que corriste, decisiones que desbloqueaste, métricas que poseíste.',
        do_not_claim: 'No digas scope de people-manager si eras IC.',
      },
      {
        concern: 'Expectativas de comp vs banda no verificada',
        why: 'Sin rango publicado; el candidato puede sobre-anclar.',
        evidence: 'Solo banda de mercado tier C.',
        missing_proof: 'Rango de cash aprobado del reclutador.',
        answer_guide:
          'Pide la banda aprobada primero, luego posiciónate mid-band con wins cuantificados.',
        do_not_claim: 'No inventes un número de TC específico de la empresa.',
      },
    ],
    interview_playbook: {
      reported: [
        {
          question: 'Describe una vez que disentiste con engineering sobre una prioridad de settlement.',
          predicted: false,
          source_url: 'https://www.glassdoor.com/Interview/index.htm',
          source_date: '2026-05',
          source_name: 'Glassdoor',
          category: 'behavioral',
          interviewer_intent: 'Resolución de conflicto bajo riesgo de settlement.',
          star_blueprint:
            'S: eng quería retrasar un hotfix · T: proteger close · A: score impacto×riesgo + MVP fino · R: hotfix shipped, sin sev-1',
          dos_donts: 'No pintes a eng como villano; enfócate en riesgo e impacto al cliente.',
        },
      ],
      predicted: [
        {
          question: 'Recórreme cómo mejoraste un workflow de ops roto de punta a punta.',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: 'Prueba ownership end-to-end e impacto cuantificado.',
          star_blueprint: 'S: backlog de reconciliación · T: bajar cycle time · A: SQL + ritual · R: −28%',
          dos_donts: 'Lidera con métricas; no inventes títulos de processor ACH.',
        },
        {
          question: 'Cuéntame de un dashboard que los stakeholders ignoraron.',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: 'Prueba influencia sin autoridad.',
          star_blueprint: 'S: packs ignorados · T: adopción ejecutiva · A: 5 KPIs + MBR · R: citado 3 meses',
          dos_donts: 'No digas scope de people-manager.',
        },
        {
          question: 'Describe un conflicto entre prioridades de risk y CX que facilitaste.',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: 'Juicio de tradeoff cross-funcional.',
          star_blueprint: 'S: doble P0 · T: proteger settlement · A: split impacto×riesgo · R: sin sev-1',
          dos_donts: 'No critiques a ningún grupo de stakeholders.',
        },
        {
          question: 'Cuéntame de una vez que dijiste no a un pedido de un stakeholder.',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: 'Poner límites sin quemar confianza.',
          star_blueprint:
            'S: CX pedía vanity metric · T: pack útil · A: KPI alterno + owner · R: pedido diferido, MBR claro',
          dos_donts: 'No suenes desdeñoso; muestra el tradeoff que protegiste.',
        },
        {
          question: '¿Cómo rampéas ACH returns en tus primeros 60 días?',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'Plan de aprendizaje sin inventar ownership ACH pasado.',
          star_blueprint: 'Sem 1–2 shadow · Sem 3–4 mapa SQL · Sem 5–8 un KPI propio',
          dos_donts: 'No digas títulos NACHA que no tuviste.',
          missing_facts: 'Prepara un learning plan sin inventar títulos ACH pasados.',
        },
        {
          question: '¿Cómo diseñas un pack de KPI para cycle time de settlement?',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'Diseño de métricas y usabilidad para stakeholders.',
          star_blueprint: 'Definir numerador/denominador · owners · ritual semanal',
          dos_donts: 'Evita vanity metrics sin dueño de acción.',
        },
        {
          question: 'Recorre cómo harías triage de un spike de excepciones de return.',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'Estructura de incidente ops bajo ambigüedad.',
          star_blueprint: 'Estabilizar · segmentar causas · control temporal · fix permanente',
          dos_donts: 'No inventes experiencia en consola de processor.',
        },
        {
          question: '¿Cómo validarías controles NACHA sin ser el owner de compliance?',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'Colaborar con risk/compliance dentro del scope BA.',
          star_blueprint:
            'Mapear owners · checklist de evidencia · review semanal · escalar gaps',
          dos_donts: 'No digas que eras el officer NACHA.',
        },
        {
          question: '¿Cómo dimensionas y priorizas un ask de eng cuando peligran SLAs de settlement?',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'Priorización producto/ops bajo presión de SLA.',
          star_blueprint:
            'Cuantificar burn de SLA · estimar costo eng · MVP vs fix completo · alinear risk+eng',
          dos_donts: 'No inventes capacity que no puedas defender.',
        },
      ],
      star_templates: [
        {
          title: 'Win de cycle-time de reconciliación',
          for_question: 'Recórreme cómo mejoraste un workflow de ops roto de punta a punta.',
          situation: 'La reconciliación mensual tomaba 9 días y bloqueaba el close financiero.',
          task: 'Bajar cycle time sin sumar headcount.',
          action: 'Cola de excepciones SQL + board Looker; 2× semanal con eng y CX.',
          result: 'Cycle time −28% en dos trimestres; escapes de error −15%.',
          resume_anchor: 'Mejoras de ops cuantificadas',
        },
        {
          title: 'Conflicto de prioridad entre stakeholders',
          for_question: '¿Cómo priorizas cuando la capacidad de eng es escasa?',
          situation: 'Risk y CX reclamaban P0 en el mismo sprint.',
          task: 'Proteger reliability de settlement y entregar un win CX.',
          action: 'Score impacto × riesgo; MVP fino para CX y hotfix de settlement en el mismo tren.',
          result: 'Ambos equipos aceptaron el tradeoff; sin sev-1 el trimestre siguiente.',
          resume_anchor: 'Facilitación cross-funcional',
        },
        {
          title: 'Adopción de dashboard',
          for_question: 'Cuéntame de un dashboard que los stakeholders ignoraron.',
          situation: 'Dashboards previos se ignoraban después de la semana dos.',
          task: 'Un pack de KPI que ejecutivos abran semanalmente.',
          action: 'Cortar a 5 métricas, owners + next actions, adjunto a agenda MBR.',
          result: 'Pack citado en tres revisiones mensuales consecutivas.',
          resume_anchor: 'Comunicación con stakeholders',
        },
      ],
      star_outlines: [],
      reverse_questions: [
        '¿Qué problema debe resolver este hire en los próximos dos trimestres?',
        '¿Cómo se medirá el éxito en los primeros 90 días?',
        '¿Qué workflows de pagos duelen más hoy — returns, settlement o disputes?',
      ],
      validate_before_join: [
        'Confirma carga on-call / incidentes del partner de ops analytics.',
        'Pregunta con qué frecuencia los slips de roadmap afectan SLAs de settlement.',
      ],
    },
    candidate_case: {
      hire_thesis:
        'Contrata ownership de ops analytics que ya entrega: rituales SQL/Looker, wins de cycle-time y facilitación ejecutiva — luego cierra el gap ACH con un ramp estructurado de 60 días.',
      top_facts: [
        'Bajó cycle time de reconciliación 28% con SQL + Looker',
        'Corrió triage semanal eng/risk/CX 18 meses',
        'Packs ejecutivos usados en revisiones mensuales',
      ],
    },
    offer_strategy: {
      target: 'Mid-band del rango de cash aprobado una vez confirmado',
      acceptable: 'Low-mid si equity / flexibilidad remota es fuerte',
      walk_away: 'Bajo el piso documentado tras discovery, o alcance bajo Senior BA',
      levers: ['Alcance', 'Sign-on', 'Flexibilidad remota', 'Leveling de título'],
      structured_levers: [
        { name: 'Alcance', note: 'Confirmar ownership Senior BA vs triage de tickets' },
        { name: 'Sign-on', note: 'Puente si cash cae low-mid mientras equity rampa' },
        { name: 'Flexibilidad remota', note: 'Trade vs onsite si la ubicación es flexible' },
        { name: 'Leveling de título', note: 'Cerrar nivel antes de anclar TC' },
      ],
      tc_breakdown: {
        base: '$150K',
        bonus: '$15K',
        equity: '$20K / año est.',
        sign_on: '$10K–$20K norma de mercado',
        total: '~$185K TC',
      },
      script:
        'Gracias — antes de dar un número, ¿cuál es la banda de cash aprobada para este nivel en esta ubicación? Con roles Senior BA fintech ops similares y mi ownership de cycle-time/KPI, apunto al mid-band una vez confirmemos alcance.',
      discovery_questions: [
        '¿Cuál es la banda aprobada para este nivel en esta ubicación?',
        '¿Cómo se parte la compensación total entre cash, bonus y equity?',
      ],
    },
    role_team_insights: {
      role_content_refined: [
        'Poseer requisitos de mejoras payments-ops de punta a punta',
        'Traducir dolor de ops a backlog de eng priorizado',
        'Publicar packs de KPI de cycle time y error rate',
      ],
      requirements_refined: [
        'SQL literacy es must-have',
        'Ownership sénior — no triage junior de tickets',
        'Dominio de pagos preferido sobre BA genérico',
      ],
      rto_official: 'Híbrido — 3 días onsite (según JD)',
      rto_employee_reality:
        'Notas de foros citan rituales cross-funcionales frecuentes; overtime sube cerca de close / semanas de incidente.',
      next_title_1_3yr: 'Lead BA / Payments Ops Product Owner',
      career_path_basis:
        'Sin escalera pública — inferido de Levels.fyi / LinkedIn Senior BA→Lead BA y ladders de empleo fintech-ops en EE. UU. (sin $ en esta página).',
      promotion_skill_gaps: [
        'Ownership nombrado ACH / returns',
        'Prueba de gestión processor / vendor',
        'Navegación de conflicto a nivel org',
      ],
      team_sample_insufficient: false,
    },
    company_truth: {
      current_strategy:
        'Prioridad cercana: confiabilidad de settlement y automatización de excepciones — menos ACH returns fallidos, close más rápido y triage con IA para que los analistas de ops sean dueños de KPIs de cycle-time, no solo apaguen tickets.',
      competitors: [
        {
          name: 'Stripe',
          strengths:
            'Rails developer-first, amplia cobertura ACH/tarjeta en EE. UU. y marca fuerte para equipos de producto self-serve.',
          weaknesses:
            'Ownership enterprise de settlement/returns se siente menos “ops-analyst native”; reconciliación B2B compleja aún pide tooling a medida.',
        },
        {
          name: 'Adyen',
          strengths:
            'Stack de commerce unificado y acquiring global — amenaza cuando clientes Northstar cruzan fronteras.',
          weaknesses:
            'Ciclo de ventas enterprise más pesado; equipos ACH mid-market en EE. UU. a veces prefieren processors más ligeros y US-centric.',
        },
        {
          name: 'Block (Square)',
          strengths:
            'Densidad SMB y productos de cash-flow que compiten por volúmenes de merchants pequeños que Northstar también corteja.',
          weaknesses:
            'Menos foco en seats de analytics de returns/settlement a gran escala; narrativa de tooling BA/ops enterprise más fina.',
        },
      ],
      insider_voice: [
        'Roles remote-friendly aún esperan packs de status escritos nítidos',
        'Entrevistadores prueban entrega cross-funcional, no solo puzzles SQL',
      ],
      forum_sample_thin: false,
      layoff_legal_flags: [],
      interviewer_strategy_questions: [
        '¿Por qué está abierto este rol ahora — backfill o nuevo alcance?',
        '¿Cuál es la prioridad operativa a 12 meses de este equipo?',
        '¿Cómo cambió el headcount de ops el último año?',
      ],
    },
  },
};

/** Hindi + Arabic reuse Spanish structure with translated strings — compact but complete for Snapshot hero fields + Guide pages. */
const HI: SampleLocalePack = {
  snapshot: {
    ...ES.snapshot,
    fit_score: {
      score: 78,
      band: 'Strong',
      evidence_coverage: 'High',
      sharp_verdict:
        'इस Senior BA सीट के लिए मजबूत एनालिटिकल और स्टेकहोल्डर कहानी। लेवल/tenure सीनियर ownership से मेल खाते हैं। मुख्य गैप: ACH/settlement गहराई बनाम आसन्न बैंकिंग ops।',
      sharp_verdict_points: [
        'मज़बूत BA फिट: SQL/Looker ownership, मापित ops wins, और क्रॉस-फंक्शनल facilitation इस JD के core से मैप होते हैं।',
        'लेवल/tenure अलाइन: छह साल fintech ops सीनियर ownership की ओर स्वाभाविक कदम है।',
        'मुख्य गैप: payments ACH/settlement गहराई; रिज़्यूमे आसन्न बैंकिंग ops है, इसलिए screeners returns/rails पूछेंगे।',
      ],
      breakdown: ES.snapshot.fit_score!.breakdown!.map((b) => ({
        ...b,
        dimension:
          b.dimension === 'Hard requirements / feasibility'
            ? 'कठोर आवश्यकताएँ / व्यवहार्यता'
            : b.dimension === 'Level / scope / tenure'
              ? 'लेवल / स्कोप / tenure'
              : b.dimension === 'Core skills / tools'
                ? 'कोर स्किल्स / टूल्स'
                : b.dimension === 'Domain / function experience'
                  ? 'डोमेन / फंक्शन अनुभव'
                  : 'सिद्ध परिणाम',
      })),
    },
    proof_map: {
      strengths: [
        {
          point: 'मापित ops सुधार',
          description: 'SQL + Looker वर्कफ़्लो से reconciliation साइकिल 28% घटाई।',
          skill_kind: 'hard',
        },
        {
          point: 'क्रॉस-फंक्शनल facilitation',
          description: 'eng, risk, CX के साथ 18 महीने साप्ताहिक triage चलाई।',
          skill_kind: 'soft',
        },
        {
          point: 'Requirements अनुशासन',
          description: 'तीन प्लेटफ़ॉर्म लॉन्च के PRD और acceptance criteria।',
          skill_kind: 'hard',
        },
        {
          point: 'स्टेकहोल्डर संचार',
          description: 'मासिक बिज़नेस रिव्यू में इस्तेमाल executive status packs।',
          skill_kind: 'soft',
        },
      ],
      gaps: [
        {
          gap: 'ACH / payments rails गहराई',
          description: 'JD ACH returns और settlement पर ज़ोर देता है; रिज़्यूमे आसन्न बैंकिंग ops है।',
          skill_kind: 'hard',
        },
        {
          gap: 'Vendor / processor प्रबंधन',
          description: 'कोई नामित processor या NACHA compliance ownership नहीं।',
          skill_kind: 'hard',
        },
        {
          gap: 'US नियामक कीवर्ड',
          description: 'Keyword screen में Reg E / returns छूट सकते हैं।',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        'दिए गए रिज़्यूमे पर ACH/returns ownership सिद्ध नहीं।',
        'नामित payments-processor अनुभव सिद्ध नहीं।',
      ],
      screenability_note: 'मज़बूत ops कीवर्ड; payments rails कीवर्ड पतले।',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary:
        'रिज़्यूमे ACH / returns / settlement / NACHA कीवर्ड्स पर हल्का है जिन्हें यह JD core मानता है।',
      missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
    },
    expected_offer: {
      ...ES.snapshot.expected_offer!,
      region: 'संयुक्त राज्य · रिमोट-फ्रेंडली',
      target_gap:
        'US रिमोट Senior BA fintech-ops सीटों के लिए तुलनीय कैश आमतौर पर इस बैंड में आता है; बातचीत से पहले नियोक्ता का अनुमोदित रेंज पुष्टि करें।',
      sources: ['Senior BA / fintech ops बाज़ार बेंचमार्क (US)'],
      candidate_position_label:
        'निचला मिड-बैंड: कोर BA सबूत मज़बूत, लेकिन पतली ACH/payments ownership कैश को midpoint से नीचे रख सकती है।',
    },
    apply_decision: {
      label: 'Apply after fixes',
      reason:
        'आप requirements ownership, मापित ops प्रभाव और stakeholder facilitation पर Senior BA बार पार करते हैं — यह सीट worth pursuing है। मुख्य जोखिम पतली ACH/payments-rails proof है जबकि JD payment ops गहराई को core मानता है। डोमेन आवश्यकता कितनी सख़्त है पुष्टि करके apply करें।',
      next_best_action:
        'पूरा आवेदन चक्र लगाने से पहले रिक्रूटर से पूछें ACH/returns ownership required है या preferred।',
    },
    role_read: {
      mission: 'Payments ops सुधारों के लिए requirements और analytics own करें।',
      responsibilities: [
        'Ops दर्द को प्राथमिकता backlog में बदलें',
        'Settlement / returns workflows पर eng के साथ partner',
        'Cycle time और error rate के KPI प्रकाशित करें',
      ],
      hiring_signals: [
        'सीनियर ownership अपेक्षित, जूनियर ticket triage नहीं',
        'Generic BA से payments डोमेन preferred',
        'SQL must-have है, nice-to-have नहीं',
      ],
    },
    interview_starters: [
      'कोई बार बताएँ जब आपने reconciliation या settlement workflow सुधारा।',
      'eng क्षमता कम होने पर आप प्राथमिकता कैसे तय करते हैं?',
      'कोई डैशबोर्ड बताएँ जिसे stakeholders वास्तव में इस्तेमाल करते थे।',
    ],
  },
  guide: {
    ...ES.guide,
    role_team_insights: {
      ...ES.guide.role_team_insights!,
      role_content_refined: [
        'Payments-ops सुधारों की requirements एंड-टू-एंड own करें',
        'Ops दर्द को प्राथमिकता eng backlog में बदलें',
        'Cycle time और error rate के KPI packs प्रकाशित करें',
      ],
      requirements_refined: [
        'SQL साक्षरता must-have है',
        'सीनियर ownership — जूनियर ticket triage नहीं',
        'Generic BA से payments डोमेन preferred',
      ],
      rto_official: 'हाइब्रिड — सप्ताह में 3 दिन ऑनसाइट (JD के अनुसार)',
      rto_employee_reality:
        'फोरम नोट्स में बार-बार क्रॉस-फंक्शनल rituals; close / incident हफ्तों में overtime बढ़ता है।',
      next_title_1_3yr: 'Lead BA / Payments Ops Product Owner',
      promotion_skill_gaps: [
        'नामित ACH / returns ownership',
        'Processor / vendor प्रबंधन प्रमाण',
        'Org-level संघर्ष नेविगेशन',
      ],
    },
    company_truth: {
      ...ES.guide.company_truth!,
      current_strategy:
        'नज़दीकी फोकस: settlement विश्वसनीयता और exception automation — कम failed ACH returns, तेज़ close, और AI-assisted triage ताकि ops analysts cycle-time KPI own करें, न कि सिर्फ tickets बुझाएँ।',
      interviewer_strategy_questions: [
        'यह रोल अभी क्यों खुला है — बैकफिल या नया स्कोप?',
        'इस टीम की 12-महीने की ऑपरेटिंग प्राथमिकता क्या है?',
        'पिछले साल ops हेडकाउंट कैसे बदला?',
      ],
    },
  },
};

const AR: SampleLocalePack = {
  snapshot: {
    ...ES.snapshot,
    fit_score: {
      score: 78,
      band: 'Strong',
      evidence_coverage: 'High',
      sharp_verdict:
        'قصة تحليلية وتواصل أصحاب مصلحة قوية لمقعد Senior BA هذا. المستوى والخبرة يتوافقان مع ملكية أقدم. الفجوة الرئيسية: عمق ACH/التسوية مقابل عمليات مصرفية مجاورة.',
      sharp_verdict_points: [
        'ملاءمة BA قوية: ملكية SQL/Looker وإنجازات تشغيلية مُقاسة وتسهيل متعدد الوظائف تطابق نطاق الـ JD.',
        'المستوى/الخبرة متوافقان: ست سنوات ops fintech خطوة طبيعية نحو ملكية أقدم.',
        'الفجوة الرئيسية: عمق ACH/التسوية؛ السيرة مجاورة لعمليات مصرفية، لذا سيُسأل عن returns والمسارات.',
      ],
      breakdown: ES.snapshot.fit_score!.breakdown!.map((b) => ({
        ...b,
        dimension:
          b.dimension === 'Hard requirements / feasibility'
            ? 'المتطلبات الصلبة / الجدوى'
            : b.dimension === 'Level / scope / tenure'
              ? 'المستوى / النطاق / الخبرة'
              : b.dimension === 'Core skills / tools'
                ? 'المهارات / الأدوات الأساسية'
                : b.dimension === 'Domain / function experience'
                  ? 'خبرة المجال / الوظيفة'
                  : 'نتائج مثبتة',
      })),
    },
    proof_map: {
      strengths: [
        {
          point: 'تحسينات تشغيلية مُقاسة',
          description: 'خفض دورة التسوية 28% بسير عمل SQL + Looker.',
          skill_kind: 'hard',
        },
        {
          point: 'تسهيل متعدد الوظائف',
          description: 'أدار triage أسبوعيًا مع eng والمخاطر وخدمة العملاء 18 شهرًا.',
          skill_kind: 'soft',
        },
        {
          point: 'انضباط المتطلبات',
          description: 'امتلك PRDs ومعايير القبول لثلاث إطلاقات منصة.',
          skill_kind: 'hard',
        },
        {
          point: 'تواصل أصحاب المصلحة',
          description: 'حزم حالة تنفيذية استُخدمت في مراجعات الأعمال الشهرية.',
          skill_kind: 'soft',
        },
      ],
      gaps: [
        {
          gap: 'عمق ACH / مسارات المدفوعات',
          description: 'الـ JD يؤكد على returns والتسوية؛ السيرة عمليات مصرفية مجاورة.',
          skill_kind: 'hard',
        },
        {
          gap: 'إدارة المورّد / المعالج',
          description: 'لا ملكية مسماة لمعالج أو امتثال NACHA.',
          skill_kind: 'hard',
        },
        {
          gap: 'كلمات تنظيمية أمريكية',
          description: 'فرز الكلمات قد يفوّت Reg E / returns.',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        'ملكية ACH/returns غير مثبتة في السيرة المقدمة.',
        'خبرة معالج مدفوعات مسماة غير مثبتة.',
      ],
      screenability_note: 'كلمات ops قوية؛ كلمات مسارات المدفوعات ضعيفة.',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary:
        'السيرة خفيفة في كلمات ACH / returns / settlement / NACHA التي يعتبرها هذا الـ JD أساسية.',
      missing_keywords: ['ACH', 'returns', 'settlement', 'NACHA'],
    },
    expected_offer: {
      ...ES.snapshot.expected_offer!,
      region: 'الولايات المتحدة · مناسب للعمل عن بُعد',
      target_gap:
        'لمقاعد Senior BA fintech-ops عن بُعد في الولايات المتحدة، يقع النقد المقارن عادة في هذا النطاق؛ أكّد النطاق المعتمد قبل التفاوض.',
      sources: ['معيار سوق Senior BA / fintech ops (الولايات المتحدة)'],
      candidate_position_label:
        'منتصف سفلي: إثبات BA الأساسي قوي، لكن ملكية ACH/المدفوعات الضعيفة قد تحد النقد دون نقطة الوسط.',
    },
    apply_decision: {
      label: 'Apply after fixes',
      reason:
        'تجتاز عتبة Senior BA في ملكية المتطلبات والأثر التشغيلي المُقاس وتسهيل أصحاب المصلحة — المقعد يستحق المتابعة. الخطر الرئيسي إثبات ACH/مسارات ضعيف بينما الـ JD يعتبر عمق عمليات الدفع أساسيًا. قدّم بعد تأكيد مدى صرامة متطلب المجال.',
      next_best_action:
        'وضّح مع المسؤول إن كانت ملكية ACH/returns مطلوبة أم مفضلة قبل استثمار دورة تقديم كاملة.',
    },
    role_read: {
      mission: 'امتلك المتطلبات والتحليلات لتحسينات عمليات المدفوعات.',
      responsibilities: [
        'حوّل ألم العمليات إلى backlog ذي أولوية',
        'شارك الهندسة في سير عمل التسوية / returns',
        'انشر مؤشرات cycle time ومعدل الأخطاء',
      ],
      hiring_signals: [
        'يُتوقع ملكية أقدم لا فرز تذاكر مبتدئ',
        'مجال المدفوعات مفضّل على BA عام',
        'SQL شرط أساسي لا ميزة إضافية',
      ],
    },
    interview_starters: [
      'صف مرة حسّنت فيها سير عمل تسوية أو settlement.',
      'كيف تضع الأولويات عندما تكون سعة الهندسة شحيحة؟',
      'أخبرني عن لوحة استخدمها أصحاب المصلحة فعليًا.',
    ],
  },
  guide: {
    ...ES.guide,
    role_team_insights: {
      ...ES.guide.role_team_insights!,
      role_content_refined: [
        'امتلك متطلبات تحسينات payments-ops من الطرف إلى الطرف',
        'حوّل ألم العمليات إلى backlog هندسي ذي أولوية',
        'انشر حزم مؤشرات cycle time ومعدل الأخطاء',
      ],
      requirements_refined: [
        'إلمام SQL شرط أساسي',
        'ملكية أقدم — لا فرز تذاكر مبتدئ',
        'مجال المدفوعات مفضّل على BA عام',
      ],
      rto_official: 'هجين — 3 أيام في المكتب (حسب الـ JD)',
      rto_employee_reality:
        'ملاحظات المنتديات تشير إلى طقوس متعددة الوظائف متكررة؛ ساعات إضافية قرب الإغلاق / أسابيع الحوادث.',
      next_title_1_3yr: 'Lead BA / مسؤول منتج عمليات المدفوعات',
      promotion_skill_gaps: [
        'ملكية ACH / returns مسماة',
        'إثبات إدارة معالج / مورّد',
        'التنقل في صراع على مستوى المنظمة',
      ],
    },
    company_truth: {
      ...ES.guide.company_truth!,
      current_strategy:
        'التركيز القريب: موثوقية التسوية وأتمتة الاستثناءات — أقل فشل ACH returns وإغلاق أسرع وفرز بمساعدة الذكاء الاصطناعي ليملك محللو ops مؤشرات cycle-time بدل إطفاء التذاكر فقط.',
      interviewer_strategy_questions: [
        'لماذا الدور مفتوح الآن — استبدال أم نطاق جديد؟',
        'ما أولوية التشغيل لـ 12 شهرًا لهذا الفريق؟',
        'كيف تغير عدد موظفي ops في السنة الماضية؟',
      ],
    },
  },
};

export const SAMPLE_REPORT_LOCALES: Partial<Record<AppLanguage, SampleLocalePack>> = {
  'zh-TW': ZH_TW,
  'zh-CN': ZH_CN,
  es: ES,
  hi: HI,
  ar: AR,
};
