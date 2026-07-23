const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'd4u-admin', 'src', 'pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Ensure useAdminContext is imported
  if (!content.includes('useAdminContext') && content.includes('import')) {
    content = content.replace(/import React[^;]*;/, "$&\nimport { useAdminContext } from '../context/AdminContext';");
    changed = true;
  }

  // 2. Ensure selectedBranchId is extracted
  if (content.includes('useAdminContext') && !content.includes('selectedBranchId')) {
    content = content.replace(/const \[activeTab/g, "const { selectedBranchId } = useAdminContext();\n  const [activeTab");
    changed = true;
  }

  // 3. Inject Authorization header helper if not present
  if (!content.includes('getHeaders')) {
    content = content.replace(/(export default function \w+\(\) {)/, "$1\n  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` });\n");
    changed = true;
  }

  // 4. Replace fetch headers
  const headerRegex = /headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\}/g;
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, "headers: getHeaders()");
    changed = true;
  }

  // 4.5 Replace fetch headers without Content-Type (like DELETE/GET)
  const emptyFetchRegex = /fetch\(([^,]+)\)/g;
  content = content.replace(emptyFetchRegex, "fetch($1, { headers: { 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` } })");

  const deleteFetchRegex = /fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\)/g;
  content = content.replace(deleteFetchRegex, "fetch($1, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` } })");


  // 5. Replace store_id: 1
  if (content.includes('store_id: 1')) {
    content = content.replace(/store_id:\s*1/g, "store_id: selectedBranchId || 1");
    changed = true;
  }

  if (content.includes('store_ids: [1]')) {
    content = content.replace(/store_ids:\s*\[1\]/g, "store_ids: [selectedBranchId || 1]");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', path.basename(filePath));
  }
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(pagesDir, f)));
