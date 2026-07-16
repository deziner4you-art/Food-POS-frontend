const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('g:/RESTAURANT_POS_WITH_BACKEND/d4u-pos-client/src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(/const BACKEND_URL = 'http:\/\/' \+ \(typeof window !== 'undefined' \? window\.location\.hostname : 'localhost'\) \+ ':3001';/g, "const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';");
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated ' + f);
  }
});
