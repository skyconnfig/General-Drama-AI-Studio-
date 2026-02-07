const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[ERROR]', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });
  
  console.log('Opening page...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  // Check button text
  const buttonText = await page.$eval('button', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Button text:', buttonText);
  
  // Fill and try clicking
  console.log('Filling textarea...');
  await page.fill('textarea', '测试故事主题');
  
  // Get button and check if it's disabled
  const isDisabled = await page.$eval('button', el => el.disabled).catch(() => 'UNKNOWN');
  console.log('Button disabled:', isDisabled);
  
  // Click using evaluate to force it
  console.log('Clicking button via evaluate...');
  await page.evaluate(() => {
    const btn = document.querySelector('button');
    if (btn) btn.click();
  });
  
  // Wait longer
  console.log('Waiting 10 seconds...');
  await page.waitForTimeout(10000);
  
  // Check for any h2 elements
  const h2Text = await page.$eval('h2', el => el.textContent).catch(() => 'NO H2');
  console.log('H2 content:', h2Text);
  
  // Check for error messages
  const errorDiv = await page.$('.error, [style*="color: #ff6b6b"]').catch(() => null);
  if (errorDiv) {
    const errorText = await errorDiv.textContent();
    console.log('Error found:', errorText);
  }
  
  await browser.close();
})();
