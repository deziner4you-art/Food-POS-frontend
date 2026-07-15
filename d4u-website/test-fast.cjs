const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5200', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
    const content = await page.evaluate(() => document.getElementById('root').innerText || document.body.innerText);
    console.log('CONTENT:', content);
    await browser.close();
  } catch (err) {
    console.error('ERROR:', err.message);
  }
})();
