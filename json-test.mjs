import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Opening...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Testing...');
await page.fill('textarea', '爱情故事');

page.on('console', msg => {
  if (msg.text().includes('Script') || msg.text().includes('JSON') || msg.text().includes('error')) {
    console.log('LOG:', msg.text().substring(0, 200));
  }
});

await page.click('button');

for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(5000);
  const h2 = await page.$('h2');
  if (h2) {
    const text = await h2.textContent();
    console.log('✓ SCRIPT TITLE:', text);
    break;
  }
}

await browser.close();
