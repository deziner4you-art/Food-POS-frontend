const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/modules');

function getRelativePath(from, to) {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function scan(dir) {
  const items = fs.readdirSync(dir);
  for (let item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.controller.ts') && !fullPath.includes('auth.controller.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Determine permission
      let perm = 'system.manage';
      if (fullPath.includes('accounting') || fullPath.includes('cash-flow')) perm = 'finance.accounting.manage';
      if (fullPath.includes('treasury')) perm = 'finance.treasury.manage';
      if (fullPath.includes('inventory')) perm = 'inventory.manage';
      if (fullPath.includes('warehouse')) perm = 'warehouse.manage';
      if (fullPath.includes('pos-orders') || fullPath.includes('kots') || fullPath.includes('online-orders') || fullPath.includes('business-day')) perm = 'sales.manage';
      if (fullPath.includes('customers') || fullPath.includes('crm') || fullPath.includes('deal') || fullPath.includes('marketing')) perm = 'crm.manage';
      if (fullPath.includes('vendor')) perm = 'purchasing.manage';
      if (fullPath.includes('production') || fullPath.includes('recipes')) perm = 'production.manage';
      if (fullPath.includes('reports') || fullPath.includes('financial-dashboard') || fullPath.includes('general-ledger-report')) perm = 'finance.reports.view';
      if (fullPath.includes('compliance')) perm = 'system.audit';

      // Insert Import
      if (!content.includes('RequirePermissions')) {
        const decoratorsPath = path.join(__dirname, 'src/common/decorators');
        let relPath = getRelativePath(fullPath, decoratorsPath);
        
        // Add import after first line or after @nestjs/common
        if (content.includes('@nestjs/common')) {
          content = content.replace(/from '@nestjs\/common';?/, "from '@nestjs/common';\nimport { RequirePermissions } from '" + relPath + "';");
        } else {
          content = "import { RequirePermissions } from '" + relPath + "';\n" + content;
        }

        // Insert decorator before @Controller
        content = content.replace(/@Controller\(/, "@RequirePermissions('" + perm + "')\n@Controller(");

        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath, 'with', perm);
      }
    }
  }
}

scan(srcDir);
