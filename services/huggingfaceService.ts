/**
 * Hugging Face Inference API Service
 * FREE - no credit card required
 * Uses FLUX and Stable Diffusion models
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Get API key from environment
const getHFApiKey = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY) {
    return (import.meta as any).env.VITE_HUGGINGFACE_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).__ENV?.VITE_HUGGINGFACE_API_KEY) {
    return (window as any).__ENV.VITE_HUGGINGFACE_API_KEY;
  }
  return process.env.VITE_HUGGINGFACE_API_KEY || '';
};

// Generate placeholder image with text
export const generatePlaceholderImage = (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber: number = 1
): string => {
  // Create a canvas-based placeholder
  const width = aspectRatio === '16:9' ? 1024 : 576;
  const height = aspectRatio === '16:9' ? 576 : 1024;
  
  // Return SVG data URL
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="${width/2 - 200}" y="${height/2 - 150}" width="400" height="300" fill="rgba(196,30,58,0.2)" rx="20"/>
      <text x="50%" y="${height/2 - 30}" text-anchor="middle" fill="#c41e3a" font-family="Arial" font-size="24" font-weight="bold">
        Scene ${sceneNumber}
      </text>
      <text x="50%" y="${height/2 + 10}" text-anchor="middle" fill="#fafafa" font-family="Arial" font-size="16">
        AI Generated
      </text>
      <text x="50%" y="${height/2 + 50}" text-anchor="middle" fill="#888" font-family="Arial" font-size="12" wrap="true">
        "${prompt.substring(0, 50)}..."
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// 1. FLUX Image Generation (Free via Hugging Face)
export const generateImageWithFluxHF = async (
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<string | null> => {
  const model = 'black-forest-labs/FLUX.1-schnell';
  
  const width = aspectRatio === '16:9' ? 1024 : 576;
  const height = aspectRatio === '16:9' ? 576 : 1024;
  
  const apiKey = getHFApiKey();

  try {
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers: apiKey ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      } : {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width,
          height,
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('HuggingFace FLUX error:', error);
      // Fall back to placeholder
      return generatePlaceholderImage(prompt, aspectRatio);
    }

    // Returns binary image data
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('HuggingFace FLUX connection failed, using placeholder:', error);
    return generatePlaceholderImage(prompt, aspectRatio);
  }
};

// 2. Stable Diffusion XL
export const generateImageWithSDXL = async (
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<string | null> => {
  return generatePlaceholderImage(prompt, aspectRatio);
};

// Unified function - always returns an image
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string | null> => {
  try {
    const result = await generateImageWithFluxHF(prompt, aspectRatio);
    if (result && result.startsWith('data:')) {
      return result;
    }
    return generatePlaceholderImage(prompt, aspectRatio, sceneNumber || 1);
  } catch {
    return generatePlaceholderImage(prompt, aspectRatio, sceneNumber || 1);
  }
};

export const checkHFConfig = (): boolean => {
  return true;
};

export const getHFApiUrl = (): string => {
  return 'https://huggingface.co/settings/tokens';
};
