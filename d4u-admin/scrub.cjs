const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function scrubFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`
  // and variations.
  content = content.replace(/['"]?Authorization['"]?:\s*`Bearer\s*\$\{\s*localStorage\.getItem\(['"]d4u_admin_token['"]\)\s*\}`,?\s*/g, '');
  
  // Replace const token = localStorage.getItem('d4u_admin_token'); if it's used right before apiFetch
  // Actually, we can just let `const token = ...` sit there unused if it doesn't break compilation, 
  // but to be clean:
  content = content.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"]d4u_admin_token['"]\);/g, '');

  // Remove empty headers blocks: headers: { }
  content = content.replace(/headers:\s*\{\s*\},?/g, '');
  
  // For AdminContext specifically
  content = content.replace(/const\s+headers:\s*HeadersInit\s*=\s*token\s*\?\s*\{.*?\}.*?;/g, '');
  content = content.replace(/apiFetch\((.*?), {\s*headers\s*}\)/g, 'apiFetch($1)');

  // HQOverview specific
  content = content.replace(/headers:\s*\{\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Scrubbed:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      scrubFile(fullPath);
    }
  }
}

walk(srcDir);
