import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Opening page...');
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

// Generate script
console.log('Generating script...');
await page.fill('textarea', 'A cyberpunk city with neon lights');
await page.click('button:has-text("Start Creating")');

// Wait for script
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(4000);
  const h2 = await page.$('h2');
  if (h2) {
    console.log('✓ Script ready');
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

// Generate images with HuggingFace
console.log('Generating images with HuggingFace FLUX...');
const genBtn = await page.$('button:has-text("Generate All Images")');
if (genBtn) {
  await genBtn.click();
}

// Wait for images (FLUX can take 30-60s)
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(5000);
  
  // Check for generated images
  const imgCount = await page.$$eval('img', imgs => 
    imgs.filter(img => img.complete && img.naturalWidth > 0 && img.src.startsWith('blob:')).length
  );
  
  // Also check console for errors
  console.log(`[${(i+1)*5}s] Waiting... (images: ${imgCount})`);
  
  if (imgCount >= 2) {
    console.log('✓ Images generated successfully!');
    break;
  }
}

await browser.close();
console.log('\nTest complete!');
