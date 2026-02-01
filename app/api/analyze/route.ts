import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 伺服器環境配置 (Server Config)
// ==========================================
// 延長執行時間限制，避免分析太久被切斷
export const maxDuration = 60;
// 強制動態渲染，確保每次請求都重新執行
export const dynamic = 'force-dynamic';

// 🟢 設定為 Lite 模型 (免費、快速、且高效)
const MODEL_NAME = 'gemini-2.5-flash-lite';

// ==========================================
// 2. CORS 跨域設定 (Options Method)
// ==========================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ==========================================
// 3. AI 角色與指令設定 (System Instruction)
// ==========================================
// 這裡是 AI 的大腦設定，完整保留原本的詳細邏輯
const SYSTEM_INSTRUCTION = `
# Role (角色設定)
You are a dual-expert persona with 40 years of top-tier experience:
1. **Global Headhunter & Senior HR Director**: Specialist in decoding organizational logic, identifying "hidden" job requirements.
2. **Career Expert (求職專家)**: Specialist in industrial lifecycles and strategic market positioning.

# Task (任務)
Analyze the provided Job Description (JD) and Resume to generate a "Winning Strategy Report".

# Critical Output Rules (核心規則)
1. **Language**: Traditional Chinese (繁體中文).
2. **Format**: PURE JSON ONLY. No markdown code blocks (e.g., no \`\`\`json).
3. **Data Retrieval**: You MUST use Google Search to find real-time data for "Salary", "Interview Questions", and "Company News".

# Detailed JSON Structure Requirements (詳細欄位要求)

1. **basic_analysis**:
   - job_title: The official title.
   - company_overview: 3 bullet points about the company status.
   - hard_requirements: List of mandatory skills.

2. **salary_analysis**:
   - estimated_range: Format as "1.5M - 2.0M TWD (年薪)".
   - rationale: Why you estimated this range (based on data).
   - negotiation_tip: Concrete advice.

3. **market_analysis**:
   - industry_trends: Start with "簡介:" then "現況與趨勢:".
   - competition_table: Array of competitors.
   - potential_risks: What could go wrong?

4. **reviews_analysis**:
   - company_reviews: Summary of Glassdoor/PTT/linkedin/reddit reviews.
   - real_interview_questions: Must retrieve REAL question, at least 5 question.

5. **match_analysis**:
   - score: 0-100 integer.
   - matching_points: Where the candidate fits perfectly.
   - skill_gaps: What is missing?

6. **interview_preparation**:
   - questions: 5 Technical + 5 Behavioral questions.
   - answer_guide: Brief advice on how to answer accroding to the quest and user's resume.

# Output JSON Example (輸出範例)
{
  "basic_analysis": { "job_title": "...", "hard_requirements": [] },
  "salary_analysis": { "estimated_range": "...", "rationale": "..." },
  "market_analysis": { "industry_trends": "...", "competition_table": [] },
  "reviews_analysis": { "company_reviews": {}, "real_interview_questions": [] },
  "match_analysis": { "score": 80, "matching_points": [], "skill_gaps": [] },
  "interview_preparation": { "questions": [], "answer_guide": "..." },
  "references": { "deep_research": [] }
}
`;

// ==========================================
// 4. 工具函式：JSON 清洗與容錯解析
// ==========================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    // 移除可能存在的 Markdown 語法
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    // 確保只抓取 { ... } 範圍內的內容
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('❌ JSON Parse Error:', error);
    throw new Error('AI 回傳格式錯誤，請重試');
  }
}

// ==========================================
// 5. 主程式入口 (POST Handler)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (POST /api/analyze)');
  
  try {
    // ------------------------------------------------
    // 步驟 1: 混合模式身分驗證 (Hybrid Auth)
    // ------------------------------------------------
    // 這裡會嘗試抓取使用者，如果抓不到不會報錯，只是標記為訪客
    let userId = null;
    let isGuest = true;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        isGuest = false;
        console.log(`👤 [Auth] 識別為登入用戶: ${userId}`);
      } else {
        console.log('👤 [Auth] 識別為訪客 (未登入)');
      }
    } catch (authErr) {
      console.warn('⚠️ [Auth Warning] 身分驗證過程異常 (視為訪客):', authErr);
    }

    // ------------------------------------------------
    // 步驟 2: 檢查前端輸入
    // ------------------------------------------------
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      console.error('❌ [Validation] 缺少必要參數');
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // ------------------------------------------------
    // 步驟 3: 準備 API Key 與 Prompt
    // ------------------------------------------------
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Config] 找不到 API Key');
      return NextResponse.json({ error: 'Server Config Error: API Key missing' }, { status: 500 });
    }

    const userParts: any[] = [{ text: `[JD]\n${jobDescription}` }];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `[RESUME]\n${resume.content}` });
    }

    // ------------------------------------------------
    // 步驟 4: 呼叫 Gemini (包含重試機制與安全設定)
    // ------------------------------------------------
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    // 詳細的安全設定，避免內容被誤擋
    const safetySettings = [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ];

    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      generationConfig: { 
        temperature: 0.7,
        response_mime_type: "application/json" 
      },
      safetySettings: safetySettings
    };

    // 重試邏輯 (Retry Loop)
    const maxRetries = 3;
    let textResult = "";
    let lastError = null;

    console.log(`🤖 [Gemini] 準備呼叫 Google API (Model: ${MODEL_NAME})...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) console.log(`🔄 [Retry] 第 ${attempt} 次嘗試...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        // 處理 429 Too Many Requests (免費版常見問題)
        if (response.status === 429) {
          console.warn(`⚠️ [429] 額度限制，等待冷卻...`);
          // 指數退避: 2秒, 4秒, 8秒
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          if (attempt === maxRetries) throw new Error('Free Quota Exceeded (429): 請稍候再試');
          continue; 
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini Error ${response.status}: ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) {
          console.log(`✅ [Gemini] 成功取得回應 (長度: ${textResult.length})`);
          break; // 成功就跳出迴圈
        } else {
          throw new Error('Empty response from Gemini');
        }

      } catch (e: any) {
        lastError = e;
        console.error(`❌ [Attempt ${attempt} Failed]`, e.message);
        if (attempt === maxRetries) break;
      }
    }

    if (!textResult) {
      throw lastError || new Error('Failed to generate report after retries');
    }

    // ------------------------------------------------
    // 步驟 5: 解析與回傳
    // ------------------------------------------------
    const report = cleanAndParseJSON(textResult);
    const totalDuration = (Date.now() - startTime) / 1000;

    console.log(`🏁 [Success] 處理完成，耗時: ${totalDuration}秒`);

    // 回傳給前端
    // saved: false (因為我們移除了 DB 寫入)
    // is_logged_in: 讓前端知道使用者是否登入 (可用於 UI 顯示)
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false,
      is_logged_in: !isGuest,
      meta: {
        duration: totalDuration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [API Fatal Error]', error);
    // 區分錯誤類型回傳不同狀態碼
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: '請稍後再試'
    }, { status });
  }
}