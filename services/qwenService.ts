/**
 * Qwen AI Service
 * Free AI image and video generation via Qwen API
 * Docs: https://qwen.ai/ & https://aimlapi.com/
 */

const QWEN_API_BASE = 'https://api.qwen.ai';
const AIMLAPI_BASE = 'https://docs.aimlapi.com';

// Get API key from environment
const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_QWEN_API_KEY) {
    return (import.meta as any).env.VITE_QWEN_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).__ENV?.VITE_QWEN_API_KEY) {
    return (window as any).__ENV.VITE_QWEN_API_KEY;
  }
  return process.env.VITE_QWEN_API_KEY;
};

// Generate image with Qwen Wan2.1
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string | null> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Try direct Qwen Chat URL approach (no API key needed)
    const encodedPrompt = encodeURIComponent(prompt);
    const width = aspectRatio === '16:9' ? 1280 : 720;
    const height = aspectRatio === '16:9' ? 720 : 1280;
    
    // Return a URL that opens Qwen Chat with the prompt
    return `https://chat.qwen.ai/?prompt=${encodedPrompt}`;
  }

  try {
    const width = aspectRatio === '16:9' ? 1024 : 576;
    const height = aspectRatio === '16:9' ? 576 : 1024;

    const response = await fetch(`${AIMLAPI_BASE}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-wan2.5-t2i-plus',
        prompt,
        width,
        height,
        num_images: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Qwen API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error('Qwen image error:', error);
    throw error;
  }
};

// Generate video with Qwen Wan2.1
export const generateVideo = async (
  prompt: string,
  aspectRatio: string = '16:9',
  onProgress?: (status: string) => void
): Promise<string | null> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Return Qwen Chat URL for manual video generation
    const encodedPrompt = encodeURIComponent(prompt);
    onProgress?.('Opening Qwen Chat for video generation...');
    return `https://chat.qwen.ai/video?prompt=${encodedPrompt}&ratio=${aspectRatio === '16:9' ? '16:9' : '9:16'}`;
  }

  try {
    onProgress?.('Creating video with Qwen Wan2.1...');

    const response = await fetch(`${AIMLAPI_BASE}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-wan2.1-t2v',
        prompt,
        aspect_ratio: aspectRatio === '16:9' ? '16:9' : '9:16',
        duration: '5'
      })
    });

    if (!response.ok) {
      throw new Error(`Qwen Video API Error: ${response.status}`);
    }

    const data = await response.json();
    onProgress?.('Video ready!');
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error('Qwen video error:', error);
    throw error;
  }
};

// Check if Qwen is configured
export const checkQwenConfig = (): boolean => {
  return !!getApiKey();
};

// Get Qwen Chat URL for manual generation
export const getQwenChatUrl = (type: 'image' | 'video' = 'image'): string => {
  return type === 'video' ? 'https://chat.qwen.ai/video' : 'https://chat.qwen.ai';
};
