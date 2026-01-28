
import React, { useState, useMemo } from 'react';
import { StoryState, Scene, Shot } from './types';
import ShotItem from './components/ShotItem';
import { generateScript, generateTransitionVideo, checkVideoApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    theme: '',
    fullScript: '',
    scenes: [],
    currentSceneId: '',
    globalStylePrompt: 'Cinematic film still, high-end production, 8k, realistic, professional lighting, deep shadows, rich textures.',
    characterProfiles: [],
    phase: 'concept'
  });

  const [loading, setLoading] = useState(false);
  const [transitionState, setTransitionState] = useState<{start?: string, end?: string}>({});
  const [generatingSequence, setGeneratingSequence] = useState(false);

  const handleGenerateScript = async () => {
    if (!state.theme) return;
    setLoading(true);
    try {
      const data = await generateScript(state.theme);
      const scenes: Scene[] = data.scenes.map((s: any, idx: number) => ({
        id: String(idx + 1),
        title: s.title,
        atmosphere: s.atmosphere,
        shots: s.shots.map((sh: any, sIdx: number) => ({
          id: `${idx + 1}-${sIdx + 1}`,
          index: `${idx + 1}-${sIdx + 1}`,
          type: sh.type,
          description: sh.description,
          isGeneratingImage: false,
          isGeneratingVideo: false,
          cameraMovement: sh.cameraMovement || 'Cinematic slow camera movement', // 使用 AI 生成的专业提示词
          selectedCharacters: data.characters.map((c: any) => c.name).slice(0, 1)
        }))
      }));

      setState(prev => ({
        ...prev,
        scenes,
        characterProfiles: data.characters,
        currentSceneId: '1',
        phase: 'assets'
      }));
    } catch (e) {
      console.error(e);
      alert("生成剧本失败，请检查网络或重试");
    } finally {
      setLoading(false);
    }
  };

  const currentScene = useMemo(() => 
    state.scenes.find(s => s.id === state.currentSceneId) || state.scenes[0],
  [state.scenes, state.currentSceneId]);

  const handleUpdateShot = (updatedShot: Shot) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => ({
        ...s,
        shots: s.shots.map(sh => sh.id === updatedShot.id ? updatedShot : sh)
      }))
    }));
  };

  const startTransition = async () => {
    if (!transitionState.start || !transitionState.end) return;
    const startShot = state.scenes.flatMap(s => s.shots).find(sh => sh.id === transitionState.start);
    const endShot = state.scenes.flatMap(s => s.shots).find(sh => sh.id === transitionState.end);
    
    if (!startShot?.imageUrl || !endShot?.imageUrl) {
      alert("请先生成起始帧和结束帧的底图");
      return;
    }

    setGeneratingSequence(true);
    try {
      await checkVideoApiKey();
      const videoUrl = await generateTransitionVideo(
        startShot.imageUrl, 
        endShot.imageUrl, 
        startShot.cameraMovement
      );
      handleUpdateShot({ ...startShot, videoUrl });
    } catch (e) {
      alert("转场生成失败");
    } finally {
      setGeneratingSequence(false);
      setTransitionState({});
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded rotate-45 flex items-center justify-center">
            <div className="-rotate-45 font-black text-xs">AI</div>
          </div>
          <h1 className="font-black tracking-tighter text-xl">DRAMA STUDIO V2.1</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-900 p-1 rounded-full border border-white/10">
            {['concept', 'assets', 'storyboard'].map(p => (
              <button 
                key={p} 
                onClick={() => state.scenes.length > 0 && setState(prev => ({...prev, phase: p as any}))}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${state.phase === p ? 'bg-red-600 text-white' : 'text-neutral-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Flow */}
      <main className="flex-1 overflow-hidden flex">
        {state.phase === 'concept' && (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-6xl font-black tracking-tight">AI 导演中心</h2>
              <p className="text-neutral-500 text-lg">输入短剧主题，系统将自动生成包含专业运镜指令的完整剧本。</p>
            </div>
            <div className="w-full max-w-xl relative">
              <input 
                value={state.theme}
                onChange={e => setState(p => ({...p, theme: e.target.value}))}
                placeholder="例如: 悬疑惊悚 - 消失的继承人..."
                className="w-full bg-neutral-900 border-2 border-white/5 rounded-3xl py-6 px-10 text-xl focus:border-red-600 outline-none transition-all shadow-2xl"
              />
              <button 
                onClick={handleGenerateScript}
                disabled={loading || !state.theme}
                className="absolute right-3 top-3 bottom-3 px-8 bg-red-600 hover:bg-red-500 rounded-2xl font-black disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "一键生成剧本资产"}
              </button>
            </div>
          </div>
        )}

        {state.phase === 'assets' && (
          <div className="flex-1 flex">
            <div className="flex-1 p-10 overflow-y-auto space-y-10 custom-scrollbar">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">资产概览 (Assets)</h2>
                <button 
                  onClick={() => setState(p => ({...p, phase: 'storyboard'}))}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black transition-all shadow-lg shadow-red-600/20"
                >
                  确认资产并进入分镜台
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {state.characterProfiles.map(char => (
                  <div key={char.name} className="bg-neutral-900/50 p-6 rounded-3xl border border-white/5 group hover:border-red-500/30 transition-all">
                    <h3 className="text-red-500 font-black mb-2 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      {char.name}
                    </h3>
                    <p className="text-sm text-neutral-300 leading-relaxed">{char.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-neutral-900/30 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-black text-sm uppercase text-neutral-500 tracking-widest">全局视觉风格 (Global Cinematic Tone)</h3>
                <textarea 
                  value={state.globalStylePrompt}
                  onChange={e => setState(p => ({...p, globalStylePrompt: e.target.value}))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm resize-none h-32 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {state.phase === 'storyboard' && (
          <>
            <aside className="w-72 border-r border-white/5 bg-black/20 p-6 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] font-black text-neutral-600 uppercase mb-4 tracking-widest">场景导视</div>
              <div className="space-y-2">
                {state.scenes.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setState(p => ({...p, currentSceneId: s.id}))}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${state.currentSceneId === s.id ? 'bg-red-600 shadow-lg shadow-red-600/20' : 'hover:bg-white/5'}`}
                  >
                    <div className="text-[9px] opacity-60 font-black mb-1">SCENE 0{s.id}</div>
                    <div className="text-xs font-black truncate">{s.title}</div>
                  </button>
                ))}
              </div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto bg-[#080808] custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-10">
                <div className="flex justify-between items-end bg-neutral-900/40 p-10 rounded-[2.5rem] border border-white/5">
                  <div>
                    <h2 className="text-4xl font-black mb-3">{currentScene.title}</h2>
                    <p className="text-neutral-500 text-sm font-medium italic">"{currentScene.atmosphere}"</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {transitionState.start && transitionState.end ? (
                      <button 
                        onClick={startTransition}
                        disabled={generatingSequence}
                        className="bg-blue-600 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30"
                      >
                        {generatingSequence ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            正在渲染平滑转场...
                          </>
                        ) : "一键合成专业级镜头"}
                      </button>
                    ) : (
                      <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                        提示: 点击分镜右上角按钮设置起始/结束点以合成转场
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {currentScene.shots.map(shot => (
                    <ShotItem 
                      key={shot.id}
                      shot={shot}
                      currentScene={currentScene}
                      globalStyle={state.globalStylePrompt}
                      characters={state.characterProfiles}
                      onUpdate={handleUpdateShot}
                      onSetAsTransitionTarget={(type) => setTransitionState(prev => ({...prev, [type]: shot.id}))}
                      transitionRole={transitionState.start === shot.id ? 'start' : transitionState.end === shot.id ? 'end' : null}
                    />
                  ))}
                </div>
              </div>
            </main>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
