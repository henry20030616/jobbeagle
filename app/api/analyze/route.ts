import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 環境配置
// ==========================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 【回歸原點】使用 Gemini 1.5 Flash
// 這是最穩定、最不容易出錯、且支援免費/付費通用的版本。
// 絕對不會有 404 或格式跑掉的問題。
const MODEL_NAME = 'gemini-1.5-flash';

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
// 3. System Instruction (原始 1/29 版本邏輯)
// ==========================================
const SYSTEM_INSTRUCTION = `
# Role
You are a "Senior Career Strategist" and "Global Headhunter".

# Task
Analyze the JD and Resume to generate a Winning Strategy Report.

# CRITICAL RULES
1. **NO SEARCH**: Do not use Google Search. Use your internal knowledge base.
2. **NO EMPTY FIELDS**: If specific data (like salary/competitors) is not in the text, **ESTIMATE IT** based on the industry standard. Do not leave blank.
3. **Format**: PURE JSON ONLY.

# Output Structure (JSON)
{
  "basic_analysis": {
    "job_title": "...",
    "company_overview": "...",
    "hard_requirements": ["Skill A", "Skill B"]
  },
  "salary_analysis": {
    "estimated_range": "e.g. 1.2M - 1.5M TWD",
    "rationale": "Based on market standards for this seniority.",
    "negotiation_tip": "..."
  },
  "market_analysis": {
    "industry_trends": "...",
    "competition_table": [
      { "name": "Competitor A", "strengths": "...", "weaknesses": "..." },
      { "name": "Competitor B", "strengths": "...", "weaknesses": "..." },
      { "name": "Competitor C", "strengths": "...", "weaknesses": "..." }
    ],
    "potential_risks": "..."
  },
  "reviews_analysis": {
    "company_reviews": { "summary": "...", "pros": [], "cons": [] },
    "real_interview_questions": [
      { "question": "Technical Question 1...", "source": "Simulation", "year": "2024" },
      { "question": "Technical Question 2...", "source": "Simulation", "year": "2024" },
      { "question": "Behavioral Question...", "source": "Simulation", "year": "2024" }
    ]
  },
  "match_analysis": {
    "score": 85,
    "matching_points": ["..."],
    "skill_gaps": ["..."]
  },
  "interview_preparation": {
    "questions": [
       { "question": "...", "type": "Technical", "answer_guide": "..." },
       { "question": "...", "type": "Behavioral", "answer_guide": "..." }
    ]
  }
}
`;

// ==========================================
// 4. JSON 清洗函式
// ==========================================
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

// ==========================================
// 5. 主程式 (無 Search, 無 Lite, 無 404)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 分析請求 (Gemini 1.5 Flash - 原始穩定版)');
  
  try {
    // 1. 混合模式身分驗證 (不擋人)
    let isGuest = true;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) isGuest = false;
    } catch (e) { /* ignore */ }

    // 2. 檢查輸入
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

    // 4. 呼叫 Gemini 1.5 Flash (最穩定的 API)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ 
        parts: [
          { text: `[JD]\n${jobDescription}` },
          { text: `[RESUME]\n${resume.type === 'text' ? resume.content : 'User uploaded file'}` }
        ] 
      }],
      // ❌ 移除所有 tools (搜尋)，避免格式錯誤
      generationConfig: { 
        temperature: 0.7,
        response_mime_type: "application/json" // 強制 JSON 模式，解決格式錯誤
      }
    };

    // 5. 執行請求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (response.status === 429) {
      return NextResponse.json({ 
        error: 'Free Quota Exceeded', 
        message: '系統繁忙，請稍等幾秒後再試' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Error: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 6. 解析與回傳
    const report = cleanAndParseJSON(textResult);
    
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false,
      is_logged_in: !isGuest
    });

  } catch (error: any) {
    console.error('API Error:', error);
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}