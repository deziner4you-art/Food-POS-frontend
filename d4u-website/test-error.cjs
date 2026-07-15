const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', req => console.log('REQ_FAIL:', req.url(), req.failure().errorText));
    await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 10000 });
    await browser.close();
  } catch (err) {
    console.error('PUPPETEER ERROR:', err.message);
  }
})();
