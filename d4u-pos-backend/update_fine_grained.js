const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/modules');

function getBasePerm(fullPath) {
  if (fullPath.includes('accounting') || fullPath.includes('cash-flow')) return 'finance.accounting';
  if (fullPath.includes('treasury')) return 'finance.treasury';
  if (fullPath.includes('inventory')) return 'inventory';
  if (fullPath.includes('warehouse')) return 'warehouse';
  if (fullPath.includes('pos-orders') || fullPath.includes('kots') || fullPath.includes('online-orders') || fullPath.includes('business-day')) return 'sales';
  if (fullPath.includes('customers') || fullPath.includes('crm') || fullPath.includes('deal') || fullPath.includes('marketing')) return 'crm';
  if (fullPath.includes('vendor')) return 'purchasing';
  if (fullPath.includes('production') || fullPath.includes('recipes')) return 'production';
  if (fullPath.includes('reports') || fullPath.includes('financial-dashboard') || fullPath.includes('general-ledger-report')) return 'finance.reports';
  if (fullPath.includes('compliance')) return 'system.audit';
  if (fullPath.includes('catalog')) return 'catalog';
  return 'system';
}

function processController(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove class level RequirePermissions
  content = content.replace(/@RequirePermissions\([^)]+\)\n@Controller/g, '@Controller');

  // Split into lines to process methods safely
  let lines = content.split('\n');
  let newLines = [];
  let basePerm = getBasePerm(fullPath);

  // We want to avoid adding multiple RequirePermissions if we already have one.
  // We will strip all method-level @RequirePermissions first
  lines = lines.filter(line => !line.trim().startsWith('@RequirePermissions'));

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match = line.match(/^\s*@(Get|Post|Put|Patch|Delete)\((.*)\)/);
    
    if (match && !line.includes('@Public')) { // Don't add permissions to public routes
      let method = match[1];
      let route = match[2];
      
      let suffix = '';
      if (route.toLowerCase().includes('approve') || line.toLowerCase().includes('approve')) {
        suffix = 'approve';
      } else if (route.toLowerCase().includes('export')) {
        suffix = 'export';
      } else {
        if (method === 'Get') suffix = 'view';
        else if (method === 'Post') suffix = 'create';
        else if (method === 'Put' || method === 'Patch') suffix = 'update';
        else if (method === 'Delete') suffix = 'delete';
        else suffix = 'manage'; // Fallback
      }

      let perm = `${basePerm}.${suffix}`;
      let indent = line.match(/^\s*/)[0];
      newLines.push(`${indent}@RequirePermissions('${perm}')`);
    }
    newLines.push(line);
  }

  content = newLines.join('\n');
  fs.writeFileSync(fullPath, content);
  console.log('Processed', fullPath);
}

function scan(dir) {
  const items = fs.readdirSync(dir);
  for (let item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.controller.ts') && !fullPath.includes('auth.controller.ts')) {
      processController(fullPath);
    }
  }
}

scan(srcDir);
