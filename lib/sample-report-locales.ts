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
          requirement: 'SQL + 儀表板職責',
          status: 'Pass',
          evidence: '履歷明確寫出 Looker + SQL',
        },
        {
          requirement: '支付／ACH 領域',
          status: 'Risk',
          evidence: '偏銀行營運相鄰經驗；ACH 未明示',
        },
        {
          requirement: '支付處理商／供應商管理',
          status: 'Risk',
          evidence: '履歷未明示處理商或供應商職責',
        },
      ],
    },
    fit_score: {
      score: 78,
      band: 'Viable',
      evidence_coverage: 'High',
      sharp_verdict:
        '核心適配：SQL／Looker 職責、對帳週期縮短 28%、跨職能分流，對齊此 JD 核心範疇。 職級／年資：六年金融科技營運經驗對上 5 年以上要求；無高於 Senior BA 範疇的證據。 主要缺口：ACH 退件與清算職責是 JD 核心要求；履歷僅顯示相鄰的銀行營運經驗。',
      sharp_verdict_points: [
        '核心適配：SQL／Looker 職責、對帳週期縮短 28%、跨職能分流，對齊此 JD 核心範疇。',
        '職級／年資：六年金融科技營運經驗對上 5 年以上要求；無高於 Senior BA 範疇的證據。',
        '主要缺口：ACH 退件與清算職責是 JD 核心要求；履歷僅顯示相鄰的銀行營運經驗。',
      ],
      breakdown: [
        {
          dimension: '硬性條件／可行性',
          weight_pct: 30,
          score: 72,
          note: '72：年資與 SQL 必備條件已達，但 ACH／清算職責僅屬相鄰銀行營運，故硬性可行性落在七十多分。',
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
          description: '未見具名處理商或 NACHA 合規職責。',
          skill_kind: 'hard',
        },
        {
          gap: '美國法規關鍵字',
          description: '關鍵字篩選可能漏掉 Reg E／退票用語。',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        '所附履歷未證明 ACH／退票職責。',
        '未證明具名支付處理商經驗。',
      ],
      screenability_note: '營運關鍵字強；支付軌道關鍵字偏薄。',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary: '履歷在 ACH／退票／清算／NACHA 等此 JD 核心關鍵字上偏薄。',
      missing_keywords: ['ACH 退票', '退票處理', '清算', 'NACHA 規範'],
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
        '偏中下帶：核心 BA 證據扎實，但 ACH／支付實績偏薄，現金可能低於座位中位。',
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
        '六年金融科技營運經驗與可量化的對帳成果，已達 Senior BA 的需求職責門檻。\nJD 將 ACH 退件與清算列為核心，而履歷僅顯示相鄰的銀行營運經驗。\n此標籤反映核心要求尚未確認，而非履歷薄弱。',
      next_best_action: '謹慎應徵：ACH／退票職責僅有相鄰證明，不是明確建議應徵。',
    },
    role_read: {
      mission:
        '這個職位是支付營運的 Senior Business Analyst。\n公司要這個人把清算與退票的營運問題整理成可排程的需求，並和工程一起寫驗收標準。\n錄取條件是 5 年以上 Business Analyst 或產品營運經驗，而且要能獨立使用 SQL、負責正式環境的營運儀表板。',
      responsibilities: [
        '需求 backlog：把清算與 ACH 退票問題寫成可排程需求，並排處理順序（給工程）。',
        '驗收標準：與工程共同撰寫清算／ACH 退票流程的需求與驗收標準。',
        '營運指標：每月向營運主管報告對帳週期與錯誤率。',
      ],
      hiring_signals: [
        '年資：5 年以上 Business Analyst 或產品營運。',
        '技能：SQL — 須能獨立使用。',
        '系統：正式環境營運儀表板（須能獨立負責）。',
        '領域：支付營運 — ACH 退票、清算，或同等支付軌道。',
      ],
    },
    interview_starters: [
      '請分享你改善對帳或清算流程的一次經驗。',
      '工程產能不足時，你如何排優先級？',
      '請說說利害關係人真正會用的儀表板經驗。',
    ],
    competency_map: [
      {
        competency: 'SQL 與儀表板職責',
        weight: 'core',
        proficiency: 'demonstrated',
        resume_evidence: '以 SQL + Looker 流程將對帳週期縮短 28%。',
      },
      {
        competency: '需求與 PRD 職責',
        weight: 'core',
        proficiency: 'demonstrated',
        resume_evidence: '主導三次平台上線的 PRD 與驗收標準。',
      },
      {
        competency: 'ACH 退件與清算',
        weight: 'core',
        proficiency: 'adjacent',
        resume_evidence: '銀行營運對帳經驗；無明確 ACH 或退件職責。',
      },
      {
        competency: '跨部門協作',
        weight: 'supporting',
        proficiency: 'demonstrated',
        resume_evidence: '18 個月每週與工程、風控、客服進行問題分流。',
      },
      {
        competency: '支付處理商與 NACHA 合規',
        weight: 'supporting',
        proficiency: 'absent',
        resume_evidence: null,
      },
    ],
    market_positioning: {
      seniority_alignment: 'at_level',
      rationale: '六年金融科技營運經驗對上 5 年以上的資深 BA 門檻：落在區間內，但無 Staff 級範疇的證據。',
      differentiator: '以 SQL 與 Looker（而非增加人力）將對帳週期縮短 28% 的量化成果。',
    },
    risk_assessment: [
      {
        category: 'competency',
        severity: 'high',
        statement: 'JD 將 ACH 退件與清算列為核心；履歷僅顯示相鄰的銀行營運經驗。',
        basis: 'resume',
      },
      {
        category: 'compensation',
        severity: 'medium',
        statement: '未公布薪資範圍，薪酬區間仰賴市場基準（C 級），現金底線尚未確認。',
        basis: 'inferred',
      },
      {
        category: 'seniority',
        severity: 'low',
        statement: '無高於資深 BA 的範疇證據，因此不支持 Staff 級的上行空間。',
        basis: 'inferred',
      },
    ],
  },
  guide: {
    strategy_fit_salary: {
      score_implications:
        '78 分可通過多數篩選；第二輪預期會有 ACH 退件的領域深挖，因為該核心要求在履歷上只是相鄰經驗，尚無證據。',
      offer_implications: '證據等級 C——先探索再錨定。支付職責可信後再瞄準中帶。',
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
      company_current_pain_point:
        '這職位是要有人接手 ACH 退票與清算例外，營運團隊目前仍在臨時處理。職缺要的是能把這個佇列做成與工程、風險的每週節奏。',
      strategic_alignment_pitch:
        '我用 SQL 和 Looker 把對帳週期縮短 28%，並連續 18 個月主持工程、風險、客服的每週 triage。我會先用同一套方法畫出你們的退票佇列：負責人、SLA，以及高階已經在看的五個指標。',
      macro_risk_warnings:
        '這份示範沒有引用裁員或負面申報。加入前先問過去兩季改變了什麼，再判斷這個位子穩不穩。',
    },
    concerns_defenses: [
      {
        concern: 'ACH／支付軌道證據偏薄',
        why: 'JD 強調清算與退票職責。',
        evidence: '履歷有銀行營運 + 對帳週期改善。',
        missing_proof: '具名 ACH 退票或處理商職責。',
        answer_guide:
          '橋接：「上一份工作我擁有與支付清算相鄰的對帳 SLA。我會用同樣的 SQL + 利害關係人節奏這樣上手 ACH 退票……」',
        do_not_claim: '不要虛構你沒有擔任過的 NACHA 或處理商職稱。',
      },
      {
        concern: '高階範疇 vs IC 分析師習慣',
        why: '履歷職稱組合可能讀起來偏中階。',
        evidence: '帶領跨職能 triage 18 個月；高階狀態包。',
        missing_proof: '人數或預算職責。',
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
            'S：履歷上的跨職能 triage 情境——工程想延後清算熱修 · T：守住關帳日 · A：影響×風險打分 + 薄 MVP（對齊你 18 個月 eng/風險/客服節奏）· R：熱修上線、無 sev-1',
          dos_donts: '不要把工程講成壞人；錨定履歷上的跨職能協調，不要虛構 ACH 處理商職稱。',
          resume_anchor: '跨職能協調',
        },
      ],
      predicted: [
        {
          question: '請從頭到尾說明你如何改善一個失效的營運流程。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考驗端到端職責與可量化影響力。',
          resume_anchor: '可量化營運改善',
          star_blueprint:
            'S：履歷上月結對帳約 9 天卡住關帳 · T：不加人力縮短週期 · A：SQL 例外佇列 + Looker triage · R：週期 −28%、錯誤外洩 −15%（履歷列出的成果）',
          dos_donts: '用履歷上的 −28% 開場；不要虛構 ACH 處理商職稱。',
        },
        {
          question: '說說利害關係人忽略你儀表板的一次經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '考驗無職權影響力。',
          resume_anchor: '高階可用的溝通',
          star_blueprint:
            'S：履歷裡先前報告兩週後被忽略 · T：讓高階每週打開 KPI 包 · A：砍到 5 指標＋負責人＋下一步、掛進 MBR · R：連續三個月月會引用',
          dos_donts: '不要聲稱有管人範疇；留在履歷上的 IC／MBR 影響力。',
        },
        {
          question: '描述一次你協調風險與客服優先級衝突的經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '跨職能取捨判斷。',
          resume_anchor: '跨職能協調',
          star_blueprint:
            'S：雙 P0（對齊你 18 個月每週 triage）· T：守清算仍交付客服小勝 · A：影響×風險打分 · R：雙方接受、無 sev-1',
          dos_donts: '不要抹黑任一利害關係人；點名你實際跑過的協調節奏。',
        },
        {
          question: '說說你曾經對利害關係人的需求說不的經驗。',
          predicted: true,
          category: 'behavioral',
          interviewer_intent: '在不傷信任下設界線。',
          resume_anchor: '需求紀律',
          star_blueprint:
            'S：客服要虛榮指標（超出你 PRD／驗收標準）· T：保持決策有用 · A：用需求紀律提替代 KPI · R：延後請求、MBR 維持精準',
          dos_donts: '語氣不要輕蔑；引用履歷上的 PRD／驗收案例。',
        },
        {
          question: '前 60 天你會如何上手 ACH 退票？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '學習計畫，且不虛構過去 ACH 職責。',
          resume_anchor: '可量化營運改善',
          star_blueprint:
            'S：履歷是銀行營運相鄰、非具名 ACH 負責人 · T：誠實上手 · A：用 SQL/Looker 與 −28% 週期改善肌肉做 W1–8 計畫 · R：綁定已驗證工具的 60 天計畫',
          dos_donts: '不要聲稱沒擔任過的 NACHA 職稱；從 SQL + Looker 成果橋接。',
          missing_facts: '履歷無具名 ACH 職責——用相鄰營運證據 + 學習計畫。',
        },
        {
          question: '你會如何設計清算週期的 KPI 包？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '指標設計與利害關係人可用性。',
          resume_anchor: '高階可用的溝通',
          star_blueprint:
            'S：履歷已有高階 MBR 狀態包 · T：設計清算週期 KPI · A：分子／分母＋負責人＋每週節奏（同你 5 KPI 包模式）· R：高階會打開的包、非虛榮圖',
          dos_donts: '避免無負責人的虛榮指標；沿用履歷 MBR 模式，勿虛構未擁有的清算 SLA。',
        },
        {
          question: '請說明你如何分流退票例外暴增。',
          predicted: true,
          category: 'technical',
          interviewer_intent: '模糊情境下的營運事故結構。',
          resume_anchor: '跨職能協調',
          star_blueprint:
            'S：退票例外暴增 · T：穩定且不虛構處理商後台 · A：重用你 eng/風險/客服每週 triage · R：清楚負責人＋週期恢復敘事',
          dos_donts: '不要虛構處理商後台經驗；靠 18 個月 triage 協調。',
        },
        {
          question: '在自己不擁有合規的情況下，你會如何驗證與 NACHA 相關的控制？',
          predicted: true,
          category: 'technical',
          interviewer_intent: '在 BA 範疇內與風險／合規合作。',
          resume_anchor: '跨職能協調',
          star_blueprint:
            'S：JD 問 NACHA、履歷無合規職責 · T：以 BA 夥伴驗證 · A：對齊控制負責人＋證據清單＋每週例外檢視 · R：缺口上升且不自稱 NACHA 官',
          dos_donts: '不要聲稱自己是 NACHA 負責人；留在履歷 BA 協調範疇。',
        },
        {
          question: '當清算 SLA 告急時，你如何估算並排序工程需求？',
          predicted: true,
          category: 'technical',
          interviewer_intent: 'SLA 壓力下的產品／營運優先級。',
          resume_anchor: '需求紀律',
          star_blueprint:
            'S：清算 SLA 燒損 · T：排序工程需求 · A：像你週期改善一樣量化影響＋MVP vs 完整修復＋PRD/AC 紀律對齊 · R：共同取捨、不虛構產能',
          dos_donts: '不要虛構無法辯護的產能數字；引用履歷需求／驗收職責。',
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
      interviewer_profiling: {
        communication_style: '這裡寫成直接、先要數字再聽故事。',
        icebreaker_hooks: [
          '這一季最痛的佇列是退票、清算中斷，還是爭議帳齡？',
          '負責這條佇列的人，前 30 天怎樣算好？',
        ],
      },
      assignment_blueprint: {
        likely_format: '現場走一遍退票佇列：排優先、點名 KPI，並說你暫時不會自動化什麼。',
        hidden_grading_rubric: [
          '提出解法前先點出履歷事實（28% 週期縮短或每週 triage）。',
          '分清楚職缺寫了什麼，以及還要跟招募確認什麼。',
          '給出工程師這週就能開始的下一步。',
        ],
      },
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
        '雇用已能交付的營運分析職責：SQL／Looker 節奏、可量化週期改善、高階可用的協調——再用結構化 60 天計畫補上 ACH 缺口。',
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
      negotiation_script: {
        prepare: '通話前先寫好「核定區間」的問題，以及你的底線：低於書面底線，或範疇低於 Senior BA。',
        pitch:
          '謝謝——在我報數字前，這個地點這個職級的核定現金區間是多少？根據相近的 Senior BA 金融科技營運職缺，以及我的週期職責，確認範疇後我會瞄準中帶。',
        counter:
          '若現金落在中下帶，我會先看簽約金或遠端彈性，再動底薪。職缺沒寫的公司總額，我不會自己錨定。',
      },
      timeline_leverage_templates: {
        stalling_for_time_email:
          '主旨：Senior BA 對話的時間\n\n[Name] 你好，\n\n謝謝更新。我這週還有一場對話要收尾，想給你一個清楚的答覆。我可以在 [day] 前回來嗎？我仍對我們談過的清算範疇有興趣。\n\n[Your name]',
        competing_offer_leverage_email:
          '主旨：決定前的更新\n\n[Name] 你好，\n\n另一個流程這週會進入決定。我不是要請你對一個我還沒看到書面數字的條件。若你能確認核定現金區間，以及是否有簽約金，我可以在 [day] 前決定。\n\n[Your name]',
      },
      levers: ['範疇', '簽約金', '遠端彈性', '職級定級'],
      structured_levers: [
        { name: '範疇', note: '確認是 Senior BA 職責而非工單分流' },
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
        '謝謝——在我報數字前，這個地點這個職級的核定現金區間是多少？根據相近 Senior BA 金融科技營運職缺與我的週期／KPI 職責，確認範疇後我會瞄準中帶。',
      discovery_questions: [
        '這個地點這個職級的核定區間是多少？',
        '總酬如何拆現金、獎金與股票？',
      ],
    },
    role_team_insights: {
      ats_critical_gaps: {
        detected_count: 2,
        gaps: [
          {
            gap_type: 'keyword_missing',
            jd_requirement: '具備 ACH 付款對帳與清算流程經驗',
            resume_weakness: '履歷寫「banking operations」，但從沒出現 ACH 或 settlement 關鍵字',
            fix_strategy:
              '面試時：「履歷寫的是銀行營運，但我實際管過每月約 $45M 的 ACH 清算流。我可以對照你們的退票與對帳需求，說明怎麼套用。」',
            severity: 'critical',
          },
          {
            gap_type: 'quantification_weak',
            jd_requirement: '5 年以上支付或金融科技商業分析經驗',
            resume_weakness: '履歷寫「extensive fintech experience」，沒寫明確年資',
            fix_strategy:
              '面試時：「我有 6 年金融科技營運經驗、待過兩家公司；最近一輪對帳優化把錯誤率降了 28%。」',
            severity: 'major',
          },
        ],
      },
      role_content_refined: [
        '端到端擁有支付營運改善的需求',
        '把營運痛點轉成優先工程 backlog',
        '發布週期與錯誤率 KPI 包',
      ],
      requirements_refined: [
        'SQL 能力是必備',
        '高階職責——不是初階工單分流',
        '偏好支付領域勝於泛用 BA',
      ],
      rto_official: '混合制——每週到辦公室 3 天（依 JD）',
      rto_employee_reality: '論壇提到跨職能節奏頻繁；關帳／事故週加班會升高。',
      next_title_1_3yr: 'Lead BA／支付營運產品負責人',
      career_path_basis:
        '公司未公開內部職等表 — 依 Levels.fyi／LinkedIn 的 Senior BA→Lead BA 路徑，以及美國金融科技營運就業市場職涯階梯推估（本頁不顯示薪資金額）。',
      promotion_skill_gaps: [
        '具名 ACH／退票職責',
        '處理商／供應商管理證據',
        '組織層級衝突協調',
      ],
      team_sample_insufficient: false,
    },
    company_truth: {
      company_overview:
        'Northstar Payments 是美國金融科技公司，主攻商戶清算、ACH 退票與營運分析，客群偏中型與成長型商戶。市場位置介於開發者友善軌道（Stripe 類）與較重的企業收單之間——這次開缺是 Senior BA 走可靠度／例外職責，不是消費型 neobank 故事。公開訊號顯示重視書面狀態包、跨職能分流，以及可量化的週期 KPI。',
      recent_developments: [
        {
          headline: '營運領導層擴大清算可靠度計畫',
          summary: '顯示 Senior BA 會用例外週期與關帳品質衡量，而不只看工單量。',
          date: '2026-04',
          category: 'leadership',
          source_name: '公司部落格',
          source_url: 'https://www.reuters.com',
        },
        {
          headline: 'AI 輔助退票分流導入營運流程',
          summary: '產品賭注代表面試可能深挖 human-in-the-loop 例外設計與 KPI 職責。',
          date: '2026-03',
          category: 'product',
          source_name: '科技媒體',
          source_url: 'https://www.bloomberg.com',
        },
        {
          headline: '支付可靠度工具獲產業肯定',
          summary: '獲獎敘事強化清算品質品牌，可用於「為何選這家公司」回答。',
          date: '2026-02',
          category: 'award',
          source_name: '產業媒體',
          source_url: 'https://www.reuters.com',
        },
        {
          headline: '宣布擴大中型商戶 ACH 覆蓋',
          summary: 'ACH 範圍擴大通常代表第一年會有更多退票／清算邊緣案例。',
          date: '2026-01',
          category: 'product',
          source_name: '公司新聞室',
          source_url: 'https://www.bloomberg.com',
        },
        {
          headline: '同業加大營運自動化投入',
          summary: '競爭壓力解釋為何 Northstar 現在開自動化與可靠度分析職缺。',
          date: '2025-11',
          category: 'other',
          source_name: '市場新聞',
          source_url: 'https://www.reuters.com',
        },
      ],
      current_strategy:
        '近期重心是清算可靠度與例外自動化：降低 ACH 退票失敗、加快關帳，並用 AI 輔助分流，讓營運分析師用週期 KPI 帶隊，而不是只救火工單。',
      competitors: [
        {
          name: 'Stripe',
          strengths:
            '開發者友善軌道、美國 ACH／卡覆蓋廣，產品團隊想自助接支付時品牌很強。',
          weaknesses:
            '大型企業清算／退票職責較不像「營運分析師原生」；複雜 B2B 對帳常仍要大量客製。',
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
    leverage_analysis: {
      candidate_leverage: 'moderate',
      factors: [
        {
          factor: '量化營運成果',
          direction: 'for_candidate',
          evidence: '履歷列出對帳週期下降 28%、錯誤外溢下降 15%。',
          source_url: null,
        },
        {
          factor: '支付軌道經驗缺口',
          direction: 'for_employer',
          evidence: 'JD 將 ACH 退件列為核心；履歷為相鄰的銀行營運。',
          source_url: null,
        },
        {
          factor: '未公布薪資範圍',
          direction: 'neutral',
          evidence: '無公布範圍（C 級），在確認前由雇主掌握薪酬區間。',
          source_url: null,
        },
        {
          factor: '工資申報高於基準中位數',
          direction: 'for_candidate',
          evidence: '範例：同類 Business Analyst 申報落在基準區間的上半段。',
          source_url: 'https://h1bdata.info',
        },
      ],
      bargaining_posture: '平衡：先確認核准範圍，錨定在區間中段，以明確職責範疇換取現金上的彈性。',
    },
    insider_signals: [
      {
        source: 'h1bdata',
        finding: '範例：同類美國支付雇主的 Business Analyst H-1B 工資申報集中在 $145K–$190K 基準區間的上半段。',
        url: 'https://h1bdata.info',
        date: '2026-05',
        evidence_tier: 1,
      },
      {
        source: 'sec_filing',
        finding: '範例：同業公開支付公司在近期 10-K 風險因素中提到營運自動化投入與人力紀律。',
        url: 'https://www.sec.gov',
        date: '2026-03',
        evidence_tier: 1,
      },
      {
        source: 'blind',
        finding: '範例：論壇貼文提到遠端營運分析職位對書面狀態報告的要求很高。',
        url: 'https://www.teamblind.com',
        date: '2026-04',
        evidence_tier: 3,
      },
    ],
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
          requirement: 'SQL + 仪表板职责',
          status: 'Pass',
          evidence: '简历明确写出 Looker + SQL',
        },
        {
          requirement: '支付／ACH 领域',
          status: 'Risk',
          evidence: '偏银行运营相邻经验；ACH 未明示',
        },
        {
          requirement: '支付处理商／供应商管理',
          status: 'Risk',
          evidence: '简历未明示处理商或供应商职责',
        },
      ],
    },
    fit_score: {
      score: 78,
      band: 'Viable',
      evidence_coverage: 'High',
      sharp_verdict:
        '核心适配：SQL／Looker 职责、对账周期缩短 28%、跨职能分流，对齐此 JD 核心范围。 职级／年资：六年金融科技运营经验对上 5 年以上要求；无高于 Senior BA 范围的证据。 主要缺口：ACH 退件与清算职责是 JD 核心要求；简历仅显示相邻的银行运营经验。',
      sharp_verdict_points: [
        '核心适配：SQL／Looker 职责、对账周期缩短 28%、跨职能分流，对齐此 JD 核心范围。',
        '职级／年资：六年金融科技运营经验对上 5 年以上要求；无高于 Senior BA 范围的证据。',
        '主要缺口：ACH 退件与清算职责是 JD 核心要求；简历仅显示相邻的银行运营经验。',
      ],
      breakdown: [
        {
          dimension: '硬性条件／可行性',
          weight_pct: 30,
          score: 72,
          note: '72：年资与 SQL 必备条件已达，但 ACH／清算职责仅属相邻银行运营，故硬性可行性落在七十多分。',
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
          description: '未见具名处理商或 NACHA 合规职责。',
          skill_kind: 'hard',
        },
        {
          gap: '美国法规关键字',
          description: '关键字筛选可能漏掉 Reg E／退票用语。',
          skill_kind: 'hard',
        },
      ],
      resume_actions: [
        '所附简历未证明 ACH／退票职责。',
        '未证明具名支付处理商经验。',
      ],
      screenability_note: '运营关键字强；支付轨道关键字偏薄。',
    },
    ats_warning: {
      pass_rate_pct: 42,
      missing_keyword_count: 4,
      summary: '简历在 ACH／退票／清算／NACHA 等此 JD 核心关键字上偏薄。',
      missing_keywords: ['ACH 退票', '退票处理', '清算', 'NACHA 规范'],
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
        '偏中下带：核心 BA 证据扎实，但 ACH／支付实绩偏薄，现金可能低于座位中位。',
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
        '六年金融科技运营经验与可量化的对账成果，已达 Senior BA 的需求职责门槛。JD 将 ACH 退件与清算列为核心，而简历仅显示相邻的银行运营经验。此标签反映核心要求尚未确认，而非简历薄弱。',
      next_best_action: '谨慎应征：ACH／退票职责仅有相邻证明，不是明确建议应征。',
    },
    role_read: {
      mission:
        '这个职位是支付运营的 Senior Business Analyst。公司要这个人把清算与退票的运营问题整理成可排期的需求，并和工程一起写验收标准。录用条件是 5 年以上 Business Analyst 或产品运营经验，而且要能独立使用 SQL、负责正式环境的运营仪表板。',
      responsibilities: [
        '需求 backlog：把清算与 ACH 退票问题写成可排期需求，并排处理顺序（给工程）。',
        '验收标准：与工程共同撰写清算／ACH 退票流程的需求与验收标准。',
        '运营指标：每月向运营主管报告对账周期与错误率。',
      ],
      hiring_signals: [
        '年资：5 年以上 Business Analyst 或产品运营。',
        '技能：SQL — 须能独立使用。',
        '系统：正式环境运营仪表板（须能独立负责）。',
        '领域：支付运营 — ACH 退票、清算，或同等支付轨道。',
      ],
    },
    interview_starters: [
      '请分享你改善对账或清算流程的一次经验。',
      '工程产能不足时，你如何排优先级？',
      '请说说利益相关者真正会用的仪表板经验。',
    ],
    competency_map: [
      {
        competency: 'SQL 与仪表板职责',
        weight: 'core',
        proficiency: 'demonstrated',
        resume_evidence: '以 SQL + Looker 流程将对账周期缩短 28%。',
      },
      {
        competency: '需求与 PRD 职责',
        weight: 'core',
        proficiency: 'demonstrated',
        resume_evidence: '主导三次平台上线的 PRD 与验收标准。',
      },
      {
        competency: 'ACH 退件与清算',
        weight: 'core',
        proficiency: 'adjacent',
        resume_evidence: '银行运营对账经验；无明确 ACH 或退件职责。',
      },
      {
        competency: '跨部门协作',
        weight: 'supporting',
        proficiency: 'demonstrated',
        resume_evidence: '18 个月每周与工程、风控、客服进行问题分流。',
      },
      {
        competency: '支付处理商与 NACHA 合规',
        weight: 'supporting',
        proficiency: 'absent',
        resume_evidence: null,
      },
    ],
    market_positioning: {
      seniority_alignment: 'at_level',
      rationale: '六年金融科技运营经验对上 5 年以上的资深 BA 门槛：落在区间内，但无 Staff 级范围的证据。',
      differentiator: '以 SQL 与 Looker（而非增加人力）将对账周期缩短 28% 的量化成果。',
    },
    risk_assessment: [
      {
        category: 'competency',
        severity: 'high',
        statement: 'JD 将 ACH 退件与清算列为核心；简历仅显示相邻的银行运营经验。',
        basis: 'resume',
      },
      {
        category: 'compensation',
        severity: 'medium',
        statement: '未公布薪资范围，薪酬区间依赖市场基准（C 级），现金底线尚未确认。',
        basis: 'inferred',
      },
      {
        category: 'seniority',
        severity: 'low',
        statement: '无高于资深 BA 的范围证据，因此不支持 Staff 级的上行空间。',
        basis: 'inferred',
      },
    ],
  },
  guide: {
    strategy_fit_salary: {
      score_implications:
        '78 分可通过多数筛选；第二轮预期会有 ACH 退件的领域深挖，因为该核心要求在简历上只是相邻经验，尚无证据。',
      offer_implications: '证据等级 C——先探索再锚定。支付职责可信后再瞄准中带。',
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
      company_current_pain_point:
        '这职位是要有人接手 ACH 退票与清算例外，运营团队目前仍在临时处理。职位要的是能把这个队列做成与工程、风险的每周节奏。',
      strategic_alignment_pitch:
        '我用 SQL 和 Looker 把对账周期缩短 28%，并连续 18 个月主持工程、风险、客服的每周 triage。我会先用同一套方法画出你们的退票队列：负责人、SLA，以及高管已经在看的五个指标。',
      macro_risk_warnings:
        '这份示范没有引用裁员或负面申报。加入前先问过去两季改变了什么，再判断这个位子稳不稳。',
    },
    concerns_defenses: [
      {
        concern: 'ACH／支付轨道证据偏薄',
        why: 'JD 强调清算与退票职责。',
        evidence: '简历有银行运营 + 对账周期改善。',
        missing_proof: '具名 ACH 退票或处理商职责。',
        answer_guide:
          '桥接：「上一份工作我拥有与支付清算相邻的对账 SLA。我会用同样的 SQL + 利益相关者节奏这样上手 ACH 退票……」',
        do_not_claim: '不要虚构你没有担任过的 NACHA 或处理商职称。',
      },
      {
        concern: '高阶范畴 vs IC 分析师习惯',
        why: '简历职称组合可能读起来偏中阶。',
        evidence: '带领跨职能 triage 18 个月；高管状态包。',
        missing_proof: '人数或预算职责。',
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
          interviewer_intent: '考验端到端职责与可量化影响力。',
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
          interviewer_intent: '学习计划，且不虚构过去 ACH 职责。',
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
      interviewer_profiling: {
        communication_style: '这里写成直接、先要数字再听故事。',
        icebreaker_hooks: [
          '这一季最痛的队列是退票、清算中断，还是争议账龄？',
          '负责这条队列的人，前 30 天怎样算好？',
        ],
      },
      assignment_blueprint: {
        likely_format: '现场走一遍退票队列：排优先、点名 KPI，并说你暂时不会自动化什么。',
        hidden_grading_rubric: [
          '提出解法前先点出简历事实（28% 周期缩短或每周 triage）。',
          '分清楚职位写了什么，以及还要跟招聘确认什么。',
          '给出工程师这周就能开始的下一步。',
        ],
      },
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
        '雇用已能交付的运营分析职责：SQL／Looker 节奏、可量化周期改善、高管可用的协调——再用结构化 60 天计划补上 ACH 缺口。',
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
      negotiation_script: {
        prepare: '通话前先写好「核定区间」的问题，以及你的底线：低于书面底线，或范畴低于 Senior BA。',
        pitch:
          '谢谢——在我报数字前，这个地点这个职级的核定现金区间是多少？根据相近的 Senior BA 金融科技运营职位，以及我的周期职责，确认范畴后我会瞄准中带。',
        counter:
          '若现金落在中下带，我会先看签约金或远程弹性，再动底薪。职位没写的公司总额，我不会自己锚定。',
      },
      timeline_leverage_templates: {
        stalling_for_time_email:
          '主题：Senior BA 对话的时间\n\n[Name] 你好，\n\n谢谢更新。我这周还有一场对话要收尾，想给你一个清楚的答复。我可以在 [day] 前回来吗？我仍对我们谈过的清算范畴有兴趣。\n\n[Your name]',
        competing_offer_leverage_email:
          '主题：决定前的更新\n\n[Name] 你好，\n\n另一个流程这周会进入决定。我不是要请你对一个我还没看到书面数字的条件。若你能确认核定现金区间，以及是否有签约金，我可以在 [day] 前决定。\n\n[Your name]',
      },
      levers: ['范畴', '签约金', '远程弹性', '职级定级'],
      structured_levers: [
        { name: '范畴', note: '确认是 Senior BA 职责而非工单分流' },
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
        '谢谢——在我报数字前，这个地点这个职级的核定现金区间是多少？根据相近 Senior BA 金融科技运营职位与我的周期／KPI 职责，确认范畴后我会瞄准中带。',
      discovery_questions: [
        '这个地点这个职级的核定区间是多少？',
        '总酬如何拆现金、奖金与股票？',
      ],
    },
    role_team_insights: {
      ats_critical_gaps: {
        detected_count: 2,
        gaps: [
          {
            gap_type: 'keyword_missing',
            jd_requirement: '具备 ACH 付款对账与清算流程经验',
            resume_weakness: '简历写「banking operations」，但从未出现 ACH 或 settlement 关键字',
            fix_strategy:
              '面试时：「简历写的是银行运营，但我实际管过每月约 $45M 的 ACH 清算流。我可以对照你们的退票与对账需求，说明怎么套用。」',
            severity: 'critical',
          },
          {
            gap_type: 'quantification_weak',
            jd_requirement: '5 年以上支付或金融科技商业分析经验',
            resume_weakness: '简历写「extensive fintech experience」，没写明确年资',
            fix_strategy:
              '面试时：「我有 6 年金融科技运营经验、待过两家公司；最近一轮对账优化把错误率降了 28%。」',
            severity: 'major',
          },
        ],
      },
      role_content_refined: [
        '端到端拥有支付运营改善的需求',
        '把运营痛点转成优先工程 backlog',
        '发布周期与错误率 KPI 包',
      ],
      requirements_refined: [
        'SQL 能力是必备',
        '高阶职责——不是初级工单分流',
        '偏好支付领域胜于泛用 BA',
      ],
      rto_official: '混合制——每周到办公室 3 天（依 JD）',
      rto_employee_reality: '论坛提到跨职能节奏频繁；关账／事故周加班会升高。',
      next_title_1_3yr: 'Lead BA／支付运营产品负责人',
      career_path_basis:
        '公司未公开内部职等表 — 依 Levels.fyi／LinkedIn 的 Senior BA→Lead BA 路径，以及美国金融科技运营就业市场职涯阶梯推估（本页不显示薪酬金额）。',
      promotion_skill_gaps: [
        '具名 ACH／退票职责',
        '处理商／供应商管理证据',
        '组织层级冲突协调',
      ],
      team_sample_insufficient: false,
    },
    company_truth: {
      company_overview:
        'Northstar Payments 是美国金融科技公司，主攻商户清算、ACH 退票与运营分析，客群偏中型与成长型商户。市场位置介于开发者友好轨道（Stripe 类）与较重的企业收单之间——这次开缺是 Senior BA 走可靠度／例外职责，不是消费型 neobank 故事。公开信号显示重视书面状态包、跨职能分流，以及可量化的周期 KPI。',
      recent_developments: [
        {
          headline: '运营领导层扩大清算可靠度计划',
          summary: '显示 Senior BA 会用例外周期与关账质量衡量，而不只看工单量。',
          date: '2026-04',
          category: 'leadership',
          source_name: '公司博客',
          source_url: 'https://www.reuters.com',
        },
        {
          headline: 'AI 辅助退票分流导入运营流程',
          summary: '产品赌注代表面试可能深挖 human-in-the-loop 例外设计与 KPI 职责。',
          date: '2026-03',
          category: 'product',
          source_name: '科技媒体',
          source_url: 'https://www.bloomberg.com',
        },
        {
          headline: '支付可靠度工具获产业肯定',
          summary: '获奖叙事强化清算质量品牌，可用于「为何选这家公司」回答。',
          date: '2026-02',
          category: 'award',
          source_name: '产业媒体',
          source_url: 'https://www.reuters.com',
        },
        {
          headline: '宣布扩大中型商户 ACH 覆盖',
          summary: 'ACH 范围扩大通常代表第一年会有更多退票／清算边缘案例。',
          date: '2026-01',
          category: 'product',
          source_name: '公司新闻室',
          source_url: 'https://www.bloomberg.com',
        },
        {
          headline: '同业加大运营自动化投入',
          summary: '竞争压力解释为何 Northstar 现在开自动化与可靠度分析职位。',
          date: '2025-11',
          category: 'other',
          source_name: '市场新闻',
          source_url: 'https://www.reuters.com',
        },
      ],
      current_strategy:
        '近期重心是清算可靠度与例外自动化：降低 ACH 退票失败、加快关账，并用 AI 辅助分流，让运营分析师用周期 KPI 带队，而不是只救火工单。',
      competitors: [
        {
          name: 'Stripe',
          strengths:
            '开发者友好轨道、美国 ACH／卡覆盖广，产品团队想自助接支付时品牌很强。',
          weaknesses:
            '大型企业清算／退票职责较不像「运营分析师原生」；复杂 B2B 对账常仍要大量定制。',
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
    leverage_analysis: {
      candidate_leverage: 'moderate',
      factors: [
        {
          factor: '量化运营成果',
          direction: 'for_candidate',
          evidence: '简历列出对账周期下降 28%、错误外溢下降 15%。',
          source_url: null,
        },
        {
          factor: '支付轨道经验缺口',
          direction: 'for_employer',
          evidence: 'JD 将 ACH 退件列为核心；简历为相邻的银行运营。',
          source_url: null,
        },
        {
          factor: '未公布薪资范围',
          direction: 'neutral',
          evidence: '无公布范围（C 级），在确认前由雇主掌握薪酬区间。',
          source_url: null,
        },
        {
          factor: '工资申报高于基准中位数',
          direction: 'for_candidate',
          evidence: '示例：同类 Business Analyst 申报落在基准区间的上半段。',
          source_url: 'https://h1bdata.info',
        },
      ],
      bargaining_posture: '平衡：先确认核准范围，锚定在区间中段，以明确职责范围换取现金上的弹性。',
    },
    insider_signals: [
      {
        source: 'h1bdata',
        finding: '示例：同类美国支付雇主的 Business Analyst H-1B 工资申报集中在 $145K–$190K 基准区间的上半段。',
        url: 'https://h1bdata.info',
        date: '2026-05',
        evidence_tier: 1,
      },
      {
        source: 'sec_filing',
        finding: '示例：同业公开支付公司在近期 10-K 风险因素中提到运营自动化投入与人力纪律。',
        url: 'https://www.sec.gov',
        date: '2026-03',
        evidence_tier: 1,
      },
      {
        source: 'blind',
        finding: '示例：论坛帖子提到远程运营分析职位对书面状态报告的要求很高。',
        url: 'https://www.teamblind.com',
        date: '2026-04',
        evidence_tier: 3,
      },
    ],
  },
};

export const SAMPLE_REPORT_LOCALES: Partial<Record<AppLanguage, SampleLocalePack>> = {
  'zh-TW': ZH_TW,
  'zh-CN': ZH_CN,
};
