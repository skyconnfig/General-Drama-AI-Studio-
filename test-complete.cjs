const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let scriptGenerated = false;
  let errorMessage = null;
  
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text.substring(0, 300)}`);
    if (text.includes('Error') || text.includes('错误')) {
      errorMessage = text;
    }
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
    errorMessage = err.message;
  });
  
  console.log('1. Opening page...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  console.log('2. Entering theme: 未来都市爱情');
  await page.fill('textarea', '未来都市中的人工智能与人类的爱情故事');
  
  console.log('3. Clicking Start Creating...');
  await page.evaluate(() => {
    document.querySelector('button')?.click();
  });
  
  console.log('4. Waiting for script generation (60s)...');
  
  // Wait up to 60 seconds for script to generate
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(5000);
    console.log(`   Check ${i+1}/12...`);
    
    // Check if loading is still happening
    const buttonText = await page.$eval('button', el => el.textContent.trim()).catch(() => 'unknown');
    console.log(`   Button text: ${buttonText}`);
    
    // Check if h2 appeared
    const h2Exists = await page.$('h2').catch(() => null);
    if (h2Exists) {
      const h2Text = await h2Exists.textContent();
      console.log(`   ✓ SCRIPT GENERATED: ${h2Text}`);
      scriptGenerated = true;
      break;
    }
    
    if (errorMessage && !buttonText.includes('Creating')) {
      console.log(`   ✗ Error: ${errorMessage}`);
      break;
    }
  }
  
  console.log('\n=== RESULT ===');
  if (scriptGenerated) {
    console.log('✓ Script generation SUCCESS!');
    
    // Check if scenes are displayed
    const scenes = await page.$$eval('h4', els => els.map(e => e.textContent));
    console.log(`  Found ${scenes.length} scene titles`);
    scenes.slice(0, 3).forEach((s, i) => console.log(`    ${i+1}. ${s}`));
  } else {
    console.log('✗ Script generation FAILED or still loading');
  }
  
  await browser.close();
})();
