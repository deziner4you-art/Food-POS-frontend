const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5300/admin/login'); // Go to login to establish origin
    
    // Set localStorage auth tokens
    await page.evaluate(() => {
      localStorage.setItem('d4u_admin_token', 'fake-token-bypass');
      localStorage.setItem('d4u_admin_user', JSON.stringify({ id: 1, role: 'SUPER_ADMIN', name: 'Admin', store_id: 1, brand_id: 1 }));
    });
    
    await page.goto('http://localhost:5300/admin/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Screenshot
    const screenshotPath = path.join(process.cwd(), 'admin_inspection.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Inject element and get styles
    const result = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'bg-stitch-surface border-stitch-border text-stitch-ink';
      document.body.appendChild(el);
      
      const computed = getComputedStyle(el);
      const rootComputed = getComputedStyle(document.documentElement);
      
      return {
        element: {
          className: el.className,
          computedBackgroundColor: computed.backgroundColor,
          computedColor: computed.color,
          computedBorderColor: computed.borderColor
        },
        root: {
          '--stitch-bg': rootComputed.getPropertyValue('--stitch-bg'),
          '--stitch-surface': rootComputed.getPropertyValue('--stitch-surface'),
          '--stitch-panel': rootComputed.getPropertyValue('--stitch-panel'),
          '--stitch-card': rootComputed.getPropertyValue('--stitch-card'),
          '--stitch-accent': rootComputed.getPropertyValue('--stitch-accent'),
          '--stitch-border': rootComputed.getPropertyValue('--stitch-border')
        }
      };
    });
    
    console.log('--- CSS Variables on :root ---');
    console.table(result.root);
    console.log('\\n--- Injected Element with bg-stitch-surface ---');
    console.table(result.element);
    
  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await browser.close();
  }
})();
