const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

try {
  console.log("🧹 Cleaning up database and business days...");
  execSync('node ../d4u-pos-backend/seed_demo_data.js', { stdio: 'ignore' });
  execSync('node ../d4u-pos-backend/fix_day.js', { stdio: 'ignore' });
} catch (e) {}

const ADMIN_URL = 'http://localhost:5300';
const WEBSITE_URL = 'http://localhost:5200';
const POS_URL = 'http://localhost:5173';
const RIDER_URL = 'http://localhost:3000';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function clickText(page, textMatchers, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const btns = await page.$$('button, div[role="button"], span, a, div.btn, .sidebar-item, h3, h2, li');
    for (const b of btns) {
      const text = await page.evaluate(el => el.innerText || el.textContent, b);
      if (text && textMatchers.some(m => text.toLowerCase().includes(m.toLowerCase()))) {
        await b.click().catch(()=>{});
        return true;
      }
    }
    await wait(500);
  }
  return false;
}

(async () => {
  console.log("🎬 Starting ULTIMATE MEGA Master Demo...");
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo: 100, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const adminPage = (await browser.pages())[0];
  const websitePage = await browser.newPage();
  const riderPage = await browser.newPage();
  const tvPage = await browser.newPage();
  const posPage = await browser.newPage();
  const kdsPage = await browser.newPage();

  const hardPause = async (ms, message) => {
    console.log(`⏳ [VOICEOVER PAUSE]: ${message} (${ms/1000}s)`);
    await wait(ms);
  };

  try {
    // ----------------------------------------------------
    // PHASE 1: ADMIN BACKEND (Sara System Tour)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 1: Admin Backend Tour");
    await adminPage.bringToFront();
    await adminPage.goto(ADMIN_URL, { waitUntil: 'networkidle2' });
    
    const adminInputs = await adminPage.$$('input');
    if (adminInputs.length >= 2) {
      await adminInputs[0].type('03000000003');
      await adminInputs[1].type('admin');
    }
    await clickText(adminPage, ['access', 'login', 'sign in']);
    await hardPause(3000, "1. Admin Backend: Sara system overview start");

    await clickText(adminPage, ['menu builder', 'catalog']);
    await hardPause(2000, "Admin: Menu Builder aur Categories assign karna");

    await clickText(adminPage, ['staff', 'permissions']);
    await hardPause(2000, "Admin: Staff aur Timings section");

    await clickText(adminPage, ['marketing', 'crm']);
    await hardPause(2000, "Admin: Marketing Hub aur Discount System");

    await clickText(adminPage, ['inventory']);
    await hardPause(2000, "Admin: Inventory Management");

    await clickText(adminPage, ['recipe costing']);
    await hardPause(2000, "Admin: Recipe Costing");

    await clickText(adminPage, ['dashboard', 'home']);
    await hardPause(2000, "Admin Tour Complete.");

    // ----------------------------------------------------
    // PHASE 2: CUSTOMER WEBSITE ORDER
    // ----------------------------------------------------
    console.log("\n➡️ Phase 2: Customer Website Order");
    await websitePage.bringToFront();
    await websitePage.goto(WEBSITE_URL, { waitUntil: 'networkidle2' });
    await hardPause(2000, "2. Customer Website: Live Online Menu");
    
    await clickText(websitePage, ['add to cart', '+ add']);
    await clickText(websitePage, ['checkout', 'cart', 'view cart']);
    await clickText(websitePage, ['checkout', 'proceed', 'place order']);
    const webInputs = await websitePage.$$('input');
    if (webInputs.length >= 3) {
      await webInputs[0].type('Ahmed Customer');
      await webInputs[1].type('03009999999');
      await webInputs[2].type('Block 5, Clifton');
    }
    await clickText(websitePage, ['confirm order', 'place order']);
    await hardPause(3000, "Website Order Placed! Live tracking chal rahi hai.");

    // ----------------------------------------------------
    // PHASE 3: TV BOARD
    // ----------------------------------------------------
    console.log("\n➡️ Phase 3: TV Board");
    await tvPage.bringToFront();
    await tvPage.goto(`${POS_URL}/tv-board`, { waitUntil: 'networkidle2' });
    await hardPause(3000, "3. In-Store TV Board for live Tokens aur Deals");

    // ----------------------------------------------------
    // PHASE 4: POS SYSTEM PROCEDURES
    // ----------------------------------------------------
    console.log("\n➡️ Phase 4: POS Operations");
    await posPage.bringToFront();
    await posPage.goto(POS_URL, { waitUntil: 'networkidle2' });
    
    // Login
    const posInputs = await posPage.$$('input');
    if (posInputs.length >= 2) {
      await posInputs[0].type('03000000001');
      await posInputs[1].type('1234');
    }
    await clickText(posPage, ['login', 'enter', 'access']);
    await wait(2000);
    
    // Day Start & Cash In
    await clickText(posPage, ['start', 'open']);
    await wait(2000);
    const cashInInputs = await posPage.$$('input[type="number"]');
    if (cashInInputs.length > 0) { await cashInInputs[0].type('1500'); }
    await clickText(posPage, ['cash in', 'open']);
    await hardPause(3000, "4. POS: Shift Start aur Cash In (1500 Float)");

    // Accept Web Order
    await clickText(posPage, ['accept', 'confirm', 'send to kitchen']);
    await hardPause(2000, "POS: Website ka Delivery Order Accept kiya");

    // Print KOT
    await clickText(posPage, ['print kot', 'kot']);
    await hardPause(2000, "POS: KOT Print Function dikhaya");

    // ----------------------------------------------------
    // PHASE 5: KDS (KITCHEN)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 5: Kitchen (KDS)");
    await kdsPage.bringToFront();
    await kdsPage.goto(`${POS_URL}/kitchen`, { waitUntil: 'networkidle2' });
    await hardPause(2000, "5. KDS: Kitchen ticket appear ho gaya");
    
    await clickText(kdsPage, ['preparing', 'start']);
    await clickText(kdsPage, ['ready', 'complete']);
    await hardPause(2000, "KDS: Order ready kar diya");

    // ----------------------------------------------------
    // PHASE 6: POS DISPATCH & RIDER DELIVERY
    // ----------------------------------------------------
    console.log("\n➡️ Phase 6: POS Dispatch & Rider App");
    await posPage.bringToFront();
    await clickText(posPage, ['dispatch', 'assign rider', 'rider']);
    await wait(1000);
    await clickText(posPage, ['confirm', 'assign', 'ok']);
    await hardPause(2000, "6. POS: Order Rider ko dispatch kiya");

    await riderPage.bringToFront();
    await riderPage.goto(RIDER_URL, { waitUntil: 'networkidle2' });
    await clickText(riderPage, ['login', 'access']);
    await wait(2000);
    await clickText(riderPage, ['accept delivery', 'start', 'pickup']);
    await hardPause(3000, "Rider App: Order pick up kar liya (Customer tracking pe map update ho raha hai)");
    
    await clickText(riderPage, ['mark delivered', 'complete', 'done']);
    await hardPause(2000, "Rider ne order Customer ko deliver kar diya");

    // ----------------------------------------------------
    // PHASE 7: POS CRM & RIDER CASH SETTLEMENT
    // ----------------------------------------------------
    console.log("\n➡️ Phase 7: POS Advanced Features");
    await posPage.bringToFront();
    await hardPause(2000, "7. Rider wapas POS pe aa kar Cash Settle karwa raha hai");
    await clickText(posPage, ['settle', 'pay']);
    await wait(1000);
    await clickText(posPage, ['confirm payment', 'record']);
    await clickText(posPage, ['close ticket', 'close']);
    await hardPause(2000, "Rider Delivery ka Cash Till mein settle ho gaya");

    // WhatsApp CRM
    await clickText(posPage, ['whatsapp', 'crm']);
    await hardPause(4000, "CRM: WhatsApp Web Integration. Yahan messages order mein convert hotay hain!");

    // Staff Timings / Management
    await clickText(posPage, ['staff']);
    await hardPause(3000, "Staff Management: Yahan staff ki timings aur details hain.");
    
    await clickText(posPage, ['pos', 'home']); // back to POS

    // ----------------------------------------------------
    // PHASE 8: TERMINAL LOCK, LOGOUT & DAY CLOSE
    // ----------------------------------------------------
    console.log("\n➡️ Phase 8: End of Day Security");
    await clickText(posPage, ['lock terminal', 'lock']);
    await hardPause(3000, "8. POS Terminal Lock Feature (Cashier Security)");
    
    // Unlock using password
    const unlockInputs = await posPage.$$('input[type="password"]');
    if (unlockInputs.length > 0) { await unlockInputs[0].type('1234'); }
    await clickText(posPage, ['unlock', 'access']);
    await hardPause(2000, "Terminal Unlocked");

    // Cash Out
    await clickText(posPage, ['cash out']);
    await wait(1000);
    const posCashOutInputs = await posPage.$$('input[type="number"]');
    if (posCashOutInputs.length > 0) { await posCashOutInputs[0].type('2000'); }
    await clickText(posPage, ['withdraw', 'confirm cash out']);
    await hardPause(3000, "Cash Out Complete.");
    
    // Day Close
    await clickText(posPage, ['day close', 'close day']);
    await wait(1000);
    await clickText(posPage, ['confirm', 'yes']);
    await hardPause(3000, "Day Officially Closed!");

    // Logout
    await clickText(posPage, ['logout']);
    await hardPause(2000, "Cashier Logout kar diya.");

    // ----------------------------------------------------
    // PHASE 9: ADMIN FINAL REPORTS
    // ----------------------------------------------------
    await adminPage.bringToFront();
    await adminPage.reload({ waitUntil: 'networkidle2' });
    await hardPause(5000, "9. Admin Dashboard automatically Sales aur Reports ko refresh karta hai. The End!");

  } catch (err) {
    console.error("Ultimate Demo Error:", err);
  } finally {
    console.log("🎬 ULTIMATE MEGA Demo finished.");
  }
})();
