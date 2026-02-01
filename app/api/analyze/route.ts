import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 伺服器環境配置
// ==========================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 改用 Gemini 2.0 Flash (目前最穩定、不會 404 的版本)
const MODEL_NAME = 'gemini-2.0-flash';

// ==========================================
// 2. CORS 跨域設定
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
// 3. AI 角色與指令設定 (回歸 1.29 豐富生成版)
// ==========================================
const SYSTEM_INSTRUCTION = `
# Role
You are a "Senior Global Headhunter" and "Career Strategy Expert" with 30 years of experience.
Your task is to analyze the JD and Resume to generate a **"Winning Strategy Report"**.

# ⚠️ CRITICAL OUTPUT RULES (Format & Content)
1. **NO EMPTY FIELDS**: You MUST populate every field. If exact data (like specific salary) is not explicit, you **MUST ESTIMATE** it based on your expert knowledge of the Taiwan market and the Job Description.
2. **Language**: Traditional Chinese (繁體中文).
3. **Format**: **PURE JSON ONLY**. Do not write any introduction or conclusion. Do not use Markdown blocks if possible.

# Detailed JSON Structure & Generation Logic

1. **basic_analysis**:
   - job_title: Official title.
   - company_overview: Summarize the company's market position and business type.
   - hard_requirements: List 3-5 mandatory technical skills.

2. **salary_analysis**:
   - estimated_range: **ESTIMATE THIS**. E.g., "1.2M - 1.8M TWD". Do not leave blank.
   - rationale: Explain your estimation (e.g., "Based on Senior Backend Engineer roles in Taipei").
   - negotiation_tip: Provide a specific negotiation tactic.

3. **market_analysis**:
   - industry_trends: Describe current trends in this specific industry.
   - competition_table: **GENERATE 3 COMPETITORS**. If you don't know exact ones, list general competitors in this sector.
     Format: [{ "name": "Competitor A", "strengths": "...", "weaknesses": "..." }]
   - potential_risks: Analyze potential career risks (e.g., Tech debt, High pressure).

4. **reviews_analysis** (Simulated Insights):
   - company_reviews: **Simulate** the likely pros/cons based on the JD's tone. (e.g., If JD emphasizes "fast-paced", Note: "Likely high pressure but fast growth").
   - real_interview_questions:
     - **GENERATE 5 REALISTIC QUESTIONS** that a hiring manager would ask for this specific JD.
     - Format: { "question": "...", "source": "Expert Simulation", "year": "2024" }

5. **match_analysis**:
   - score: 0-100 score based on resume match.
   - matching_points: What makes the candidate a good fit?
   - skill_gaps: What is missing?

6. **interview_preparation**:
   - questions: 5 **Hard Technical Questions** (Specific to JD stack) + 3 Behavioral Questions.
   - answer_guide: Brief advice (STAR method).

# Output JSON Example
{
  "basic_analysis": { ... },
  "salary_analysis": { "estimated_range": "...", ... },
  "market_analysis": { "competition_table": [ ... ], ... },
  "reviews_analysis": { "real_interview_questions": [ ... ], ... },
  "match_analysis": { ... },
  "interview_preparation": { ... }
}
`;

// ==========================================
// 4. 工具函式：JSON 清洗與容錯解析
// ==========================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    // 強力清洗：移除所有 Markdown 和非 JSON 字元
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    } else {
      throw new Error('No JSON found');
    }
    
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('JSON Parse Error:', error);
    // 這裡我們不再 throw error 讓前端掛掉，而是回傳一個空的結構防止白屏，或是再次嘗試
    throw new Error('AI 生成格式異常，請重試');
  }
}

// ==========================================
// 5. 主程式入口 (POST Handler)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (Stable Mode: No Tools)');
  
  try {
    // 1. 混合模式身分驗證 (不擋人)
    let isGuest = true;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) isGuest = false;
    } catch (e) { /* ignore */ }

    // 2. 檢查前端輸入
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // 3. 取得 API Key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    // 4. 呼叫 Gemini (不使用 Tools，確保格式穩定)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ 
        parts: [
          { text: `[TARGET JD]\n${jobDescription}` },
          { text: `[RESUME]\n${resume.type === 'text' ? resume.content : 'User uploaded file'}` }
        ] 
      }],
      // ❌ 移除 Tools，回歸純生成模式，確保 100% 成功率
      generationConfig: { 
        temperature: 0.7,
        response_mime_type: "application/json" 
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // 5. 執行請求 (重試機制)
    const maxRetries = 2;
    let textResult = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini Error: ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) break;

      } catch (e: any) {
        if (attempt === maxRetries) throw e;
      }
    }

    // 6. 解析與回傳
    const report = cleanAndParseJSON(textResult);
    
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false,
      is_logged_in: !isGuest,
      meta: { searchEnabled: false } // 標記搜尋未啟用
    });

  } catch (error: any) {
    console.error('API Error:', error);
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}