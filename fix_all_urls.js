const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const apps = ['d4u-admin', 'd4u-pos-client', 'd4u-rider', 'd4u-website'];
apps.forEach(app => {
    const files = walkDir(path.join('g:/RESTAURANT_POS_WITH_BACKEND', app, 'src'));
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        let newContent = content.replace(/const BACKEND_URL = [^;]+;/g, "const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';");
        if (content !== newContent) {
            fs.writeFileSync(f, newContent);
            console.log('Updated ' + f);
        }
    });
});
