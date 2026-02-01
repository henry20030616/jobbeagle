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
// 3. AI 指令生成函數 (根據語言動態生成)
// ==========================================
const generateSystemInstruction = (language: 'zh' | 'en' = 'zh'): string => {
  const langRule = language === 'zh' 
    ? '1. **Language**: Traditional Chinese (繁體中文). ALL content MUST be in Traditional Chinese.'
    : '1. **Language**: English. ALL content MUST be in English.';
  
  return `
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
- **Company Reviews**: Search for real employee reviews from Glassdoor, PTT, Dcard, and other platforms to provide authentic company culture insights.

# Detailed Requirements (具體產出要求)
**CRITICAL: Keep all sections CONCISE except industry_trends**

1. **Match Analysis**: Provide 3-5 BRIEF points for "Matching Points" and "Skill Gaps". Each point should be 1-2 sentences maximum.
2. **Salary**: ${language === 'zh' 
    ? 'Strictly format as "Amount + (年薪)" or "Amount + (月薪)". E.g., "1.8M - 2.5M TWD (年薪)".' 
    : 'Strictly format as "Amount + (Annual Salary)" or "Amount + (Monthly Salary)". E.g., "1.8M - 2.5M TWD (Annual Salary)".'} Keep rationale and negotiation_tip to 2-3 bullet points maximum.
3. **Moat**: Focus strictly on the company's inherent strategic advantages. Keep each advantage description to 1-2 sentences. Avoid lengthy explanations.
4. **Competitive Landscape**: The table MUST include the target company itself alongside its competitors (at least 4-5 major rivals). Keep strengths/weaknesses to 1 sentence each.
5. **Industry Analysis**: The "industry_trends" is the ONLY section where detailed, comprehensive analysis is allowed. ${language === 'zh' 
    ? 'Format: "簡介: [Deep Intro] \\n 現況與趨勢: [Current Market Status & Forward Trends]"' 
    : 'Format: "Introduction: [Deep Intro] \\n Current Status & Trends: [Current Market Status & Forward Trends]"'}. This can be longer and more detailed.
6. **Corporate Analysis**: Keep culture, interview process, and risks summaries to 3-4 bullet points maximum. Be concise.
7. **Real Interview Questions**:
    - **MUST search for REAL questions** from Glassdoor, PTT, Dcard, LinkedIn, or similar platforms.
    - Return 5+ questions from actual interviews.
    - "job_title" field: Format as "Company Name Position" ${language === 'zh' ? '(e.g., "群聯電子 產品經理")' : '(e.g., "TSMC Senior Engineer")'}.
    - "year" field: Format as "[Source Website Name] YYYY.MM" (e.g., "[Glassdoor] 2023.08").
    - "source_url" field: Include the actual URL if available.
8. **Mock Interview Prep**: Generate at least 10 questions total.
    - **ORDER**: List 5 Technical questions FIRST, then 5 Behavioral questions.
    - **Labeling**: ${language === 'zh' ? 'Prefix with "[技術面]" or "[行為面]".' : 'Prefix with "[Technical]" or "[Behavioral]".'}
    - **Answer Advice**: The "answer_guide" must be BRIEF (2-3 sentences maximum). ${language === 'zh' 
      ? 'Start with "回答建議：", followed by concise, actionable advice.' 
      : 'Start with "Answer Advice:", followed by concise, actionable advice.'}

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
    "estimated_range": "${language === 'zh' ? 'e.g., 1.8M - 2.5M TWD (年薪)' : 'e.g., 1.8M - 2.5M TWD (Annual Salary)'}",
    "market_position": "BRIEF objective ranking (1 sentence).",
    "negotiation_tip": "CONCISE tactics. 2-3 bullet points maximum.",
    "rationale": "${language === 'zh' 
      ? 'BRIEF data-driven logic. 2-3 bullet points maximum. Format as \'分析推估邏輯：\' followed by bullet points.' 
      : 'BRIEF data-driven logic. 2-3 bullet points maximum. Format as \'Analysis & Estimation Logic:\' followed by bullet points.'}"
  },
  "market_analysis": {
    "industry_trends": "${language === 'zh' 
      ? '簡介: [DETAILED - This is the ONLY section allowed to be comprehensive] \\n 現況與趨勢: [DETAILED - Can be longer and more detailed]. MUST include current market status, growth trends, technology adoption, regulatory changes, and future outlook.' 
      : 'Introduction: [DETAILED - This is the ONLY section allowed to be comprehensive] \\n Current Status & Trends: [DETAILED - Can be longer and more detailed]. MUST include current market status, growth trends, technology adoption, regulatory changes, and future outlook.'}",
    "positioning": "BRIEF strategic assessment (1 sentence).",
    "competition_table": [
       {"name": "Competitor (Include Target Co)", "strengths": "BRIEF (1 sentence)", "weaknesses": "BRIEF (1 sentence)"}
    ],
    "key_advantages": [{"point": "${language === 'zh' 
      ? 'Core Moat/Advantage (e.g., \'技術護城河\', \'品牌優勢\', \'市場地位\')' 
      : 'Core Moat/Advantage (e.g., \'Technology Moat\', \'Brand Advantage\', \'Market Position\')'}", "description": "BRIEF description of the company's strategic moat (1-2 sentences maximum). Focus on competitive advantages that are hard to replicate."}],
    "potential_risks": [{"point": "${language === 'zh' 
      ? 'Strategic Risk (e.g., \'市場競爭加劇\', \'技術變革風險\', \'監管風險\')' 
      : 'Strategic Risk (e.g., \'Intensified Market Competition\', \'Technological Disruption Risk\', \'Regulatory Risk\')'}", "description": "BRIEF description of long-term strategic risks (1-2 sentences maximum). Focus on risks that could impact the company's competitive position."}]
  },
  "reviews_analysis": {
    "company_reviews": { 
      "summary": "CONCISE cultural analysis based on REAL reviews from Glassdoor/PTT/Dcard. Should cover: work environment, team collaboration, work-life balance, innovation culture. 3-4 bullet points maximum.", 
      "pros": ["Real positive aspects from reviews (e.g., good benefits, growth opportunities)"], 
      "cons": ["Real negative aspects from reviews (e.g., high workload, bureaucracy)"] 
    },
    "job_reviews": { 
      "summary": "CONCISE process/difficulty breakdown from REAL interview experiences. Should cover: interview stages, typical difficulty level, common focus areas, preparation tips. 3-4 bullet points maximum.", 
      "pros": [], 
      "cons": [] 
    },
    "real_interview_questions": [
      {
         "question": "Actual question text from real interviews (search Glassdoor, PTT, Dcard, LinkedIn)",
         "job_title": "${language === 'zh' 
           ? 'Format: [Company] [Position] (e.g., \'台新銀行 AI應用規劃師\')' 
           : 'Format: [Company] [Position] (e.g., \'TSMC Senior Engineer\')'}",
         "year": "Format: [[Source] YYYY.MM] (e.g., '[Glassdoor] 2023.08')",
         "source_url": "URL if available"
      }
    ]
  },
  "match_analysis": {
    "score": 85,
    "matching_points": [{"point": "Fit", "description": "BRIEF professional alignment (1-2 sentences)"}],
    "skill_gaps": [{"gap": "Gap", "description": "BRIEF interview strategy (1-2 sentences)"}]
  },
    "interview_preparation": {
      "questions": [{"question": "Simulated Q", "source": "BRIEF analytical logic (1 sentence)", "answer_guide": "${language === 'zh' ? '回答建議：[CONCISE advice, 2-3 sentences maximum]' : 'Answer Advice: [CONCISE advice, 2-3 sentences maximum]'}"}]
    },
  "references": {
    "deep_research": [{"title": "Title", "url": "URL"}],
    "data_citations": [{"title": "Source", "url": "URL"}]
  }
}

# Rules
${langRule}
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
6. **ALL text content MUST be in ${language === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English'}** - No ${language === 'zh' ? 'English' : 'Chinese'} content except for technical terms or proper nouns.
`;
};

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
    const { jobDescription, resume, language = 'zh' } = body;

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
    
    const systemInstruction = generateSystemInstruction(language);
    
    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
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
    
    // 5. 解析報告
    const report = cleanAndParseJSON(textResult);
    
    // 6. 保存到數據庫（如果用戶已登入）
    let savedReportId = null;
    if (!isGuest) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: savedData, error: dbError } = await supabase
            .from('analysis_reports')
            .insert({
              user_id: user.id,
              job_title: report.basic_analysis?.job_title || 'Unknown',
              job_description: jobDescription,
              resume_file_name: resume.fileName || 'unknown',
              resume_type: resume.type,
              analysis_data: report,
              content: textResult,
              created_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          
          if (!dbError && savedData) {
            savedReportId = savedData.id;
            console.log('✅ [DB] 報告已保存，ID:', savedReportId);
          } else if (dbError) {
            console.error('❌ [DB] 保存失敗:', dbError.message);
          }
        }
      } catch (dbErr: any) {
        console.error('❌ [DB] 保存異常:', dbErr.message);
      }
    }
    
    return NextResponse.json({ 
      report, 
      modelUsed: MODEL_NAME,
      saved: !!savedReportId,
      id: savedReportId,
      is_logged_in: !isGuest
    });

  } catch (error: any) {
    console.error('API Error:', error);
    const status = error.message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}