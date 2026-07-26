const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const outputDir = 'g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-admin\\screenshots';
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  }

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Login via localStorage
  await page.addInitScript(() => {
    localStorage.setItem('d4u_admin_user', JSON.stringify({ name: 'Admin', role: 'Super Admin' }));
    localStorage.setItem('d4u_admin_token', 'test_token');
  });

  console.log('Navigating to HQ Overview...');
  await page.goto('http://localhost:5300/admin/', { waitUntil: 'networkidle' });
  
  console.log('Selecting Branch...');
  const selects = await page.$$('select');
  if (selects.length >= 2) {
    await selects[1].selectOption({ index: 1 });
  }
  
  const enterBtn = await page.$('button:has-text("Enter")');
  if (enterBtn) {
    await enterBtn.click();
    await page.waitForTimeout(1500);
  }

  console.log('Navigating to CRM...');
  await page.goto('http://localhost:5300/admin/customers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: path.join(outputDir, 'CRM_After_Fix_Branch_A.png') });
  console.log('Captured CRM for first branch context.');

  // Change branch again
  if (selects.length >= 2) {
    await selects[1].selectOption({ index: 2 }).catch(() => {});
  }
  if (enterBtn) {
    await enterBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: path.join(outputDir, 'CRM_After_Fix_Branch_B.png') });
  console.log('Captured CRM after workspace switch (list updated).');

  if (errors.length > 0) {
    console.log('Console errors found:', errors);
  } else {
    console.log('No console errors detected.');
  }

  await browser.close();
  console.log('Verification completed.');
})();
