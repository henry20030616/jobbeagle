import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🟢 設定模型：使用標準名稱，不加 latest 避免路徑問題
const MODEL_NAME = 'gemini-1.5-flash';

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
    "industry_trends": "簡介: [DETAILED] \n 現況與趨勢: [DETAILED]",
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
3. **CRITICAL JSON FORMAT REQUIREMENTS**: Output MUST be valid JSON only. Do NOT include markdown code blocks.
`;

function cleanAndParseJSON(text: string): InterviewReport {
  try {
    console.log('🔍 [Parsing] 原始回應長度:', text.length);
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBraceIndex = cleanText.indexOf('{');
    if (firstBraceIndex > 0) cleanText = cleanText.substring(firstBraceIndex);
    const lastBraceIndex = cleanText.lastIndexOf('}');
    if (lastBraceIndex > 0 && lastBraceIndex < cleanText.length - 1) {
      cleanText = cleanText.substring(0, lastBraceIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('❌ [Parsing Error]', error.message);
    throw new Error(`AI 資料格式錯誤: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 收到分析請求');
  console.log(`🔥 [Debug] 使用模型: ${MODEL_NAME}`);

  try {
    const body: UserInputs = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription || !resume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    let baseJD = jobDescription.trim();
    const match104 = baseJD.match(/104\.com\.tw\/job\/(\w+)/);
    const matchLinkedIn = baseJD.match(/linkedin\.com\/.*currentJobId=(\d+)/) || baseJD.match(/linkedin\.com\/jobs\/view\/(\d+)/);

    let systemHint = "";
    if (match104) systemHint = `\n[SYSTEM_HINT]: 104 Job ID: ${match104[1]}`;
    else if (matchLinkedIn) systemHint = `\n[SYSTEM_HINT]: LinkedIn Job ID: ${matchLinkedIn[1]}`;

    const userParts: any[] = [{ text: `[CONTEXT: JD ANALYSIS]\n\n${baseJD}${systemHint}` }];
    if (resume.type === 'file' && resume.mimeType) {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME CONTENT ===\n${resume.content}` });
    }

    // 🟢 使用 v1beta，網址寫死
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

    const maxRetries = 3;
    let lastError: any = null;
    let text = "";

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`⏳ [Attempt ${attempt + 1}] Requesting ${MODEL_NAME}...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store'
        });

        if (response.status === 503) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [Gemini Error] ${response.status}: ${errorText}`);
          throw new Error(`Gemini API Error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts) {
          text = data.candidates[0].content.parts.map((p: any) => p.text).join('');
          console.log('✅ 成功取得回應');
        } else {
          throw new Error('No content in response');
        }
        break; 
      } catch (error: any) {
        lastError = error;
        console.error(`❌ 失敗 (${attempt + 1}/${maxRetries}):`, error.message);
        if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!text && lastError) throw lastError;
    const report = cleanAndParseJSON(text);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('analysis_reports').insert({
        user_id: user.id,
        job_title: report.basic_analysis?.job_title || 'Unknown',
        job_description: jobDescription,
        resume_file_name: resume.fileName || 'unknown',
        resume_type: resume.type,
        analysis_data: report,
        content: text,
        created_at: new Date().toISOString(),
      });
      console.log('✅ DB 儲存成功');
    }

    return NextResponse.json({
      report,
      modelUsed: MODEL_NAME,
      saved: !!user
    });

  } catch (error: any) {
    console.error('❌ [Critical Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}