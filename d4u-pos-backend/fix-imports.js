const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix prisma imports
  // If we are in src/modules/core/X or src/modules/business/X, we need to go up 3 levels to src, then into database/prisma
  content = content.replace(/from '\.\.\/prisma\/(.*)'/g, "from '../../../database/prisma/$1'");
  
  // Fix app.gateway imports
  content = content.replace(/from '\.\.\/app\.gateway'/g, "from '../../../app.gateway'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src/modules'));
