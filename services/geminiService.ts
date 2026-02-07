import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "");
  return new GoogleGenAI({ apiKey });
};

// 1. 生成剧本
export const generateScript = async (theme: string) => {
  const ai = getAI();
  const prompt = `你是一个专业的短剧编剧和导演。请根据主题 "${theme}" 创作一个包含5个关键场景的短剧大纲。
  每个场景需要包含：标题、氛围、以及3-4个详细的分镜描述。
  
  关键要求：
  - 为每个分镜生成一个 "cameraMovement" 字段，必须是专业级的英文视频生成提示词（用于Veo/Sora类模型）。
  - 提示词应包含：专业运镜技巧（如 Dolly Zoom, Pan, Tilt, Rack Focus, Handheld Tracking）、动作细节、光影氛围。
  - 角色的一致性描述要极其详细。

  请以JSON格式返回，结构如下：
  {
    "title": "剧名",
    "characters": [{"name": "名字", "description": "外貌、性格、细节服饰描述"}],
    "scenes": [
      {
        "title": "场景名", 
        "atmosphere": "氛围描述", 
        "shots": [
          {
            "type": "远景/中景/特写", 
            "description": "具体的画面动作描述",
            "cameraMovement": "Professional English prompt: Camera technique + detailed movement + lighting/mood"
          }
        ]
      }
    ]
  }`;

  const response = await (ai as any).models.generateContent({
    model: 'gemini-1.5-pro', // Using 1.5 pro for scripts
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '{}');
};

// 2. 生成底图（简化版 - 兼容 App.tsx）
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
) => {
  const ai = getAI();
  
  const response = await (ai as any).models.generateContent({
    model: 'gemini-2.0-flash-exp-image-generation',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

// 3. 生成带转场的视频（起始帧 + 结束帧）
export const generateVideo = async (
  prompt: string,
  aspectRatio: string,
  onProgress?: (status: string) => void
) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "");
  const ai = new GoogleGenAI({ apiKey });

  try {
    if (onProgress) onProgress('Starting video generation with Veo 3.1...');

    let operation = await (ai as any).models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic high-quality video. ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16'
      }
    });

    console.log('Video generation started:', operation.name);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (onProgress) onProgress('Processing video...');
      operation = await (ai as any).operations.getVideosOperation({
        name: operation.name
      });
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoResult = operation.response?.generatedVideos?.[0];
    if (!videoResult?.video?.uri) {
      throw new Error('No video URI returned from API');
    }

    const downloadLink = videoResult.video.uri;
    const finalUrl = downloadLink.includes('?')
      ? `${downloadLink}&key=${apiKey}`
      : `${downloadLink}?key=${apiKey}`;

    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error('Failed to download generated video');

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error('Error in generateVideo:', error);
    throw error;
  }
};

// 保持原有函数名向后兼容
export const generateTransitionVideo = generateVideo;

export const checkGeminiConfig = () => {
  const apiKey = (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
                  (typeof window !== 'undefined' && (window as any)?.ENV?.VITE_GEMINI_API_KEY) ||
                  "";
  return !!apiKey;
};

export const checkVideoApiKey = async () => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  return true;
};
