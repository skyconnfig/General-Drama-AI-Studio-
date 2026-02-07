const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  console.log('1. Opening page...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  console.log('2. Entering drama theme...');
  await page.fill('textarea', '未来科技都市中的人工智能爱情故事');
  
  console.log('3. Clicking Start Creating...');
  await page.click('button:has-text("Start Creating")');
  
  // Wait for script generation
  console.log('4. Waiting for script generation (30s)...');
  await page.waitForTimeout(30000);
  
  // Check if script was generated
  const scriptContent = await page.$eval('h2', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('5. Script title:', scriptContent);
  
  // Check if scenes were created
  const sceneCount = await page.$$eval('h4', els => els.length).catch(() => 0);
  console.log('6. Number of scenes found:', sceneCount);
  
  // Print console logs
  console.log('\n--- Console Logs ---');
  consoleLogs.forEach(log => console.log(log));
  
  await browser.close();
  console.log('\nWorkflow test completed!');
})();
