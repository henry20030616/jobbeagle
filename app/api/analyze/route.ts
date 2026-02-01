import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. 伺服器與模型配置 (Server & Model Config)
// ============================================================================

// 允許最長執行時間 60 秒 (避免搜尋時間過長被卡斷)
export const maxDuration = 60;
// 強制動態渲染，確保每次請求都產生新結果
export const dynamic = 'force-dynamic';

// 🟢 使用 Gemini 2.0 Flash
// 原因：雖然 2.5 Lite 較新，但 2.0 Flash 對於「搜尋工具 (Tools)」的支援最穩定，
// 能有效減少 JSON 格式錯誤的問題。
const MODEL_NAME = 'gemini-2.0-flash';

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
// 3. AI 核心指令與角色設定 (System Prompt)
// ============================================================================
const SYSTEM_INSTRUCTION = `
# Role (角色設定)
You are a "Ruthless Career Strategist" and "Senior Headhunter" in Taiwan.
Your goal is to provide **insider intelligence** and **actionable strategy**, not just generic summaries.

# 🚀 CRITICAL: GOOGLE SEARCH MANDATE (搜尋指令)
You **MUST** perform these specific searches using the attached tool to find REAL-TIME data:
1. "site:ptt.cc {Company Name} 面試" OR "site:dcard.tw {Company Name} 心得"
2. "site:qollie.com {Company Name} 評價"
3. "{Company Name} interview questions technical"
4. "{Job Title} salary Taiwan levels.fyi" OR "{Job Title} 薪水 104"

# ⚠️ STRICT "NO EMPTY FIELDS" POLICY (禁止留白規則)
- **NEVER return empty arrays [].**
- **Competitors**: If exact competitors are unknown, list the top 3 general players in that industry.
- **Interview Questions**: If no specific questions are found for this company, you MUST provide **"Standard High-Frequency Questions"** for this specific job role and label them as "(Industry Standard)".
- **Salary**: If unknown, estimate based on market averages for this role level.

# Detailed JSON Structure Requirements

1. **basic_analysis**:
   - job_title: Official title.
   - hard_requirements: Extract 3-5 killer skills from JD.

2. **salary_analysis**:
   - estimated_range: e.g., "1.2M - 1.8M TWD". **DO NOT LEAVE EMPTY.**
   - rationale: Cite a source (e.g., "104 Market Avg", "Levels.fyi").
   - negotiation_tip: A concrete tactic to ask for more.

3. **market_analysis**:
   - competition_table: **MANDATORY**. List at least 3 competitors.
     Format: [{ "name": "Shopee", "strengths": "Traffic", "weaknesses": "High pressure" }]
   - potential_risks: Find negative news or "layoff" rumors. If none, write "Stable growth".

4. **reviews_analysis** (The "Truth" Section):
   - company_reviews: Summarize the "Vibe" from PTT/Dcard (e.g., "Overtime", "Culture", "Management").
   - real_interview_questions:
     - **MUST** provide at least 5 questions.
     - Format: { "question": "...", "source": "PTT/Glassdoor/Industry Standard", "year": "2024" }

5. **match_analysis**:
   - score: 0-100.
   - skill_gaps: Be critical. What is the candidate missing?
   - matching_points: What makes them a good fit?

6. **interview_preparation**:
   - questions: 5 **Hard Technical** Questions + 3 Behavioral.
   - answer_guide: One-sentence pro tip for each.

# Output Format
PURE JSON ONLY. No Markdown wrapper.
`;

// ============================================================================
// 4. 輔助函式：JSON 清洗與解析 (Helper Function)
// ============================================================================
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    // 1. 移除 Markdown 標記 (```json ... ```)
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. 尋找 JSON 的開頭與結尾 (過濾掉搜尋引擎回傳的前言後語)
    const firstBraceIndex = cleanText.indexOf('{');
    const lastBraceIndex = cleanText.lastIndexOf('}');
    
    if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    } else {
      throw new Error('無法在回應中找到有效的 JSON 結構');
    }

    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('❌ JSON Parse Error:', error);
    console.error('❌ Raw Text Preview:', text.substring(0, 200) + '...');
    throw new Error('AI 回傳格式錯誤 (搜尋結果干擾)，請重試');
  }
}

// ============================================================================
// 5. 主程式邏輯 (Main Handler)
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (功能: 搜尋 + 混合驗證)');

  try {
    // ------------------------------------------------------------------------
    // A. 混合模式身分驗證 (Hybrid Auth Check)
    // ------------------------------------------------------------------------
    let userId: string | null = null;
    let isGuest = true;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        isGuest = false;
        console.log(`👤 [Auth] 識別為登入用戶: ${userId}`);
      } else {
        console.log('👤 [Auth] 識別為訪客 (Guest Mode)');
      }
    } catch (e) {
      console.warn('⚠️ [Auth Warning] Supabase 驗證跳過，視為訪客');
    }

    // ------------------------------------------------------------------------
    // B. 輸入資料驗證 (Input Validation)
    // ------------------------------------------------------------------------
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    console.log(`📦 [Data] JD長度: ${jobDescription?.length}, Resume類型: ${resume?.type}`);

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing inputs: jobDescription or resume' }, { status: 400 });
    }

    // ------------------------------------------------------------------------
    // C. API 金鑰與模型設定 (Config & Tools)
    // ------------------------------------------------------------------------
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Config] API Key 未設定');
      return NextResponse.json({ error: 'Server Config Error: API Key missing' }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    // 準備 Prompt 內容
    const userParts: any[] = [{ text: `[TARGET JOB DESCRIPTION]\n${jobDescription}` }];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `[MY RESUME CONTENT]\n${resume.content}` });
    }

    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      // 🚀 核心功能：啟用 Google 搜尋工具 (Grounding)
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC", 
              dynamicThreshold: 0.6 // 數值越低，越容易觸發搜尋
            }
          }
        }
      ],
      generationConfig: { 
        temperature: 0.7, // 保持一定創意以利推論
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
    // D. 執行請求與重試機制 (Request Execution & Retry)
    // ------------------------------------------------------------------------
    const maxRetries = 2; // 因為搜尋很花時間，重試 2 次就好
    let textResult = "";
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 [Gemini Attempt ${attempt}] 發送請求中...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        // 處理 429 額度限制 (免費版最常遇到)
        if (response.status === 429) {
          console.warn(`⚠️ [429] 額度超限，正在冷卻...`);
          // 指數退避: 等待 2秒, 4秒...
          await new Promise(r => setTimeout(r, 2000 * attempt));
          if (attempt === maxRetries) throw new Error('Free Quota Exceeded (429): 請稍後再試');
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini Error ${response.status}: ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (textResult) {
          console.log(`✅ [Success] 成功取得回應 (長度: ${textResult.length})`);
          break; // 成功就跳出
        } else {
          throw new Error('Gemini 回傳了空的內容');
        }

      } catch (e: any) {
        console.error(`❌ [Attempt ${attempt} Failed]:`, e.message);
        lastError = e;
        if (attempt === maxRetries) break; // 最後一次也失敗就不試了
      }
    }

    if (!textResult) {
      throw lastError || new Error('Failed to generate report after retries');
    }

    // ------------------------------------------------------------------------
    // E. 資料解析與回傳 (Parsing & Response)
    // ------------------------------------------------------------------------
    const report = cleanAndParseJSON(textResult);
    const totalDuration = (Date.now() - startTime) / 1000;

    console.log(`🏁 [API End] 流程結束，總耗時: ${totalDuration}秒`);

    // 建構回傳資料
    // saved: false -> 明確告知前端沒有存檔
    // is_logged_in -> 讓前端 UI 決定是否顯示 "儲存履歷" 按鈕
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: false, 
      is_logged_in: !isGuest,
      meta: {
        duration: totalDuration,
        timestamp: new Date().toISOString(),
        searchEnabled: true
      }
    });

  } catch (error: any) {
    console.error('❌ [API Fatal Error]:', error);
    
    // 根據錯誤類型回傳適當的 HTTP 狀態碼
    const status = error.message.includes('429') ? 429 : 500;
    
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: '分析服務暫時無法使用，請稍後重試'
    }, { status });
  }
}