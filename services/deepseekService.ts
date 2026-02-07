/**
 * DeepSeek AI Service
 * Used for script generation (DeepSeek V3)
 * Note: DeepSeek doesn't support image/video generation - use Gemini for those
 */

const DEEPSEEK_API_URL = '/api/deepseek/chat/completions';

// System prompt for script generation - SIMPLE and STRICT
const SCRIPT_SYSTEM_PROMPT = `You are a professional short drama screenwriter. 

IMPORTANT RULES:
1. You must ONLY respond with valid JSON - no other text, no markdown, no explanations
2. The JSON must contain a "title", "characters" array, and "scenes" array
3. Each scene must have "title", "atmosphere", and "shots" array
4. Each shot must have "type", "description", and "cameraMovement" (in English)

JSON Structure:
{
  "title": "Drama Title",
  "characters": [{"name": "Name", "description": "Appearance and clothing"}],
  "scenes": [
    {
      "title": "Scene Title",
      "atmosphere": "Atmosphere description",
      "shots": [
        {
          "type": "Wide/Medium/Close-up",
          "description": "Shot description",
          "cameraMovement": "Professional English camera movement prompt"
        }
      ]
    }
  ]
}

RESPOND WITH JSON ONLY. NO OTHER TEXT.`;

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

// Get API key from various sources
const getDeepSeekApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEEPSEEK_API_KEY) {
    return (import.meta as any).env.VITE_DEEPSEEK_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).__ENV?.VITE_DEEPSEEK_API_KEY) {
    return (window as any).__ENV.VITE_DEEPSEEK_API_KEY;
  }
  return undefined;
};

export const generateScriptWithDeepSeek = async (theme: string): Promise<any> => {
  const apiKey = getDeepSeekApiKey();
  
  if (!apiKey) {
    throw new Error('请配置 DeepSeek API Key (VITE_DEEPSEEK_API_KEY)');
  }

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
    { role: 'user', content: `Create a short drama script about: ${theme}. Respond with JSON only.` }
  ];

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 8192,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', errorText);
      throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
    }

    const data: DeepSeekResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('DeepSeek API 返回空内容');
    }

    try {
      // Extract JSON from markdown code block if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[2];
      }
      
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', content.substring(0, 500));
      throw new Error('解析 DeepSeek 响应失败');
    }
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
};

export const checkDeepSeekConfig = (): boolean => {
  return !!getDeepSeekApiKey();
};
