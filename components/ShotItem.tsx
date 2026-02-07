
import React, { useState } from 'react';
import { Shot, Character, Scene } from '../types';
import { generateImage, checkVideoApiKey } from '../services/geminiService';

interface ShotItemProps {
  shot: Shot;
  currentScene: Scene;
  globalStyle: string;
  characters: Character[];
  onUpdate: (updatedShot: Shot) => void;
  onSetAsTransitionTarget?: (type: 'start' | 'end') => void;
  transitionRole?: 'start' | 'end' | null;
}

const ShotItem: React.FC<ShotItemProps> = ({
  shot, currentScene, globalStyle, characters, onUpdate, onSetAsTransitionTarget, transitionRole
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    try {
      setError(null);
      onUpdate({ ...shot, isGeneratingImage: true });
      const charContext = characters
        .filter(c => shot.selectedCharacters.includes(c.name))
        .map(c => `${c.name}: ${c.description}`).join('; ');

      const firstShotImg = currentScene.shots.find(s => s.imageUrl && s.id !== shot.id)?.imageUrl;
      const url = await generateImage(shot.description, globalStyle, charContext, currentScene.title, firstShotImg);
      onUpdate({ ...shot, imageUrl: url || undefined, isGeneratingImage: false });
    } catch (err: any) {
      setError(err.message);
      onUpdate({ ...shot, isGeneratingImage: false });
    }
  };

  return (
    <div className={`group bg-[#121212] rounded-[2rem] overflow-hidden border transition-all duration-500 ${transitionRole === 'start' ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]' :
        transitionRole === 'end' ? 'border-green-500 ring-4 ring-green-500/10 scale-[1.02]' : 'border-white/5 hover:border-white/20'
      }`}>
      <div className="relative aspect-video bg-black overflow-hidden">
        {shot.videoUrl ? (
          <video
            src={shot.videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : shot.imageUrl ? (
          <img src={shot.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-neutral-700 space-y-3">
            {shot.isGeneratingImage ? (
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">{shot.isGeneratingImage ? "AI 画师构图中..." : "等待生成底图"}</span>
          </div>
        )}

        {/* 角色与类型标记 */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="text-[10px] bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-white font-black uppercase tracking-tighter">
            {shot.type}
          </span>
          {shot.selectedCharacters.map(c => (
            <span key={c} className="text-[9px] bg-red-600 px-2 py-1 rounded-md text-white font-black shadow-lg shadow-red-600/30">{c}</span>
          ))}
        </div>

        {/* 转场设置按钮 */}
        {shot.imageUrl && onSetAsTransitionTarget && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onSetAsTransitionTarget('start')}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${transitionRole === 'start' ? 'bg-blue-600 border-white/20' : 'bg-black/40 border-white/10 hover:bg-blue-600/50'}`}
              title="设为转场起始点"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => onSetAsTransitionTarget('end')}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${transitionRole === 'end' ? 'bg-green-600 border-white/20' : 'bg-black/40 border-white/10 hover:bg-green-600/50'}`}
              title="设为转场结束点"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">画面描述 (Visual Detail)</label>
            <span className="text-[9px] text-neutral-600 font-bold">SHOT {shot.index}</span>
          </div>
          <textarea
            value={shot.description}
            onChange={(e) => onUpdate({ ...shot, description: e.target.value })}
            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs h-20 resize-none outline-none focus:border-red-500 transition-colors leading-relaxed text-neutral-300"
            placeholder="在此处优化画面内容描述..."
          />
        </div>

        <div className="space-y-2 bg-red-600/5 p-4 rounded-xl border border-red-600/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <label className="text-[10px] text-red-500/80 uppercase font-black tracking-widest">专业运镜指令 (AI Directed Movement)</label>
          </div>
          <textarea
            value={shot.cameraMovement}
            onChange={(e) => onUpdate({ ...shot, cameraMovement: e.target.value })}
            className="w-full bg-transparent border-none p-0 text-xs font-mono text-neutral-200 outline-none resize-none h-16 leading-relaxed"
            placeholder="AI 将自动生成专业指令..."
          />
        </div>

        {error && <div className="text-[10px] text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</div>}

        <button
          onClick={handleGenerateImage}
          disabled={shot.isGeneratingImage}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
        >
          {shot.isGeneratingImage ? "正在生成..." : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {shot.imageUrl ? "刷新分镜图" : "生成分镜图"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ShotItem;
