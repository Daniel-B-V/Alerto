const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Navigate to the login page
  await page.goto('http://localhost:3001');

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Get the HTML structure
  const html = await page.content();
  console.log('Page loaded successfully');

  // Check for cloud logo
  const cloudLogo = await page.locator('.inline-flex.items-center.justify-center').first();
  const isVisible = await cloudLogo.isVisible();
  console.log('Cloud logo container visible:', isVisible);

  if (isVisible) {
    const bgColor = await cloudLogo.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Logo background color:', bgColor);
  }

  // Take a full screenshot
  await page.screenshot({
    path: 'login-test.png',
    fullPage: true
  });

  console.log('\n✓ Screenshot saved as login-test.png');
  console.log('✓ Browser will stay open - you can inspect the page');
  console.log('  Press Ctrl+C to close when done\n');

  // Keep browser open indefinitely for inspection
  await page.waitForTimeout(300000); // 5 minutes

  await browser.close();
})();
