import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 伺服器環境配置
// ==========================================
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 改用 Gemini 2.0 Flash，因為它對「Google 搜尋工具」的支援最穩定
// 2.5-lite 搭配搜尋工具有時會回傳格式錯誤，建議這裡先用 2.0 確保功能正常
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

# Detailed JSON Structure Requirements

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

# Output Format Rules
1. **PURE JSON ONLY**.
2. Do NOT output any conversational text like "Here is the report...".
3. Do NOT use markdown formatting for the JSON itself if possible, but if you do, wrap in \`\`\`json.
`;

// ==========================================
// 4. 工具函式：JSON 清洗與容錯解析
// ==========================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    // 1. 移除 Markdown 標記
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. 尋找 JSON 的開頭與結尾 (過濾掉搜尋引擎回傳的雜訊)
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    } else {
      throw new Error('找不到有效的 JSON 結構');
    }

    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('❌ JSON Parse Error:', error);
    console.error('❌ Raw Text Preview:', text.substring(0, 100) + '...');
    throw new Error('AI 回傳格式錯誤 (搜尋結果干擾)，請重試');
  }
}

// ==========================================
// 5. 主程式入口 (啟用 Google Search Tool)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (Google Search Enabled)');
  
  try {
    // ------------------------------------------------
    // 1. 混合模式身分驗證 (不擋人，只紀錄)
    // ------------------------------------------------
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

    // ------------------------------------------------
    // 2. 檢查輸入
    // ------------------------------------------------
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // ------------------------------------------------
    // 3. API Key & 搜尋工具設定
    // ------------------------------------------------
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

    // 🟢 使用 Gemini 2.0 並掛載 Google 搜尋工具
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      // 🚀 關鍵：啟用 Google Search Grounding
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC", 
              dynamicThreshold: 0.6 // 設低一點，鼓勵 AI 多去搜尋
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

    // ------------------------------------------------
    // 4. 執行請求 (含重試邏輯)
    // ------------------------------------------------
    const maxRetries = 2; 
    let textResult = "";
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 [Attempt ${attempt}] Calling Gemini with Search...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        if (response.status === 429) {
          console.warn(`⚠️ [429] 忙碌中，等待重試...`);
          await new Promise(r => setTimeout(r, 2000 * attempt)); // 等待 2秒, 4秒
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini Error ${response.status}: ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) break;

      } catch (e: any) {
        console.error(`Attempt ${attempt} failed:`, e.message);
        if (attempt === maxRetries) throw e;
      }
    }

    // ------------------------------------------------
    // 5. 解析與回傳
    // ------------------------------------------------
    const report = cleanAndParseJSON(textResult);
    const totalDuration = (Date.now() - startTime) / 1000;
    
    console.log(`✅ [Success] 分析完成 (含搜尋)，耗時: ${totalDuration}s`);

    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false,
      is_logged_in: !isGuest,
      meta: { searchEnabled: true, duration: totalDuration }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    // 針對解析錯誤，回傳 500，讓前端知道
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: '分析過程中發生錯誤，請稍後重試' 
    }, { status });
  }
}