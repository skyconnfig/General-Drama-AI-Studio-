# AI短剧工作室 - 最佳实践模板

> 从 General Drama AI Studio 项目归档 | 2025-02-08

---

## 快速启动

```bash
npm create vite@latest my-ai-app -- --template react-ts
cd my-ai-app
npm install @google/genai
```

## 项目结构

```
src/
├── services/           # AI服务层
│   ├── pollinations.ts  # ⭐ 免费方案（首选）
│   ├── qwen.ts          # 免费方案
│   ├── deepseek.ts     # 剧本生成
│   ├── replicate.ts     # 付费方案
│   └── gemini.ts        # 付费方案
├── types.ts            # Character, Scene, Shot, Provider
└── App.tsx             # 主逻辑
.env.local              # API Keys
```

## 免费Provider优先级

| 优先级 | Provider | 类型 | 配置 | 备注 |
|--------|----------|------|------|------|
| ⭐⭐⭐ | **Pollinations** | 图+视频 | 无需 | **首选** |
| ⭐⭐ | Qwen AI | 图+视频 | 需Key | 高质量 |
| ⭐ | DeepSeek | 文本 | 需Key | 剧本生成 |

## 核心代码片段

### types.ts
```typescript
export interface Scene {
  id: string | number;
  title: string;
  atmosphere: string;
  shots: Array<{
    type: string;
    description: string;
    cameraMovement?: string;
  }>;
  imageUrl?: string;
  videoUrl?: string;
}

export type Provider = 'pollinations' | 'qwen' | 'deepseek' | 'replicate' | 'gemini';
```

### App.tsx 状态管理
```typescript
const [scenes, setScenes] = useState<Scene[]>([]);
const [provider, setProvider] = useState<Provider>('pollinations');
const [loading, setLoading] = useState(false);
const [loadingText, setLoadingText] = useState('');
```

## 配色方案

```css
:root {
  --bg: #030303;
  --accent: #c41e3a;
  --accent-green: #00c896;
  --text: #fafafa;
  --border: rgba(196,30,58,0.2);
}
```

## 下次启动

1. 创建Vite项目
2. 复制 types.ts
3. 复制 services/pollinations.ts (⭐免费方案)
4. 复制 App.tsx
5. 运行 npm run dev

---

**归档完成** ✅
