import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120; // 2 minutes for video generation

interface JobbeagleRequest {
  companyName: string;
  jobTitle: string;
  description: string;
}

interface GeneratedContent {
  script: string;
  visualDescription: string;
  thumbnailBase64?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [Jobbeagle API] 開始處理腳本生成請求');

  try {
    const body: JobbeagleRequest = await request.json();
    const { companyName, jobTitle, description } = body;

    console.log(`📦 [Jobbeagle API] 接收資料: ${companyName} - ${jobTitle}`);

    if (!companyName || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName and jobTitle' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Jobbeagle API] 找不到 GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // 使用 Gemini 2.5 Flash-Lite 生成腳本和視覺描述
    const model = 'gemini-2.5-flash-lite';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `
      You are a top-tier video production expert with 30 years of experience.
      Create a compelling 30s-60s video script for a job opening.
      If company info is scarce, use a "Cute White Polar Bear" as the host.
      Output Format: JSON only.
      Language: Traditional Chinese (繁體中文). ALL content MUST be in Traditional Chinese.
    `;

    const prompt = `
      Company: ${companyName}
      Job Title: ${jobTitle}
      Job Description: ${description || 'No description provided'}

      Please generate:
      1. A video script (dialogue/narration) in Traditional Chinese.
      2. A visual description of the video style and key scenes in Traditional Chinese.
    `;

    const requestBody = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: "application/json",
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    console.log(`🤖 [Jobbeagle API] 調用 Gemini ${model}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Jobbeagle API] Gemini 錯誤: ${response.status}`, errorText.substring(0, 500));
      
      // 處理 429 配額用盡錯誤（符合指南建議）
      if (response.status === 429) {
        console.warn(`⚠️ [Jobbeagle API] 配額用盡 (429)，優雅地提示用戶`);
        throw new Error('今日額度已滿，請明天再來。API 配額已用盡，請稍後再試。');
      }
      
      // 如果 v1beta 失敗，嘗試 v1
      if (response.status === 404 || response.status === 400) {
        console.warn(`⚠️ [Jobbeagle API] v1beta 失敗，嘗試 v1 API...`);
        const v1Url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        const v1Response = await fetch(v1Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!v1Response.ok) {
          const v1ErrorText = await v1Response.text();
          console.error(`❌ [Jobbeagle API] v1 API 也失敗: ${v1Response.status}`, v1ErrorText.substring(0, 500));
          throw new Error(`Gemini API Error: ${v1Response.status} ${v1ErrorText.substring(0, 100)}`);
        }

        const v1Data = await v1Response.json();
        const parts = v1Data.candidates?.[0]?.content?.parts || [];
        const text = parts.map((part: any) => part.text || '').join('');

        if (!text) {
          throw new Error('No text response from Gemini');
        }

        // 清理 JSON 回應
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const jsonResponse = JSON.parse(cleanedText);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ [Jobbeagle API] 成功生成腳本 (${duration}秒)`);

        const result: GeneratedContent = {
          script: jsonResponse.script || '',
          visualDescription: jsonResponse.visualDescription || '',
        };

        return NextResponse.json(result);
      }

      throw new Error(`Gemini API Error: ${response.status} ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((part: any) => part.text || '').join('');

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    // 清理 JSON 回應
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonResponse = JSON.parse(cleanedText);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ [Jobbeagle API] 成功生成腳本 (${duration}秒)`);

    const result: GeneratedContent = {
      script: jsonResponse.script || '',
      visualDescription: jsonResponse.visualDescription || '',
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ [Jobbeagle API] 錯誤:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate script' },
      { status: 500 }
    );
  }
}
