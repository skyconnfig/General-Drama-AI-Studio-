import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

// Check Replicate provider is selected
const replicateBtn = await page.$('button:has-text("Replicate (Free)")');
if (replicateBtn) {
  console.log('Replicate button found - clicking...');
  await replicateBtn.click();
}

// Generate script
console.log('Generating script...');
await page.fill('textarea', 'A sci-fi romance');
await page.click('button:has-text("Start Creating")');

// Wait for script
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(4000);
  const h2 = await page.$('h2');
  if (h2) {
    const text = await h2.textContent();
    console.log('✓ Script:', text);
    break;
  }
}

// Go to Images tab
console.log('Switching to Images tab...');
const imageTab = await page.$('button:has-text("Images")');
if (imageTab) {
  await imageTab.click();
  await page.waitForTimeout(1000);
}

// Generate images
console.log('Generating images with FLUX...');
const genImagesBtn = await page.$('button:has-text("Generate All Images")');
if (genImagesBtn) {
  await genImagesBtn.click();
}

// Wait for images
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(5000);
  const imgCount = await page.$$eval('img', imgs => imgs.filter(img => img.complete && img.naturalWidth > 0).length);
  console.log(`[${(i+1)*5}s] Images loaded: ${imgCount}`);
  if (imgCount >= 2) {
    console.log('✓ Images generated successfully!');
    break;
  }
}

await browser.close();
console.log('\nTest complete!');
