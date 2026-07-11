const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

// Auto-cleanup DB to prevent "Day Already Open" error
try {
  console.log("🧹 Cleaning up open business days...");
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
  console.log("🎬 Starting COMPLETE MEGA Demo Automation...");
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo: 120, // slightly slower for better visibility
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const pages = await browser.pages();
  const adminPage = pages[0];
  const tvPage = await browser.newPage();
  const websitePage = await browser.newPage();
  const posPage = await browser.newPage();
  const kdsPage = await browser.newPage();
  const riderPage = await browser.newPage();

  const hardPause = async (ms, message) => {
    console.log(`⏳ [VOICEOVER PAUSE]: ${message} (${ms/1000}s)`);
    await wait(ms);
  };

  try {
    // ----------------------------------------------------
    // PHASE 1: Admin Portal Comprehensive Tour
    // ----------------------------------------------------
    console.log("\n➡️ Phase 1: Admin Portal");
    await adminPage.bringToFront();
    await adminPage.goto(ADMIN_URL, { waitUntil: 'networkidle2' });
    await hardPause(2000, "Opening Admin Portal");

    const adminInputs = await adminPage.$$('input');
    if (adminInputs.length >= 2) {
      await adminInputs[0].type('03000000003');
      await adminInputs[1].type('admin');
    }
    await clickText(adminPage, ['access', 'login', 'sign in']);
    await hardPause(3000, "Viewing Admin Dashboard & Reports");

    await clickText(adminPage, ['staff', 'permissions']);
    await hardPause(3000, "Staff & Permissions: Creating users (Cashier, Chef, Rider)");

    await clickText(adminPage, ['menu builder', 'catalog']);
    await hardPause(3000, "Menu Builder: Adding Categories and Items");

    await clickText(adminPage, ['inventory']);
    await hardPause(3000, "Inventory Management: Managing stock levels");

    await clickText(adminPage, ['marketing']);
    await hardPause(3000, "Marketing Hub: Creating Deals and TV Banners");

    await clickText(adminPage, ['cms manager', 'website cms']);
    await hardPause(3000, "CMS Manager: Customizing Website Pages");

    // ----------------------------------------------------
    // PHASE 2: TV Board Display
    // ----------------------------------------------------
    console.log("\n➡️ Phase 2: TV Board");
    await tvPage.bringToFront();
    await tvPage.goto(`${POS_URL}/tv-board`, { waitUntil: 'networkidle2' });
    await hardPause(4000, "TV Board displaying Marketing Deals and Token numbers");

    // ----------------------------------------------------
    // PHASE 3: POS System (Cash In & Walk-in Dine-in Order)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 3: POS Manual Order");
    await posPage.bringToFront();
    await posPage.goto(POS_URL, { waitUntil: 'networkidle2' });
    
    const posInputs = await posPage.$$('input');
    if (posInputs.length >= 2) {
      await posInputs[0].type('03000000001');
      await posInputs[1].type('1234');
    }
    await clickText(posPage, ['login', 'enter', 'access']);
    await wait(2000);
    
    await clickText(posPage, ['start', 'open']);
    await wait(2000);
    const cashInInputs = await posPage.$$('input[type="number"]');
    if (cashInInputs.length > 0) {
      await cashInInputs[0].type('2000');
    }
    await clickText(posPage, ['cash in', 'open']);
    await hardPause(3000, "POS Login, Day Start & Cash In (Opening Float)");

    // Place a manual Walk-in order
    await clickText(posPage, ['zinger', 'burger', 'pizza']);
    await hardPause(1000, "Added Walk-in item to cart");
    
    // Select Dine In Table
    await clickText(posPage, ['dine in', 'takeaway', 'table']);
    await wait(1000);
    const tableInputs = await posPage.$$('input[placeholder="Enter Table No"]');
    if (tableInputs.length > 0) {
      await tableInputs[0].type('T-5');
    }

    await clickText(posPage, ['settle', 'pay']);
    await wait(1000);
    const settleInputs = await posPage.$$('input[type="number"]');
    if (settleInputs.length > 0) {
      await settleInputs[0].type('1000');
    }
    await wait(500);
    await clickText(posPage, ['confirm payment', 'record']);
    await hardPause(3000, "Walk-in Dine-In order paid successfully.");
    
    await clickText(posPage, ['close ticket', 'cancel', 'close']);

    // ----------------------------------------------------
    // PHASE 4: Customer Website (Online Order)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 4: Customer Website");
    await websitePage.bringToFront();
    await websitePage.goto(WEBSITE_URL, { waitUntil: 'networkidle2' });
    await hardPause(3000, "Customer browsing the Website and ordering");
    
    await clickText(websitePage, ['add to cart', '+ add']);
    await hardPause(1000, "Added item to cart");
    await clickText(websitePage, ['checkout', 'cart', 'view cart']);
    await hardPause(2000, "Reviewing Checkout");
    
    await clickText(websitePage, ['checkout', 'proceed', 'place order']);
    const webInputs = await websitePage.$$('input');
    if (webInputs.length >= 3) {
      await webInputs[0].type('Ali Customer');
      await webInputs[1].type('03009999999');
      await webInputs[2].type('Block 5, Clifton');
    }
    await clickText(websitePage, ['confirm order', 'place order']);
    await hardPause(4000, "Online Order Placed! Live tracking screen active.");

    // ----------------------------------------------------
    // PHASE 5: POS (Accept Web Order)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 5: POS Accept Web Order");
    await posPage.bringToFront();
    await hardPause(2000, "New Delivery Web Order received on POS");
    
    await clickText(posPage, ['accept', 'confirm', 'send to kitchen']);
    await hardPause(3000, "Web order accepted and sent to KDS");

    // ----------------------------------------------------
    // PHASE 6: KDS (Kitchen)
    // ----------------------------------------------------
    console.log("\n➡️ Phase 6: KDS (Kitchen)");
    await kdsPage.bringToFront();
    await kdsPage.goto(`${POS_URL}/kitchen`, { waitUntil: 'networkidle2' });
    await hardPause(3000, "Kitchen Display System showing all tickets (Walk-in + Web)");
    
    await clickText(kdsPage, ['preparing', 'start', 'accept']);
    await wait(1000);
    await clickText(kdsPage, ['preparing', 'start', 'accept']);
    await hardPause(2000, "Chefs preparing food");

    await clickText(kdsPage, ['ready', 'complete', 'done']);
    await wait(1000);
    await clickText(kdsPage, ['ready', 'complete', 'done']);
    await hardPause(3000, "All orders ready for dispatch");

    // ----------------------------------------------------
    // PHASE 7: POS Dispatch to Rider
    // ----------------------------------------------------
    console.log("\n➡️ Phase 7: POS Dispatch");
    await posPage.bringToFront();
    await hardPause(2000, "Back to POS to dispatch delivery order");
    
    await clickText(posPage, ['dispatch', 'assign rider', 'rider']);
    await wait(1000);
    await clickText(posPage, ['confirm', 'assign', 'ok']);
    await hardPause(3000, "Delivery Order dispatched to rider");

    // ----------------------------------------------------
    // PHASE 8: Rider App
    // ----------------------------------------------------
    console.log("\n➡️ Phase 8: Rider App");
    await riderPage.bringToFront();
    await riderPage.goto(RIDER_URL, { waitUntil: 'networkidle2' });
    await hardPause(3000, "Rider App: Notification received");

    await clickText(riderPage, ['login', 'access']);
    await wait(2000);
    await clickText(riderPage, ['accept delivery', 'start', 'pickup']);
    await hardPause(3000, "Rider accepted delivery and on the way");
    
    await clickText(riderPage, ['mark delivered', 'complete', 'done']);
    await hardPause(2000, "Rider marked order as Delivered");

    // ----------------------------------------------------
    // PHASE 9: End of Day Cash Out & Close
    // ----------------------------------------------------
    console.log("\n➡️ Phase 9: POS End of Day");
    await posPage.bringToFront();
    await hardPause(2000, "Shift is over. Performing POS Cash Out.");

    await clickText(posPage, ['cash out']);
    await wait(1000);
    const posCashOutInputs = await posPage.$$('input[type="number"]');
    if (posCashOutInputs.length > 0) {
      await posCashOutInputs[0].type('3000');
    }
    await wait(500);
    await clickText(posPage, ['withdraw', 'save', 'confirm cash out']);
    await hardPause(3000, "Till cash withdrawn (Cash Out completed). Now closing day.");
    
    await clickText(posPage, ['day close', 'close day']);
    await wait(1000);
    await clickText(posPage, ['confirm', 'yes']);
    await hardPause(4000, "Day officially closed!");

    // ----------------------------------------------------
    // PHASE 10: Final Admin Review
    // ----------------------------------------------------
    console.log("\n➡️ Phase 10: Admin Reports");
    await adminPage.bringToFront();
    await clickText(adminPage, ['dashboard', 'home']);
    await hardPause(5000, "Admin Dashboard updated with latest sales and reports. Demo Complete!");

  } catch (err) {
    console.error("Demo Script Error:", err);
  } finally {
    console.log("🎬 MEGA Demo finished. You can stop the recording.");
  }
})();
