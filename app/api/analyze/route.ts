import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. 伺服器與模型配置
// ============================================================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 修正重點：改用 Gemini 2.0 Flash
// 1.5-pro 報錯 404 代表該名稱不可用。2.0 Flash 是確定可用的穩定模型。
// 我們透過修改下方的 Prompt 來讓它達到 1.29 的報告品質。
const MODEL_NAME = 'gemini-2.0-flash';

// ============================================================================
// 2. CORS
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
// 3. 核心指令 (還原 1.29 風格：搜尋 + 模擬保底)
// ============================================================================
const SYSTEM_INSTRUCTION = `
# Role
You are a "Senior Headhunter" and "Career Strategist" with 30 years of experience.
Your goal is to generate a "Winning Strategy Report" that is **rich, detailed, and fully populated**.

# 🚀 HYBRID DATA STRATEGY (關鍵：模擬保底機制)
1. **Search First**: Use Google Search to find real data (Salary, Reviews).
2. **FALLBACK PROTOCOL (Must Follow)**:
   - If Google Search finds NOTHING (e.g., niche company, no public salary), **YOU MUST SIMULATE IT based on the JD.**
   - **NEVER return empty fields.** - If you can't find real interview questions, **GENERATE 5 realistic technical questions** based on the job's hard skills.
   - Label simulated data as "(Estimated based on Market Standard)".

# Content Requirements (No Empty Fields)

1. **basic_analysis**:
   - job_title: Official title.
   - hard_requirements: Extract 3-5 killer skills.
   - company_overview: Summarize the company business.

2. **salary_analysis**:
   - estimated_range: "1.2M - 1.8M TWD" (Estimate if unknown).
   - rationale: Explain logic (e.g., "Market rate for Senior Backend in Taiwan").

3. **market_analysis**:
   - competition_table: **List 3 Competitors**. If unknown, list **General Industry Competitors**.
   - potential_risks: Analyze risks like "Market Saturation".

4. **reviews_analysis**:
   - company_reviews: Summarize pros/cons. If no info, infer from JD tone (e.g., "High growth = High pressure").
   - real_interview_questions:
     - **MUST Provide 5 Questions**.
     - **Fallback**: Generate 5 tough technical questions if real ones aren't found.
     - Format: { "question": "...", "source": "Simulation/PTT", "year": "2024" }

5. **match_analysis**:
   - score: 0-100.
   - skill_gaps: Be critical.

6. **interview_preparation**:
   - questions: 5 Technical + 3 Behavioral.
   - answer_guide: Strategic advice (STAR method).

# Output Format
PURE JSON ONLY. No Markdown wrapper.
`;

// ============================================================================
// 4. JSON 清洗工具
// ============================================================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('JSON Parse Error:', error);
    throw new Error('AI 回傳格式錯誤，請重試');
  }
}

// ============================================================================
// 5. 主程式入口
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 分析請求 (Model: 2.0 Flash + Fallback)');

  try {
    // 1. 混合身分驗證
    let isGuest = true;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) isGuest = false;
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

    // 4. 設定請求
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [
        { text: `[TARGET JD]\n${jobDescription}` },
        { text: `[RESUME]\n${resume.type === 'text' ? resume.content : 'User uploaded file'}` }
      ]}],
      // 🚀 關鍵：啟用搜尋，但 Prompt 控制保底
      tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.6 } } }],
      generationConfig: { 
        temperature: 0.7, 
        response_mime_type: "application/json" 
      }
    };

    // 5. 執行 (重試機制)
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
          // 這裡會抓到 404 如果模型名稱又錯了
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