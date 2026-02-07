import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

// Check console for errors
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('ERROR:', msg.text());
  }
});

// Test API directly from browser
console.log('Testing DeepSeek API from browser...');
const result = await page.evaluate(async () => {
  const key = (window as any).__ENV?.VITE_DEEPSEEK_API_KEY || '';
  console.log('Key found:', key ? key.substring(0, 10) + '...' : 'NO KEY');
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 50
    })
  });
  return { status: response.status, text: await response.text() };
});

console.log('Status:', result.status);
console.log('Response:', result.text.substring(0, 300));

await browser.close();
