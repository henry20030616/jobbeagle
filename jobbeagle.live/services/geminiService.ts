import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from '../types';

// Helper to get fresh AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateJobScriptAndImage = async (
  companyName: string,
  jobTitle: string,
  baseDescription: string
): Promise<GeneratedContent> => {
  const ai = getAI();
  
  // 1. Generate Script and Visual Description using Gemini 3 Pro
  const modelId = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are a top-tier video production expert with 30 years of experience.
    Create a compelling 30s-60s video script for a job opening.
    If company info is scarce, use a "Cute White Polar Bear" as the host.
    Output Format: JSON only.
  `;

  const prompt = `
    Company: ${companyName}
    Job Title: ${jobTitle}
    Job Description: ${baseDescription}

    Please generate:
    1. A video script (dialogue/narration).
    2. A visual description of the video style and key scenes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.STRING },
            visualDescription: { type: Type.STRING },
          },
          required: ["script", "visualDescription"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");
    
    const jsonResponse = JSON.parse(text);

    // 2. Generate a Thumbnail Image
    const imageModelId = "gemini-3-pro-image-preview";
    let thumbnailBase64 = undefined;

    try {
        const imagePrompt = `
            High quality, cinematic, photorealistic 4k vertical thumbnail.
            Scene: ${jsonResponse.visualDescription.substring(0, 300)}.
            Aspect Ratio 9:16.
        `;

        const imageResponse = await ai.models.generateContent({
            model: imageModelId,
            contents: imagePrompt,
            config: {
                imageConfig: {
                    aspectRatio: "9:16",
                    imageSize: "1K"
                }
            }
        });

        const part = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
            thumbnailBase64 = part.inlineData.data;
        }
    } catch (imgError) {
        console.warn("Image generation failed", imgError);
    }

    return {
      script: jsonResponse.script,
      visualDescription: jsonResponse.visualDescription,
      thumbnailBase64
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateRecruitmentVideo = async (
    visualDescription: string
): Promise<string> => {
    const ai = getAI();
    // Use Veo model for video generation
    // Note: This requires a paid API key selected via window.aistudio.openSelectKey()
    
    // Shorten prompt for video generation optimization
    const videoPrompt = `Cinematic, high quality, 9:16 vertical video. ${visualDescription.substring(0, 200)}`;

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: videoPrompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed to return a URI");

        // Return the URI. The frontend must append &key=API_KEY to fetch/play it.
        return videoUri;

    } catch (error) {
        console.error("Veo Video Generation Error:", error);
        throw error;
    }
};