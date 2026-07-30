const puppeteer = require('puppeteer');
const path = require('path');

const ROUTES = [
  { name: 'Login', url: 'http://localhost:5300/admin/login', auth: false },
  { name: 'Dashboard', url: 'http://localhost:5300/admin/', auth: true },
  { name: 'CMS_Manager', url: 'http://localhost:5300/admin/cms', auth: true },
  { name: 'Marketing_Hub', url: 'http://localhost:5300/admin/marketing', auth: true },
  { name: 'Menu_Manager', url: 'http://localhost:5300/admin/menu', auth: true }
];

const VIEWPORTS = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Tablet', width: 768, height: 1024 }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  try {
    for (const route of ROUTES) {
      console.log(`Navigating to ${route.name}...`);
      
      await page.goto('http://localhost:5300/admin/login');
      if (route.auth) {
        await page.evaluate(() => {
          localStorage.setItem('d4u_admin_token', 'fake-token-bypass');
          localStorage.setItem('d4u_admin_user', JSON.stringify({ id: 1, role: 'SUPER_ADMIN', name: 'Admin', store_id: 1, brand_id: 1 }));
        });
      } else {
        await page.evaluate(() => { localStorage.clear(); });
      }
      await page.goto(route.url);
      await new Promise(r => setTimeout(r, 2000)); // Wait for render and animations

      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await new Promise(r => setTimeout(r, 500)); // wait for layout to adjust
        
        const filename = `qa_${route.name}_${vp.name}.png`;
        const filepath = path.join(process.cwd(), filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`Captured ${filename}`);
      }
    }
  } catch (err) {
    console.error('Error during QA capture:', err);
  } finally {
    await browser.close();
  }
})();
