const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

try {
  console.log("🧹 Cleaning up open business days...");
  execSync('node ../d4u-pos-backend/fix_day.js', { stdio: 'ignore' });
} catch (e) {}

const POS_URL = 'http://localhost:5173';
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
  console.log("🎬 Starting POS Detailed Demo...");
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo: 120, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const posPage = (await browser.pages())[0];
  const hardPause = async (ms, message) => {
    console.log(`⏳ [VOICEOVER PAUSE]: ${message} (${ms/1000}s)`);
    await wait(ms);
  };

  try {
    await posPage.goto(POS_URL, { waitUntil: 'networkidle2' });
    
    // ----------------------------------------------------
    // 1. LOGIN & SHIFT START
    // ----------------------------------------------------
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
    if (cashInInputs.length > 0) { await cashInInputs[0].type('2000'); }
    await clickText(posPage, ['cash in', 'open']);
    await hardPause(3000, "1. Login & Day Start with Rs. 2000 Opening Float.");

    // ----------------------------------------------------
    // 2. DINE-IN ORDER & HOLD FUNCTIONALITY
    // ----------------------------------------------------
    await clickText(posPage, ['dine in']);
    await wait(500);
    const tableInputs = await posPage.$$('input[placeholder="Enter Table No"]');
    if (tableInputs.length > 0) { await tableInputs[0].type('Table 5'); }

    // Add Items
    await clickText(posPage, ['zinger']);
    await clickText(posPage, ['desserts', 'cold beverages']);
    await clickText(posPage, ['brownie', 'margarita']);
    await hardPause(2000, "2. Added Items for a Dine-in Order.");

    // Enter Customer Mobile for Loyalty Points
    const phoneInputs = await posPage.$$('input[type="tel"]');
    if (phoneInputs.length > 0) { await phoneInputs[0].type('03001234567'); }
    await hardPause(2000, "Attached customer mobile for Loyalty Points.");

    // Put Order on Hold
    await clickText(posPage, ['hold']);
    await hardPause(3000, "Placed order on Hold to take another quick order.");

    // ----------------------------------------------------
    // 3. TAKEAWAY ORDER & CUSTOM ITEMS
    // ----------------------------------------------------
    await clickText(posPage, ['takeaway']);
    await clickText(posPage, ['pizzas']);
    await clickText(posPage, ['fajita', 'pepperoni']);
    await hardPause(2000, "3. Taking a quick Takeaway Order.");

    // Add Custom Item
    await clickText(posPage, ['add custom item']);
    await wait(1000);
    const customInputs = await posPage.$$('input[type="text"], input[type="number"]');
    if (customInputs.length >= 2) {
      await customInputs[0].type('Special Mayo Dip');
      await customInputs[1].type('150');
    }
    await clickText(posPage, ['add', 'save']);
    await hardPause(2000, "Added a completely custom off-menu item.");

    // Settle Takeaway with Card
    await clickText(posPage, ['settle', 'pay']);
    await wait(1000);
    await clickText(posPage, ['card']);
    await clickText(posPage, ['confirm payment', 'record']);
    await hardPause(3000, "Settled Takeaway Order via Card.");
    await clickText(posPage, ['close ticket', 'close']);

    // ----------------------------------------------------
    // 4. RECALL HELD ORDER & SPLIT PAYMENT
    // ----------------------------------------------------
    await clickText(posPage, ['orders on hold', 'held']);
    await wait(1000);
    await clickText(posPage, ['resume', 'recall', 'open']);
    await hardPause(2000, "4. Recalled the Held Dine-In Order.");

    // Apply Discount
    await clickText(posPage, ['discount']);
    await wait(500);
    const discountInputs = await posPage.$$('input[type="number"]');
    if (discountInputs.length > 0) { await discountInputs[0].type('10'); } // 10% discount
    await clickText(posPage, ['apply']);
    await hardPause(2000, "Applied a 10% discount to the order.");

    // Settle with Split Payment
    await clickText(posPage, ['settle', 'pay']);
    await wait(1000);
    await clickText(posPage, ['split']);
    await wait(1000);
    const splitInputs = await posPage.$$('input[placeholder="0.00"]');
    if (splitInputs.length >= 2) {
      await splitInputs[0].type('500'); // Cash
      await splitInputs[1].type('1000'); // Card
    }
    await clickText(posPage, ['confirm payment', 'record']);
    await hardPause(3000, "Settled Dine-In order using Split Payment (Cash + Card).");
    await clickText(posPage, ['close ticket', 'close']);

    // ----------------------------------------------------
    // 5. KITCHEN DISPLAY SYSTEM (KDS)
    // ----------------------------------------------------
    const kdsPage = await browser.newPage();
    await kdsPage.goto(`${POS_URL}/kitchen`, { waitUntil: 'networkidle2' });
    await hardPause(3000, "5. Switching to Kitchen Display System (KDS).");
    
    await clickText(kdsPage, ['preparing', 'start']);
    await clickText(kdsPage, ['ready', 'complete']);
    await hardPause(3000, "Chefs marked tickets as Prepared and Ready.");

    // ----------------------------------------------------
    // 6. END OF DAY
    // ----------------------------------------------------
    await posPage.bringToFront();
    await hardPause(2000, "6. End of shift. Performing Cash Out.");

    await clickText(posPage, ['cash out']);
    await wait(1000);
    const posCashOutInputs = await posPage.$$('input[type="number"]');
    if (posCashOutInputs.length > 0) { await posCashOutInputs[0].type('500'); }
    await wait(500);
    await clickText(posPage, ['withdraw', 'confirm cash out']);
    await hardPause(3000, "Till cash withdrawn (Cash Out). Closing Day.");
    
    await clickText(posPage, ['day close', 'close day']);
    await wait(1000);
    await clickText(posPage, ['confirm', 'yes']);
    await hardPause(4000, "Day officially closed! POS Demo Complete.");

  } catch (err) {
    console.error("POS Demo Error:", err);
  } finally {
    console.log("🎬 POS Demo finished.");
  }
})();
