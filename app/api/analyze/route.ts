import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_INSTRUCTION = `
# Role (角色設定)
You are a dual-expert persona with 30 years of top-tier experience:
1. **Global Headhunter & Senior HR Director**: Specialist in decoding organizational logic, identifying "hidden" job requirements, and assessing cultural alignment at the executive level.
2. **Career Expert (求職專家)**: Specialist in industrial lifecycles, competitive moats, business models, financial health, and strategic market positioning.

# Task (任務)
Analyze the provided Job Description (JD) and Resume to generate a "Winning Strategy Report". Your output must be:
- **Concise & Focused**: Keep all sections BRIEF and to the point. Only provide essential information.
- **Exception - Industry Analysis**: The "industry_trends" section is the ONLY exception where detailed, comprehensive analysis is allowed and expected.
- **High-Density**: Use professional, data-driven terminology. Avoid verbose explanations.
- **Objective & Neutral**: Provide a hard-hitting, realistic assessment.

**CRITICAL SEARCH INSTRUCTIONS (真實數據調查)**:
You MUST use Google Search to retrieve high-fidelity, recent data. 
- **Interview Intelligence**: Search for actual interview questions and process stages from the last 24 months (e.g., Glassdoor, PTT, Dcard, LinkedIn). Gather 5+ real questions from the same company (or highly similar roles if strictly unavailable).
- **Salary Benchmarking**: Cross-reference actual market pay scales for this specific company or its direct tier-1 competitors.
- **Strategic Context**: Analyze the company's latest news, strategic pivots, or earnings reports.

# Detailed Requirements (具體產出要求)
**CRITICAL: Keep all sections CONCISE except industry_trends**

1. **Match Analysis**: Provide 3-5 BRIEF points for "Matching Points" and "Skill Gaps". Each point should be 1-2 sentences maximum.
2. **Salary**: Strictly format as "Amount + (年薪)" or "Amount + (月薪)". E.g., "1.8M - 2.5M TWD (年薪)". Keep rationale and negotiation_tip to 2-3 bullet points maximum.
3. **Moat (護城河)**: Focus strictly on the company's inherent strategic advantages. Keep each advantage description to 1-2 sentences. Avoid lengthy explanations.
4. **Competitive Landscape (競爭格局)**: The table MUST include the target company itself alongside its competitors (at least 4-5 major rivals). Keep strengths/weaknesses to 1 sentence each.
5. **Industry Analysis (唯一可詳細的部分)**: The "industry_trends" is the ONLY section where detailed, comprehensive analysis is allowed. Format: "簡介: [Deep Intro] \n 現況與趨勢: [Current Market Status & Forward Trends]". This can be longer and more detailed.
6. **Corporate Analysis**: Keep culture, interview process, and risks summaries to 3-4 bullet points maximum. Be concise.
7. **Real Interview Questions**:
    - Return 5+ questions.
    - "job_title" field: Format as "Company Name Position" (e.g., "群聯電子 產品經理").
    - "year" field: Format as "[Source Website Name] YYYY.MM" (e.g., "[glassdoor 2023.08").
8. **Mock Interview Prep**: Generate at least 10 questions total.
    - **ORDER**: List 5 Technical questions FIRST, then 5 Behavioral questions.
    - **Labeling**: Prefix with "[技術面]" or "[行為面]".
    - **Answer Advice**: The "answer_guide" must be BRIEF (2-3 sentences maximum). Start with "回答建議：", followed by concise, actionable advice.

# Output Format (JSON)
{
  "basic_analysis": {
    "job_title": "Full Professional Job Title",
    "company_overview": "BRIEF analysis. 2-3 bullet points maximum.",
    "business_scope": "CONCISE breakdown. 2-3 bullet points maximum.",
    "company_trends": "BRIEF strategic shifts. 2-3 bullet points maximum.",
    "job_summary": "CONCISE decoding of JD demands. 2-3 bullet points maximum.",
    "hard_requirements": ["Mandatory technical or certification requirements"]
  },
  "salary_analysis": {
    "estimated_range": "e.g., 1.8M - 2.5M TWD (年薪)",
    "market_position": "BRIEF objective ranking (1 sentence).",
    "negotiation_tip": "CONCISE tactics. 2-3 bullet points maximum.",
    "rationale": "BRIEF data-driven logic. 2-3 bullet points maximum."
  },
  "market_analysis": {
    "industry_trends": "簡介: [DETAILED - This is the ONLY section allowed to be comprehensive] \n 現況與趨勢: [DETAILED - Can be longer and more detailed]",
    "positioning": "BRIEF strategic assessment (1 sentence).",
    "competition_table": [
       {"name": "Competitor (Include Target Co)", "strengths": "BRIEF (1 sentence)", "weaknesses": "BRIEF (1 sentence)"}
    ],
    "key_advantages": [{"point": "Advantage", "description": "BRIEF (1-2 sentences maximum)"}],
    "potential_risks": [{"point": "Risk", "description": "BRIEF (1-2 sentences maximum)"}]
  },
  "reviews_analysis": {
    "company_reviews": { "summary": "CONCISE cultural analysis. 3-4 bullet points maximum.", "pros": [], "cons": [] },
    "job_reviews": { "summary": "CONCISE process/difficulty breakdown. 3-4 bullet points maximum.", "pros": [], "cons": [] },
    "real_interview_questions": [
      {
         "question": "Actual question text",
         "job_title": "Format: [Company] [Position]",
         "year": "Format: [[Source] YYYY.MM]",
         "source_url": "URL"
      }
    ]
  },
  "match_analysis": {
    "score": 85,
    "matching_points": [{"point": "Fit", "description": "BRIEF professional alignment (1-2 sentences)"}],
    "skill_gaps": [{"gap": "Gap", "description": "BRIEF interview strategy (1-2 sentences)"}]
  },
  "interview_preparation": {
    "questions": [{"question": "Simulated Q", "source": "BRIEF analytical logic (1 sentence)", "answer_guide": "回答建議：[CONCISE advice, 2-3 sentences maximum]"}]
  },
  "references": {
    "deep_research": [{"title": "Title", "url": "URL"}],
    "data_citations": [{"title": "Source", "url": "URL"}]
  }
}

# Rules
1. **Language**: Traditional Chinese (繁體中文).
2. **Professional Tone**: Board-level strategic consultant tone.
3. **Length Control**: 
   - Keep ALL sections BRIEF and concise (1-3 sentences or 2-4 bullet points maximum per item).
   - ONLY exception: "industry_trends" can be detailed and comprehensive.
   - Avoid verbose explanations, redundant information, or unnecessary elaboration.
   - Focus on actionable insights, not lengthy descriptions.
`;

export async function POST(request: NextRequest) {
  try {
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json(
        { error: 'Missing required fields: jobDescription and resume' },
        { status: 400 }
      );
    }

    // 支援兩種環境變數名稱
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    let baseJD = jobDescription.trim();
    const match104 = baseJD.match(/104\.com\.tw\/job\/(\w+)/);
    const matchLinkedIn = baseJD.match(/linkedin\.com\/.*currentJobId=(\d+)/) || baseJD.match(/linkedin\.com\/jobs\/view\/(\d+)/);

    let systemHint = "";
    if (match104) systemHint = `\n[SYSTEM_HINT]: 104 Job ID: ${match104[1]}`;
    else if (matchLinkedIn) systemHint = `\n[SYSTEM_HINT]: LinkedIn Job ID: ${matchLinkedIn[1]}`;

    // 準備用戶內容的 parts
    const userParts: any[] = [
      { 
        text: `[CONTEXT: JD ANALYSIS]\n\n${baseJD}${systemHint}` 
      }
    ];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME ===\n${resume.content}` });
    }

    // 使用原生 fetch 調用 Gemini API，包含 503 重試機制
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // ============================================
    // 解決 API 欄位錯誤：確保使用 system_instruction (底線格式) 而非 systemInstruction
    // 移除所有 tools 參數
    // ============================================
    const requestBody: any = {
      system_instruction: {
        parts: [
          {
            text: SYSTEM_INSTRUCTION
          }
        ]
      },
      contents: [
        {
          parts: userParts
        }
      ],
      generationConfig: {
        temperature: 0.7
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
      // 注意：已移除所有 tools 參數，避免 API 錯誤
    };

    const maxRetries = 3;
    let lastError: any = null;
    let text = "";

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        // ============================================
        // 穩定性：實作 503 Service Unavailable 的自動重試邏輯（Exponential Backoff）
        // ============================================
        if (response.status === 503) {
          // 錯誤處理：先用 response.text() 印出原始錯誤內容
          const errorText = await response.text();
          console.warn(
            `⚠️  [Gemini API] 伺服器過載 (503)，重試中... (嘗試 ${attempt + 1}/${maxRetries})`,
            {
              errorText: errorText,
              timestamp: new Date().toISOString(),
            }
          );

          // 指數退避：等待時間 = 2^attempt 秒
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));

          lastError = new Error(`Server overloaded (503): ${errorText}`);
          continue; // 繼續重試
        }

        // ============================================
        // 錯誤處理：如果 API 報錯，先用 response.text() 印出原始錯誤內容
        // 不要直接執行 response.json() 導致解析崩潰
        // ============================================
        if (!response.ok) {
          // 先取得錯誤文字並記錄日誌（避免直接調用 response.json() 導致崩潰）
          const errorText = await response.text();
          console.error(
            `❌ [Gemini API] 請求失敗 (${response.status})`,
            {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText, // 原始錯誤內容
              timestamp: new Date().toISOString(),
            }
          );

          // 嘗試解析為 JSON（如果失敗，使用原始文字）
          let errorData: any = null;
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // 如果不是 JSON，使用原始文字
            errorData = { error: errorText };
          }

          throw new Error(
            errorData.error?.message ||
            errorData.message ||
            `API request failed with status ${response.status}: ${errorText}`
          );
        }

        // 成功回應，解析 JSON
        const data = await response.json();

        // 提取回應文字
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = data.candidates[0].content.parts || [];
          text = parts
            .map((part: any) => part.text || '')
            .join('');
        }

        break; // 成功，跳出重試循環
      } catch (error: any) {
        lastError = error;

        // 如果是 503 錯誤且還有重試機會，繼續重試
        if (error.message?.includes('503') && attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 其他錯誤或已達最大重試次數，拋出錯誤
        if (attempt === maxRetries - 1) {
          console.error(
            `❌ [Gemini API] 重試失敗，已達最大重試次數 (${maxRetries})`,
            {
              error: error.message || error,
              timestamp: new Date().toISOString(),
            }
          );
          throw error;
        }
      }
    }

    // 如果所有重試都失敗，拋出最後的錯誤
    if (!text && lastError) {
      throw lastError || new Error('Failed to generate content after all retries');
    }
    
    // 保存完整的 AI 回應文字（用於存入 content 欄位）
    const fullResponseText = text;
    
    // 提取 JSON 部分
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const report: InterviewReport = JSON.parse(text);

    // Save to Supabase
    const supabase = await createClient();
    
    // ============================================
    // 確保欄位完全對齊：將分析數據存入 analysis_data，將完整文字存入 content 欄位
    // ============================================
    const insertData: any = {
      job_title: report.basic_analysis?.job_title || 'Unknown',
      job_description: jobDescription,
      resume_file_name: resume.fileName || 'unknown',
      resume_type: resume.type,
      analysis_data: report, // 使用 analysis_data 欄位名稱儲存 JSON 結構
      content: fullResponseText, // 使用 content 欄位名稱儲存完整文字
      created_at: new Date().toISOString(),
    };

    // ============================================
    // 確保分析報告正確關聯到用戶帳號
    // ============================================
    try {
      // 使用 createClient() 從 cookies 中獲取用戶 session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && user && user.id) {
        insertData.user_id = user.id;
        console.log('✅ 成功獲取用戶資訊，將儲存到用戶帳號:', user.id);
      } else {
        // 如果無法獲取用戶，記錄警告但不阻止儲存（RLS 會處理權限）
        console.warn('⚠️ 無法獲取用戶資訊:', userError?.message || '用戶未登入');
        console.warn('將嘗試儲存（如果 RLS 允許匿名儲存）');
      }
    } catch (authError: any) {
      // 如果出現認證錯誤，記錄但不阻止儲存（RLS 會處理權限）
      console.warn('⚠️ 獲取用戶資訊時發生錯誤:', authError.message || authError);
      console.warn('將嘗試儲存（如果 RLS 允許匿名儲存）');
    }

    const { data: savedReport, error: dbError } = await supabase
      .from('analysis_reports')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      // 使用 JSON.stringify 完整序列化錯誤物件，避免 {} 空報錯
      const errorString = JSON.stringify(dbError, null, 2);
      console.error('❌ 儲存分析報告失敗');
      console.error('錯誤代碼:', dbError.code || 'UNKNOWN');
      console.error('錯誤訊息:', dbError.message || '未知錯誤');
      console.error('錯誤詳情:', dbError.details || null);
      console.error('完整錯誤物件:', errorString);
      // Still return the report even if DB save fails
    } else {
      console.log('✅ 分析報告儲存成功:', savedReport?.id);
    }

    return NextResponse.json({
      report,
      savedReportId: savedReport?.id,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
