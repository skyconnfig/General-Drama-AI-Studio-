const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept network requests to see API calls
  page.on('response', async response => {
    if (response.url().includes('deepseek')) {
      console.log('\n=== DeepSeek API Response ===');
      console.log('URL:', response.url());
      console.log('Status:', response.status());
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));
    }
  });
  
  page.on('console', msg => {
    console.log('[CONSOLE]', msg.type(), msg.text().substring(0, 200));
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });
  
  console.log('Opening page...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  console.log('Filling theme...');
  await page.fill('textarea', '爱情故事');
  
  console.log('Clicking Start...');
  await page.evaluate(() => {
    document.querySelector('button')?.click();
  });
  
  console.log('Waiting for API call (20s)...');
  await page.waitForTimeout(20000);
  
  // Check current page state
  const loadingText = await page.$eval('button span', el => el.textContent).catch(() => 'NO SPAN');
  console.log('Loading status:', loadingText);
  
  await browser.close();
  console.log('\nDone!');
})();
