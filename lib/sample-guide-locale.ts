import type { AppLanguage } from '@/lib/report-language';
import type { GuideResumeRewrite } from '@/types';

/** Customer-facing Guide sample prose. One language per pack — no mixed sentences. */
export type SampleGuideNarrative = {
  professional: string[];
  behavioral: string[];
  rewrites: GuideResumeRewrite[];
  rationale: string;
  buyer_seller: string;
  levelsTitle: string;
  h1bWageTitle: string;
  culture: string;
  labor_risk: string;
  layoff_risk: string;
  h1b: string;
  remote_sponsorship: string;
  role_reviews: string;
  company_pros: string[];
  company_cons: string[];
  role_pros: string[];
  role_cons: string[];
  roleSourceTitle: string;
  blindTitle: string;
  warnTitle: string;
  process: string;
  company_summary: string;
  questions_summary: string;
  negotiate_summary: string;
  pay_strategy: string;
  benefits_strategy: string;
  script: string;
  company_questions: string;
  follow_up_email: string;
};

const en: SampleGuideNarrative = {
  professional: [
    'Walk me through how you prioritized an ACH return queue before cutoff.',
    'How do you reconcile a settlement break when the bank file and the ledger disagree?',
    'Tell me about a time NACHA return codes changed how you triaged exceptions.',
    'How would you explain a same-day ACH failure to a merchant who missed payroll?',
    'What SQL checks do you run before calling a settlement exception closed?',
    'How have you partnered with engineering when a returns file arrived late?',
    'Describe a control you added so a duplicate ACH file could not post twice.',
    'How do you decide which exception is a customer issue versus a bank issue?',
    'Walk through a month-end settlement tie-out you owned.',
    'What would you inspect first if return volume jumped week over week?',
    'Which ops metric would you put on a daily settlement standup?',
    'How do you document an exception so the next shift can finish it?',
  ],
  behavioral: [
    'Tell me about a time you pushed back on a deadline that would have missed a cutoff.',
    'Describe a cross-team miss and what you changed afterward.',
    'Tell me about feedback that changed how you write status updates.',
    'A stakeholder wanted a number you could not defend. What did you do?',
    'Tell me about delivering bad news to a partner bank or customer.',
    'Describe how you onboarded yourself into an unfamiliar payments process.',
    'Tell me about a conflict with engineering over what done meant.',
    'When have you chosen a simpler control over a perfect one?',
    'Tell me about a written update that changed a leadership decision.',
    'Describe a reconciliation mistake and how you contained it.',
    'Tell me about coaching someone through their first incident.',
  ],
  rewrites: [
    {
      category: 'Missing hard requirements on the resume',
      gap: 'Resume does not show ACH returns or settlement',
      before: 'Supported payment operations and reconciliation.',
      after:
        'Cut reconciliation cycle time 28% with SQL and Looker on a banking-ops book. The resume does not show ACH returns or settlement; do not add them.',
    },
    {
      category: 'Missing hard requirements on the resume',
      gap: 'Resume does not show NACHA or a named processor',
      before: 'Worked with vendors on payment issues.',
      after:
        'Partnered with engineering on late exception files. The resume does not show a processor or NACHA title; do not add one.',
    },
  ],
  rationale:
    'Target: $168K. US remote Senior Business Analyst band is about $145K–$190K; SQL/Looker cut reconciliation cycle time 28%, ACH returns ownership is only adjacent, so the number stays mid-band.\nCeiling: $185K. No Staff-level scope and no second offer.\nMix: $145K base, about $12K a year of equity, $11K bonus. Equity and bonus are not rights the resume already holds.',
  buyer_seller:
    'The requisition is still posted, so the employer has an open seat to fill, but public sources cite no start deadline or hiring freeze. With no competing offer in play, they can hold a mid-band first offer and keep screening.\nThe evidenced ask is a 28% reconciliation cycle-time cut with SQL and Looker. ACH returns ownership is not on the resume and cannot be treated as completed scope in negotiation.',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'H-1B wage data',
  culture: 'Public reviews describe a written, remote-friendly ops culture with tight cutoff deadlines.',
  labor_risk: 'No cited labor action in the sample sources. Treat this as unknown, not as a clean record.',
  layoff_risk:
    'No WARN notice in the sample window. Ask the recruiter whether ops headcount changed in the last year.',
  h1b: 'Sample H-1B employer filings for Northstar Payments show petitions in the last three years. The cited page does not publish a selection rate. Sponsorship is plausible and unconfirmed — ask the recruiter before you rely on it.',
  remote_sponsorship: 'The posting says US remote. It does not say the company will sponsor this seat.',
  role_reviews: 'Reviewers praise SQL depth and flag on-call during settlement incidents.',
  company_pros: [
    'Public reviews describe a written, remote-friendly operations culture.',
    'No WARN notice appears in the sample window.',
  ],
  company_cons: [
    'The same reviews describe tight cutoff deadlines.',
    'Sample sources cite no labor action. Treat that as unknown, not as a clean record.',
    'H-1B filings exist for the last three years, and the cited page publishes no selection rate. Sponsorship is unconfirmed. The posting says US remote and does not say this seat is sponsored.',
  ],
  role_pros: [
    'Reviews of this seat praise the SQL depth the posting asks for.',
    'Reviewers describe a defined settlement cutoff, not a vague collaboration role.',
  ],
  role_cons: [
    'On-call is expected during settlement incidents.',
    'Reviews do not describe a promotion pace for this seat. Confirm that with the recruiter.',
  ],
  roleSourceTitle: 'Glassdoor — role reviews',
  blindTitle: 'Blind — ops reviews',
  warnTitle: 'DOL WARN notices',
  process:
    'Recruiter screen, hiring-manager case on a settlement break, then a panel. Sample shares put the loop at about three weeks.',
  company_summary:
    'Culture: public reviews describe a written, remote-friendly ops culture with tight cutoffs.\nRisk: no WARN in the sample window; H-1B filings exist, but sponsorship for this seat is unconfirmed.\nConfirm: ask the recruiter about ops headcount and visa before treating either as settled.',
  questions_summary:
    'Process: recruiter screen, hiring-manager settlement-break case, then a panel, about three weeks.\nProfessional: ACH returns, cutoff, and SQL checks.\nBehavioral: written status and cross-team misses.',
  negotiate_summary:
    'Open: $168K total, $145K base, using only the 28% reconciliation cycle-time proof.\nCap: $185K. No Staff scope and no second offer.\nBan: do not invent a competing bid, and do not trade base for a benefit the employer did not offer.',
  pay_strategy:
    'Name the total first, not the base. The only fact this resume can spend is a 28% reconciliation cycle-time cut with SQL and Looker. ACH returns ownership is not on the resume, so do not price the offer as if that gap were closed.\nOpen at $168K total: $145K base, about $12K a year of equity, and an $11K bonus. That is the middle of the band, which is what this proof supports.\nIf the offer is the floor of the band, or base only, counter once and stop at $185K. There is no Staff scope and no second written offer, so nothing above $185K has a basis.\nDo not invent a competing offer. The leverage is the 28% already delivered, not another company.',
  benefits_strategy:
    'Talk benefits only after the $145K base is named. Do not reverse that order.\nAsk once, for four items: sign-on, an equity refresh, remote days per week, and PTO. Do not turn them into four separate counters.\nSponsorship stays out of this counter. The posting says US remote and does not say this seat is sponsored. Ask the recruiter.\nDo not give up base for a benefit the employer did not offer. If they ask to cut the $145K in exchange for remote days or PTO, refuse that trade.',
  script:
    'The work I can show is a 28% reconciliation cycle-time cut with SQL and Looker. I can accept $168K total, with base at $145K. If we need to move, the ceiling that proof can support is $185K.',
  company_questions:
    'Does this seat own ACH returns on day one, or is settlement experience enough?\nWho receives the monthly cycle-time and error-rate report, and what do they expect in the first 90 days?\nHow often is on-call during settlement incidents, and what does the rotation cover?\nThe posting says US remote and does not say this seat is sponsored. Will the company sponsor it?\nAfter this interview, who runs the next round and what are they assessing?',
  follow_up_email:
    'Send this after the interview, before anyone starts talking numbers. Once pay is on the table, use the spoken line above and do not send this note.\n\nSubject: Thank you — Senior Business Analyst, Northstar Payments\n\nDear Hiring Team,\n\nThank you for taking the time to speak with me today about the Senior Business Analyst role on the payments operations team.\n\nThe work I can speak to with evidence is a 28% cut in reconciliation cycle time using SQL and Looker. I did not present ACH returns as work I have already owned.\n\nIf this seat requires independent handling of ACH returns on day one, I would welcome a brief confirmation of the scope before a next round.\n\nBest regards,\n[Your name]',
};

const zhTW: SampleGuideNarrative = {
  professional: [
    '請說明你在截止時間前如何排列 ACH 退票佇列的優先順序。',
    '銀行檔與帳本不一致時，你如何核對一筆清算差異？',
    '請分享 NACHA 退票代碼改變你處理例外方式的一次經驗。',
    '商戶錯過薪資發放時，你會如何說明一筆當日 ACH 失敗？',
    '把一筆清算例外標成結案前，你會跑哪些 SQL 檢查？',
    '退票檔遲到時，你如何與工程合作？',
    '請說明你加過什麼控制，避免同一份 ACH 檔被入帳兩次。',
    '你如何判斷一筆例外是客戶問題還是銀行問題？',
    '請走一遍你負責過的一次月底清算對帳。',
    '如果退票量一週比一週增加，你會先查什麼？',
    '每日清算站會上，你會放哪個營運指標？',
    '你如何記錄一筆例外，讓下一班能接手做完？',
  ],
  behavioral: [
    '請分享你拒絕一個會錯過截止時間的期限的經驗。',
    '請說明一次跨團隊失誤，以及你事後改了什麼。',
    '請分享改變你寫狀態更新方式的一次回饋。',
    '利害關係人要一個你站不住的數字時，你怎麼做？',
    '請分享你向合作銀行或客戶傳達壞消息的經驗。',
    '請說明你如何自己熟悉一套不熟的支付流程。',
    '請分享你與工程對「完成」定義不一致的一次衝突。',
    '你什麼時候選擇較簡單的控制，而不是完美的控制？',
    '請分享一份書面更新改變了主管決定的經驗。',
    '請說明一次對帳錯誤，以及你如何把影響控制住。',
    '請分享你帶著同事度過第一次事故的經驗。',
  ],
  rewrites: [
    {
      category: '履歷缺少的關鍵項目',
      gap: '履歷缺少 ACH 退票與清算經驗',
      before: '支援支付營運與對帳。',
      after: '在銀行營運帳上，用 SQL 與 Looker 把對帳週期縮短 28%。履歷沒有 ACH 退票或清算經驗，改寫時不要補上。',
    },
    {
      category: '履歷缺少的關鍵項目',
      gap: '履歷缺少 NACHA 與支付處理商經驗',
      before: '與供應商處理支付問題。',
      after: '與工程一起處理遲到的例外檔。履歷沒有處理商或 NACHA 職稱，不要自行加上。',
    },
  ],
  rationale:
    '目標價：$168K。美國遠端 Senior Business Analyst 市場帶約 $145K–$190K；履歷可證 SQL／Looker 將對帳週期縮短 28%，ACH 退票僅相鄰，故不站上緣。\n天花板：$185K。沒有 Staff 級範圍，也沒有第二份 offer。\n結構：底薪 $145K、股票約 $12K／年、獎金 $11K。股票與獎金不是履歷已拿到的權利。',
  buyer_seller:
    '職缺仍在公開招募，雇主有補位需求，但公開來源未顯示到職時程或人力緊縮。在沒有第二份競爭 offer 的情況下，雇主可維持中帶首報、繼續篩選。\n履歷可主張的證據是以 SQL 與 Looker 將對帳週期縮短 28%。ACH 退票擁有權未記載於履歷，不得在談判中列為已完成的工作範圍。',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'H-1B 薪資資料',
  culture: '公開評價描述的是重視書面、可遠端的營運文化，截止時間很緊。',
  labor_risk: '範例來源沒有引用勞資行動。這應視為未知，不是清白紀錄。',
  layoff_risk: '範例區間內沒有 WARN 通知。請向招募確認過去一年營運人力是否變動。',
  h1b: '範例中的 Northstar Payments H-1B 雇主申報顯示近三年有申請。所引頁面沒有公布抽籤率。贊助有可能，但尚未確認。在你依賴它之前，先問招募。',
  remote_sponsorship: '職缺寫美國可遠端。沒有寫這家公司會為這個位子提供簽證贊助。',
  role_reviews: '評價肯定 SQL 深度，並指出清算事故期間需要待命。',
  company_pros: [
    '公開評價把這家公司寫成重視書面溝通、可遠端的營運文化。',
    '範例區間內沒有 WARN 裁員通知。',
  ],
  company_cons: [
    '同一批評價指出截止時間很緊。',
    '範例來源沒有引用勞資行動。這是未知，不是清白紀錄。',
    '近三年有 H-1B 申請，所引頁面沒有公布抽籤率。贊助尚未確認。職缺寫美國可遠端，沒有寫會贊助這個位子。',
  ],
  role_pros: [
    '這個職位的評價肯定 SQL 深度，和職缺要求一致。',
    '評價把工作寫成有明確的清算截止，而不是空泛的協作。',
  ],
  role_cons: [
    '清算事故期間需要待命。',
    '評價沒有寫出這個位子的晉升節奏，上任前要向招募確認。',
  ],
  roleSourceTitle: 'Glassdoor 職位評價',
  blindTitle: 'Blind 營運討論',
  warnTitle: 'DOL WARN 公告',
  process: '招募篩選、用人主管的清算差異案例，然後是小組面試。範例分享把整段流程放在大約三週。',
  company_summary:
    '文化：公開評價寫重視書面溝通、可遠端的營運文化，截止時間很緊。\n風險：範例區間沒有 WARN；近三年有 H-1B 申請，此席是否贊助尚未確認。\n待確認：入職前向招募確認人力變動與簽證。',
  questions_summary:
    '流程：招募篩選、用人主管清算差異案例、小組面試，約三週。\n專業題：ACH 退票、截止、SQL 核對。\n行為題：書面狀態與跨團隊失誤。',
  negotiate_summary:
    '開價：總薪酬 $168K，底薪 $145K，依據是對帳週期縮短 28%。\n上限：$185K。沒有 Staff 範圍，也沒有第二份 offer。\n禁區：不要編競爭方案，也不用底薪去換對方沒提出的福利。',
  pay_strategy:
    '先報總薪酬，不要先報底薪。這份履歷能拿來談的證據只有一項：用 SQL 與 Looker 把對帳週期縮短 28%。履歷沒有 ACH 退票擁有權，不能把這個缺口說成已經補上，拿來抬價。\n開價 $168K 總薪酬：底薪 $145K、股票約 $12K／年、獎金 $11K。這是市場帶的中段，對得上履歷能證明的範圍。\n對方若開在帶的底部，或只給底薪、不給股票與獎金，只還價一次，停在 $185K。沒有 Staff 級範圍，也沒有第二份書面 offer，再往上沒有依據。\n沒有書面競爭方案就不要編。籌碼是已經發生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪 $145K 講定之後才談福利。順序不要反過來。\n一次問完四項：簽約金、股票增授、每週遠端天數、帶薪假。不要拆成四次還價。\n簽證贊助不進這次還價。職缺只寫美國可遠端，沒有寫會贊助這個位子。這題問招募。\n對方沒有提出的福利，不要用降低底薪去換。若對方要求把 $145K 降下來換遠端或休假，拒絕這筆交換。',
  script:
    '我能證明的是，用 SQL 與 Looker 把對帳週期縮短 28%。我接受總薪酬 $168K，其中底薪 $145K。若還要移動，這項證明能站住的上限是 $185K。',
  company_questions:
    '這個職位第一天就要獨立負責 ACH 退票，還是有清算經驗即可？\n每月的對帳週期與錯誤率，是向哪一位營運主管報告，前 90 天要交出什麼？\n清算事故的待命頻率與範圍是什麼？\n職缺寫的是美國可遠端，沒有寫簽證贊助。這個位子會贊助嗎？\n這一面試之後，下一關由誰進行、看的是什麼？',
  follow_up_email:
    '面試結束、對方還沒開始談薪資時寄。已經在談數字，就用上面的開口稿，不要再寄這封。\n\n主旨：Senior Business Analyst 面試後續 — Northstar Payments\n\n您好：\n\n感謝您今天撥冗面試 Senior Business Analyst（支付營運）一職。\n\n履歷上能證明的，是以 SQL 與 Looker 把對帳週期縮短 28%。我沒有把 ACH 退票說成已經負責過。\n\n若這個位子第一天就要獨立處理退票，希望能再確認一次工作範圍。\n\n此致\n[您的姓名]',
};

const zhCN: SampleGuideNarrative = {
  professional: [
    '请说明你在截止时间前如何排列 ACH 退票队列的优先顺序。',
    '银行档与账本不一致时，你如何核对一笔清算差异？',
    '请分享 NACHA 退票代码改变你处理例外方式的一次经验。',
    '商户错过薪资发放时，你会如何说明一笔当日 ACH 失败？',
    '把一笔清算例外标成结案前，你会跑哪些 SQL 检查？',
    '退票档迟到时，你如何与工程合作？',
    '请说明你加过什么控制，避免同一份 ACH 档被入账两次。',
    '你如何判断一笔例外是客户问题还是银行问题？',
    '请走一遍你负责过的一次月底清算对账。',
    '如果退票量一周比一周增加，你会先查什么？',
    '每日清算站会上，你会放哪个运营指标？',
    '你如何记录一笔例外，让下一班能接手做完？',
  ],
  behavioral: [
    '请分享你拒绝一个会错过截止时间的期限的经验。',
    '请说明一次跨团队失误，以及你事后改了什么。',
    '请分享改变你写状态更新方式的一次反馈。',
    '利害关系人要一个你站不住的数字时，你怎么做？',
    '请分享你向合作银行或客户传达坏消息的经验。',
    '请说明你如何自己熟悉一套不熟的支付流程。',
    '请分享你与工程对「完成」定义不一致的一次冲突。',
    '你什么时候选择较简单的控制，而不是完美的控制？',
    '请分享一份书面更新改变了主管决定的经验。',
    '请说明一次对账错误，以及你如何把影响控制住。',
    '请分享你带着同事度过第一次事故的经验。',
  ],
  rewrites: [
    {
      category: '简历缺少的关键项目',
      gap: '简历缺少 ACH 退票与清算经验',
      before: '支持支付运营与对账。',
      after: '在银行运营账上，用 SQL 与 Looker 把对账周期缩短 28%。简历没有 ACH 退票或清算经验，改写时不要补上。',
    },
    {
      category: '简历缺少的关键项目',
      gap: '简历缺少 NACHA 与支付处理商经验',
      before: '与供应商处理支付问题。',
      after: '与工程一起处理迟到的例外档。简历没有处理商或 NACHA 职称，不要自行加上。',
    },
  ],
  rationale:
    '目标价：$168K。美国远程 Senior Business Analyst 市场带约 $145K–$190K；简历可证 SQL／Looker 将对账周期缩短 28%，ACH 退票仅相邻，故不站上沿。\n天花板：$185K。没有 Staff 级范围，也没有第二份 offer。\n结构：底薪 $145K、股票约 $12K／年、奖金 $11K。股票与奖金不是简历已拿到的权利。',
  buyer_seller:
    '职位仍在公开招聘，雇主有补位需求，但公开来源未显示到职时程或人力紧缩。在没有第二份竞争 offer 的情况下，雇主可维持中带首报、继续筛选。\n简历可主张的证据是以 SQL 与 Looker 将对账周期缩短 28%。ACH 退票所有权未记载于简历，不得在谈判中列为已完成的工作范围。',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'H-1B 薪资资料',
  culture: '公开评价描述的是重视书面、可远程的运营文化，截止时间很紧。',
  labor_risk: '示例来源没有引用劳资行动。这应视为未知，不是清白记录。',
  layoff_risk: '示例区间内没有 WARN 通知。请向招聘确认过去一年运营人力是否变动。',
  h1b: '示例中的 Northstar Payments H-1B 雇主申报显示近三年有申请。所引页面没有公布抽签率。赞助有可能，但尚未确认。在你依赖它之前，先问招聘。',
  remote_sponsorship: '职位写美国可远程。没有写这家公司会为这个位子提供签证赞助。',
  role_reviews: '评价肯定 SQL 深度，并指出清算事故期间需要待命。',
  company_pros: [
    '公开评价把这家公司写成重视书面沟通、可远程的运营文化。',
    '示例区间内没有 WARN 裁员通知。',
  ],
  company_cons: [
    '同一批评价指出截止时间很紧。',
    '示例来源没有引用劳资行动。这是未知，不是清白记录。',
    '近三年有 H-1B 申请，所引页面没有公布抽签率。赞助尚未确认。职位写美国可远程，没有写会赞助这个位子。',
  ],
  role_pros: [
    '这个职位的评价肯定 SQL 深度，和职位要求一致。',
    '评价把工作写成有明确的清算截止，而不是空泛的协作。',
  ],
  role_cons: [
    '清算事故期间需要待命。',
    '评价没有写出这个位子的晋升节奏，上任前要向招聘确认。',
  ],
  roleSourceTitle: 'Glassdoor 职位评价',
  blindTitle: 'Blind 运营讨论',
  warnTitle: 'DOL WARN 公告',
  process: '招聘筛选、用人主管的清算差异案例，然后是小组面试。示例分享把整段流程放在大约三周。',
  company_summary:
    '文化：公开评价写重视书面沟通、可远程的运营文化，截止时间很紧。\n风险：示例区间没有 WARN；近三年有 H-1B 申请，此席是否赞助尚未确认。\n待确认：入职前向招聘确认人力变动与签证。',
  questions_summary:
    '流程：招聘筛选、用人主管清算差异案例、小组面试，约三周。\n专业题：ACH 退票、截止、SQL 核对。\n行为题：书面状态与跨团队失误。',
  negotiate_summary:
    '开价：总薪酬 $168K，底薪 $145K，依据是对账周期缩短 28%。\n上限：$185K。没有 Staff 范围，也没有第二份 offer。\n禁区：不要编竞争方案，也不用底薪去换对方没提出的福利。',
  pay_strategy:
    '先报总薪酬，不要先报底薪。这份简历能拿来谈的证据只有一项：用 SQL 与 Looker 把对账周期缩短 28%。简历没有 ACH 退票所有权，不能把这个缺口说成已经补上，拿来抬价。\n开价 $168K 总薪酬：底薪 $145K、股票约 $12K／年、奖金 $11K。这是市场带的中段，对得上简历能证明的范围。\n对方若开在带的底部，或只给底薪、不给股票与奖金，只还价一次，停在 $185K。没有 Staff 级范围，也没有第二份书面 offer，再往上没有依据。\n没有书面竞争方案就不要编。筹码是已经发生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪 $145K 讲定之后才谈福利。顺序不要反过来。\n一次问完四项：签约金、股票增授、每周远程天数、带薪假。不要拆成四次还价。\n签证赞助不进这次还价。职位只写美国可远程，没有写会赞助这个位子。这题问招聘。\n对方没有提出的福利，不要用降低底薪去换。若对方要求把 $145K 降下来换远程或休假，拒绝这笔交换。',
  script:
    '我能证明的是，用 SQL 与 Looker 把对账周期缩短 28%。我接受总薪酬 $168K，其中底薪 $145K。若还要移动，这项证明能站住的上限是 $185K。',
  company_questions:
    '这个职位第一天就要独立负责 ACH 退票，还是有清算经验即可？\n每月的对账周期与错误率，是向哪一位运营主管报告，前 90 天要交出什么？\n清算事故的待命频率与范围是什么？\n职位写的是美国可远程，没有写签证赞助。这个位子会赞助吗？\n这一轮面试之后，下一关由谁进行、看的是什么？',
  follow_up_email:
    '面试结束、对方还没开始谈薪酬时寄。已经在谈数字，就用上面的开口稿，不要再寄这封。\n\n主旨：Senior Business Analyst 面试后续 — Northstar Payments\n\n您好：\n\n感谢您今天拨冗面试 Senior Business Analyst（支付运营）一职。\n\n简历上能证明的，是以 SQL 与 Looker 把对账周期缩短 28%。我没有把 ACH 退票说成已经负责过。\n\n若这个位子第一天就要独立处理退票，希望能再确认一次工作范围。\n\n此致\n[您的姓名]',
};

const es: SampleGuideNarrative = {
  professional: [
    'Explícame cómo priorizaste una cola de devoluciones ACH antes del corte.',
    '¿Cómo concilias una diferencia de liquidación cuando el archivo del banco y el libro no coinciden?',
    'Cuéntame una vez en que los códigos de devolución NACHA cambiaron cómo clasificabas excepciones.',
    '¿Cómo explicarías un fallo de ACH del mismo día a un comercio que no pagó nómina?',
    '¿Qué comprobaciones SQL haces antes de cerrar una excepción de liquidación?',
    '¿Cómo has trabajado con ingeniería cuando un archivo de devoluciones llegó tarde?',
    'Describe un control que añadiste para que un archivo ACH duplicado no se contabilizara dos veces.',
    '¿Cómo decides si una excepción es del cliente o del banco?',
    'Recorre un cierre de liquidación de fin de mes que hayas llevado.',
    'Si el volumen de devoluciones sube semana a semana, ¿qué mirarías primero?',
    '¿Qué métrica de operaciones pondrías en la reunión diaria de liquidación?',
    '¿Cómo documentas una excepción para que el siguiente turno pueda terminarla?',
  ],
  behavioral: [
    'Cuéntame una vez que rechazaste un plazo que habría perdido el corte.',
    'Describe un fallo entre equipos y qué cambiaste después.',
    'Cuéntame un comentario que cambió cómo escribes las actualizaciones de estado.',
    'Un interesado pidió una cifra que no podías defender. ¿Qué hiciste?',
    'Cuéntame cómo diste una mala noticia a un banco asociado o a un cliente.',
    'Describe cómo te pusiste al día en un proceso de pagos que no conocías.',
    'Cuéntame un conflicto con ingeniería sobre qué significaba terminado.',
    '¿Cuándo has elegido un control más simple en lugar de uno perfecto?',
    'Cuéntame una nota escrita que cambió una decisión de dirección.',
    'Describe un error de conciliación y cómo contuviste el impacto.',
    'Cuéntame cómo acompañaste a alguien en su primer incidente.',
  ],
  rewrites: [
    {
      category: 'Requisitos clave que faltan en el CV',
      gap: 'El CV no muestra devoluciones ACH ni liquidación',
      before: 'Apoyé operaciones de pago y conciliación.',
      after:
        'En un libro de operaciones bancarias, reduje el ciclo de conciliación un 28% con SQL y Looker. El CV no muestra devoluciones ACH ni liquidación; no las añadas al reescribir.',
    },
    {
      category: 'Requisitos clave que faltan en el CV',
      gap: 'El CV no muestra NACHA ni un procesador concreto',
      before: 'Trabajé con proveedores en incidencias de pago.',
      after:
        'Trabajé con ingeniería en archivos de excepción que llegaron tarde. El CV no muestra un cargo de procesador ni de NACHA; no lo añadas.',
    },
  ],
  rationale:
    'Objetivo: $168K. Banda de Senior Business Analyst remoto en EE. UU. ~$145K–$190K; el CV prueba un recorte del 28% en conciliación con SQL y Looker, y las devoluciones ACH solo son adyacentes, así que queda a mitad de banda.\nTecho: $185K. No hay alcance Staff ni una segunda oferta.\nMix: base $145K, unos $12K al año en acciones, bono $11K. Acciones y bono no son derechos que el CV ya tenga.',
  buyer_seller:
    'La vacante sigue publicada, así que el empleador tiene un puesto por cubrir, pero las fuentes públicas no citan fecha de incorporación ni congelación de contrataciones. Sin una segunda oferta en juego, puede mantener una primera oferta a mitad de banda y seguir filtrando.\nEl hecho acreditado es un recorte del 28% en el ciclo de conciliación con SQL y Looker. La propiedad de devoluciones ACH no figura en el CV y no puede presentarse en la negociación como alcance ya ejecutado.',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'Datos salariales H-1B',
  culture: 'Las reseñas públicas describen una cultura de operaciones por escrito, compatible con remoto y con cortes muy ajustados.',
  labor_risk: 'Las fuentes de la muestra no citan una acción laboral. Trátalo como desconocido, no como un historial limpio.',
  layoff_risk:
    'No hay aviso WARN en la ventana de la muestra. Pregunta al reclutador si la plantilla de operaciones cambió en el último año.',
  h1b: 'Las presentaciones H-1B de muestra de Northstar Payments muestran peticiones en los últimos tres años. La página citada no publica una tasa de selección. El patrocinio es posible y no está confirmado. Pregunta al reclutador antes de depender de ello.',
  remote_sponsorship: 'El anuncio dice remoto en Estados Unidos. No dice que la empresa patrocine este puesto.',
  role_reviews: 'Las reseñas valoran la profundidad en SQL y señalan guardias durante incidentes de liquidación.',
  company_pros: [
    'Las reseñas públicas describen una cultura de operaciones por escrito y compatible con remoto.',
    'No aparece un aviso WARN en la ventana de la muestra.',
  ],
  company_cons: [
    'Las mismas reseñas describen cortes de plazo muy ajustados.',
    'Las fuentes no citan una acción laboral. Eso es desconocido, no un historial limpio.',
    'Hay presentaciones H-1B en los últimos tres años y la página citada no publica una tasa de selección. El patrocinio no está confirmado. El anuncio dice remoto en Estados Unidos y no dice que este puesto esté patrocinado.',
  ],
  role_pros: [
    'Las reseñas de este puesto valoran la profundidad en SQL que pide el anuncio.',
    'Describen un corte de liquidación definido, no un rol vago de colaboración.',
  ],
  role_cons: [
    'Hay guardia durante incidentes de liquidación.',
    'Las reseñas no describen el ritmo de promoción de este puesto. Confírmalo con el reclutador.',
  ],
  roleSourceTitle: 'Glassdoor — reseñas del puesto',
  blindTitle: 'Blind — reseñas de ops',
  warnTitle: 'Avisos WARN de DOL',
  process:
    'Filtro del reclutador, caso del responsable de contratación sobre una diferencia de liquidación y después un panel. Las muestras sitúan el proceso en unas tres semanas.',
  company_summary:
    'Cultura: reseñas públicas describen operaciones escritas y remotas, con plazos muy ajustados.\nRiesgo: no hay WARN en la ventana de muestra; hay presentaciones H-1B, pero el patrocinio de este puesto no está confirmado.\nConfirmar: pregunta al reclutador por la plantilla de ops y el visado.',
  questions_summary:
    'Proceso: filtro del reclutador, caso de liquidación y panel, unas tres semanas.\nProfesional: devoluciones ACH, corte y SQL.\nConductual: estatus escrito y fallos entre equipos.',
  negotiate_summary:
    'Apertura: $168K total, base $145K, solo con la prueba del 28% en conciliación.\nTope: $185K. No hay alcance Staff ni una segunda oferta.\nProhibido: no inventes una oferta competidora ni cambies la base por un beneficio no ofrecido.',
  pay_strategy:
    'Nombra primero el total, no la base. El único hecho que este CV puede usar es un recorte del 28% en el ciclo de conciliación con SQL y Looker. La propiedad de devoluciones ACH no está en el CV, así que no pongas precio como si esa brecha ya estuviera cerrada.\nAbre en $168K de total: base $145K, unos $12K al año en acciones y un bono de $11K. Es el medio de la banda, que es lo que esta prueba sostiene.\nSi la oferta está en el suelo, o es solo base, contraoferta una vez y para en $185K. No hay alcance de nivel Staff ni una segunda oferta por escrito, así que por encima de $185K no hay base.\nNo inventes una oferta competidora. La palanca es el 28% ya entregado, no otra empresa.',
  benefits_strategy:
    'Habla de beneficios solo después de nombrar la base de $145K. No inviertas ese orden.\nPide una sola vez cuatro cosas: prima de firma, ampliación de acciones, días remotos por semana y vacaciones. No las conviertas en cuatro contraofertas.\nEl patrocinio queda fuera de esta contraoferta. El anuncio dice remoto en Estados Unidos y no dice que este puesto esté patrocinado. Pregúntalo al reclutador.\nNo entregues la base a cambio de un beneficio que no te hayan ofrecido. Si piden bajar los $145K a cambio de remoto o vacaciones, rechaza ese canje.',
  script:
    'Lo que puedo mostrar es un recorte del 28% en el ciclo de conciliación con SQL y Looker. Acepto $168K de total, con base de $145K. Si hay que moverse, el techo que esa prueba sostiene es $185K.',
  company_questions:
    '¿Este puesto posee las devoluciones ACH desde el primer día, o basta la experiencia en liquidación?\n¿Quién recibe el informe mensual de ciclo y tasa de error, y qué espera en los primeros 90 días?\n¿Con qué frecuencia hay guardia en incidentes de liquidación y qué cubre?\nEl anuncio dice remoto en Estados Unidos y no dice que el puesto esté patrocinado. ¿La empresa lo patrocina?\nDespués de esta entrevista, ¿quién hace la siguiente ronda y qué evalúa?',
  follow_up_email:
    'Envíala al terminar la entrevista, antes de que nadie hable de cifras. Si ya se está negociando el sueldo, usa la frase de arriba y no envíes esta nota.\n\nAsunto: Agradecimiento — Senior Business Analyst, Northstar Payments\n\nEstimado equipo de selección:\n\nGracias por el tiempo de hoy para hablar del puesto de Senior Business Analyst en operaciones de pago.\n\nLo que puedo acreditar es un recorte del 28% en el ciclo de conciliación con SQL y Looker. No presenté las devoluciones ACH como un trabajo que ya hubiera dirigido.\n\nSi el puesto exige gestionar devoluciones ACH de forma independiente desde el primer día, agradecería confirmar el alcance antes de una siguiente ronda.\n\nUn saludo,\n[Su nombre]',
};

const hi: SampleGuideNarrative = {
  professional: [
    'कटऑफ से पहले आपने ACH रिटर्न कतार की प्राथमिकता कैसे तय की, यह बताएँ।',
    'जब बैंक फ़ाइल और खाता बही मेल नहीं खाती, तो आप सेटलमेंट अंतर कैसे मिलाते हैं?',
    'कोई बार बताएँ जब NACHA रिटर्न कोड ने अपवादों की छँटाई बदल दी।',
    'जिस व्यापारी की पेरोल छूट गई, उसे उसी दिन की ACH विफलता आप कैसे समझाएँगे?',
    'सेटलमेंट अपवाद बंद करने से पहले आप कौन से SQL जाँच चलाते हैं?',
    'रिटर्न फ़ाइल देर से आने पर आपने इंजीनियरिंग के साथ कैसे काम किया?',
    'ऐसा नियंत्रण बताएँ जिससे एक ही ACH फ़ाइल दो बार पोस्ट न हो।',
    'आप कैसे तय करते हैं कि अपवाद ग्राहक का है या बैंक का?',
    'महीने के अंत का एक सेटलमेंट टाई-आउट बताएँ जिसकी ज़िम्मेदारी आपकी थी।',
    'अगर रिटर्न की मात्रा हफ़्ते दर हफ़्ते बढ़े, तो आप पहले क्या देखेंगे?',
    'रोज़ के सेटलमेंट स्टैंडअप में आप कौन सा संचालन संकेतक रखेंगे?',
    'आप अपवाद को कैसे लिखते हैं ताकि अगली शिफ्ट उसे पूरा कर सके?',
  ],
  behavioral: [
    'कोई बार बताएँ जब आपने ऐसी समय-सीमा ठुकराई जो कटऑफ चूक जाती।',
    'टीमों के बीच एक चूक बताएँ और बाद में आपने क्या बदला।',
    'ऐसी प्रतिक्रिया बताएँ जिसने स्थिति अपडेट लिखने का तरीका बदल दिया।',
    'एक हितधारक ऐसा आँकड़ा चाहता था जिसे आप बचा नहीं सकते थे। आपने क्या किया?',
    'साझेदार बैंक या ग्राहक को बुरी ख़बर देने का अनुभव बताएँ।',
    'एक अनजानी भुगतान प्रक्रिया में आपने खुद को कैसे तैयार किया?',
    'इंजीनियरिंग से इस बात पर विवाद बताएँ कि पूरा होने का मतलब क्या था।',
    'आपने कब सरल नियंत्रण को पूर्ण नियंत्रण पर चुना?',
    'ऐसा लिखित अपडेट बताएँ जिसने नेतृत्व का फ़ैसला बदल दिया।',
    'एक मिलान गलती बताएँ और आपने प्रभाव कैसे रोका।',
    'किसी को उसकी पहली घटना से निकालने का अनुभव बताएँ।',
  ],
  rewrites: [
    {
      category: 'रिज़्यूमे में कमी वाले मुख्य आइटम',
      gap: 'रिज़्यूमे में ACH रिटर्न या सेटलमेंट नहीं है',
      before: 'भुगतान संचालन और मिलान में सहयोग किया।',
      after:
        'बैंकिंग संचालन की किताब पर SQL और Looker से मिलान चक्र 28% छोटा किया। रिज़्यूमे में ACH रिटर्न या सेटलमेंट नहीं है; पुनर्लेखन में जोड़ें नहीं।',
    },
    {
      category: 'रिज़्यूमे में कमी वाले मुख्य आइटम',
      gap: 'रिज़्यूमे में NACHA या नामित प्रोसेसर नहीं है',
      before: 'भुगतान समस्याओं पर विक्रेताओं के साथ काम किया।',
      after:
        'देर से आई अपवाद फ़ाइलों पर इंजीनियरिंग के साथ काम किया। रिज़्यूमे में प्रोसेसर या NACHA का पद नहीं है; इसे स्वयं न जोड़ें।',
    },
  ],
  rationale:
    'लक्ष्य: $168K। अमेरिका में दूरस्थ Senior Business Analyst पट्टी ~$145K–$190K; SQL/Looker से मिलान चक्र −28%, ACH रिटर्न केवल आसन्न, इसलिए मध्य पट्टी।\nछत: $185K। Staff दायरा नहीं, दूसरा ऑफ़र नहीं।\nमिश्रण: आधार $145K, ~$12K/वर्ष इक्विटी, बोनस $11K। इक्विटी और बोनस रिज़्यूमे के मौजूदा अधिकार नहीं।',
  buyer_seller:
    'पद अभी प्रकाशित है, इसलिए नियोक्ता के पास भरने वाली सीट है, लेकिन सार्वजनिक स्रोतों में ज्वॉइन की समयसीमा या हायरिंग फ्रीज नहीं है। बिना दूसरे ऑफ़र के वे मिड-बैंड पहली पेशकश रख सकते हैं और स्क्रीनिंग जारी रख सकते हैं।\nसिद्ध माँग SQL और Looker से मिलान चक्र में 28% की कमी है। रिज़्यूमे में ACH रिटर्न की मालिकी नहीं है, और इसे बातचीत में पूरा हो चुका दायरा नहीं माना जा सकता।',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'H-1B वेतन डेटा',
  culture: 'सार्वजनिक समीक्षाएँ लिखित, दूरस्थ-अनुकूल संचालन संस्कृति बताती हैं, जिसमें कटऑफ बहुत कड़े हैं।',
  labor_risk: 'नमूना स्रोतों में कोई श्रम कार्रवाई उद्धृत नहीं है। इसे अज्ञात मानें, साफ़ रिकॉर्ड नहीं।',
  layoff_risk: 'नमूना अवधि में कोई WARN सूचना नहीं है। भर्तीकर्ता से पूछें कि पिछले वर्ष संचालन की संख्या बदली या नहीं।',
  h1b: 'Northstar Payments के नमूना H-1B नियोक्ता दाखिले पिछले तीन वर्षों में याचिकाएँ दिखाते हैं। उद्धृत पृष्ठ चयन दर नहीं छापता। प्रायोजन संभव है और पुष्ट नहीं है। उस पर निर्भर होने से पहले भर्तीकर्ता से पूछें।',
  remote_sponsorship: 'विज्ञापन अमेरिका में दूरस्थ कहता है। यह नहीं कहता कि कंपनी इस सीट को प्रायोजित करेगी।',
  role_reviews: 'समीक्षाएँ SQL की गहराई की सराहना करती हैं और सेटलमेंट घटनाओं के दौरान ऑन-कॉल बताती हैं।',
  company_pros: [
    'सार्वजनिक समीक्षाएँ लिखित और दूरस्थ-अनुकूल संचालन संस्कृति बताती हैं।',
    'नमूना अवधि में कोई WARN सूचना नहीं है।',
  ],
  company_cons: [
    'वही समीक्षाएँ कड़े कटऑफ बताती हैं।',
    'स्रोत कोई श्रम कार्रवाई नहीं उद्धृत करते। यह अज्ञात है, साफ़ रिकॉर्ड नहीं।',
    'पिछले तीन वर्षों में H-1B दाखिले हैं और उद्धृत पृष्ठ चयन दर नहीं छापता। प्रायोजन पुष्ट नहीं है। विज्ञापन अमेरिका में दूरस्थ कहता है और यह नहीं कहता कि इस सीट का प्रायोजन है।',
  ],
  role_pros: [
    'इस पद की समीक्षाएँ उसी SQL गहराई की सराहना करती हैं जो विज्ञापन माँगता है।',
    'वे एक स्पष्ट सेटलमेंट कटऑफ बताती हैं, खाली सहयोग भूमिका नहीं।',
  ],
  role_cons: [
    'सेटलमेंट घटनाओं के दौरान ऑन-कॉल अपेक्षित है।',
    'समीक्षाएँ इस पद की पदोन्नति गति नहीं लिखतीं। भर्तीकर्ता से पुष्टि करें।',
  ],
  roleSourceTitle: 'Glassdoor — पद समीक्षा',
  blindTitle: 'Blind — ops चर्चा',
  warnTitle: 'DOL WARN सूचनाएँ',
  process:
    'भर्तीकर्ता की जाँच, सेटलमेंट अंतर पर नियुक्ति प्रबंधक का केस, फिर पैनल। नमूना साझाकरण पूरी प्रक्रिया को लगभग तीन सप्ताह मानते हैं।',
  company_summary:
    'संस्कृति: सार्वजनिक समीक्षाएँ लिखित, दूरस्थ-अनुकूल ops और कड़े कटऑफ बताती हैं।\nजोखिम: नमूना अवधि में WARN नहीं; H-1B दाखिले हैं, इस सीट का प्रायोजन पुष्ट नहीं।\nपुष्टि: ops हेडकाउंट और वीज़ा भर्तीकर्ता से पूछें।',
  questions_summary:
    'प्रक्रिया: भर्तीकर्ता स्क्रीन, सेटलमेंट-ब्रेक केस, पैनल—लगभग तीन सप्ताह।\nपेशेवर: ACH रिटर्न, कटऑफ, SQL।\nव्यवहारिक: लिखित स्टेटस और क्रॉस-टीम चूक।',
  negotiate_summary:
    'खोलें: कुल $168K, आधार $145K, केवल 28% मिलान चक्र प्रमाण।\nऊपरी सीमा: $185K। Staff दायरा या दूसरा ऑफ़र नहीं।\nनिषेध: प्रतिस्पर्धी बोली न गढ़ें, न दी सुविधा के बदले आधार न दें।',
  pay_strategy:
    'पहले कुल बताएँ, आधार नहीं। यह रिज़्यूमे केवल एक तथ्य खर्च कर सकता है: SQL और Looker से मिलान चक्र में 28% की कमी। ACH रिटर्न की मालिकी रिज़्यूमे में नहीं है, इसलिए इस अंतर को भरा हुआ मानकर दाम न लगाएँ।\n$168K कुल पर खोलें: आधार $145K, प्रति वर्ष लगभग $12K इक्विटी, बोनस $11K। यह पट्टी का मध्य है, जितना यह प्रमाण संभालता है।\nअगर ऑफ़र पट्टी के निचले सिरे पर है, या केवल आधार है, तो एक बार प्रतिप्रस्ताव दें और $185K पर रुकें। Staff दायरा नहीं है और दूसरा लिखित ऑफ़र नहीं है, इसलिए $185K से ऊपर का आधार नहीं है।\nप्रतिस्पर्धी ऑफ़र गढ़ें नहीं। लाभ वह 28% है जो हो चुका है, कोई दूसरी कंपनी नहीं।',
  benefits_strategy:
    'लाभ की बात $145K आधार तय होने के बाद करें। क्रम उलटा न करें।\nएक बार में चार चीज़ें माँगें: साइन-ऑन, इक्विटी वृद्धि, प्रति सप्ताह दूरस्थ दिन, और छुट्टी। इन्हें चार अलग प्रतिप्रस्ताव न बनाएँ।\nप्रायोजन इस प्रतिप्रस्ताव में नहीं आता। विज्ञापन अमेरिका में दूरस्थ कहता है और इस सीट का प्रायोजन नहीं कहता। यह भर्तीकर्ता से पूछें।\nजो लाभ नियोक्ता ने नहीं दिया, उसके बदले आधार न दें। अगर वे दूरस्थ दिन या छुट्टी के लिए $145K घटाना चाहें, तो यह विनिमय अस्वीकार करें।',
  script:
    'जो मैं दिखा सकता हूँ, वह SQL और Looker से मिलान चक्र में 28% की कमी है। मैं कुल $168K स्वीकार करता हूँ, जिसमें आधार $145K है। अगर हिलना हो, तो इस प्रमाण की ऊपरी सीमा $185K है।',
  company_questions:
    'क्या इस पद पर पहले दिन से ACH रिटर्न की ज़िम्मेदारी है, या सेटलमेंट अनुभव काफ़ी है?\nमासिक चक्र-समय और त्रुटि-दर रिपोर्ट किसे मिलती है, और पहले 90 दिनों में वे क्या चाहते हैं?\nसेटलमेंट घटनाओं में ऑन-कॉल कितनी बार है, और दायरा क्या है?\nविज्ञापन अमेरिका में दूरस्थ कहता है और प्रायोजन नहीं कहता। क्या कंपनी इस सीट को प्रायोजित करेगी?\nइस इंटरव्यू के बाद अगला दौर कौन लेता है, और वे क्या जाँचते हैं?',
  follow_up_email:
    'इंटरव्यू के बाद, संख्याओं की बात शुरू होने से पहले भेजें। वेतन की बात चल पड़ी हो, तो ऊपर वाली पंक्ति बोलें और यह पत्र न भेजें।\n\nविषय: धन्यवाद — Senior Business Analyst, Northstar Payments\n\nप्रिय भर्ती टीम,\n\nआज Senior Business Analyst (भुगतान संचालन) पद पर समय देने के लिए धन्यवाद।\n\nजो मैं प्रमाण के साथ कह सकता हूँ, वह SQL और Looker से मिलान चक्र में 28% की कमी है। मैंने ACH रिटर्न को ऐसा काम नहीं बताया जिसे मैं पहले से चलाता रहा हूँ।\n\nअगर इस पद पर पहले दिन से ACH रिटर्न स्वतंत्र रूप से संभालने होंगे, तो अगले दौर से पहले दायरा एक बार पुष्ट करना चाहूँगा।\n\nसादर,\n[आपका नाम]',
};

const ar: SampleGuideNarrative = {
  professional: [
    'اشرح كيف رتبت أولوية طابور مرتجعات ACH قبل موعد القطع.',
    'كيف تطابق فرق التسوية عندما يختلف ملف البنك عن الدفتر؟',
    'صف مرة غيّرت فيها رموز إرجاع NACHA طريقة فرز الاستثناءات.',
    'كيف تشرح فشلاً في ACH في اليوم نفسه لتاجر فاتته الرواتب؟',
    'ما فحوصات SQL التي تجريها قبل إغلاق استثناء تسوية؟',
    'كيف عملت مع الهندسة عندما وصل ملف المرتجعات متأخراً؟',
    'صف ضبطاً أضفته حتى لا يُرحّل ملف ACH مكرر مرتين.',
    'كيف تقرر إن كان الاستثناء مشكلة عميل أم مشكلة بنك؟',
    'اسرد مطابقة تسوية نهاية شهر كنت تملكها.',
    'إذا ارتفع حجم المرتجعات أسبوعاً بعد أسبوع، ماذا تفحص أولاً؟',
    'أي مؤشر تشغيلي تضع في اجتماع التسوية اليومي؟',
    'كيف توثّق استثناءً حتى تكمله الوردية التالية؟',
  ],
  behavioral: [
    'صف مرة رفضت فيها موعداً كان سيفوّت القطع.',
    'صف إخفاقاً بين الفرق وما غيّرته بعده.',
    'صف ملاحظة غيّرت طريقة كتابة تحديثات الحالة.',
    'أراد صاحب مصلحة رقماً لا تستطيع الدفاع عنه. ماذا فعلت؟',
    'صف إبلاغ بنك شريك أو عميل بخبر سيئ.',
    'صف كيف تعلمت بنفسك عملية مدفوعات لم تكن تعرفها.',
    'صف خلافاً مع الهندسة حول معنى الإنجاز.',
    'متى اخترت ضبطاً أبسط بدلاً من ضبط كامل؟',
    'صف تحديثاً مكتوباً غيّر قرار الإدارة.',
    'صف خطأ مطابقة وكيف حويت أثره.',
    'صف مرافقة زميل في أول حادثة له.',
  ],
  rewrites: [
    {
      category: 'البنود الأساسية الناقصة في السيرة',
      gap: 'السيرة لا تُظهر مرتجعات ACH أو التسوية',
      before: 'دعمت عمليات الدفع والمطابقة.',
      after:
        'على دفتر عمليات مصرفية، اختصرت زمن المطابقة بنسبة 28% باستخدام SQL وLooker. السيرة لا تُظهر مرتجعات ACH أو التسوية؛ لا تضفها عند إعادة الصياغة.',
    },
    {
      category: 'البنود الأساسية الناقصة في السيرة',
      gap: 'السيرة لا تُظهر NACHA أو معالجاً مسمى',
      before: 'عملت مع الموردين على مشكلات الدفع.',
      after:
        'عملت مع الهندسة على ملفات استثناء وصلت متأخرة. السيرة لا تُظهر مسمى معالج أو NACHA؛ لا تضفه من عندك.',
    },
  ],
  rationale:
    'الهدف: $168K. نطاق Senior Business Analyst عن بُعد في الولايات المتحدة ~$145K–$190K؛ اختصار المطابقة 28% بـ SQL/Looker، وملكية مرتجعات ACH مجاورة فقط، فيبقى الرقم في منتصف النطاق.\nالسقف: $185K. لا نطاق Staff ولا عرض ثانٍ.\nالتركيبة: أساس $145K، نحو $12K سنوياً أسهماً، مكافأة $11K. الأسهم والمكافأة ليست حقوقاً تملكها السيرة.',
  buyer_seller:
    'الإعلان ما يزال منشوراً، فلصاحب العمل مقعد شاغر، لكن المصادر العامة لا تذكر موعد مباشرة أو تجميداً للتوظيف. من دون عرض منافس يمكنه الإبقاء على عرض أول في منتصف النطاق ومواصلة الفرز.\nالمطلب المثبت هو اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. ملكية مرتجعات ACH ليست في السيرة ولا يجوز معاملتها في التفاوض كنطاق منجز.',
  levelsTitle: 'Levels.fyi — Business Analyst',
  h1bWageTitle: 'بيانات أجور H-1B',
  culture: 'تصف المراجعات العامة ثقافة عمليات مكتوبة وصديقة للعمل عن بُعد، مع مواعيد قطع ضيقة.',
  labor_risk: 'مصادر العينة لا تذكر إجراءً عمالياً. عامل هذا كمجهول، لا كسجل نظيف.',
  layoff_risk: 'لا يوجد إخطار WARN في نافذة العينة. اسأل المسؤول إن تغيّر عدد عمليات التشغيل خلال السنة الماضية.',
  h1b: 'تُظهر إيداعات صاحب العمل H-1B في العينة لشركة Northstar Payments طلبات خلال السنوات الثلاث الماضية. الصفحة المذكورة لا تنشر معدل اختيار. الرعاية محتملة وغير مؤكدة. اسأل المسؤول قبل أن تعتمد عليها.',
  remote_sponsorship: 'يقول الإعلان إن العمل عن بُعد داخل الولايات المتحدة. لا يقول إن الشركة سترعى هذا المقعد.',
  role_reviews: 'يشيد المراجعون بعمق SQL ويشيرون إلى المناوبة أثناء حوادث التسوية.',
  company_pros: [
    'تصف المراجعات العامة ثقافة عمليات مكتوبة وصديقة للعمل عن بُعد.',
    'لا يظهر إخطار WARN في نافذة العينة.',
  ],
  company_cons: [
    'تصف المراجعات نفسها مواعيد قطع ضيقة.',
    'لا تذكر المصادر إجراءً عمالياً. هذا مجهول، وليس سجلاً نظيفاً.',
    'توجد إيداعات H-1B خلال السنوات الثلاث الماضية والصفحة المذكورة لا تنشر معدل اختيار. الرعاية غير مؤكدة. يقول الإعلان إن العمل عن بُعد داخل الولايات المتحدة ولا يقول إن هذا المقعد مَرعي.',
  ],
  role_pros: [
    'تشيد مراجعات هذا المقعد بعمق SQL الذي يطلبه الإعلان.',
    'تصف موعد قطع تسوية محدداً، لا دوراً عاماً للتعاون.',
  ],
  role_cons: [
    'المناوبة متوقعة أثناء حوادث التسوية.',
    'لا تصف المراجعات وتيرة الترقية لهذا المقعد. أكّد ذلك مع المسؤول.',
  ],
  roleSourceTitle: 'Glassdoor — تقييمات الدور',
  blindTitle: 'Blind — نقاشات العمليات',
  warnTitle: 'إشعارات DOL WARN',
  process:
    'فرز المسؤول، ثم حالة لدى مدير التوظيف عن فرق تسوية، ثم لجنة. تضع المشاركات في العينة الحلقة عند نحو ثلاثة أسابيع.',
  company_summary:
    'الثقافة: مراجعات تصف عمليات مكتوبة ومرنة للعمل عن بُعد مع مواعيد قطع ضيقة.\nالمخاطر: لا WARN في نافذة العينة؛ إيداعات H-1B موجودة ورعاية هذا المقعد غير مؤكدة.\nتأكيد: اسأل المسؤول عن عدد موظفي العمليات والتأشيرة.',
  questions_summary:
    'العملية: فرز المسؤول، حالة فرق تسوية، لجنة، نحو ثلاثة أسابيع.\nمهني: مرتجعات ACH والقطع وSQL.\nسلوكي: التحديث المكتوب وإخفاقات الفرق.',
  negotiate_summary:
    'الافتتاح: إجمالي $168K وأساس $145K، فقط باختصار المطابقة 28%.\nالسقف: $185K. لا نطاق Staff ولا عرض ثانٍ.\nمحظور: لا تخترع عرضاً منافساً ولا تستبدل الأساس بميزة لم تُعرض.',
  pay_strategy:
    'سمِّ الإجمالي أولاً، لا الأساس. الحقيقة الوحيدة التي تستطيع هذه السيرة إنفاقها هي اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. ملكية مرتجعات ACH ليست في السيرة، فلا تسعّر العرض كأن هذه الفجوة قد سُدّت.\nافتح عند إجمالي $168K: أساس $145K، ونحو $12K سنوياً من الأسهم، ومكافأة $11K. هذا منتصف النطاق، وهو ما يثبته هذا الدليل.\nإذا كان العرض عند قاع النطاق، أو أساساً فقط، فقدّم عرضاً مضاداً مرة واحدة وتوقف عند $185K. لا يوجد نطاق بمستوى Staff ولا عرض ثانٍ مكتوب، لذلك لا سند لما فوق $185K.\nلا تخترع عرضاً منافساً. الورقة هي نسبة 28% التي تحققت، وليست شركة أخرى.',
  benefits_strategy:
    'تحدث عن المزايا فقط بعد تسمية أساس $145K. لا تعكس هذا الترتيب.\nاطلب مرة واحدة أربعة بنود: مكافأة التوقيع، وتجديد الأسهم، وأيام العمل عن بُعد في الأسبوع، والإجازة. لا تجعلها أربعة عروض مضادة.\nالرعاية خارج هذا العرض المضاد. يقول الإعلان عملاً عن بُعد داخل الولايات المتحدة ولا يقول إن هذا المقعد مَرعي. اسأل المسؤول.\nلا تتنازل عن الأساس مقابل ميزة لم تُعرض. إذا طلبوا خفض $145K مقابل أيام عن بُعد أو إجازة، ارفض هذه المبادلة.',
  script:
    'ما أستطيع إظهاره هو اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. أقبل إجمالي $168K، والأساس فيه $145K. إذا لزم التحرك، فالسقف الذي يثبته هذا الدليل هو $185K.',
  company_questions:
    'هل يملك هذا المقعد مرتجعات ACH من اليوم الأول، أم تكفي خبرة التسوية؟\nمن يستلم تقرير زمن الدورة ومعدل الخطأ الشهري، وماذا يتوقع في أول 90 يوماً؟\nما وتيرة المناوبة أثناء حوادث التسوية، وما الذي تغطيه؟\nيقول الإعلان إن العمل عن بُعد داخل الولايات المتحدة ولا يذكر الرعاية. هل ترعى الشركة هذا المقعد؟\nبعد هذه المقابلة، من يدير الجولة التالية وماذا يقيّم؟',
  follow_up_email:
    'أرسِلها بعد المقابلة وقبل أن يبدأ الحديث عن الأرقام. إذا بدأت مناقشة الأجر، فاستخدم الجملة أعلاه ولا ترسل هذه الرسالة.\n\nالموضوع: شكر — Senior Business Analyst، Northstar Payments\n\nفريق التوظيف الكريم،\n\nشكراً لكم على الوقت اليوم للحديث عن مقعد Senior Business Analyst في عمليات الدفع.\n\nما أستطيع إثباته هو اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. لم أقدّم مرتجعات ACH كعمل كنت أديره من قبل.\n\nإذا كان المقعد يتطلب معالجة مرتجعات ACH بشكل مستقل من اليوم الأول، فأود تأكيد النطاق قبل جولة تالية.\n\nمع التحية،\n[اسمك]',
};

export const SAMPLE_GUIDE_NARRATIVE: Record<AppLanguage, SampleGuideNarrative> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  es,
  hi,
  ar,
};
