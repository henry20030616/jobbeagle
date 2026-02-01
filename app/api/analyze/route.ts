import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. 伺服器與模型配置
// ============================================================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 使用 Gemini 2.0 Flash (支援搜尋 + 強大生成能力)
const MODEL_NAME = 'gemini-2.0-flash';

// ============================================================================
// 2. CORS (跨域設定)
// ============================================================================
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

// ============================================================================
// 3. 核心大腦指令 (已加入「找不到就生成」的強制保底機制)
// ============================================================================
const SYSTEM_INSTRUCTION = `
# Role
You are a "Ruthless Career Strategist" and "Senior Headhunter" with 30 years of experience.
Your goal is to provide a "Winning Strategy Report" that is **dense, actionable, and comprehensive**.

# 🚀 HYBRID STRATEGY (The "Search or Simulate" Protocol)
1. **STEP 1: USE GOOGLE SEARCH** to find real-time data (Salary, Reviews, Specific Questions).
2. **STEP 2: CRITICAL FALLBACK (The "No Empty Fields" Rule)**: 
   - If Google Search returns **NO results** or insufficient data for a specific field (e.g., niche company with no PTT discussions):
   - **YOU MUST GENERATE HIGH-QUALITY SIMULATED DATA based on the Job Description and Industry Standards.**
   - **DO NOT return empty arrays or null values.**
   - If generating data, label the source as "(Based on Job Analysis)" or "(Industry Standard)".

# Detailed Execution Guide

1. **basic_analysis**:
   - job_title: Official title.
   - hard_requirements: Extract 3-5 killer skills.

2. **salary_analysis**:
   - estimated_range: Try to find real data. If not found, **ESTIMATE** based on Taiwan market standards for this seniority. **NEVER LEAVE EMPTY.**
   - rationale: Explain your estimation logic.

3. **market_analysis**:
   - competition_table: List 3 competitors.
     - *Fallback*: If exact competitors are unknown, list **Top 3 General Competitors** in this specific industry sector.
   - potential_risks: If no specific news found, analyze "General Industry Risks" (e.g., AI replacing jobs).

4. **reviews_analysis** (CRITICAL SECTION):
   - company_reviews: Summarize search results. If none, summarize "Typical pros/cons for this type of role/industry".
   - real_interview_questions:
     - **Goal**: Find 5 REAL questions.
     - **Fallback**: If 0 real questions found, **GENERATE 5 TOUGH TECHNICAL QUESTIONS** based strictly on the JD's "Hard Requirements".
     - Format: { "question": "...", "source": "PTT/Glassdoor/AI Simulation", "year": "2024" }

5. **interview_preparation**:
   - questions: 5 Technical + 3 Behavioral. **These must be specific to the JD's tech stack.**
   - answer_guide: Provide a strategic answer structure (STAR method).

6. **match_analysis**:
   - score: 0-100.
   - skill_gaps: Be critical.
   - matching_points: Be encouraging.

# Output Format
PURE JSON ONLY. No Markdown wrapper.
`;

// ============================================================================
// 4. JSON 清洗與容錯工具
// ============================================================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    // 移除搜尋引擎可能產生的前綴廢話
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('JSON Parse Error:', error);
    // 這裡不做 throw，嘗試回傳一個錯誤結構讓前端顯示，避免白屏
    throw new Error('AI 回傳格式錯誤，請重試');
  }
}

// ============================================================================
// 5. 主程式入口
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 請求開始 (策略: 搜尋優先 -> 生成保底)');

  try {
    // 1. 混合模式驗證 (User or Guest)
    let isGuest = true;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isGuest = false;
        console.log(`👤 用戶已登入: ${user.id}`);
      }
    } catch (e) { /* ignore */ }

    // 2. 輸入檢查
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // 3. API Key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    // 4. 設定請求 (啟用搜尋 + 生成)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ 
        parts: [
          { text: `[TARGET JD]\n${jobDescription}` },
          { text: `[MY RESUME]\n${resume.type === 'text' ? resume.content : 'User uploaded file'}` }
        ] 
      }],
      // 🚀 關鍵工具設定：啟用 Google 搜尋
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.6 } } }],
      generationConfig: { 
        temperature: 0.8, // 調高創意度，確保找不到資料時它敢於生成內容
        response_mime_type: "application/json" 
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // 5. 執行 (重試機制)
    const maxRetries = 2;
    let textResult = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 [Attempt ${attempt}] Calling Gemini...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        if (response.status === 429) {
          console.warn('⚠️ 429 Too Many Requests, waiting...');
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Gemini Error: ${err.substring(0, 100)}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) break;

      } catch (e: any) {
        console.error(`Attempt ${attempt} failed:`, e.message);
        if (attempt === maxRetries) throw e;
      }
    }

    // 6. 回傳
    const report = cleanAndParseJSON(textResult);
    
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false,
      is_logged_in: !isGuest,
      meta: { searchEnabled: true }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}