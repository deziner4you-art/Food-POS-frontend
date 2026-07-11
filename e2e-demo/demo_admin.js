const puppeteer = require('puppeteer');
const path = require('path');

const OUT = 'C:\\Users\\dezin\\.gemini\\antigravity-ide\\brain\\ba8df429-4f7a-4a23-ba97-982ab5753d72';
const ADMIN = 'http://localhost:5300';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  const shot = async (name) => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); console.log(`✅ ${name}.png`); };

  // Force load with auth disabled to show dashboard
  await page.goto(`${ADMIN}/`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);
  await shot('A1_admin_login_page');

  // Disable auth via API to get through
  await page.evaluate(async () => {
    await fetch('http://localhost:3001/cms/settings/1', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ module_auth_enabled: false }) });
  });
  await page.reload({ waitUntil: 'networkidle2' }); await sleep(3000);
  await shot('A2_admin_dashboard_overview');

  // Sections
  const nav = async (label, file) => {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await page.evaluate(el => el.innerText.trim(), btn);
      if (txt.toLowerCase().includes(label.toLowerCase())) { await btn.click(); await sleep(2500); await shot(file); return; }
    }
  };

  await nav('Menu', 'A3_admin_menu_builder');
  await nav('Marketing', 'A4_admin_marketing_hub');
  await nav('Branch', 'A5_admin_branches');
  await nav('Inventory', 'A6_admin_inventory');
  await nav('Recipe', 'A7_admin_recipe_costing');
  await nav('Website', 'A8_admin_website_cms');

  await browser.close();
  console.log('\n🎉 Admin screenshots done!');
})();
