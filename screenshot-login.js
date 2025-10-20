const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Listen for errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error));

  // Navigate to the login page
  await page.goto('http://localhost:3001');

  // Wait for the page to load
  await page.waitForTimeout(3000);

  // Check if elements are present
  const cloudIcon = await page.locator('svg').count();
  console.log('Number of SVG elements found:', cloudIcon);

  // Take a screenshot
  await page.screenshot({
    path: 'login-page-screenshot.png',
    fullPage: true
  });

  console.log('Screenshot saved as login-page-screenshot.png');

  // Keep browser open for 30 seconds so you can see it
  console.log('Browser will stay open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
