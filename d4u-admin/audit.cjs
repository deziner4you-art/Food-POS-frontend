const fs = require('fs');
const files = {
  'Dashboard': 'src/pages/Dashboard.tsx',
  'CMS Manager': 'src/pages/CmsManager.tsx',
  'Marketing Hub': 'src/pages/MarketingHub.tsx',
  'Menu Manager': 'src/pages/MenuManager.tsx'
};

const legacyRegex = /\b(bg|text|border|ring|shadow|divide)-(slate|gray|white|black|blue|red|green|yellow|indigo|purple|pink|emerald|teal|amber|orange|zinc|neutral|stone)-?\d*\b/g;
const legacyMiscRegex = /\b(rounded-md|shadow-md|shadow-sm|shadow-lg)\b/g;
const stitchRegex = /\b(bg|text|border|ring|shadow|divide)-stitch-[a-z-]+\b/g;

for (const [name, path] of Object.entries(files)) {
  if (!fs.existsSync(path)) { console.log(name, 'not found'); continue; }
  const content = fs.readFileSync(path, 'utf8');
  
  // Extract all className string values (rough approximation to avoid complex AST parsing)
  const classMatches = [...content.matchAll(/className\s*=\s*(?:["']([^"']+)["']|\{`([^`]+)`\}|\{(.*?)\})/g)];
  
  let legacyCount = 0;
  let stitchCount = 0;
  let legacyClasses = new Set();
  
  for (const match of classMatches) {
    const clsString = match[1] || match[2] || match[3] || '';
    const legacyMatches = [...clsString.matchAll(legacyRegex), ...clsString.matchAll(legacyMiscRegex)];
    const sMatches = [...clsString.matchAll(stitchRegex)];
    
    legacyCount += legacyMatches.length;
    stitchCount += sMatches.length;
    
    legacyMatches.forEach(m => legacyClasses.add(m[0]));
  }
  
  const total = legacyCount + stitchCount;
  const stitchPct = total > 0 ? Math.round((stitchCount / total) * 100) : 0;
  const legacyPct = total > 0 ? Math.round((legacyCount / total) * 100) : 0;
  
  console.log(`\n=== ${name} ===`);
  console.log(`${stitchPct}% Stitch (${stitchCount})`);
  console.log(`${legacyPct}% Legacy (${legacyCount})`);
  console.log('Legacy classes found:', Array.from(legacyClasses).slice(0, 50).join(', '));
}
