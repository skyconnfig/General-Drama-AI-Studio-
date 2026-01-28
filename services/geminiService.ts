
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '{}');
};

// 2. 生成底图（支持一致性参考）
export const generateImage = async (
  prompt: string, 
  stylePrefix: string, 
  characterContext: string, 
  sceneContext: string,
  referenceImageBase64?: string
) => {
  const ai = getAI();
  const fullPrompt = `
    STYLE: ${stylePrefix}
    SCENE: ${sceneContext}
    ACTION: ${prompt}
    CHARACTERS: ${characterContext}
    TECHNICAL: Cinematic lighting, 8k, photorealistic, consistency key.
  `.trim();

  const parts: any[] = [{ text: fullPrompt }];
  if (referenceImageBase64) {
    parts.unshift({
      inlineData: {
        data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

// 3. 生成带转场的视频（起始帧 + 结束帧）
export const generateTransitionVideo = async (
  startImageBase64: string,
  endImageBase64: string,
  prompt: string
) => {
  const ai = getAI();
  const startData = startImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const endData = endImageBase64.replace(/^data:image\/\w+;base64,/, "");

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic high-quality video transition. ${prompt}`,
    image: {
      imageBytes: startData,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
      lastFrame: {
        imageBytes: endData,
        mimeType: 'image/png'
      }
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const checkVideoApiKey = async () => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  return true;
};
