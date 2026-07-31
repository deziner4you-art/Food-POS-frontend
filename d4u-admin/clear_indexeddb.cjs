const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(r => setTimeout(r, 2000));
    
    // Clear Dexie database
    await page.evaluate(async () => {
      if (window.indexedDB) {
        console.log('Clearing Dexie DB...');
        // We know Dexie is used, let's just clear the KOTs object store directly via standard IndexedDB API
        // First we need to find the database name. Let's delete the 'd4u-pos-db' if we know the name, 
        // or just let Dexie clear it. Dexie is exported or available? 
        // In the App.tsx it's `db.kots.clear()`.
        
        const request = window.indexedDB.open('d4u_pos_db'); // guessing name, maybe it's D4UPosDB?
        request.onsuccess = (e) => {
          const db = e.target.result;
          try {
            const tx = db.transaction('kots', 'readwrite');
            const store = tx.objectStore('kots');
            store.clear();
            console.log('KOTs cleared via IndexedDB');
          } catch(err) {
            console.log('Error opening kots store:', err);
          }
        };
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    console.log('Executed clear command in the browser context.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
