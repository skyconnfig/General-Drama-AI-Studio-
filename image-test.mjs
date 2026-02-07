import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  if (msg.text().includes('Generate') || msg.text().includes('image') || msg.text().includes('error')) {
    console.log('LOG:', msg.text().substring(0, 200));
  }
});

console.log('Opening...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Generating script first...');
await page.fill('textarea', 'A love story set in ancient China');
await page.click('button');

for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(5000);
  const h2 = await page.$('h2');
  if (h2) {
    console.log('✓ Script generated');
    break;
  }
}

console.log('Switching to Images tab...');
await page.click('button:has-text("Images")');

console.log('Clicking Generate Images...');
await page.click('button:has-text("Generate All Images")');

console.log('Waiting for images...');
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(5000);
  const images = await page.$$eval('img', imgs => imgs.filter(img => img.src.startsWith('data:image')).length);
  console.log(`[${(i+1)*5}s] Images generated: ${images}`);
  if (images >= 3) break;
}

await browser.close();
console.log('\nDone!');
