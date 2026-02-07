import React, { useState, useEffect } from 'react';
import { generateScriptWithDeepSeek } from './services/deepseekService';
import { generateImage as generateImageGemini, generateVideo as generateVideoGemini, checkGeminiConfig } from './services/geminiService';
import { generateImage as generateImageReplicate, generateVideoWithLuma, checkReplicateConfig, getReplicateApiUrl } from './services/replicateService';
import { generateImage as generateImageHF, checkHFConfig } from './services/huggingfaceService';
import { generateImage as generateImagePollinations, generateVideo as generateVideoPollinations, checkPollinationsConfig, getPollinationsUrl } from './services/pollinationsService';

// Provider type
type Provider = 'pollinations' | 'huggingface' | 'replicate' | 'gemini';

interface Shot {
  type: string;
  description: string;
  cameraMovement?: string;
}

interface Scene {
  id: number;
  title: string;
  atmosphere: string;
  shots: Shot[];
  imageUrl?: string;
  videoUrl?: string;
}

interface DramaData {
  title: string;
  characters: Array<{ name: string; description: string }>;
  scenes: Scene[];
}

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<DramaData | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'script' | 'image' | 'video'>('script');
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<Provider>('pollinations'); // Default to FREE
  const [geminiReady, setGeminiReady] = useState(false);
  const [replicateReady, setReplicateReady] = useState(false);

  useEffect(() => {
    setGeminiReady(checkGeminiConfig());
    setReplicateReady(checkReplicateConfig());
  }, []);

  // Get image generator based on provider
  const generateImage = async (prompt: string, aspectRatio: string, sceneNumber?: number) => {
    switch (provider) {
      case 'pollinations':
        return await generateImagePollinations(prompt, aspectRatio, sceneNumber);
      case 'huggingface':
        return await generateImageHF(prompt, aspectRatio, sceneNumber);
      case 'replicate':
        return await generateImageReplicate(prompt, aspectRatio, sceneNumber);
      case 'gemini':
        return await generateImageGemini(prompt, aspectRatio, sceneNumber);
      default:
        return await generateImagePollinations(prompt, aspectRatio, sceneNumber);
    }
  };

  // Get video generator based on provider
  const generateVideo = async (prompt: string, aspectRatio: string, onProgress?: (status: string) => void) => {
    switch (provider) {
      case 'pollinations':
        return await generateVideoPollinations(prompt, aspectRatio, onProgress);
      case 'replicate':
        return await generateVideoWithLuma(prompt, aspectRatio, onProgress);
      case 'gemini':
        return await generateVideoGemini(prompt, aspectRatio, onProgress);
      default:
        return await generateVideoPollinations(prompt, aspectRatio, onProgress);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setLoadingText('Creating script...');
    try {
      console.log('Starting script generation with theme:', input);
      const data = await generateScriptWithDeepSeek(input);
      console.log('Script generated successfully:', data);
      setOutput(data);
      const sceneArray: Scene[] = (data.scenes || []).map((s: any, idx: number) => ({
        id: idx,
        title: s.title,
        atmosphere: s.atmosphere,
        shots: s.shots || [],
        imageUrl: undefined,
        videoUrl: undefined
      }));
      setScenes(sceneArray);
      console.log('Scenes set:', sceneArray.length);
    } catch (err: any) {
      console.error('Script generation error:', err);
      setError(err.message || 'Script generation failed');
    }
    setLoading(false);
  };

  const handleGenerateImages = async () => {
    if (!output || scenes.length === 0) return;
    setLoading(true);
    setLoadingText('Generating images...');
    setCurrentPhase('image');
    const updatedScenes = [...scenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      const scene = updatedScenes[i];
      setLoadingText(`Generating ${i + 1}/${updatedScenes.length}: ${scene.title}`);
      try {
        const prompt = `CINEMATIC SCENE: ${scene.title}. ATMOSPHERE: ${scene.atmosphere}. Dark moody lighting, 8k quality.`;
        const imageUrl = await generateImage(prompt, '16:9', i + 1);
        updatedScenes[i] = { ...scene, imageUrl };
        setScenes([...updatedScenes]);
      } catch (err) {
        console.error(`Image failed for scene ${i}:`, err);
      }
    }
    setOutput({ ...output, scenes: updatedScenes });
    setLoading(false);
  };

  const handleGenerateVideos = async () => {
    // Check provider and show appropriate message
    if (provider === 'huggingface') {
      setError('Video generation not available on HuggingFace. Switch to Replicate or Gemini.');
      return;
    }
    
    if (provider === 'replicate' && !replicateReady) {
      setError('Replicate requires credit purchase. Visit: ' + getReplicateApiUrl());
      return;
    }
    
    if (provider === 'gemini' && !geminiReady) {
      setError('Please configure Gemini API Key in .env.local');
      return;
    }
    
    setLoading(true);
    setLoadingText('Preparing videos...');
    setCurrentPhase('video');
    const updatedScenes = [...scenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      const scene = updatedScenes[i];
      if (!scene.imageUrl) {
        setLoadingText(`Scene ${i + 1} needs image first`);
        continue;
      }
      setLoadingText(`Generating video ${i + 1}/${updatedScenes.length}: ${scene.title}`);
      try {
        const prompt = `Cinematic video: ${scene.title}. ${scene.shots?.map((s: Shot) => s.description).join('. ') || ''}`;
        const videoUrl = await generateVideo(prompt, '16:9', (status) => setLoadingText(status));
        updatedScenes[i] = { ...scene, videoUrl };
        setScenes([...updatedScenes]);
      } catch (err) {
        console.error(`Video failed for scene ${i}:`, err);
      }
    }
    setOutput({ ...output, scenes: updatedScenes });
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030303', color: '#fafafa' }}>
      <div className="film-grain"></div>
      <div className="light-leak"></div>
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ textAlign: 'center', padding: '4rem 2rem 2rem' }}>
          <h1 className="main-title" style={{ marginBottom: '0.5rem' }}>DRAMA STUDIO</h1>
          <p className="subtitle">AI Short Drama Studio</p>
          
          {/* Provider Selector */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(250,250,250,0.4)', width: '100%', marginBottom: '0.25rem' }}>Image/Video Provider:</span>
            
            {/* Pollinations - BEST FREE */}
            <button
              onClick={() => setProvider('pollinations')}
              style={{
                padding: '6px 12px',
                background: provider === 'pollinations' ? 'rgba(0, 200, 150, 0.35)' : 'transparent',
                border: `1px solid ${provider === 'pollinations' ? 'rgba(0, 200, 150, 0.7)' : 'rgba(250,250,250,0.2)'}`,
                borderRadius: '20px',
                color: provider === 'pollinations' ? '#00c896' : 'rgba(250,250,250,0.5)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🌱 Pollinations (Free)
            </button>
            
            {/* HuggingFace */}
            <button
              onClick={() => setProvider('huggingface')}
              style={{
                padding: '6px 12px',
                background: provider === 'huggingface' ? 'rgba(255, 165, 0, 0.35)' : 'transparent',
                border: `1px solid ${provider === 'huggingface' ? 'rgba(255, 165, 0, 0.7)' : 'rgba(250,250,250,0.2)'}`,
                borderRadius: '20px',
                color: provider === 'huggingface' ? '#ffa500' : 'rgba(250,250,250,0.5)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🤗 HF (FLUX)
            </button>
            
            {/* Replicate */}
            <button
              onClick={() => setProvider('replicate')}
              style={{
                padding: '6px 12px',
                background: provider === 'replicate' ? 'rgba(100, 200, 100, 0.3)' : 'transparent',
                border: `1px solid ${provider === 'replicate' ? 'rgba(100, 200, 100, 0.6)' : 'rgba(250,250,250,0.2)'}`,
                borderRadius: '20px',
                color: provider === 'replicate' ? '#64c864' : 'rgba(250,250,250,0.5)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Replicate
            </button>
            
            {/* Gemini */}
            <button
              onClick={() => setProvider('gemini')}
              style={{
                padding: '6px 12px',
                background: provider === 'gemini' ? 'rgba(196,30,58,0.3)' : 'transparent',
                border: `1px solid ${provider === 'gemini' ? 'rgba(196,30,58,0.6)' : 'rgba(250,250,250,0.2)'}`,
                borderRadius: '20px',
                color: provider === 'gemini' ? '#c41e3a' : 'rgba(250,250,250,0.5)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Gemini Veo
            </button>
          </div>
          
          {/* Status indicator */}
          <div style={{ marginTop: '0.75rem', fontSize: '0.7rem' }}>
            {provider === 'pollinations' && (
              <span style={{ color: 'rgba(0, 200, 150, 0.8)' }}>
                ✓ Pollinations (Free) - FLUX + Seedance Video
              </span>
            )}
            {provider === 'huggingface' && (
              <span style={{ color: 'rgba(255, 165, 0, 0.7)' }}>
                ⚠ FLUX (may have network issues in China)
              </span>
            )}
            {provider === 'replicate' && (
              replicateReady ? (
                <span style={{ color: 'rgba(100, 200, 100, 0.6)' }}>
                  ✓ FLUX + Luma Dream Machine
                </span>
              ) : (
                <span style={{ color: 'rgba(250,100,100,0.6)' }}>
                  ⚠ Requires credit purchase
                </span>
              )
            )}
            {provider === 'gemini' && (
              geminiReady ? (
                <span style={{ color: 'rgba(196,30,58,0.6)' }}>
                  ✓ Gemini Veo 3.1 Ready
                </span>
              ) : (
                <span style={{ color: 'rgba(250,100,100,0.6)' }}>
                  ⚠ API Key required
                </span>
              )
            )}
          </div>
        </header>
        <main style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your drama idea..."
                style={{ width: '100%', minHeight: '160px', padding: '1.5rem 2rem', paddingRight: '180px', background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: '16px', color: '#fafafa', fontSize: '1rem', resize: 'none' }}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                style={{ position: 'absolute', right: '12px', bottom: '12px', padding: '14px 28px', background: 'linear-gradient(135deg, #c41e3a 0%, #8b1528 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? <span>{loadingText || 'Generating...'}</span> : 'Start Creating'}
              </button>
            </div>
            {error && (
              <div style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            )}
          </section>
          {output && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {(['script', 'image', 'video'] as const).map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setCurrentPhase(phase)}
                    style={{ padding: '12px 32px', background: 'transparent', border: '1px solid rgba(196,30,58,0.3)', borderRadius: '50px', color: currentPhase === phase ? '#c41e3a' : 'rgba(250,250,250,0.5)', fontSize: '0.9rem', cursor: 'pointer', margin: '0 0.5rem' }}
                  >
                    {phase === 'script' ? 'Script' : phase === 'image' ? 'Images' : 'Videos'}
                  </button>
                ))}
              </div>
              {currentPhase === 'script' && (
                <div style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: '20px', padding: '2.5rem' }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#c41e3a', marginBottom: '1.5rem' }}>{output.title}</h2>
                  <button onClick={handleGenerateImages} disabled={loading} style={{ padding: '8px 20px', background: 'rgba(196,30,58,0.2)', border: '1px solid rgba(196,30,58,0.4)', borderRadius: '8px', color: '#c41e3a', cursor: 'pointer', marginBottom: '1rem' }}>
                    Generate Images
                  </button>
                  {output.scenes?.map((scene: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                      <h4 style={{ color: '#c41e3a', marginBottom: '0.5rem' }}>{idx + 1}. {scene.title}</h4>
                      <p style={{ color: 'rgba(250,250,250,0.6)', fontStyle: 'italic', marginBottom: '1rem' }}>Atmosphere: {scene.atmosphere}</p>
                    </div>
                  ))}
                </div>
              )}
              {currentPhase === 'image' && (
                <div>
                  <button onClick={handleGenerateImages} disabled={loading} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #c41e3a 0%, #8b1528 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'block', margin: '0 auto 2rem' }}>
                    {loading ? loadingText : 'Generate All Images'}
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {scenes.map((scene, idx) => (
                      <div key={idx} style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
                        {scene.imageUrl ? (
                          <img src={scene.imageUrl} alt={`Scene ${idx + 1}`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(250,250,250,0.3)' }}>Waiting...</div>
                        )}
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ color: '#c41e3a', marginBottom: '0.5rem' }}>{idx + 1}. {scene.title}</h4>
                          <p style={{ color: 'rgba(250,250,250,0.7)', fontSize: '0.9rem' }}>{scene.atmosphere}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                {currentPhase === 'video' && (
                <div>
                  <button 
                    onClick={handleGenerateVideos} 
                    disabled={loading || (provider === 'replicate' && !replicateReady) || (provider === 'gemini' && !geminiReady)} 
                    style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #c41e3a 0%, #8b1528 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'block', margin: '0 auto 2rem' }}
                  >
                    {loading ? loadingText : 'Generate All Videos'}
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {scenes.map((scene, idx) => (
                      <div key={idx} style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
                        {scene.videoUrl ? (
                          <video src={scene.videoUrl} controls style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                        ) : scene.imageUrl ? (
                          <img src={scene.imageUrl} alt={`Scene ${idx + 1}`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(250,250,250,0.3)' }}>Generate image first</div>
                        )}
                        <div style={{ padding: '1rem' }}>
                          <h4 style={{ color: '#c41e3a', marginBottom: '0.5rem' }}>{idx + 1}. {scene.title}</h4>
                          <p style={{ color: 'rgba(250,250,250,0.7)', fontSize: '0.9rem' }}>{scene.atmosphere}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
