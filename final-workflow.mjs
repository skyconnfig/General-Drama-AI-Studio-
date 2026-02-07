import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  if (msg.text().includes('SCRIPT') || msg.text().includes('error')) {
    console.log('LOG:', msg.text().substring(0, 200));
  }
});

console.log('Opening...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Testing...');
await page.fill('textarea', 'A love story between an astronaut and AI');

await page.click('button');

for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(5000);
  const h2 = await page.$('h2');
  if (h2) {
    const text = await h2.textContent();
    console.log('✓ SCRIPT:', text);
    break;
  }
}

await browser.close();
