const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd) => {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', shell: 'powershell.exe' });
  } catch (e) {
    console.error('Command failed');
    process.exit(1);
  }
};

const destDir = 'g:\\POS_LIVE_DEPLOYMENT';

console.log('Cleaning destination...');
run(`Get-ChildItem -Path ${destDir} -Exclude .git | Remove-Item -Recurse -Force`);

console.log('Copying POS Client to root...');
run(`Copy-Item -Path g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-pos-client\\dist\\* -Destination ${destDir} -Recurse -Force`);

console.log('Copying Website...');
run(`New-Item -ItemType Directory -Force -Path ${destDir}\\website`);
run(`Copy-Item -Path g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-website\\dist\\* -Destination ${destDir}\\website -Recurse -Force`);

console.log('Copying Admin...');
run(`New-Item -ItemType Directory -Force -Path ${destDir}\\admin`);
run(`Copy-Item -Path g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-admin\\dist\\* -Destination ${destDir}\\admin -Recurse -Force`);

console.log('Copying Rider...');
run(`New-Item -ItemType Directory -Force -Path ${destDir}\\rider`);
run(`Copy-Item -Path g:\\RESTAURANT_POS_WITH_BACKEND\\d4u-rider\\dist\\* -Destination ${destDir}\\rider -Recurse -Force`);

console.log('Generating .htaccess...');
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{HTTP_HOST} ^api\\.pos\\.deziner4you\\.com$ [NC]
  RewriteRule ^ - [L]

  RewriteRule ^website/(.*)$ website/$1 [L]
  RewriteCond %{REQUEST_URI} ^/website
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^website/.* website/index.html [L]

  RewriteRule ^admin/(.*)$ admin/$1 [L]
  RewriteCond %{REQUEST_URI} ^/admin
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^admin/.* admin/index.html [L]

  RewriteRule ^rider/(.*)$ rider/$1 [L]
  RewriteCond %{REQUEST_URI} ^/rider
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^rider/.* rider/index.html [L]

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.html [L]
</IfModule>`;

fs.writeFileSync('g:\\\\POS_LIVE_DEPLOYMENT\\\\.htaccess', htaccessContent);
console.log('Done!');
