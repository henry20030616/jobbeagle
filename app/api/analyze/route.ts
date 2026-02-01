import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. 伺服器與模型配置 (Server & Model Config)
// ============================================================================

// 允許最長執行時間 60 秒 (Pro 模型思考較深入，需要多一點時間)
export const maxDuration = 60;
// 強制動態渲染
export const dynamic = 'force-dynamic';

// 🟢 【關鍵回歸】使用 Gemini 1.5 Pro
// 這是 Google 目前邏輯最強、寫作最細膩、格式最穩定的模型。
// 既然你有付費帳號，用這個絕對比 Lite 或 Flash 更好，能還原 1.29 的報告品質。
const MODEL_NAME = 'gemini-1.5-pro';

// ============================================================================
// 2. 跨域資源共享設定 (CORS Options)
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
// 3. AI 核心指令 (System Prompt - 經典復刻增強版)
// ============================================================================
const SYSTEM_INSTRUCTION = `
# Role (角色設定)
You are a "Senior Career Strategist" and "Global Headhunter" with 30 years of experience.
Your goal is to provide a "Winning Strategy Report" that is **dense, insightful, and formatted perfectly**.

# 🚀 HYBRID DATA STRATEGY (搜尋 + 專業推演)
1. **Google Search First**: Attempt to find real-time data for Salary and Company Reviews.
2. **FALLBACK PROTOCOL (Critical)**:
   - If Google Search returns insufficient data (e.g., niche company, no public salary info), **YOU MUST SIMULATE IT.**
   - **DO NOT return empty fields.** Use your expert knowledge to estimate the salary, generate likely interview questions, and identify competitors based on the industry and JD.
   - Label estimated data as "(Industry Est.)" or "(Simulation)".

# JSON Structure & Content Guide

1. **basic_analysis**:
   - job_title: Official title.
   - hard_requirements: Extract 3-5 killer skills from JD.
   - company_overview: 3 key highlights about the company (Search or Summarize JD).

2. **salary_analysis**:
   - estimated_range: e.g., "1.2M - 1.8M TWD". **If unknown, estimate based on Market Standards.**
   - rationale: Explain the logic (e.g., "Based on Senior Backend roles in Taipei").
   - negotiation_tip: Provide a specific tactic.

3. **market_analysis**:
   - industry_trends: "簡介:" (Intro) + "趨勢:" (Trends).
   - competition_table: **List 3 Competitors**. If specific ones aren't found, list **General Industry Competitors**.
     Format: [{ "name": "...", "strengths": "...", "weaknesses": "..." }]
   - potential_risks: Analyze risks like "Market Saturation" or "Tech Debt".

4. **reviews_analysis** (The "Inside Scoop"):
   - company_reviews: Summarize pros/cons. If no real reviews found, infer likely culture from the JD tone (e.g., "High growth usually means high pressure").
   - real_interview_questions:
     - **MUST Provide 5 Questions**.
     - If real questions are missing, **GENERATE 5 TOUGH TECHNICAL QUESTIONS** specific to the JD's tech stack.
     - Format: { "question": "...", "source": "PTT/Glassdoor/AI Simulation", "year": "2024" }

5. **match_analysis**:
   - score: 0-100.
   - skill_gaps: Be critical.
   - matching_points: Be encouraging.

6. **interview_preparation**:
   - questions: 5 Hard Technical + 3 Behavioral (STAR method).
   - answer_guide: Strategic advice for each.

# Output Format
PURE JSON ONLY. No Markdown code blocks. No conversational text.
`;

// ============================================================================
// 4. 輔助函式：JSON 清洗與解析
// ============================================================================
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
    // 這裡不 throw，避免前端白屏，而是回傳一個錯誤結構方便除錯
    throw new Error('AI 回傳格式錯誤，請稍後重試');
  }
}

// ============================================================================
// 5. 主程式入口 (Main Handler)
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (Model: 1.5 Pro)');

  try {
    // ------------------------------------------------------------------------
    // A. 混合模式身分驗證 (Hybrid Auth)
    // ------------------------------------------------------------------------
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
      console.warn('Supabase Auth Check Skipped');
    }

    // ------------------------------------------------------------------------
    // B. 輸入資料驗證
    // ------------------------------------------------------------------------
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });
    }

    // ------------------------------------------------------------------------
    // C. API 金鑰與模型設定
    // ------------------------------------------------------------------------
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    // 準備 Prompt
    const userParts: any[] = [{ text: `[TARGET JD]\n${jobDescription}` }];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `[MY RESUME]\n${resume.content}` });
    }

    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      // 🚀 關鍵工具：啟用 Google 搜尋，但由 Prompt 控制保底
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC", 
              dynamicThreshold: 0.7 // 門檻設高一點，讓 AI 自己判斷何時該搜，何時該寫
            }
          }
        }
      ],
      generationConfig: { 
        temperature: 0.7, // 1.5 Pro 的最佳溫度，既有創意又守規矩
        response_mime_type: "application/json" 
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // ------------------------------------------------------------------------
    // D. 執行請求與重試 (Robust Retry)
    // ------------------------------------------------------------------------
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

        // 處理 429
        if (response.status === 429) {
          console.warn('⚠️ 429 Quota Exceeded, waiting...');
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
        console.error(`Attempt ${attempt} failed:`, e.message);
        if (attempt === maxRetries) throw e;
      }
    }

    // ------------------------------------------------------------------------
    // E. 回傳結果
    // ------------------------------------------------------------------------
    const report = cleanAndParseJSON(textResult);
    const totalDuration = (Date.now() - startTime) / 1000;

    console.log(`🏁 [Success] 分析完成，耗時: ${totalDuration}s`);

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
    console.error('❌ [API Fatal Error]:', error);
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: '分析服務暫時無法使用，請稍後重試'
    }, { status });
  }
}