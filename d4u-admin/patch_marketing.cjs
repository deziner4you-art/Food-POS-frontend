const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'MarketingHub.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace fetch(`${BACKEND_URL}${endpoint}` with apiFetch(`${endpoint}`
content = content.replace(/fetch\(`\$\{BACKEND_URL\}\$\{endpoint\}`,\s*\{/g, "apiFetch(endpoint, {");
content = content.replace(/fetch\(`\$\{BACKEND_URL\}\$\{endpoint\}\/\$\{deleteConfirmId\}`,\s*\{/g, "apiFetch(`${endpoint}/${deleteConfirmId}`, {");

// 2. Replace fetch(`${BACKEND_URL}/path` with apiFetch(`/path`
content = content.replace(/fetch\(`\$\{BACKEND_URL\}(\/[^`]*)`,\s*\{/g, "apiFetch(`$1`, {");

// 3. Remove headers: getHeaders()
content = content.replace(/headers:\s*getHeaders\(\)/g, "/* headers removed */");
content = content.replace(/headers:\s*getHeaders\(true\)/g, "headers: { 'Content-Type': 'application/json' }");

fs.writeFileSync(filePath, content);
console.log('MarketingHub.tsx patched successfully');
