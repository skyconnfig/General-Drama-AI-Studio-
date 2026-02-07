const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture ALL network requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
  });
  
  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });
  
  console.log('Opening page...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  console.log('Filling theme...');
  await page.fill('textarea', '测试');
  
  console.log('Clicking...');
  await page.evaluate(() => {
    document.querySelector('button')?.click();
  });
  
  console.log('Waiting 30s...');
  await page.waitForTimeout(30000);
  
  console.log('\nFailed requests:', failedRequests.length);
  failedRequests.forEach(r => console.log('  -', r));
  
  // Check if there's an error div
  const hasError = await page.$('[style*="color: #ff6b6b"]').catch(() => null);
  if (hasError) {
    const errorText = await hasError.textContent();
    console.log('Error displayed:', errorText);
  }
  
  await browser.close();
})();
