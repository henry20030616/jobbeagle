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
  pay_strategy: string;
  benefits_strategy: string;
  script: string;
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
      gap: 'ACH returns ownership is not named',
      before: 'Supported payment operations and reconciliation.',
      after:
        'Cut reconciliation cycle time 28% with SQL and Looker on a banking-ops book. ACH returns ownership is not on this resume.',
    },
    {
      gap: 'NACHA and processor ownership are unnamed',
      before: 'Worked with vendors on payment issues.',
      after:
        'Partnered with engineering on late exception files. Do not add a processor or NACHA title that the resume does not show.',
    },
  ],
  rationale:
    'The target sits at $168K because a US remote Senior Business Analyst band is about $145K–$190K. The resume can prove a 28% reconciliation cycle-time cut with SQL and Looker, but ACH returns ownership is only adjacent, so the number stays mid-band. The ceiling stops at $185K: there is no Staff-level scope and no second offer to push past it. Base $145K, about $12K a year of equity, and an $11K bonus are what add up to $168K. Equity and bonus are not items the resume already holds, so they are not existing rights.',
  buyer_seller:
    'The company: this seat is still open, so they need someone and they can also keep waiting.\nYou: the resume fact you can use is a 28% reconciliation cycle-time cut with SQL and Looker.\nDo not use this: ACH returns ownership is not on the resume, so do not talk as if you already did that work.',
  levelsTitle: 'Levels sample',
  h1bWageTitle: 'H-1B wage sample',
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
  roleSourceTitle: 'Glassdoor role sample',
  blindTitle: 'Blind sample',
  warnTitle: 'WARN sample',
  process:
    'Recruiter screen, hiring-manager case on a settlement break, then a panel. Sample shares put the loop at about three weeks.',
  pay_strategy:
    'Name the total first, not the base. The only fact this resume can spend is a 28% reconciliation cycle-time cut with SQL and Looker. ACH returns ownership is not on the resume, so do not price the offer as if that gap were closed.\nOpen at $168K total: $145K base, about $12K a year of equity, and an $11K bonus. That is the middle of the band, which is what this proof supports.\nIf the offer is the floor of the band, or base only, counter once and stop at $185K. There is no Staff scope and no second written offer, so nothing above $185K has a basis.\nDo not invent a competing offer. The leverage is the 28% already delivered, not another company.',
  benefits_strategy:
    'Talk benefits only after the $145K base is named. Do not reverse that order.\nAsk once, for four items: sign-on, an equity refresh, remote days per week, and PTO. Do not turn them into four separate counters.\nSponsorship stays out of this counter. The posting says US remote and does not say this seat is sponsored. Ask the recruiter.\nDo not give up base for a benefit the employer did not offer. If they ask to cut the $145K in exchange for remote days or PTO, refuse that trade.',
  script:
    'The work I can show is a 28% reconciliation cycle-time cut with SQL and Looker. I can accept $168K total, with base at $145K. If we need to move, the ceiling that proof can support is $185K.',
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
      gap: '履歷沒有寫出 ACH 退票擁有權',
      before: '支援支付營運與對帳。',
      after: '在銀行營運帳上，用 SQL 與 Looker 把對帳週期縮短 28%。這份履歷沒有 ACH 退票擁有權，改寫時不要補上。',
    },
    {
      gap: '履歷沒有寫出 NACHA 與處理商擁有權',
      before: '與供應商處理支付問題。',
      after: '與工程一起處理遲到的例外檔。履歷沒有處理商或 NACHA 職稱，不要自行加上。',
    },
  ],
  rationale:
    '目標價放在 $168K，是因為這席在美國、可遠端的 Senior Business Analyst 市場帶大約 $145K–$190K。履歷能證明的是 SQL／Looker 把對帳週期縮短 28%，但 ACH 退票擁有權只是相鄰經驗，所以不站到帶的上緣。天花板停在 $185K：沒有 Staff 級範圍，也沒有第二份 offer 可以再往上推。底薪 $145K、股票約 $12K／年、獎金 $11K 加總才是 $168K；股票和獎金不是履歷已經拿到的項目，不能把它們說成既有權利。',
  buyer_seller:
    '公司這邊：這個位子還沒補上，所以他們需要人，也可以繼續等。\n你這邊：履歷上能拿出來的，是用 SQL 與 Looker 把對帳週期縮短 28%。\n不能拿來談的：履歷沒有 ACH 退票擁有權，不要把這項說成已經做到。',
  levelsTitle: 'Levels 範例',
  h1bWageTitle: 'H-1B 薪資範例',
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
  roleSourceTitle: 'Glassdoor 職位評價範例',
  blindTitle: 'Blind 範例',
  warnTitle: 'WARN 範例',
  process: '招募篩選、用人主管的清算差異案例，然後是小組面試。範例分享把整段流程放在大約三週。',
  pay_strategy:
    '先報總薪酬，不要先報底薪。這份履歷能拿來談的證據只有一項：用 SQL 與 Looker 把對帳週期縮短 28%。履歷沒有 ACH 退票擁有權，不能把這個缺口說成已經補上，拿來抬價。\n開價 $168K 總薪酬：底薪 $145K、股票約 $12K／年、獎金 $11K。這是市場帶的中段，對得上履歷能證明的範圍。\n對方若開在帶的底部，或只給底薪、不給股票與獎金，只還價一次，停在 $185K。沒有 Staff 級範圍，也沒有第二份書面 offer，再往上沒有依據。\n沒有書面競爭方案就不要編。籌碼是已經發生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪 $145K 講定之後才談福利。順序不要反過來。\n一次問完四項：簽約金、股票增授、每週遠端天數、帶薪假。不要拆成四次還價。\n簽證贊助不進這次還價。職缺只寫美國可遠端，沒有寫會贊助這個位子。這題問招募。\n對方沒有提出的福利，不要用降低底薪去換。若對方要求把 $145K 降下來換遠端或休假，拒絕這筆交換。',
  script:
    '我能證明的是，用 SQL 與 Looker 把對帳週期縮短 28%。我接受總薪酬 $168K，其中底薪 $145K。若還要移動，這項證明能站住的上限是 $185K。',
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
      gap: '简历没有写出 ACH 退票所有权',
      before: '支持支付运营与对账。',
      after: '在银行运营账上，用 SQL 与 Looker 把对账周期缩短 28%。这份简历没有 ACH 退票所有权，改写时不要补上。',
    },
    {
      gap: '简历没有写出 NACHA 与处理商所有权',
      before: '与供应商处理支付问题。',
      after: '与工程一起处理迟到的例外档。简历没有处理商或 NACHA 职称，不要自行加上。',
    },
  ],
  rationale:
    '目标价放在 $168K，是因为这席在美国、可远程的 Senior Business Analyst 市场带大约 $145K–$190K。履历能证明的是 SQL／Looker 把对账周期缩短 28%，但 ACH 退票所有权只是相邻经验，所以不站到带的上沿。天花板停在 $185K：没有 Staff 级范围，也没有第二份 offer 可以再往上推。底薪 $145K、股票约 $12K／年、奖金 $11K 加总才是 $168K；股票和奖金不是履历已经拿到的项目，不能把它们说成既有权利。',
  buyer_seller:
    '公司这边：这个位子还没补上，所以他们需要人，也可以继续等。\n你这边：简历上能拿出来的，是用 SQL 与 Looker 把对账周期缩短 28%。\n不能拿来谈的：简历没有 ACH 退票所有权，不要把这项说成已经做到。',
  levelsTitle: 'Levels 示例',
  h1bWageTitle: 'H-1B 薪资示例',
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
  roleSourceTitle: 'Glassdoor 职位评价示例',
  blindTitle: 'Blind 示例',
  warnTitle: 'WARN 示例',
  process: '招聘筛选、用人主管的清算差异案例，然后是小组面试。示例分享把整段流程放在大约三周。',
  pay_strategy:
    '先报总薪酬，不要先报底薪。这份简历能拿来谈的证据只有一项：用 SQL 与 Looker 把对账周期缩短 28%。简历没有 ACH 退票所有权，不能把这个缺口说成已经补上，拿来抬价。\n开价 $168K 总薪酬：底薪 $145K、股票约 $12K／年、奖金 $11K。这是市场带的中段，对得上简历能证明的范围。\n对方若开在带的底部，或只给底薪、不给股票与奖金，只还价一次，停在 $185K。没有 Staff 级范围，也没有第二份书面 offer，再往上没有依据。\n没有书面竞争方案就不要编。筹码是已经发生的 28%，不是另一家公司。',
  benefits_strategy:
    '底薪 $145K 讲定之后才谈福利。顺序不要反过来。\n一次问完四项：签约金、股票增授、每周远程天数、带薪假。不要拆成四次还价。\n签证赞助不进这次还价。职位只写美国可远程，没有写会赞助这个位子。这题问招聘。\n对方没有提出的福利，不要用降低底薪去换。若对方要求把 $145K 降下来换远程或休假，拒绝这笔交换。',
  script:
    '我能证明的是，用 SQL 与 Looker 把对账周期缩短 28%。我接受总薪酬 $168K，其中底薪 $145K。若还要移动，这项证明能站住的上限是 $185K。',
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
      gap: 'El CV no nombra la propiedad de las devoluciones ACH',
      before: 'Apoyé operaciones de pago y conciliación.',
      after:
        'En un libro de operaciones bancarias, reduje el ciclo de conciliación un 28% con SQL y Looker. Este CV no tiene propiedad de devoluciones ACH; no la añadas al reescribir.',
    },
    {
      gap: 'El CV no nombra la propiedad de NACHA ni del procesador',
      before: 'Trabajé con proveedores en incidencias de pago.',
      after:
        'Trabajé con ingeniería en archivos de excepción que llegaron tarde. El CV no muestra un cargo de procesador ni de NACHA; no lo añadas.',
    },
  ],
  rationale:
    'El objetivo queda en $168K porque la banda de un Senior Business Analyst remoto en Estados Unidos ronda $145K–$190K. El CV puede probar un recorte del 28% en el ciclo de conciliación con SQL y Looker, pero la propiedad de devoluciones ACH solo es adyacente, así que el número se queda a mitad de banda. El techo para en $185K: no hay alcance de nivel Staff ni una segunda oferta para subir más. La base de $145K, unos $12K al año en acciones y un bono de $11K son lo que suma $168K. Las acciones y el bono no son derechos que el CV ya tenga.',
  buyer_seller:
    'La empresa: el puesto sigue abierto, así que necesitan a alguien y también pueden seguir esperando.\nTú: el hecho del CV que puedes usar es un recorte del 28% en el ciclo de conciliación con SQL y Looker.\nNo uses esto: la propiedad de devoluciones ACH no está en el CV, así que no hables como si ya hubieras hecho ese trabajo.',
  levelsTitle: 'Muestra de Levels',
  h1bWageTitle: 'Muestra salarial H-1B',
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
  roleSourceTitle: 'Muestra de reseñas del puesto',
  blindTitle: 'Muestra de Blind',
  warnTitle: 'Muestra de WARN',
  process:
    'Filtro del reclutador, caso del responsable de contratación sobre una diferencia de liquidación y después un panel. Las muestras sitúan el proceso en unas tres semanas.',
  pay_strategy:
    'Nombra primero el total, no la base. El único hecho que este CV puede usar es un recorte del 28% en el ciclo de conciliación con SQL y Looker. La propiedad de devoluciones ACH no está en el CV, así que no pongas precio como si esa brecha ya estuviera cerrada.\nAbre en $168K de total: base $145K, unos $12K al año en acciones y un bono de $11K. Es el medio de la banda, que es lo que esta prueba sostiene.\nSi la oferta está en el suelo, o es solo base, contraoferta una vez y para en $185K. No hay alcance de nivel Staff ni una segunda oferta por escrito, así que por encima de $185K no hay base.\nNo inventes una oferta competidora. La palanca es el 28% ya entregado, no otra empresa.',
  benefits_strategy:
    'Habla de beneficios solo después de nombrar la base de $145K. No inviertas ese orden.\nPide una sola vez cuatro cosas: prima de firma, ampliación de acciones, días remotos por semana y vacaciones. No las conviertas en cuatro contraofertas.\nEl patrocinio queda fuera de esta contraoferta. El anuncio dice remoto en Estados Unidos y no dice que este puesto esté patrocinado. Pregúntalo al reclutador.\nNo entregues la base a cambio de un beneficio que no te hayan ofrecido. Si piden bajar los $145K a cambio de remoto o vacaciones, rechaza ese canje.',
  script:
    'Lo que puedo mostrar es un recorte del 28% en el ciclo de conciliación con SQL y Looker. Acepto $168K de total, con base de $145K. Si hay que moverse, el techo que esa prueba sostiene es $185K.',
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
      gap: 'रिज़्यूमे में ACH रिटर्न की मालिकी नहीं लिखी',
      before: 'भुगतान संचालन और मिलान में सहयोग किया।',
      after:
        'बैंकिंग संचालन की किताब पर SQL और Looker से मिलान चक्र 28% छोटा किया। इस रिज़्यूमे में ACH रिटर्न की मालिकी नहीं है; पुनर्लेखन में इसे जोड़ें नहीं।',
    },
    {
      gap: 'रिज़्यूमे में NACHA और प्रोसेसर की मालिकी नहीं लिखी',
      before: 'भुगतान समस्याओं पर विक्रेताओं के साथ काम किया।',
      after:
        'देर से आई अपवाद फ़ाइलों पर इंजीनियरिंग के साथ काम किया। रिज़्यूमे में प्रोसेसर या NACHA का पद नहीं है; इसे स्वयं न जोड़ें।',
    },
  ],
  rationale:
    'लक्ष्य $168K पर है क्योंकि अमेरिका में दूरस्थ Senior Business Analyst की पट्टी लगभग $145K–$190K है। रिज़्यूमे SQL और Looker से मिलान चक्र में 28% की कमी साबित कर सकता है, पर ACH रिटर्न की मालिकी केवल आसन्न है, इसलिए संख्या पट्टी के बीच में रहती है। छत $185K पर रुकती है: Staff स्तर का दायरा नहीं है और ऊपर धकेलने के लिए दूसरा ऑफ़र नहीं है। आधार $145K, लगभग $12K प्रति वर्ष इक्विटी और $11K बोनस मिलकर $168K बनते हैं। इक्विटी और बोनस रिज़्यूमे के मौजूदा अधिकार नहीं हैं।',
  buyer_seller:
    'कंपनी: यह सीट अभी खाली है, इसलिए उन्हें किसी की ज़रूरत है और वे इंतज़ार भी कर सकते हैं।\nआप: रिज़्यूमे पर जो तथ्य इस्तेमाल कर सकते हैं, वह SQL और Looker से मिलान चक्र में 28% की कमी है।\nइसे बातचीत में न लाएँ: रिज़्यूमे में ACH रिटर्न की मालिकी नहीं है, इसलिए ऐसा न कहें कि यह काम आप कर चुके हैं।',
  levelsTitle: 'Levels नमूना',
  h1bWageTitle: 'H-1B वेतन नमूना',
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
  roleSourceTitle: 'पद समीक्षा नमूना',
  blindTitle: 'Blind नमूना',
  warnTitle: 'WARN नमूना',
  process:
    'भर्तीकर्ता की जाँच, सेटलमेंट अंतर पर नियुक्ति प्रबंधक का केस, फिर पैनल। नमूना साझाकरण पूरी प्रक्रिया को लगभग तीन सप्ताह मानते हैं।',
  pay_strategy:
    'पहले कुल बताएँ, आधार नहीं। यह रिज़्यूमे केवल एक तथ्य खर्च कर सकता है: SQL और Looker से मिलान चक्र में 28% की कमी। ACH रिटर्न की मालिकी रिज़्यूमे में नहीं है, इसलिए इस अंतर को भरा हुआ मानकर दाम न लगाएँ।\n$168K कुल पर खोलें: आधार $145K, प्रति वर्ष लगभग $12K इक्विटी, बोनस $11K। यह पट्टी का मध्य है, जितना यह प्रमाण संभालता है।\nअगर ऑफ़र पट्टी के निचले सिरे पर है, या केवल आधार है, तो एक बार प्रतिप्रस्ताव दें और $185K पर रुकें। Staff दायरा नहीं है और दूसरा लिखित ऑफ़र नहीं है, इसलिए $185K से ऊपर का आधार नहीं है।\nप्रतिस्पर्धी ऑफ़र गढ़ें नहीं। लाभ वह 28% है जो हो चुका है, कोई दूसरी कंपनी नहीं।',
  benefits_strategy:
    'लाभ की बात $145K आधार तय होने के बाद करें। क्रम उलटा न करें।\nएक बार में चार चीज़ें माँगें: साइन-ऑन, इक्विटी वृद्धि, प्रति सप्ताह दूरस्थ दिन, और छुट्टी। इन्हें चार अलग प्रतिप्रस्ताव न बनाएँ।\nप्रायोजन इस प्रतिप्रस्ताव में नहीं आता। विज्ञापन अमेरिका में दूरस्थ कहता है और इस सीट का प्रायोजन नहीं कहता। यह भर्तीकर्ता से पूछें।\nजो लाभ नियोक्ता ने नहीं दिया, उसके बदले आधार न दें। अगर वे दूरस्थ दिन या छुट्टी के लिए $145K घटाना चाहें, तो यह विनिमय अस्वीकार करें।',
  script:
    'जो मैं दिखा सकता हूँ, वह SQL और Looker से मिलान चक्र में 28% की कमी है। मैं कुल $168K स्वीकार करता हूँ, जिसमें आधार $145K है। अगर हिलना हो, तो इस प्रमाण की ऊपरी सीमा $185K है।',
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
      gap: 'السيرة لا تذكر ملكية مرتجعات ACH',
      before: 'دعمت عمليات الدفع والمطابقة.',
      after:
        'على دفتر عمليات مصرفية، اختصرت زمن المطابقة بنسبة 28% باستخدام SQL وLooker. هذه السيرة لا تتضمن ملكية مرتجعات ACH؛ لا تضفها عند إعادة الصياغة.',
    },
    {
      gap: 'السيرة لا تذكر ملكية NACHA أو المعالج',
      before: 'عملت مع الموردين على مشكلات الدفع.',
      after:
        'عملت مع الهندسة على ملفات استثناء وصلت متأخرة. السيرة لا تُظهر مسمى معالج أو NACHA؛ لا تضفه من عندك.',
    },
  ],
  rationale:
    'الهدف عند $168K لأن نطاق Senior Business Analyst عن بُعد في الولايات المتحدة يقارب $145K–$190K. تستطيع السيرة إثبات اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker، لكن ملكية مرتجعات ACH مجاورة فقط، لذلك يبقى الرقم في منتصف النطاق. يتوقف السقف عند $185K: لا يوجد نطاق بمستوى Staff ولا عرض ثانٍ للدفع أعلى. الأساس $145K ونحو $12K سنوياً من الأسهم ومكافأة $11K هي ما يجمع $168K. الأسهم والمكافأة ليست حقوقاً تملكها السيرة أصلاً.',
  buyer_seller:
    'الشركة: المقعد ما يزال شاغراً، فهم بحاجة إلى شخص ويمكنهم أيضاً مواصلة الانتظار.\nأنت: الحقيقة التي تستطيع استخدامها من السيرة هي اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker.\nلا تستخدم هذا: ملكية مرتجعات ACH ليست في السيرة، فلا تتحدث كأنك أنجزت هذا العمل.',
  levelsTitle: 'عينة Levels',
  h1bWageTitle: 'عينة أجر H-1B',
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
  roleSourceTitle: 'عينة تقييم الدور',
  blindTitle: 'عينة Blind',
  warnTitle: 'عينة WARN',
  process:
    'فرز المسؤول، ثم حالة لدى مدير التوظيف عن فرق تسوية، ثم لجنة. تضع المشاركات في العينة الحلقة عند نحو ثلاثة أسابيع.',
  pay_strategy:
    'سمِّ الإجمالي أولاً، لا الأساس. الحقيقة الوحيدة التي تستطيع هذه السيرة إنفاقها هي اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. ملكية مرتجعات ACH ليست في السيرة، فلا تسعّر العرض كأن هذه الفجوة قد سُدّت.\nافتح عند إجمالي $168K: أساس $145K، ونحو $12K سنوياً من الأسهم، ومكافأة $11K. هذا منتصف النطاق، وهو ما يثبته هذا الدليل.\nإذا كان العرض عند قاع النطاق، أو أساساً فقط، فقدّم عرضاً مضاداً مرة واحدة وتوقف عند $185K. لا يوجد نطاق بمستوى Staff ولا عرض ثانٍ مكتوب، لذلك لا سند لما فوق $185K.\nلا تخترع عرضاً منافساً. الورقة هي نسبة 28% التي تحققت، وليست شركة أخرى.',
  benefits_strategy:
    'تحدث عن المزايا فقط بعد تسمية أساس $145K. لا تعكس هذا الترتيب.\nاطلب مرة واحدة أربعة بنود: مكافأة التوقيع، وتجديد الأسهم، وأيام العمل عن بُعد في الأسبوع، والإجازة. لا تجعلها أربعة عروض مضادة.\nالرعاية خارج هذا العرض المضاد. يقول الإعلان عملاً عن بُعد داخل الولايات المتحدة ولا يقول إن هذا المقعد مَرعي. اسأل المسؤول.\nلا تتنازل عن الأساس مقابل ميزة لم تُعرض. إذا طلبوا خفض $145K مقابل أيام عن بُعد أو إجازة، ارفض هذه المبادلة.',
  script:
    'ما أستطيع إظهاره هو اختصار زمن المطابقة بنسبة 28% باستخدام SQL وLooker. أقبل إجمالي $168K، والأساس فيه $145K. إذا لزم التحرك، فالسقف الذي يثبته هذا الدليل هو $185K.',
};

export const SAMPLE_GUIDE_NARRATIVE: Record<AppLanguage, SampleGuideNarrative> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  es,
  hi,
  ar,
};
