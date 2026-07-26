const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'MenuManager.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add apiFetch import after existing imports block
if (!content.includes("import { apiFetch }")) {
  content = content.replace(
    `import { customAlert, customSuccess, customConfirm } from '../utils/alerts';`,
    `import { customAlert, customSuccess, customConfirm } from '../utils/alerts';\nimport { apiFetch } from '../utils/api';`
  );
}

// 2. Remove the BACKEND_URL const line
content = content.replace(
  /const BACKEND_URL = window\.location\.hostname.*?'https:\/\/pos-api\.deziner4you\.com';\r?\n/,
  ''
);

// 3. Remove the broken getHeaders and getAuthHeaderOnly functions
content = content.replace(
  /\s*const getHeaders = \(\) => \(\{[\s\S]*?'Content-Type': 'application\/json',[\s\S]*?\}\);\s*/,
  '\n'
);
content = content.replace(
  /\s*const getAuthHeaderOnly = \(\) => \(\{[\s\S]*?\}\);\s*/,
  '\n'
);

// 4. Replace all fetch(`${BACKEND_URL}/X`, { method: 'Y', headers: getHeaders(), body: Z }) 
//    with apiFetch('/X', { method: 'Y', body: Z })
// Replace GET calls with getAuthHeaderOnly()
content = content.replace(
  /fetch\(`\$\{BACKEND_URL\}(\/[^`]+)`,\s*\{\s*headers:\s*getAuthHeaderOnly\(\)\s*\}\)/g,
  'apiFetch(`$1`)'
);

// Replace calls with getHeaders() and method
content = content.replace(
  /fetch\(`\$\{BACKEND_URL\}(\/[^`]+)`,\s*\{([\s\S]*?)headers:\s*getHeaders\(\),([\s\S]*?)\}\)/g,
  (match, path, before, after) => {
    const combined = (before + after).trim().replace(/,\s*$/, '');
    return `apiFetch(\`${path}\`, {${combined}})`;
  }
);

// Replace remaining fetch with BACKEND_URL (fallback)
content = content.replace(
  /fetch\(`\$\{BACKEND_URL\}(\/[^`]+)`/g,
  'apiFetch(`$1`'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ MenuManager.tsx patched — all fetch() calls replaced with apiFetch()');
