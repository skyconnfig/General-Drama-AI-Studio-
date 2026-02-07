/**
 * Replicate AI Service
 * Free alternative to Gemini Veo for image and video generation
 * Docs: https://replicate.com/docs
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

// Get API key from environment
const getReplicateApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_REPLICATE_API_KEY) {
    return (import.meta as any).env.VITE_REPLICATE_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).__ENV?.VITE_REPLICATE_API_KEY) {
    return (window as any).__ENV.VITE_REPLICATE_API_KEY;
  }
  return process.env.VITE_REPLICATE_API_KEY;
};

// 1. FLUX Image Generation (Best quality/free tier)
export const generateImageWithFlux = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string | null> => {
  const apiKey = getReplicateApiKey();
  
  if (!apiKey) {
    throw new Error('请配置 Replicate API Key (VITE_REPLICATE_API_KEY)');
  }

  // Use FLUX model via Replicate
  // Model: black-forest-labs/flux-schnell (fast, cheap)
  const model = 'black-forest-labs/flux-schnell';
  
  // Aspect ratio mapping
  const width = aspectRatio === '16:9' ? 1344 : 768;
  const height = aspectRatio === '16:9' ? 768 : 1344;

  try {
    const response = await fetch(`${REPLICATE_API_URL}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt,
          width,
          height,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API Error: ${error}`);
    }

    const data = await response.json();
    
    // Return as base64 or URL
    if (data.output && Array.isArray(data.output)) {
      return data.output[0]; // URL to image
    }
    
    return null;
  } catch (error) {
    console.error('FLUX generation error:', error);
    throw error;
  }
};

// 2. Stable Diffusion (Free alternative)
export const generateImageWithSD = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string | null> => {
  const apiKey = getReplicateApiKey();
  
  if (!apiKey) {
    throw new Error('请配置 Replicate API Key (VITE_REPLICATE_API_KEY)');
  }

  // Use Stability AI SDXL via Replicate
  const model = 'stability-ai/stable-diffusion';
  
  const width = aspectRatio === '16:9' ? 1024 : 576;
  const height = aspectRatio === '16:9' ? 576 : 1024;

  try {
    const response = await fetch(`${REPLICATE_API_URL}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt,
          width,
          height,
          num_outputs: 1
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API Error: ${error}`);
    }

    const data = await response.json();
    
    if (data.output && Array.isArray(data.output)) {
      return data.output[0];
    }
    
    return null;
  } catch (error) {
    console.error('Stable Diffusion error:', error);
    throw error;
  }
};

// 3. Luma Dream Machine Video (Free via Replicate)
export const generateVideoWithLuma = async (
  prompt: string,
  aspectRatio: string = '16:9',
  onProgress?: (status: string) => void
): Promise<string | null> => {
  const apiKey = getReplicateApiKey();
  
  if (!apiKey) {
    throw new Error('请配置 Replicate API Key (VITE_REPLICATE_API_KEY)');
  }

  // Use Luma Ray (Dream Machine) via Replicate
  const model = 'luma/ray';
  
  try {
    if (onProgress) onProgress('Creating video with Dream Machine...');

    // Start prediction
    const createResponse = await fetch(`${REPLICATE_API_URL}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspectRatio === '16:9' ? '16:9' : '9:16',
          duration: '5s'
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Replicate API Error: ${error}`);
    }

    const prediction = await createResponse.json();
    const predictionUrl = `${REPLICATE_API_URL}/predictions/${prediction.id}`;

    // Poll for completion
    let completed = false;
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onProgress) onProgress('Processing video...');
      
      const statusResponse = await fetch(predictionUrl, {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      });

      const status = await statusResponse.json();
      
      if (status.status === 'succeeded') {
        completed = true;
        if (onProgress) onProgress('Video ready!');
        return status.output?.video || status.output?.[0] || null;
      } else if (status.status === 'failed') {
        throw new Error('Video generation failed');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Luma video error:', error);
    throw error;
  }
};

// 4. Simple unified function - tries FLUX first, falls back to SD
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string | null> => {
  try {
    return await generateImageWithFlux(prompt, aspectRatio, sceneNumber);
  } catch {
    console.log('FLUX failed, trying Stable Diffusion...');
    return await generateImageWithSD(prompt, aspectRatio);
  }
};

// 5. Check if Replicate is configured
export const checkReplicateConfig = (): boolean => {
  return !!getReplicateApiKey();
};

// Get Replicate API key from: https://replicate.com/account/api-tokens
export const getReplicateApiUrl = (): string => {
  return 'https://replicate.com/account/api-tokens';
};
