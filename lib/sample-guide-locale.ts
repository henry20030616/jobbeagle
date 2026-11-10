import type { AppLanguage } from '@/lib/report-language';
import type { GuideResumeRewrite } from '@/types';

/** Customer-facing Guide sample prose. One language per pack — no mixed sentences. */
export type SampleGuideNarrative = {
  professional: string[];
  behavioral: string[];
  rewrites: GuideResumeRewrite[];
  rationale: string;
  /** Four titled lines (company ×2, then candidate ×2). Same 短標題：gist shape as pay_strategy. */
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
    'How do you cut off a settlement file that is still posting after the SLA?',
    'What would you check if ACH origination volume dropped overnight?',
    'Walk me through how you would rebuild a returns aging report in SQL.',
    'How do you explain a Fed settlement miss to finance without a root cause yet?',
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
    'Tell me about covering a teammate’s queue during a cutoff week.',
    'Describe a time you had to redo a status pack the night before a review.',
    'When have you said no to a dashboard request that would have missed close?',
    'Tell me about learning a payment rail from a runbook instead of a manager.',
    'Describe how you handled an on-call ping that was not actually an incident.',
  ],
  rewrites: [
    {
      category: 'Adjustment advice',
      gap: 'ACH returns and settlement',
      before: 'Supported payment operations and reconciliation.',
      after: 'Cut reconciliation cycle time 28% with SQL and Looker; do not add ACH returns.',
    },
    {
      category: 'Adjustment advice',
      gap: 'NACHA and a named processor',
      before: 'Worked with vendors on payment issues.',
      after: 'Partnered with engineering on late exception files; do not add a processor or NACHA title.',
    },
  ],
  rationale:
    'Target total: $168K. US remote Senior Business Analyst band is about $145K–$190K; SQL/Looker cut reconciliation cycle time 28%, ACH returns ownership is only adjacent, so the number stays mid-band.\nNegotiation ceiling: $185K. No Staff-level scope and no second offer.\nPay structure: $145K base, about $12K a year of equity, $11K bonus. Equity and bonus are a target mix, not guaranteed or already-earned pay.',
  buyer_seller:
    'Seat still posted: The requisition is still posted, so the employer has an open seat to fill, but public sources cite no start deadline or hiring freeze.\nFirst-offer room: With no competing offer in play, they can hold a mid-band first offer and keep screening.\nResume proof: The evidenced ask is a 28% reconciliation cycle-time cut with SQL and Looker.\nScope not on resume: ACH returns ownership is not on the resume and cannot be treated as completed scope in negotiation.',
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
    'Culture: Public reviews describe a written, remote-friendly ops culture, but the same voices flag tight cutoffs — remote does not mean a loose pace. That is how the employer runs, not a quirk of one seat.\nOps risk: No WARN notice appears in the sample window, and sources cite no labor action. A missing layoff filing is not proof of stable headcount; a silent labor record is unknown, not clean.\nVisa and remote: The posting says US remote. Filings exist for the last three years, but the cited page publishes no selection rate and does not say this seat is sponsored. Remote and sponsorship are separate facts; the latter is unconfirmed.\nSeat vs posting: The posting asks for SQL depth and a defined settlement cutoff; role reviews describe the same line, not a vague collaboration job. The two accounts match — day one is returns, cutoff, and tie-out, run independently.\nDelivery: On-call is expected during settlement incidents. That is a cost of this seat, not a footnote on company culture; confirm rotation frequency and coverage with the recruiter before you start.\nConfirm: Promotion pace, last-year ops headcount, and whether this seat is sponsored are not settled on public pages. Ask the recruiter those three; do not infer them from a missing WARN or from H-1B filings.',
  questions_summary:
    'Hiring process: recruiter screen, hiring-manager settlement-break case, then a panel, about three weeks.\nProfessional analysis:\nData skill probe: The interview tests SQL and related data work\nThe professional round tests whether you can sequence an ACH returns queue against cutoff, and close a bank-file vs ledger break with SQL the next shift can defend.\n\nDay-one seat work: Returns, cutoff, and tie-out must run independently\nThat is day-one work on this Senior BA seat: returns, cutoff, and tie-out. The hiring-manager settlement-break case is built to see if you can run that line, not recite the acronyms.\n\nResume prep scope: Use the 28% SQL/Looker cycle-time cut; do not claim ACH returns\nPrepare by walking the resume’s 28% SQL/Looker cycle-time cut through one cutoff queue and one SQL close. ACH returns ownership is not on the resume — do not present it as completed scope.\nBehavioral analysis:\nWritten handoff: The interview tests whether a status can be acted on\nThe behavioral round tests whether a written status can be acted on, and how you recover when a cross-team miss hits cutoff.\n\nRemote written ops: A vague update is a missed cutoff\nThis ops seat is remote and written; a vague update is a missed cutoff, and a cross-team miss lands on settlement.\n\nSTAR prep: Two STARs from resume facts only — written status and a cross-team miss\nPrepare two STARs from resume facts only: one written update that changed a decision, and one cross-team miss after which you changed a process. Do not invent the story.',
  negotiate_summary:
    'Suggested quote: $168K total, $145K base, using only the 28% reconciliation cycle-time proof.\nNegotiation ceiling: $185K. No Staff scope and no second offer.\nWalk-away line: do not invent a competing bid, and do not trade base for a benefit the employer did not offer.',
  pay_strategy:
    'Lead with total: not the base. The only fact this resume can spend is a 28% reconciliation cycle-time cut with SQL and Looker. ACH returns ownership is not on the resume, so do not price the offer as if that gap were closed.\nPay structure: $168K total — $145K base, about $12K a year of equity, and an $11K bonus. That is the middle of the band, which is what this proof supports.\nConcession pace: if the offer is the floor of the band, or base only, counter once and stop at $185K. There is no Staff scope and no second written offer, so nothing above $185K has a basis.\nDo not match bids: do not invent a competing offer. The leverage is the 28% already delivered, not another company.',
  benefits_strategy:
    'Lock base first: talk benefits only after the $145K base is named. Do not reverse that order.\nAsk package once: sign-on, an equity refresh, remote days per week, and PTO. Do not turn them into four separate counters.\nVisa separately: sponsorship stays out of this counter. The posting says US remote and does not say this seat is sponsored. Ask the recruiter.\nDo not trade base: do not give up base for a benefit the employer did not offer. If they ask to cut the $145K in exchange for remote days or PTO, refuse that trade.',
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
      category: '調整建議',
      gap: 'ACH 退票與清算',
      before: '支援支付營運與對帳。',
      after: '用 SQL 與 Looker 把對帳週期縮短 28%；不要補上 ACH 退票。',
    },
    {
      category: '調整建議',
      gap: 'NACHA 與支付處理商',
      before: '與供應商處理支付問題。',
      after: '與工程處理遲到的例外檔；不要加上 NACHA 或處理商職稱。',
    },
  ],
  rationale:
    '目標總酬：$168K。美國遠端 Senior Business Analyst 市場帶約 $145K–$190K；履歷可證 SQL／Looker 將對帳週期縮短 28%，ACH 退票僅相鄰，故不站上緣。\n議價上限：$185K。沒有 Staff 級範圍，也沒有第二份 offer。\n薪酬結構：底薪 $145K、股票約 $12K／年、獎金 $11K。股票與獎金為目標總薪酬的結構拆分，實際以錄取條件為準。',
  buyer_seller:
    '招募狀態：職缺仍在公開招募，雇主有補位需求，但公開來源未顯示到職時程或人力緊縮。\n首報空間：在沒有第二份競爭 offer 的情況下，雇主可維持中帶首報、繼續篩選。\n履歷證據：履歷可主張的證據是以 SQL 與 Looker 將對帳週期縮短 28%。\n範圍未記載：ACH 退票職責未記載於履歷，不得在談判中列為已完成的工作範圍。',
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
    '文化：公開評價把雇主寫成重視書面溝通、可遠端的營運文化，但同一批聲音把截止時間寫得很緊——遠端不等於節奏鬆。這是公司層的運作方式，不是單一職位的例外。\n營運風險：範例區間沒有 WARN 裁員通知，來源也沒有引用勞資行動。沒有裁員通知不等於人力穩定；缺席的勞資紀錄應視為未知，不是清白。\n簽證與遠端：職缺寫美國可遠端，近三年有 H-1B 申請，但所引頁面沒有公布抽籤率，也沒有寫這個位子會贊助。遠端與贊助是兩件事，後者尚未確認。\n職位對照：職缺要 SQL 深度與明確的清算截止，這個位子的公開評價也把工作寫成這條線，而不是空泛協作。兩邊對得上，第一天就要能獨立跑退票、截止與對帳。\n交付節奏：評價指出清算事故期間需要待命。這是這個位子的交付成本，不是公司文化的附帶說明；上任前要問待命頻率與範圍。\n待確認：晉升節奏、過去一年營運人力、以及這個位子是否贊助，公開頁面都沒有落實。這三題問招募，不要從缺席的 WARN 或 H-1B 申請自行推論。',
  questions_summary:
    '招募流程：招募篩選、用人主管清算差異案例、小組面試，約三週。\n專業題分析：\n數據專業要求：面試重點考察 SQL 等數據能力\n面試在測截止前如何排列 ACH 退票佇列，以及銀行檔與帳本不一致時，如何用 SQL 核到下一班接得走。\n\n職位第一天工作：第一天就是退票、截止與對帳\n這份 Senior BA 職位第一天的工作就是退票、截止與對帳；用人主管的清算差異案例就是在看這條線能不能獨立做。\n\n履歷準備範圍：用履歷已有的 SQL／Looker 對帳週期縮短 28% 來準備\n準備時用履歷已有的 SQL／Looker 對帳週期縮短 28%，走完一筆截止佇列與一次核對。ACH 退票職責不在履歷上，不要講成已完成的範圍。\n行為題分析：\n書面狀態交接：面試重點考察狀態能不能讓別人接著做\n面試在測書面狀態能不能讓別人接著做，以及跨團隊失誤撞上截止時，你怎麼收斂、事後改了什麼。\n\n遠端書面營運：狀態寫不清楚就等於錯過截止\n這份營運工作是遠端、靠書面交接；狀態寫不清楚就等於錯過截止，跨團隊失誤會直接打到清算。\n\nSTAR 準備：準備書面狀態與跨團隊失誤兩則，只用履歷事實\n準備兩則 STAR：一則是書面狀態改變決策，一則是跨團隊失誤後你改了流程——只使用履歷事實，不要編造。',
  negotiate_summary:
    '建議報價：總薪酬 $168K，底薪 $145K，依據是對帳週期縮短 28%。\n議價上限：$185K。沒有 Staff 範圍，也沒有第二份 offer。\n談判底線：不要編競爭方案，也不用底薪去換對方沒提出的福利。',
  pay_strategy:
    '先報總酬：不要先報底薪。這份履歷能拿來談的證據只有一項：用 SQL 與 Looker 把對帳週期縮短 28%。履歷沒有 ACH 退票職責，不能把這個缺口說成已經補上，拿來抬價。\n薪酬結構：$168K 總薪酬，底薪 $145K、股票約 $12K／年、獎金 $11K。這是市場帶的中段，對得上履歷能證明的範圍。\n讓步節奏：對方若開在帶的底部，或只給底薪、不給股票與獎金，只還價一次，停在 $185K。沒有 Staff 級範圍，也沒有第二份書面 offer，再往上沒有依據。\n勿跟競價：沒有書面競爭方案就不要編。依據是已經發生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪先鎖：底薪 $145K 講定之後才談福利。順序不要反過來。\n福利一次問清：簽約金、股票增授、每週遠端天數、帶薪假。不要拆成四次還價。\n簽證另議：簽證贊助不進這次還價。職缺只寫美國可遠端，沒有寫會贊助這個位子。這題問招募。\n底薪不換：對方沒有提出的福利，不要用降低底薪去換。若對方要求把 $145K 降下來換遠端或休假，拒絕這筆交換。',
  script:
    '我能證明的是，用 SQL 與 Looker 把對帳週期縮短 28%。我接受總薪酬 $168K，其中底薪 $145K。若還要移動，這項證明能站住的上限是 $185K。',
  company_questions:
    '這個職位第一天就要獨立負責 ACH 退票，還是有清算經驗即可？\n每月的對帳週期與錯誤率，是向哪一位營運主管報告，前 90 天要交出什麼？\n清算事故的待命頻率與範圍是什麼？\n職缺寫的是美國可遠端，沒有寫簽證贊助。這個位子會贊助嗎？\n這一面試之後，下一關由誰進行、看的是什麼？',
  follow_up_email:
    '面試結束、對方還沒開始談薪資時寄。已經在談數字，就用上面的開場講稿，不要再寄這封。\n\n主旨：Senior Business Analyst 面試後續 — Northstar Payments\n\n您好：\n\n感謝您今天撥冗面試 Senior Business Analyst（支付營運）一職。\n\n履歷上能證明的，是以 SQL 與 Looker 把對帳週期縮短 28%。我沒有把 ACH 退票說成已經負責過。\n\n若這個位子第一天就要獨立處理退票，希望能再確認一次工作範圍。\n\n此致\n[您的姓名]',
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
      category: '调整建议',
      gap: 'ACH 退票与清算',
      before: '支持支付运营与对账。',
      after: '用 SQL 与 Looker 把对账周期缩短 28%；不要补上 ACH 退票。',
    },
    {
      category: '调整建议',
      gap: 'NACHA 与支付处理商',
      before: '与供应商处理支付问题。',
      after: '与工程处理迟到的例外档；不要加上 NACHA 或处理商职称。',
    },
  ],
  rationale:
    '目标总酬：$168K。美国远程 Senior Business Analyst 市场带约 $145K–$190K；简历可证 SQL／Looker 将对账周期缩短 28%，ACH 退票仅相邻，故不站上沿。\n议价上限：$185K。没有 Staff 级范围，也没有第二份 offer。\n薪酬结构：底薪 $145K、股票约 $12K／年、奖金 $11K。股票与奖金为目标总薪酬的结构拆分，实际以录取条件为准。',
  buyer_seller:
    '招聘状态：职位仍在公开招聘，雇主有补位需求，但公开来源未显示到职时程或人力紧缩。\n首报空间：在没有第二份竞争 offer 的情况下，雇主可维持中带首报、继续筛选。\n简历证据：简历可主张的证据是以 SQL 与 Looker 将对账周期缩短 28%。\n范围未记载：ACH 退票职责未记载于简历，不得在谈判中列为已完成的工作范围。',
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
    '文化：公开评价把雇主写成重视书面沟通、可远程的运营文化，但同一批声音把截止时间写得很紧——远程不等于节奏松。这是公司层的运作方式，不是单一职位的例外。\n运营风险：示例区间没有 WARN 裁员通知，来源也没有引用劳资行动。没有裁员通知不等于人力稳定；缺席的劳资纪录应视为未知，不是清白。\n签证与远程：职位写美国可远程，近三年有 H-1B 申请，但所引页面没有公布抽签率，也没有写这个位子会赞助。远程与赞助是两件事，后者尚未确认。\n职位对照：职位要 SQL 深度与明确的清算截止，这个位子的公开评价也把工作写成这条线，而不是空泛协作。两边对得上，第一天就要能独立跑退票、截止与对账。\n交付节奏：评价指出清算事故期间需要待命。这是这个位子的交付成本，不是公司文化的附带说明；上任前要问待命频率与范围。\n待确认：晋升节奏、过去一年运营人力、以及这个位子是否赞助，公开页面都没有落实。这三题问招聘，不要从缺席的 WARN 或 H-1B 申请自行推论。',
  questions_summary:
    '招聘流程：招聘筛选、用人主管清算差异案例、小组面试，约三周。\n专业题分析：\n数据专业要求：面试重点考察 SQL 等数据能力\n面试在测截止前如何排列 ACH 退票队列，以及银行档与账本不一致时，如何用 SQL 核到下一班接得走。\n\n职位第一天工作：第一天就是退票、截止与对账\n这份 Senior BA 职位第一天的工作就是退票、截止与对账；用人主管的清算差异案例就是在看这条线能不能独立做。\n\n简历准备范围：用简历已有的 SQL／Looker 对账周期缩短 28% 来准备\n准备时用简历已有的 SQL／Looker 对账周期缩短 28%，走完一笔截止队列与一次核对。ACH 退票职责不在简历上，不要讲成已完成的范围。\n行为题分析：\n书面状态交接：面试重点考察状态能不能让别人接着做\n面试在测书面状态能不能让别人接着做，以及跨团队失误撞上截止时，你怎么收敛、事后改了什么。\n\n远程书面运营：状态写不清楚就等于错过截止\n这份运营工作是远程、靠书面交接；状态写不清楚就等于错过截止，跨团队失误会直接打到清算。\n\nSTAR 准备：准备书面状态与跨团队失误两则，只用简历事实\n准备两则 STAR：一则是书面状态改变决策，一则是跨团队失误后你改了流程——只使用简历事实，不要编造。',
  negotiate_summary:
    '建议报价：总薪酬 $168K，底薪 $145K，依据是对账周期缩短 28%。\n议价上限：$185K。没有 Staff 范围，也没有第二份 offer。\n谈判底线：不要编竞争方案，也不用底薪去换对方没提出的福利。',
  pay_strategy:
    '先报总酬：不要先报底薪。这份简历能拿来谈的证据只有一项：用 SQL 与 Looker 把对账周期缩短 28%。简历没有 ACH 退票职责，不能把这个缺口说成已经补上，拿来抬价。\n薪酬结构：$168K 总薪酬，底薪 $145K、股票约 $12K／年、奖金 $11K。这是市场带的中段，对得上简历能证明的范围。\n让步节奏：对方若开在带的底部，或只给底薪、不给股票与奖金，只还价一次，停在 $185K。没有 Staff 级范围，也没有第二份书面 offer，再往上没有依据。\n勿跟竞价：没有书面竞争方案就不要编。依据是已经发生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪先锁：底薪 $145K 讲定之后才谈福利。顺序不要反过来。\n福利一次问清：签约金、股票增授、每周远程天数、带薪假。不要拆成四次还价。\n签证另议：签证赞助不进这次还价。职位只写美国可远程，没有写会赞助这个位子。这题问招聘。\n底薪不换：对方没有提出的福利，不要用降低底薪去换。若对方要求把 $145K 降下来换远程或休假，拒绝这笔交换。',
  script:
    '我能证明的是，用 SQL 与 Looker 把对账周期缩短 28%。我接受总薪酬 $168K，其中底薪 $145K。若还要移动，这项证明能站住的上限是 $185K。',
  company_questions:
    '这个职位第一天就要独立负责 ACH 退票，还是有清算经验即可？\n每月的对账周期与错误率，是向哪一位运营主管报告，前 90 天要交出什么？\n清算事故的待命频率与范围是什么？\n职位写的是美国可远程，没有写签证赞助。这个位子会赞助吗？\n这一轮面试之后，下一关由谁进行、看的是什么？',
  follow_up_email:
    '面试结束、对方还没开始谈薪酬时寄。已经在谈数字，就用上面的开场讲稿，不要再寄这封。\n\n主旨：Senior Business Analyst 面试后续 — Northstar Payments\n\n您好：\n\n感谢您今天拨冗面试 Senior Business Analyst（支付运营）一职。\n\n简历上能证明的，是以 SQL 与 Looker 把对账周期缩短 28%。我没有把 ACH 退票说成已经负责过。\n\n若这个位子第一天就要独立处理退票，希望能再确认一次工作范围。\n\n此致\n[您的姓名]',
};




export const SAMPLE_GUIDE_NARRATIVE: Record<AppLanguage, SampleGuideNarrative> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
};
