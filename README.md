<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Short Drama Studio

AI-powered short drama generation with script, images, and video.

## Features

- **Script Generation** - DeepSeek AI for story writing
- **Image Generation** - Multiple providers available
- **Video Generation** - Create short videos from scenes

## Providers

| Provider | Images | Video | Cost | Notes |
|----------|--------|-------|------|-------|
| **Pollinations** | ✅ | ✅ | FREE | No API key - browser-based |
| **Qwen AI** | ✅ | ✅ | FREE | chat.qwen.ai - unlimited |
| **DeepSeek** | - | - | FREE | Script generation ✓ |
| HuggingFace | ✅ | ❌ | FREE | Network blocked in China |
| Replicate | ✅ | ✅ | $ | Requires credit purchase |
| Gemini Veo | ✅ | ✅ | $ | API key invalid |

## Quick Start

**Prerequisites:** Node.js

```bash
# 1. Install dependencies
npm install

# 2. Run the app
npm run dev

# 3. Open http://localhost:3003
```

## Free Usage (Recommended)

### Option 1: Pollinations (Simplest)
- No API key required
- Directly generates images/videos in browser
- Select "Pollinations" in the provider dropdown

### Option 2: Qwen AI (Best Quality)
- Visit https://chat.qwen.ai
- Sign in (free account)
- Generate images/videos manually
- Copy URLs back to the app

## API Configuration (Optional)

Edit `.env.local` for advanced features:

```env
# DeepSeek (Scripts - already configured)
VITE_DEEPSEEK_API_KEY=sk-your-key

# HuggingFace (Images - network issues in China)
VITE_HUGGINGFACE_API_KEY=hf_xxx

# Replicate (Images + Video - requires credit)
VITE_REPLICATE_API_KEY=r8_xxx

# Qwen AI (Images + Video - recommended)
VITE_QWEN_API_KEY=your-qwen-key

# Gemini (Images + Video)
GEMINI_API_KEY=your-gemini-key
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## Architecture

```
services/
├── deepseekService.ts    # Script generation
├── pollinationsService.ts # FREE images + video
├── qwenService.ts        # FREE images + video
├── huggingfaceService.ts # Images (limited)
├── replicateService.ts   # Images + video (paid)
└── geminiService.ts      # Images + video (paid)
```

## Troubleshooting

**HuggingFace not working?**
- Network is blocked in China
- Use VPN or switch to Pollinations/Qwen

**Replicate failing?**
- Requires credit purchase
- Visit https://replicate.com/account/api-tokens

**Gemini not working?**
- API key is invalid/expired
- Get new key from https://aistudio.google.com

## Resources

- DeepSeek: https://platform.deepseek.com
- Pollinations: https://pollinations.ai
- Qwen Chat: https://chat.qwen.ai
- Replicate: https://replicate.com
- Gemini: https://aistudio.google.com
