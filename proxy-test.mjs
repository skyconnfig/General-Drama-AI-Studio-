import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('response', async response => {
  if (response.url().includes('deepseek')) {
    console.log('DEEPSEEK REQUEST:', response.status());
    const text = await response.text();
    console.log('RESPONSE:', text.substring(0, 500));
  }
});

console.log('Testing proxy...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Filling theme...');
await page.fill('textarea', '测试');

console.log('Clicking button...');
await page.click('button');

console.log('Waiting 30s...');
await page.waitForTimeout(30000);

await browser.close();
