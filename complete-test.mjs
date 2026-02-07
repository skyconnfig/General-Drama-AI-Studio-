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
await page.fill('textarea', 'A young scientist falls in love with an AI');

await page.click('button');

for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(5000);
  const h2 = await page.$('h2');
  if (h2) {
    const text = await h2.textContent();
    console.log('✓ SCRIPT TITLE:', text);
    
    // Check scenes
    const scenes = await page.$$eval('h4', els => els.map(e => e.textContent).slice(0, 6));
    console.log('  Scenes:', scenes.join(', '));
    break;
  }
  console.log(`[${(i+1)*5}s] Waiting...`);
}

await browser.close();
console.log('\nDone!');
