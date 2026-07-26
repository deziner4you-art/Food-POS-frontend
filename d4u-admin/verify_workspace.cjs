const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Create output directory for screenshots
  const outputDir = 'g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-admin\\screenshots';
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  }

  // Setup local storage auth
  await page.addInitScript(() => {
    localStorage.setItem('d4u_admin_user', JSON.stringify({ name: 'Admin', role: 'Super Admin' }));
    localStorage.setItem('d4u_admin_token', 'test_token');
  });

  console.log('Navigating to HQ Overview...');
  await page.goto('http://localhost:5300/admin/', { waitUntil: 'networkidle' });
  
  // Wait for Workspace Bar to be visible
  await page.waitForSelector('.bg-slate-900.border-b.border-slate-800', { timeout: 10000 });
  await page.screenshot({ path: path.join(outputDir, '1_Overview_Workspace_Bar.png') });
  console.log('Captured HQ Overview');

  // Change Branch context in the Switcher
  console.log('Changing Branch...');
  // Find the Branch select box (2nd select)
  const selects = await page.$$('select');
  if (selects.length >= 2) {
    // Select the first real branch if available (value > 0)
    await selects[1].selectOption({ index: 1 }); // Assuming index 1 is a valid branch
  }
  
  // Click Enter
  const enterBtn = await page.$('button:has-text("Enter")');
  if (enterBtn) {
    await enterBtn.click();
    console.log('Clicked Enter');
    await page.waitForTimeout(1500); // Wait for the transition
  }

  await page.screenshot({ path: path.join(outputDir, '2_Context_Updated.png') });
  
  // Now navigate to the requested modules to show persistence
  const modules = [
    { name: 'Inventory', url: 'http://localhost:5300/admin/inventory' },
    { name: 'Staff', url: 'http://localhost:5300/admin/staff' },
    { name: 'Marketing', url: 'http://localhost:5300/admin/marketing' },
    { name: 'CRM', url: 'http://localhost:5300/admin/customers' },
    { name: 'Website_CMS', url: 'http://localhost:5300/admin/cms' },
  ];

  for (const mod of modules) {
    console.log(`Navigating to ${mod.name}...`);
    // Use client-side navigation or just goto if SPA maintains state
    await page.goto(mod.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // let UI settle
    await page.screenshot({ path: path.join(outputDir, `3_${mod.name}_Workspace_Bar.png`) });
    console.log(`Captured ${mod.name}`);
  }

  await browser.close();
  console.log('Done');
})();
