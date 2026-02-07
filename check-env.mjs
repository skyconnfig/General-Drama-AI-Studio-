import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

// Check env vars in browser
const envVars = await page.evaluate(() => {
  return {
    hasViteDeepseek: typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY ? 'YES' : 'NO',
    hasViteGemini: typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY ? 'YES' : 'NO'
  };
});

console.log('Environment:');
console.log('  VITE_DEEPSEEK_API_KEY:', envVars.hasViteDeepseek);
console.log('  VITE_GEMINI_API_KEY:', envVars.hasViteGemini);

// Test direct API call
console.log('\nTesting DeepSeek API...');
const result = await page.evaluate(async () => {
  try {
    const key = import.meta.env?.VITE_DEEPSEEK_API_KEY || '';
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100
      })
    });
    return { status: response.status, data: await response.json() };
  } catch (err) {
    return { error: err.message };
  }
});

console.log('API Status:', result.status);
console.log('API Response:', JSON.stringify(result.data, null, 2));

await browser.close();
