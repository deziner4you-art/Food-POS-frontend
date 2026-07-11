import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const filePath = 'C:\\Users\\dezin\\Downloads\\Final NEW COSTING SHEET.xls';
  console.log('Reading file from:', filePath);
  
  const workbook = xlsx.readFile(filePath);

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Processing Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' }) as any[];
    
    let itemKey = '';
    let startIndex = 0;
    
    // Find the row that contains "ITEM"
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const key of Object.keys(row)) {
        if (typeof row[key] === 'string' && row[key].trim().toUpperCase().includes('ITEM')) {
          itemKey = key;
          startIndex = i + 1; // Start reading data from the next row
          break;
        }
      }
      if (itemKey) break;
    }
    
    if (!itemKey) {
      console.log(`Could not find a cell with "ITEM" to identify the column in sheet ${sheetName}. Skipping sheet.`);
      continue;
    }
    
    console.log(`Found "ITEM" header at row index ${startIndex - 1}, key is "${itemKey}"`);

    let added = 0;
    let skipped = 0;

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      let itemName = row[itemKey];
      if (typeof itemName !== 'string') continue;
      
      itemName = itemName.trim();
      if (!itemName || itemName.toUpperCase().includes('ITEM') || itemName.toUpperCase().includes('TOTAL')) continue;
      
      const existing = await prisma.inventoryItem.findFirst({
        where: { name: itemName, store_id: 1 }
      });

      if (existing) {
        skipped++;
        totalSkipped++;
        continue;
      }

      await prisma.inventoryItem.create({
        data: {
          store_id: 1,
          name: itemName,
          quantity: 0,
          unit: 'kg', // Defaulting to kg since the sheet might just have QTY numbers
          reorder_level: 0,
          unit_price: 0
        }
      });
      added++;
      totalAdded++;
      console.log(`Added: ${itemName}`);
    }
    
    console.log(`Sheet "${sheetName}" complete. Added: ${added}, Skipped: ${skipped}`);
  }

  console.log(`\n=== IMPORT FINISHED ===\nTotal Added: ${totalAdded}\nTotal Skipped: ${totalSkipped}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
