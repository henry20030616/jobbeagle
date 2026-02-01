import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 環境設定
// ==========================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 使用穩定的 Gemini 2.5 Flash
const MODEL_NAME = 'gemini-2.5-flash';

// ==========================================
// 2. CORS 設定
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
// 3. AI 指令 (核心：禁止搜尋，強制生成)
// ==========================================
const SYSTEM_INSTRUCTION = `
# Role
You are a "Senior Career Strategist" and "Global Headhunter".

# Task
Analyze the JD and Resume to generate a Winning Strategy Report.

# CRITICAL RULES
1. **NO SEARCH**: Do not use Google Search. Use your internal knowledge base.
2. **NO EMPTY FIELDS**: You MUST ESTIMATE all data based on the industry standard. Do not return null or empty arrays.
3. **Format**: PURE JSON ONLY.

# Output Structure (JSON)
{
  "basic_analysis": {
    "job_title": "Job Title",
    "company_overview": "Summary of company...",
    "hard_requirements": ["Skill 1", "Skill 2"]
  },
  "salary_analysis": {
    "estimated_range": "e.g. 1.2M - 1.5M TWD",
    "rationale": "Estimated based on market standards.",
    "negotiation_tip": "Tip..."
  },
  "market_analysis": {
    "industry_trends": "Trends...",
    "competition_table": [
      { "name": "Competitor A", "strengths": "...", "weaknesses": "..." },
      { "name": "Competitor B", "strengths": "...", "weaknesses": "..." },
      { "name": "Competitor C", "strengths": "...", "weaknesses": "..." }
    ],
    "potential_risks": "Risks..."
  },
  "reviews_analysis": {
    "company_reviews": { "summary": "Summary...", "pros": ["Pro 1"], "cons": ["Con 1"] },
    "real_interview_questions": [
      { "question": "Technical Question 1...", "source": "Simulation", "year": "2024" },
      { "question": "Technical Question 2...", "source": "Simulation", "year": "2024" },
      { "question": "Behavioral Question...", "source": "Simulation", "year": "2024" },
      { "question": "Behavioral Question...", "source": "Simulation", "year": "2024" },
      { "question": "Behavioral Question...", "source": "Simulation", "year": "2024" }
    ]
  },
  "match_analysis": {
    "score": 85,
    "matching_points": ["Point 1"],
    "skill_gaps": ["Gap 1"]
  },
  "interview_preparation": {
    "questions": [
       { "question": "Q1...", "type": "Technical", "answer_guide": "..." },
       { "question": "Q2...", "type": "Technical", "answer_guide": "..." },
       { "question": "Q3...", "type": "Technical", "answer_guide": "..." },
       { "question": "Q4...", "type": "Behavioral", "answer_guide": "..." },
       { "question": "Q5...", "type": "Behavioral", "answer_guide": "..." }
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
// 5. 主程式 API
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 1.29 原始版復刻');
  
  try {
    // 1. 簡單身分檢查 (不擋人)
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

    // 4. 構建用戶輸入內容
    const userParts: any[] = [
      { text: `[CONTEXT: JOB DESCRIPTION]\n\n${jobDescription.trim()}` }
    ];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME CONTENT ===\n${resume.content}` });
    }

    // 5. 呼叫 Gemini (標準 Fetch, 無 Tools)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      generationConfig: { 
        temperature: 0.7,
        response_mime_type: "application/json"
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (response.status === 429) {
      return NextResponse.json({ error: 'Quota Exceeded', details: '請稍後再試' }, { status: 429 });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Error: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 5. 回傳
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