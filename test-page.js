const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Opening http://localhost:3003/...');
  await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
  
  // Check page title and content
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if main elements exist
  const mainTitle = await page.$eval('h1', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Main title:', mainTitle);
  
  // Check for Gemini Veo 3.1 Ready text
  const geminiReady = await page.$eval('span', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Gemini status:', geminiReady);
  
  // Check if textarea exists
  const textarea = await page.$('textarea');
  console.log('Textarea exists:', !!textarea);
  
  // Check if Start Creating button exists
  const button = await page.$('button');
  console.log('Button exists:', !!button);
  
  await browser.close();
  console.log('\nTest completed successfully!');
})();
