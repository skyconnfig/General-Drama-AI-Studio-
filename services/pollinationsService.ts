/**
 * Pollinations AI Service
 * COMPLETELY FREE - No API key required
 * https://gen.pollinations.ai
 */

// Image generation URL builder
export const generateImageUrl = (
  prompt: string,
  aspectRatio: string = '16:9',
  model: string = 'flux'
): string => {
  // URL encode the prompt
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Aspect ratio dimensions
  const width = aspectRatio === '16:9' ? 1280 : 720;
  const height = aspectRatio === '16:9' ? 720 : 1280;
  
  // Build URL with parameters
  return `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;
};

// Generate image and return URL
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string> => {
  return generateImageUrl(prompt, aspectRatio, 'flux');
};

// Video generation with Pollinations
export const generateVideo = async (
  prompt: string,
  aspectRatio: string = '16:9',
  onProgress?: (status: string) => void
): Promise<string | null> => {
  try {
    onProgress?.('Creating video with Pollinations...');
    
    const response = await fetch('https://gen.pollinations.ai/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'seedance',
        aspect_ratio: aspectRatio === '16:9' ? '16:9' : '9:16'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Video generation failed: ${response.status}`);
    }
    
    const data = await response.json();
    onProgress?.('Video ready!');
    return data.videoUrl || data.url || null;
  } catch (error) {
    console.error('Pollinations video error:', error);
    throw error;
  }
};

// Check if Pollinations is available
export const checkPollinationsConfig = (): boolean => {
  return true; // Always available - no API key needed
};

export const getPollinationsUrl = (): string => {
  return 'https://gen.pollinations.ai';
};
