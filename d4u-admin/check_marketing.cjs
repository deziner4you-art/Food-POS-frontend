const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:5300/admin/');
  await page.evaluate(() => {
    sessionStorage.setItem('adminToken', 'mock-token');
    sessionStorage.setItem('adminIsBranchEntered', 'true');
    sessionStorage.setItem('adminSelectedBranchId', '1');
  });
  
  await page.goto('http://localhost:5300/admin/marketing', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
