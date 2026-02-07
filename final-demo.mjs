import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('=== DRAMA STUDIO TEST ===\n');
console.log('1. Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

console.log('2. Selecting HuggingFace (Free)...');
const hfBtn = await page.$('button:has-text("HuggingFace")');
if (hfBtn) await hfBtn.click();

console.log('3. Generating script...');
await page.fill('textarea', 'A story about time travel and love');
await page.click('button:has-text("Start Creating")');

// Wait for script
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(4000);
  const h2 = await page.$('h2');
  if (h2) {
    const title = await h2.textContent();
    console.log('   ✓ Script generated:', title);
    break;
  }
}

console.log('4. Switching to Images tab...');
const imgTab = await page.$('button:has-text("Images")');
if (imgTab) {
  await imgTab.click();
  await page.waitForTimeout(500);
}

console.log('5. Generating images (with placeholder fallback)...');
const genBtn = await page.$('button:has-text("Generate All Images")');
if (genBtn) await genBtn.click();

// Wait for images
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(3000);
  
  const imgCount = await page.$$eval('img', imgs => 
    imgs.filter(img => img.complete && img.naturalWidth > 0).length
  );
  
  console.log(`   [${(i+1)*3}s] Images loaded: ${imgCount}`);
  
  if (imgCount >= 2) {
    console.log('   ✓ Images generated successfully!');
    break;
  }
}

console.log('\n=== TEST COMPLETE ===');

await browser.close();
