/**
 * Pollinations AI Service
 * COMPLETELY FREE - No API key required
 * Docs: https://github.com/pollinations/pollinations/blob/master/APIDOCS.md
 *
 * Image API: https://image.pollinations.ai/prompt/{prompt}
 * Rate Limit: Anonymous = 1 request/15s, Registered = 1 request/5s
 */

// Image generation URL builder
// Correct format: https://image.pollinations.ai/prompt/{prompt}?width=1280&height=720&model=flux
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

  // Build URL with parameters (anonymous access - may have watermark)
  // Note: nologo=true requires registered account
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}`;
};

// Generate image and return URL
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
  sceneNumber?: number
): Promise<string> => {
  return generateImageUrl(prompt, aspectRatio, 'flux');
};

// Video generation with Pollinations (if available)
// Note: Video generation requires API access - fallback to URL approach
export const generateVideo = async (
  prompt: string,
  aspectRatio: string = '16:9',
  onProgress?: (status: string) => void
): Promise<string | null> => {
  try {
    onProgress?.('Checking Pollinations video API...');

    // Try Pollinations video endpoint
    const response = await fetch('https://image.pollinations.ai/video', {
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
      throw new Error(`Video API not available: ${response.status}`);
    }

    const data = await response.json();
    onProgress?.('Video ready!');
    return data.videoUrl || data.url || null;
  } catch (error) {
    console.log('Pollinations video not available, using image fallback');
    // Fallback: Return image URL as placeholder
    onProgress?.('Video generation requires account - returning image');
    return generateImageUrl(prompt, aspectRatio);
  }
};

// Check if Pollinations is available
export const checkPollinationsConfig = (): boolean => {
  // Pollinations is always "available" - no API key needed
  return true;
};

export const getPollinationsUrl = (): string => {
  return 'https://image.pollinations.ai';
};

// Get Pollinations status info
export const getPollinationsInfo = (): { url: string; rateLimit: string; note: string } => {
  return {
    url: 'https://image.pollinations.ai',
    rateLimit: 'Anonymous: 15s, Registered: 5s',
    note: 'Free tier may include watermark. Register at auth.pollinations.ai to remove watermark.'
  };
};
