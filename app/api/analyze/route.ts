import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

// 設定最大執行時間（雖然 Vercel 免費版由平台控制，但這行可以提醒 Next.js 不要太早斷開）
export const maxDuration = 60; 

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

# CRITICAL JSON FORMAT REQUIREMENTS
1. **Output MUST be valid JSON only** - Do NOT include any text before or after the JSON object.
2. **No Markdown code blocks** - Do NOT wrap the JSON in markdown code block markers (three backticks).
3. **No explanatory text** - Do NOT add comments, explanations, or any text outside the JSON structure.
4. **Valid JSON syntax** - Ensure all strings are properly quoted, all brackets are matched, and there are no trailing commas.
5. **Complete structure** - The JSON must include ALL required fields as specified in the Output Format section above.

**Example of CORRECT output:**
{
  "basic_analysis": { ... },
  "salary_analysis": { ... },
  ...
}

**Example of INCORRECT output:**
Do NOT wrap in markdown code blocks or add any text before/after the JSON object.
`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 開始處理分析請求');

  try {
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    console.log(`📦 [Data Received] JD 長度: ${jobDescription?.length}, Resume 類型: ${resume?.type}`);

    if (!jobDescription || !resume) {
      return NextResponse.json(
        { error: 'Missing required fields: jobDescription and resume' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Config Error] 找不到 GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    console.log('🔑 [Config] API Key 存在 (已遮罩)');
    console.log('🔑 [Config] API Key 長度:', apiKey.length);
    console.log('🔑 [Config] API Key 前綴:', apiKey.substring(0, 10) + '...');

    let baseJD = jobDescription.trim();
    const match104 = baseJD.match(/104\.com\.tw\/job\/(\w+)/);
    const matchLinkedIn = baseJD.match(/linkedin\.com\/.*currentJobId=(\d+)/) || baseJD.match(/linkedin\.com\/jobs\/view\/(\d+)/);

    let systemHint = "";
    if (match104) systemHint = `\n[SYSTEM_HINT]: 104 Job ID: ${match104[1]}`;
    else if (matchLinkedIn) systemHint = `\n[SYSTEM_HINT]: LinkedIn Job ID: ${matchLinkedIn[1]}`;

    const userParts: any[] = [
      { text: `[CONTEXT: JD ANALYSIS]\n\n${baseJD}${systemHint}` }
    ];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME ===\n${resume.content}` });
    }

    // 使用稳定的 Gemini 模型（优先使用 2.0，如果不可用则回退到 1.5）
    // 模型优先级列表（从最好到最差，免费账号优先使用稳定的模型）
    // 注意：免费账号可能需要使用带版本号的模型名称
    const modelPriority = [
      'gemini-1.5-flash-001',  // 带版本号的模型名称（免费账号常用）
      'gemini-1.5-flash',       // 不带版本号的模型名称
      'gemini-pro',             // 旧版模型（作为后备）
    ];

    // 免费账号可能不支持 response_mime_type，先不使用
    const requestBodyTemplate: any = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      generationConfig: { 
        temperature: 0.7,
        // response_mime_type: "application/json" // 免费账号可能不支持，先注释掉
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    let text = "";
    let lastError: any = null;
    let successfulModel = '';

    // 按优先级尝试不同模型
    for (const model of modelPriority) {
      try {
        // 优先尝试 v1beta API（免费账号通常使用 v1beta）
        // 注意：v1 API 可能对免费账号不可用，所以先尝试 v1beta
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`🤖 [Gemini] 嘗試使用模型: ${model} (v1beta API)...`);
        console.log(`🔗 [Gemini] URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);

        const fetchStartTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBodyTemplate),
        });

        const fetchDuration = (Date.now() - fetchStartTime) / 1000;
        console.log(`⏱️ [Gemini] ${model} 回應時間: ${fetchDuration}秒, Status: ${response.status}`);

        // 读取错误响应以便调试
        let errorText = '';
        if (!response.ok) {
          try {
            errorText = await response.text();
            console.error(`❌ [Gemini] ${model} 錯誤詳情:`, errorText.substring(0, 500));
          } catch (e) {
            console.error(`❌ [Gemini] ${model} 無法讀取錯誤訊息`);
          }
        }

        // 如果是 404 或 400，尝试使用 v1beta API
        if (response.status === 404 || response.status === 400) {
          console.warn(`⚠️ [Gemini] v1 API 失敗 (${response.status})，嘗試 v1beta API...`);
          if (errorText) {
            console.warn(`⚠️ [Gemini] v1 錯誤訊息: ${errorText.substring(0, 200)}`);
          }
          
          // 尝试 v1beta API
          try {
            const v1betaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            console.log(`🔄 [Gemini] 嘗試 v1beta API: ${v1betaUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
            
            const v1betaResponse = await fetch(v1betaUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBodyTemplate),
            });

            const v1betaDuration = (Date.now() - fetchStartTime) / 1000;
            console.log(`⏱️ [Gemini] v1beta 回應時間: ${v1betaDuration}秒, Status: ${v1betaResponse.status}`);

            if (v1betaResponse.ok) {
              const v1betaData = await v1betaResponse.json();
              if (v1betaData.candidates && v1betaData.candidates[0] && v1betaData.candidates[0].content) {
                const parts = v1betaData.candidates[0].content.parts || [];
                text = parts.map((part: any) => part.text || '').join('');
                successfulModel = model;
                console.log(`✅ [Gemini] v1beta API 成功，回應長度: ${text.length}`);
                break; // 成功，退出循环
              }
            } else {
              const v1betaErrorText = await v1betaResponse.text();
              console.error(`❌ [Gemini] v1beta API 也失敗: ${v1betaResponse.status} - ${v1betaErrorText.substring(0, 200)}`);
              lastError = new Error(`Model ${model} not available in both v1 and v1beta: ${v1betaErrorText.substring(0, 100)}`);
              continue; // 尝试下一个模型
            }
          } catch (v1betaError: any) {
            console.error(`❌ [Gemini] v1beta API 請求失敗:`, v1betaError.message);
            lastError = new Error(`Model ${model} not available: ${response.status} ${errorText.substring(0, 100)}`);
            continue; // 尝试下一个模型
          }
        }

        // 如果是 401，说明 API Key 有问题
        if (response.status === 401) {
          console.error(`❌ [Gemini] API Key 無效或過期 (401)`);
          throw new Error('Gemini API Key 無效或過期，請檢查環境變數 GEMINI_API_KEY');
        }

        // 如果是 403，说明权限不足
        if (response.status === 403) {
          console.error(`❌ [Gemini] 權限不足 (403)`);
          throw new Error('Gemini API 權限不足，請檢查 API Key 權限或帳號限制');
        }

        // 如果是 503，等待后重试同一模型
        if (response.status === 503) {
          const errorText = await response.text();
          console.warn(`⚠️ [Gemini 503] 伺服器過載，等待 2 秒後重試 ${model}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // 重试一次
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBodyTemplate),
          });

          if (!retryResponse.ok) {
            console.warn(`⚠️ [Gemini] ${model} 重試後仍失敗，降級到下一個模型...`);
            continue;
          }

          const retryData = await retryResponse.json();
          if (retryData.candidates && retryData.candidates[0] && retryData.candidates[0].content) {
            const parts = retryData.candidates[0].content.parts || [];
            text = parts.map((part: any) => part.text || '').join('');
            successfulModel = model;
            console.log(`✅ [Gemini] ${model} 重試成功，回應長度: ${text.length}`);
            break;
          }
        }

        if (!response.ok) {
          // 如果之前已经读取过错误文本，就不重复读取
          if (!errorText) {
            try {
              errorText = await response.text();
            } catch (e) {
              errorText = `无法读取错误信息: ${e}`;
            }
          }
          console.error(`❌ [Gemini Error] ${model} API 回應錯誤: ${response.status} ${response.statusText}`);
          console.error(`❌ [Gemini Error] 詳細錯誤: ${errorText.substring(0, 300)}`);
          lastError = new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
          console.log(`🔄 [Gemini] 降級到下一個模型...`);
          continue; // 尝试下一个模型
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = data.candidates[0].content.parts || [];
          text = parts.map((part: any) => part.text || '').join('');
          successfulModel = model;
          console.log(`✅ [Gemini] ${model} 成功取得回應，長度: ${text.length}`);
          break; // 成功，退出循环
        } else {
          console.error(`❌ [Gemini] ${model} 回應格式異常:`, JSON.stringify(data).substring(0, 200));
          console.log(`🔄 [Gemini] 降級到下一個模型...`);
          continue; // 尝试下一个模型
        }

      } catch (error: any) {
        console.error(`❌ [Gemini] ${model} 請求失敗:`, error.message);
        lastError = error;
        console.log(`🔄 [Gemini] 降級到下一個模型...`);
        continue; // 尝试下一个模型
      }
    }

    if (!text) {
      const errorMessage = lastError 
        ? `所有模型都失敗了。已嘗試: ${modelPriority.join(', ')}。最後錯誤: ${lastError.message}`
        : `所有模型都失敗了。已嘗試: ${modelPriority.join(', ')}`;
      console.error(`❌ [Gemini] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`🎉 [Gemini] 最終使用模型: ${successfulModel}`);
    
    // ==========================================
    // 🛡️ 強化的 JSON 解析防護罩
    // ==========================================
    const fullResponseText = text;
    let report: InterviewReport;

    try {
      console.log('🔍 [Parsing] 開始解析 JSON...');
      console.log('📏 [Parsing] 原始文字長度:', text.length);
      
      // 步驟 1: 移除 Markdown 代碼塊標記
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // 步驟 2: 移除可能的開頭說明文字（直到第一個 {）
      const firstBraceIndex = cleanText.indexOf('{');
      if (firstBraceIndex > 0) {
        console.log(`⚠️ [Parsing] 發現 ${firstBraceIndex} 個字符的前綴文字，已移除`);
        cleanText = cleanText.substring(firstBraceIndex);
      }
      
      // 步驟 3: 找到最後一個 } 的位置（處理可能的後綴文字）
      const lastBraceIndex = cleanText.lastIndexOf('}');
      if (lastBraceIndex > 0 && lastBraceIndex < cleanText.length - 1) {
        console.log(`⚠️ [Parsing] 發現後綴文字，已移除`);
        cleanText = cleanText.substring(0, lastBraceIndex + 1);
      }
      
      // 步驟 4: 嘗試找到完整的 JSON 對象（使用括號匹配）
      let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // 步驟 5: 修復常見的 JSON 格式問題
      // 移除尾隨逗號
      cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');
      
      // 步驟 6: 驗證 JSON 結構完整性
      const openBraces = (cleanText.match(/\{/g) || []).length;
      const closeBraces = (cleanText.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.warn(`⚠️ [Parsing] 括號不匹配: { ${openBraces} vs } ${closeBraces}`);
        // 嘗試修復：如果缺少閉合括號，添加它們
        if (openBraces > closeBraces) {
          cleanText += '}'.repeat(openBraces - closeBraces);
          console.log('🔧 [Parsing] 已自動添加缺失的閉合括號');
        }
      }
      
      // 步驟 7: 解析 JSON
      report = JSON.parse(cleanText);
      console.log('✅ [Parsing] JSON 解析成功');
      
      // 步驟 8: 驗證必要字段
      if (!report.basic_analysis || !report.match_analysis) {
        throw new Error('JSON 結構不完整：缺少必要字段 (basic_analysis 或 match_analysis)');
      }
      
    } catch (e: any) {
      console.error('❌ [Parsing Error] JSON 解析失敗！');
      console.error('錯誤訊息:', e.message);
      console.error('--- 原始文字開頭 (前 500 字符) ---');
      console.error(text.substring(0, 500));
      console.error('--- 原始文字結尾 (後 500 字符) ---');
      console.error(text.substring(Math.max(0, text.length - 500)));
      
      // 容錯：最後嘗試手動修復
      try {
        console.log('🔧 [Parsing] 嘗試容錯修復...');
        let fixedText = text;
        
        // 移除所有標記
        fixedText = fixedText.replace(/```[\w]*\s*/g, '');
        fixedText = fixedText.replace(/`/g, '');
        fixedText = fixedText.trim();
        
        // 提取 JSON
        const match = fixedText.match(/\{[\s\S]*\}/);
        if (match) {
          fixedText = match[0];
          fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
          
          // 修復括號
          const open = (fixedText.match(/\{/g) || []).length;
          const close = (fixedText.match(/\}/g) || []).length;
          if (open > close) {
            fixedText += '}'.repeat(open - close);
          }
          
          report = JSON.parse(fixedText);
          console.log('✅ [Parsing] 容錯修復成功！');
        } else {
          throw new Error('無法找到有效的 JSON 結構');
        }
      } catch (fixError: any) {
        console.error('❌ [Parsing] 容錯修復也失敗:', fixError);
        console.error('------------------');
        
        return NextResponse.json(
          { 
              error: 'AI Generated Invalid JSON', 
              details: e.message,
              rawText: text.substring(0, 1000),
              hint: 'AI 返回的內容不是有效的 JSON 格式。請重試或檢查 API 設定。'
          },
          { status: 500 }
        );
      }
    }

    // 先返回報告給用戶，提升響應速度
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`🏁 [API End] AI 分析完成，耗時: ${totalDuration}秒`);

    // 🔥 重要：保存到數據庫（改為同步，確保保存成功）
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('💾 [DB] 準備保存報告到數據庫...');
    console.log('💾 [DB] 用戶狀態:', user ? `已登入 (ID: ${user.id})` : '未登入');
    
    if (!user) {
      console.warn('⚠️  [DB] 用戶未登入，報告將不會保存到數據庫');
    } else {
      const insertData: any = {
        user_id: user.id,
        job_title: report.basic_analysis?.job_title || 'Unknown',
        job_description: jobDescription,
        resume_file_name: resume.fileName || 'unknown',
        resume_type: resume.type,
        analysis_data: report,
        content: fullResponseText,
        created_at: new Date().toISOString(),
      };

      console.log('💾 [DB] 插入數據:', {
        user_id: insertData.user_id,
        job_title: insertData.job_title,
        resume_file_name: insertData.resume_file_name
      });

      try {
        const { data: savedData, error: dbError } = await supabase
          .from('analysis_reports')
          .insert(insertData)
          .select('id, job_title, created_at')
          .single();

        if (dbError) {
          console.error('❌ [DB Error] 儲存失敗:', dbError.message);
          console.error('❌ [DB Error] 錯誤代碼:', dbError.code);
          console.error('❌ [DB Error] 錯誤詳情:', JSON.stringify(dbError, null, 2));
        } else if (savedData) {
          console.log('✅ [DB Success] 報告已成功保存！');
          console.log('✅ [DB Success] 報告 ID:', savedData.id);
          console.log('✅ [DB Success] 職位標題:', savedData.job_title);
          console.log('✅ [DB Success] 保存時間:', savedData.created_at);
        }
      } catch (e: any) {
        console.error('❌ [DB Exception] 保存時發生異常:', e);
        console.error('❌ [DB Exception] 異常訊息:', e?.message);
      }
    }

    return NextResponse.json({
      report,
      modelUsed: successfulModel || 'unknown',
      saved: !!user, // 告訴前端是否已保存
    });

  } catch (error: any) {
    console.error('❌ [Critical Error] API 全局錯誤:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}