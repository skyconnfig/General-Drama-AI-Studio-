import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('pageerror', err => {
  console.log('PAGE ERROR:', err.message);
  console.log('STACK:', err.stack);
});

page.on('response', async response => {
  if (response.url().includes('deepseek')) {
    console.log('DEEPSEEK RESPONSE:', response.status());
    const text = await response.text();
    console.log('RESPONSE PREVIEW:', text.substring(0, 200));
  }
});

console.log('Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Clicking button...');
await page.click('button');

console.log('Waiting 30s...');
await page.waitForTimeout(30000);

console.log('\nChecking for error div...');
const errorDiv = await page.$('[style*="color: #ff6b6b"]');
if (errorDiv) {
  console.log('Found error div:', await errorDiv.textContent());
}

await browser.close();
