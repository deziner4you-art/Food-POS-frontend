const xlsx = require('xlsx');

const filePath = 'C:\\Users\\dezin\\Downloads\\Final NEW COSTING SHEET.xls';
const workbook = xlsx.readFile(filePath);

const uniqueItems = new Map();

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  for (const row of data) {
    if (!Array.isArray(row)) continue;
    
    for (let i = 0; i < row.length; i++) {
      if (typeof row[i] === 'string' && row[i].trim() && 
          !row[i].toUpperCase().includes('TOTAL') && 
          !row[i].toUpperCase().includes('COST') && 
          !row[i].toUpperCase().includes('SALE')) {
         
         if (typeof row[i+1] === 'number' && typeof row[i+2] === 'number') {
           const itemName = row[i].trim().replace(/\s+/g, ' '); // normalize spaces
           let unitPrice = row[i+2];
           
           // Exclude if name is something like 'ITEM', 'QTY', etc.
           if (['ITEM', 'QTY', 'PRICE', 'DESCRIPTION', 'SR.No', 'Item Name'].includes(itemName.toUpperCase())) continue;
           
           if (!uniqueItems.has(itemName)) {
             uniqueItems.set(itemName, unitPrice);
           }
           break;
         }
      }
    }
  }
}

console.log("Extracted Unique Items:");
uniqueItems.forEach((price, name) => {
  console.log(`${name}: ${price}`);
});
