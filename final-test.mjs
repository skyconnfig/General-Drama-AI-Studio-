import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('BROWSER ERROR:', msg.text());
  } else if (msg.text().includes('Starting script') || msg.text().includes('Script generated') || msg.text().includes('error')) {
    console.log('CONSOLE:', msg.text());
  }
});

console.log('Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('Entering theme...');
await page.fill('textarea', '科技爱情');

console.log('Clicking Start...');
await page.click('button');

console.log('Waiting 45s for script...');
for (let i = 0; i < 9; i++) {
  await page.waitForTimeout(5000);
  const buttonText = await page.locator('button').first().textContent();
  console.log(`[${(i+1)*5}s] Button: ${buttonText}`);
  
  // Check if script loaded
  const h2 = await page.$('h2');
  if (h2) {
    const text = await h2.textContent();
    console.log('✓ SCRIPT TITLE:', text);
    
    // Check scenes
    const scenes = await page.$$('h4');
    console.log('  Found', scenes.length, 'scene items');
    break;
  }
}

await browser.close();
console.log('\nTest complete!');
