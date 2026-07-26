const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    } else {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5300/admin/');
  await page.goto('http://localhost:5300/admin/', { waitUntil: 'networkidle' });
  
  // Set local storage
  console.log('Setting localStorage for auth...');
  await page.evaluate(() => {
    localStorage.setItem('d4u_admin_user', JSON.stringify({
      id: 63, name: "Super Admin", role: "Super Admin", role_id: 3, brand_id: 1, store_id: 1
    }));
    localStorage.setItem('d4u_admin_token', 'test_token');
  });

  console.log('Navigating to Customers Hub...');
  await page.goto('http://localhost:5300/admin/customers', { waitUntil: 'networkidle' });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
