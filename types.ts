
export interface Character {
  name: string;
  description: string;
}

export interface Shot {
  id: string;
  index: string;
  type: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  cameraMovement: string;
  selectedCharacters: string[];
}

export interface Scene {
  id: string;
  title: string;
  atmosphere: string;
  shots: Shot[];
}

export interface StoryState {
  theme: string;
  fullScript: string;
  scenes: Scene[];
  currentSceneId: string;
  globalStylePrompt: string;
  characterProfiles: Character[];
  phase: 'concept' | 'assets' | 'storyboard';
}
