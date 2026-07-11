const puppeteer = require('puppeteer');
const path = require('path');

const OUT = 'C:\\Users\\dezin\\.gemini\\antigravity-ide\\brain\\ba8df429-4f7a-4a23-ba97-982ab5753d72';
const ADMIN = 'http://localhost:5300';
const POS = 'http://localhost:5173';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  const shot = async (name) => {
    const p = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: p });
    console.log(`✅ ${name}.png`);
  };

  // ─────────────────────────────────────────────────
  // 1. Admin HQ Login
  // ─────────────────────────────────────────────────
  console.log('\n🔐 Admin HQ Login');
  await page.goto(`${ADMIN}/`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);
  await shot('03_admin_login');

  // Type in fields - note admin uses different placeholder
  const allInputs = await page.$$('input');
  if (allInputs.length >= 2) {
    await allInputs[0].click(); await allInputs[0].type('03000000001');
    await allInputs[1].click(); await allInputs[1].type('1234');
  }
  await shot('04_admin_login_filled');

  // Submit
  const submitBtns = await page.$$('button');
  for (const btn of submitBtns) {
    const txt = await page.evaluate(el => el.innerText, btn);
    if (txt.includes('Access') || txt.includes('Login') || txt.includes('Sign')) {
      await btn.click(); break;
    }
  }
  await sleep(4000);
  await shot('05_admin_dashboard');

  // ─────────────────────────────────────────────────
  // 2. Admin HQ - Navigate sections via sidebar
  // ─────────────────────────────────────────────────
  console.log('\n🏪 Admin Sections');

  const clickNav = async (label) => {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await page.evaluate(el => el.innerText, btn);
      if (txt.includes(label)) { await btn.click(); await sleep(2000); return true; }
    }
    return false;
  };

  if (await clickNav('Menu Builder')) await shot('06_admin_menu_builder');
  if (await clickNav('Marketing')) await shot('07_admin_marketing');
  if (await clickNav('Branch')) await shot('08_admin_branches');
  if (await clickNav('Inventory')) await shot('09_admin_inventory');
  if (await clickNav('Recipe')) await shot('10_admin_recipes');
  if (await clickNav('Website')) await shot('10b_admin_cms');

  // ─────────────────────────────────────────────────
  // 3. Owner App
  // ─────────────────────────────────────────────────
  console.log('\n📊 Owner App');
  await page.goto(`${ADMIN}/owner`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);
  await shot('11_owner_app');

  // ─────────────────────────────────────────────────
  // 4. POS Client
  // ─────────────────────────────────────────────────
  console.log('\n🖥️ POS Client');
  await page.goto(`${POS}/`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);
  await shot('12_pos_login');

  const posInputs = await page.$$('input');
  if (posInputs.length >= 2) {
    await posInputs[0].click(); await posInputs[0].type('03000000001');
    await posInputs[1].click(); await posInputs[1].type('1234');
  }
  const posBtns = await page.$$('button[type="submit"], button');
  for (const b of posBtns) {
    const txt = await page.evaluate(el => el.innerText, b);
    if (txt.includes('Login') || txt.includes('Sign') || txt.includes('Enter')) {
      await b.click(); break;
    }
  }
  await sleep(3000);
  await shot('13_pos_after_login');

  // Handle Day Start / Cash In pages
  for (let i = 0; i < 3; i++) {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await page.evaluate(el => el.innerText, btn);
      if (txt.match(/Start|Confirm|Begin|Cash In|Open/i)) {
        // Fill any number inputs first
        const numInputs = await page.$$('input[type="number"], input[type="text"]');
        for (const inp of numInputs) {
          await inp.click({ clickCount: 3 });
          await inp.type('5000');
        }
        await btn.click();
        await sleep(2000);
        break;
      }
    }
  }
  await shot('14_pos_main');

  // ─────────────────────────────────────────────────
  // 5. TV Board
  // ─────────────────────────────────────────────────
  console.log('\n📺 TV Board');
  await page.goto(`${POS}/tv-board`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);
  await shot('15_tv_board');

  await browser.close();
  console.log('\n🎉 All done!');
})();
