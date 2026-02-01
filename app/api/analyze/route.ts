import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 伺服器環境配置
// ==========================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 建議改回 gemini-2.0-flash，因為它對「搜尋工具 (Grounding)」的支援目前最穩定
// 如果 2.5-flash-lite 報錯，請改回 'gemini-2.0-flash'
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
// 3. AI 角色與指令設定 (強化搜尋版)
// ==========================================
const SYSTEM_INSTRUCTION = `
# Role
You are a dual-expert persona:
1. **Global Headhunter**: Specialist in "detecting hidden risks" and "decoding JD".
2. **Taiwan Career Strategist**: Expert in PTT (Tech_Job, Soft_Job), Dcard, and Qollie data analysis.

# Task
Analyze the JD and Resume to generate a "Winning Strategy Report" in Traditional Chinese.

# 🚀 CRITICAL: GOOGLE SEARCH MANDATE
You **MUST** perform multiple Google Searches using the integrated tool to find REAL-TIME data.
**Target Search Queries (You must execute these conceptually):**
1. "{Company Name} PTT", "{Company Name} Dcard", "{Company Name} Qollie", "{Company Name} 面試心得"
2. "{Job Title} 薪水 PTT", "{Job Title} 薪水 levels.fyi Taiwan"
3. "{Company Name} interview questions software engineer" (or relevant role)

# detailed JSON Structure Requirements

1. **basic_analysis**:
   - job_title: Official title.
   - company_overview: Recent news or funding status found via search.
   - hard_requirements: Mandatory skills.

2. **salary_analysis**:
   - estimated_range: e.g., "1.5M - 2.0M TWD".
   - rationale: **MUST cite specific data sources** (e.g., "According to 2024 levels.fyi data...").
   - negotiation_tip: Tactics.

3. **market_analysis**:
   - industry_trends: Real-time market trend analysis.
   - competition_table: Competitors found via search.
   - potential_risks: **Crucial**. Find negative news or "layoff" rumors if any.

4. **reviews_analysis** (The most important part):
   - company_reviews: **MUST** summarize real sentiments from PTT/Dcard/Glassdoor. (e.g., "PTT users mentioned heavy overtime...").
   - real_interview_questions:
     - **MUST** be actual questions found online.
     - format: { "question": "...", "source": "PTT/Glassdoor/Dcard", "year": "2023-2024" }

5. **match_analysis**:
   - score: 0-100.
   - matching_points: Strengths.
   - skill_gaps: Weaknesses.

6. **interview_preparation**:
   - questions: 5 Technical + 5 Behavioral (based on the company's tech stack).
   - answer_guide: Strategy.

# Output Format
PURE JSON ONLY. No Markdown.
`;

// ==========================================
// 4. 工具函式：JSON 清洗
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
    console.error('❌ JSON Parse Error:', error);
    // 這裡不做 throw，試著回傳一個錯誤結構，讓前端不要白屏
    throw new Error('AI 回傳格式錯誤，請重試');
  }
}

// ==========================================
// 5. 主程式入口 (啟用 Google Search Tool)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. 混合模式身分驗證 (不擋人，只紀錄)
    let isGuest = true;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isGuest = false;
        console.log(`👤 [Auth] 登入用戶: ${user.id}`);
      } else {
        console.log('👤 [Auth] 訪客模式');
      }
    } catch (e) {
      console.warn('Supabase check skipped');
    }

    // 2. 檢查輸入
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // 3. API Key & Prompt
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const userParts: any[] = [{ text: `[TARGET JD]\n${jobDescription}` }];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `[MY RESUME]\n${resume.content}` });
    }

    // 4. 設定 Gemini API (加入 tools: googleSearchRetrieval)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      // 🚀 關鍵修改：加入 Google 搜尋工具
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC", // 讓 AI 自己決定何時搜尋，通常會設為自動
              dynamicThreshold: 0.7
            }
          }
        }
      ],
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

    console.log(`🔍 [Gemini] 啟動 Google 搜尋增強模式 (${MODEL_NAME})...`);

    // 重試機制
    const maxRetries = 2; // 搜尋比較慢，重試次數少一點避免 timeout
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
          console.warn(`⚠️ [429] 忙碌中，等待重試...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini Error ${response.status}: ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        // 有使用 Search Tool 時，回應結構可能會稍微不同，但 content.parts.text 還是會在
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) break;
      } catch (e) {
        console.error(`Attempt ${attempt} failed:`, e);
        if (attempt === maxRetries) throw e;
      }
    }

    // 5. 解析與回傳
    const report = cleanAndParseJSON(textResult);
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`✅ [Success] 分析完成 (含搜尋)，耗時: ${totalDuration}s`);

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
    return NextResponse.json({ error: error.message || 'Error' }, { status });
  }
}