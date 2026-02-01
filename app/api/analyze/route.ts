import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// ==========================================
// 1. 環境配置 (Environment Config)
// ==========================================
// 延長 Vercel Serverless Function 的執行時間限制 (防止 10 秒超時)
export const maxDuration = 60;
// 強制使用動態渲染，防止 Vercel 快取導致 404
export const dynamic = 'force-dynamic';

// 🟢 設定模型名稱：使用帶版號的 Flash，這是解決 "Not Found" 的關鍵
// 不要改動這裡，這個名稱是 Google 全球通用的唯一識別碼
const MODEL_NAME = 'gemini-1.5-flash-001';

// ==========================================
// 2. CORS 跨域請求處理 (OPTIONS Method)
// ==========================================
// 這段是為了防止前端出現 Access-Control-Allow-Origin 錯誤
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

// ==========================================
// 3. 系統核心指令 (System Instruction) - 完整展開版
// ==========================================
// 這裡保留了你所有的指令與範例，確保 AI 輸出的品質
const SYSTEM_INSTRUCTION = `
# Role (角色設定)
You are a dual-expert persona with 30 years of top-tier experience:
1. **Global Headhunter & Senior HR Director**: Specialist in decoding organizational logic, identifying "hidden" job requirements, and assessing cultural alignment at the executive level.
2. **Career Expert (求職專家)**: Specialist in industrial lifecycles, competitive moats, business models, financial health, and strategic market positioning.

# Task (任務)
Analyze the provided Job Description (JD) and Resume to generate a "Winning Strategy Report".

# Critical Output Rules (核心規則)
1. **Language**: Traditional Chinese (繁體中文).
2. **Tone**: Professional, strategic, objective, and hard-hitting.
3. **Format**: PURE JSON ONLY. No markdown code blocks (e.g., no \`\`\`json).
4. **Data Retrieval**: You MUST use Google Search to find real-time data for "Salary", "Interview Questions", and "Company News".

# Detailed JSON Structure Requirements (詳細欄位要求)

1. **basic_analysis**:
   - job_title: The official title.
   - company_overview: 2-3 bullet points about the company status.
   - business_scope: What they actually sell or do.
   - hard_requirements: List of mandatory skills.

2. **salary_analysis**:
   - estimated_range: Format as "1.5M - 2.0M TWD (年薪)".
   - market_position: Is this above or below market average?
   - negotiation_tip: Concrete advice on how to ask for more.
   - rationale: Why you estimated this range (based on data).

3. **market_analysis**:
   - industry_trends: **DETAILED SECTION**. Start with "簡介:" then "現況與趨勢:".
   - competition_table: Array of competitors. Including strengths and weaknesses.
   - key_advantages: What is the company's moat?
   - potential_risks: What could go wrong?

4. **reviews_analysis**:
   - company_reviews: Summary of Glassdoor/PTT reviews.
   - real_interview_questions:
     - Must retrieve REAL questions from the internet.
     - format: { "question": "...", "job_title": "...", "year": "...", "source_url": "..." }

5. **match_analysis**:
   - score: 0-100 integer.
   - matching_points: Where the candidate fits perfectly.
   - skill_gaps: What is missing?

6. **interview_preparation**:
   - questions: 5 Technical + 5 Behavioral questions.
   - answer_guide: Brief advice on how to answer.

# Output JSON Example (輸出範例 - 絕對不可省略)
{
  "basic_analysis": {
    "job_title": "Senior Backend Engineer",
    "company_overview": "Leading e-commerce platform in Taiwan...",
    "business_scope": "B2C Retail, Logistics Tech...",
    "company_trends": "Expanding to SEA market...",
    "job_summary": "Responsible for high-concurrency API design...",
    "hard_requirements": ["Node.js", "PostgreSQL", "AWS"]
  },
  "salary_analysis": {
    "estimated_range": "1.5M - 2.0M TWD (年薪)",
    "market_position": "Top 10% in industry",
    "negotiation_tip": "Focus on your system design experience...",
    "rationale": "Based on 2024 salary reports for Senior Engineers..."
  },
  "market_analysis": {
    "industry_trends": "簡介: E-commerce sector... \\n 現況與趨勢: Growing at 15% YoY...",
    "positioning": "Market Leader",
    "competition_table": [
      {
        "name": "Competitor A",
        "strengths": "Strong logistics",
        "weaknesses": "Outdated app UI"
      }
    ],
    "key_advantages": [
      { "point": "User Base", "description": "10M active users" }
    ],
    "potential_risks": [
      { "point": "Market Saturation", "description": "Growth slowing down" }
    ]
  },
  "reviews_analysis": {
    "company_reviews": {
      "summary": "Good benefits but high pressure",
      "pros": ["Free lunch", "High bonus"],
      "cons": ["Long working hours"]
    },
    "job_reviews": {
      "summary": "Technical interview is hard",
      "pros": ["Respectful interviewers"],
      "cons": ["4 rounds of interviews"]
    },
    "real_interview_questions": [
      {
        "question": "Explain Event Loop in Node.js",
        "job_title": "Backend Engineer",
        "year": "[Glassdoor] 2023.12",
        "source_url": "https://..."
      }
    ]
  },
  "match_analysis": {
    "score": 85,
    "matching_points": [
      { "point": "Tech Stack", "description": "Matches 100%" }
    ],
    "skill_gaps": [
      { "gap": "Cloud Experience", "description": "Needs AWS certification" }
    ]
  },
  "interview_preparation": {
    "questions": [
      {
        "question": "[技術] How to handle database deadlock?",
        "source": "Common High Concurrency Question",
        "answer_guide": "Explain deadlock detection and prevention..."
      }
    ]
  },
  "references": {
    "deep_research": [],
    "data_citations": []
  }
}
`;

// ==========================================
// 4. 輔助函式：JSON 清洗與容錯解析 (Clean & Parse)
// ==========================================
// 這是最重要的防護罩，防止 AI 回傳 Markdown 格式或多餘文字導致解析失敗
function cleanAndParseJSON(text: string): InterviewReport {
  try {
    console.log('🔍 [Parsing] 開始解析回應，原始長度:', text.length);
    
    // 步驟 1: 移除 Markdown 代碼塊標記 (```json ... ```)
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 步驟 2: 尋找第一個左大括號 '{'
    const firstBraceIndex = cleanText.indexOf('{');
    if (firstBraceIndex === -1) {
      throw new Error('回應中找不到 JSON 開始符號 "{"');
    }
    
    // 步驟 3: 尋找最後一個右大括號 '}'
    const lastBraceIndex = cleanText.lastIndexOf('}');
    if (lastBraceIndex === -1) {
      throw new Error('回應中找不到 JSON 結束符號 "}"');
    }
    
    // 步驟 4: 截取有效的 JSON 字串
    if (firstBraceIndex > 0 || lastBraceIndex < cleanText.length - 1) {
      cleanText = cleanText.substring(firstBraceIndex, lastBraceIndex + 1);
    }
    
    // 步驟 5: 解析 JSON
    const parsed = JSON.parse(cleanText);
    console.log('✅ [Parsing] JSON 解析成功');
    return parsed;

  } catch (error: any) {
    console.error('❌ [Parsing Error] JSON 解析失敗:', error.message);
    console.error('❌ [Parsing Error] 錯誤片段:', text.substring(0, 200) + '...');
    throw new Error(`AI 回傳資料格式錯誤: ${error.message}`);
  }
}

// ==========================================
// 5. 主程式入口 (POST Handler)
// ==========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求 (POST /api/analyze)');
  console.log(`🔥 [Config] 使用模型: ${MODEL_NAME}`);

  try {
    // 1. 解析 Request Body
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    console.log(`📦 [Data Received] JD 長度: ${jobDescription?.length || 0}, Resume 類型: ${resume?.type}`);

    // 基本資料驗證
    if (!jobDescription || !resume) {
      console.error('❌ [Validation] 缺少必要欄位');
      return NextResponse.json(
        { error: 'Missing required fields: jobDescription and resume' },
        { status: 400 }
      );
    }

    // 2. 取得 API Key (支援兩種環境變數命名)
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Config Error] 伺服器未設定 API Key');
      return NextResponse.json(
        { error: 'Server configuration error: API Key missing' },
        { status: 500 }
      );
    }

    // 3. 智能解析 Job ID (104 / LinkedIn)
    let baseJD = jobDescription.trim();
    const match104 = baseJD.match(/104\.com\.tw\/job\/(\w+)/);
    const matchLinkedIn = baseJD.match(/linkedin\.com\/.*currentJobId=(\d+)/) || baseJD.match(/linkedin\.com\/jobs\/view\/(\d+)/);

    let systemHint = "";
    if (match104) {
      systemHint = `\n[SYSTEM_HINT]: This is a 104.com.tw job. ID: ${match104[1]}. Use this ID to find more context via Google Search.`;
      console.log(`🔍 [Job ID] 偵測到 104 ID: ${match104[1]}`);
    } else if (matchLinkedIn) {
      systemHint = `\n[SYSTEM_HINT]: This is a LinkedIn job. ID: ${matchLinkedIn[1]}.`;
      console.log(`🔍 [Job ID] 偵測到 LinkedIn ID: ${matchLinkedIn[1]}`);
    }

    // 4. 準備發送給 Gemini 的內容
    const userParts: any[] = [
      { text: `[CONTEXT: JOB DESCRIPTION]\n\n${baseJD}${systemHint}` }
    ];
    
    // 處理履歷內容 (文字或檔案)
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME CONTENT ===\n${resume.content}` });
    }

    // ==========================================
    // 6. Gemini API 請求設定
    // ==========================================
    // 務必使用 v1beta 接口，並且網址寫死，使用上面定義的 MODEL_NAME
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

    console.log(`🤖 [Gemini] 準備發送請求至 Google Cloud...`);

    // ==========================================
    // 7. 執行請求 + 重試機制 (Retry Loop)
    // ==========================================
    const maxRetries = 3;
    let lastError: any = null;
    let text = "";

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const fetchStartTime = Date.now();
        console.log(`⏳ [Gemini] 嘗試第 ${attempt + 1} 次請求...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          // 🔴 關鍵：防止 Vercel 快取 404 錯誤頁面，每次都強制發新請求
          cache: 'no-store' 
        });

        const fetchDuration = (Date.now() - fetchStartTime) / 1000;
        console.log(`⏱️ [Gemini] 耗時: ${fetchDuration}秒, Status: ${response.status}`);

        if (response.status === 503) {
          console.warn(`⚠️ [Gemini 503] 伺服器忙碌，等待 ${(attempt + 1) * 2} 秒後重試...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [Gemini Error] HTTP ${response.status}: ${errorText}`);
          throw new Error(`Gemini API Error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = data.candidates[0].content.parts || [];
          text = parts.map((part: any) => part.text || '').join('');
          console.log(`✅ [Gemini] 成功取得回應 (Length: ${text.length})`);
        } else {
          console.error('❌ [Gemini] 回應結構異常:', JSON.stringify(data).substring(0, 200));
          throw new Error('No content in response candidates');
        }

        break; 

      } catch (error: any) {
        lastError = error;
        console.error(`❌ [Gemini] 第 ${attempt + 1} 次嘗試失敗:`, error.message);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    if (!text && lastError) {
      throw lastError || new Error('Failed to generate content after all retries');
    }
    
    // ==========================================
    // 8. 解析與清洗 JSON
    // ==========================================
    const report: InterviewReport = cleanAndParseJSON(text);

    // ==========================================
    // 9. 儲存至 Supabase 資料庫
    // ==========================================
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ [Auth Warning] 無法確認使用者身分:', authError.message);
    }
    
    if (user) {
      console.log(`💾 [DB] 正在為使用者 ${user.id} 儲存報告...`);
      
      const insertData = {
        user_id: user.id,
        job_title: report.basic_analysis?.job_title || 'Unknown Position',
        job_description: jobDescription, // 完整保留 JD
        resume_file_name: resume.fileName || 'unknown',
        resume_type: resume.type,
        analysis_data: report, // JSON 報告
        content: text,         // 原始 AI 回應 (備份用)
        created_at: new Date().toISOString(),
      };

      try {
        const { data: savedData, error: dbError } = await supabase
          .from('analysis_reports')
          .insert(insertData)
          .select('id, job_title')
          .single();

        if (dbError) {
          console.error('❌ [DB Error] 資料庫寫入失敗:', dbError.message);
          console.error('❌ [DB Error Detail]:', JSON.stringify(dbError));
        } else {
          console.log(`✅ [DB Success] 報告已儲存! ID: ${savedData.id}`);
        }
      } catch (e: any) {
        console.error('❌ [DB Exception] 資料庫操作發生異常:', e.message);
      }
    } else {
      console.log('ℹ️ [DB Skip] 使用者未登入，跳過儲存步驟');
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`🏁 [API End] 處理完成，總耗時: ${totalDuration}秒`);

    // ==========================================
    // 10. 回傳結果給前端
    // ==========================================
    return NextResponse.json({
      report,
      modelUsed: MODEL_NAME,
      saved: !!user,
      meta: {
        duration: totalDuration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [Critical Error] API 全局錯誤:', error);
    
    const status = error.message.includes('Gemini API Error') ? 502 : 500;
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal Server Error',
        details: '請稍後再試或聯繫管理員'
      },
      { status }
    );
  }
}