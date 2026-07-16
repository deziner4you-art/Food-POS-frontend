const fs = require('fs');
const path = require('path');

const sourceDir = 'g:\\RESTAURANT_POS_WITH_BACKEND';
const destDir = 'g:\\POS_LIVE_DEPLOYMENT';

const ignoreDirs = ['node_modules', '.git', '.agents', '.gemini', 'e2e-demo'];
const rootIgnoreFiles = [
  'live_orders.json', 'modify_stitch.py', 'order-bridge.cjs', 'sync.json', 
  'update_docs.py', 'StitchLandingCompiled.js', 'StitchLandingCrash.js', 
  'StitchLandingCrashNew.js', 'compiled.js', 'add-chef.js'
];

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  const isDir = stats.isDirectory();
  if (isDir) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      if (ignoreDirs.includes(childItemName)) return;
      if (src === sourceDir && rootIgnoreFiles.includes(childItemName)) return;
      if (src === sourceDir && childItemName.endsWith('.md')) return; // ignore root markdown files
      if (childItemName.endsWith('.sqlite') || childItemName.endsWith('.sqlite-journal')) return; // ignore databases
      
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

console.log('Copying files...');
copyRecursiveSync(sourceDir, destDir);
console.log('Done copying files.');

const gitignoreContent = `
node_modules/
.env
*.sqlite
*.sqlite-journal
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
`;

fs.writeFileSync(path.join(destDir, '.gitignore'), gitignoreContent.trim());
console.log('.gitignore created.');
