const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

let stats = {
  files: 0,
  modules: 0,
  controllers: 0,
  services: 0,
  interfaces: 0,
  events: 0,
  dtos: 0,
  repositories: 0,
  validators: 0,
  fileNames: {},
  duplicates: [],
  largeFiles: [],
  emptyFiles: []
};

function scan(dir) {
  const items = fs.readdirSync(dir);
  for (let item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      stats.files++;
      const name = path.basename(fullPath);
      
      if (stats.fileNames[name]) {
        stats.fileNames[name].push(fullPath);
      } else {
        stats.fileNames[name] = [fullPath];
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 500) {
        stats.largeFiles.push({ file: fullPath, lines });
      }
      if (lines < 3) {
        stats.emptyFiles.push(fullPath);
      }

      if (name.endsWith('.module.ts')) stats.modules++;
      if (name.endsWith('.controller.ts')) stats.controllers++;
      if (name.endsWith('.service.ts')) stats.services++;
      if (name.endsWith('.interface.ts')) stats.interfaces++;
      if (name.endsWith('.event.ts')) stats.events++;
      if (name.endsWith('.dto.ts')) stats.dtos++;
      if (name.endsWith('.repository.ts')) stats.repositories++;
      if (name.endsWith('.validator.ts')) stats.validators++;
    }
  }
}

scan(srcDir);

for (const [name, paths] of Object.entries(stats.fileNames)) {
  if (paths.length > 1 && name !== 'index.ts' && name !== 'main.ts') {
    stats.duplicates.push({ name, paths });
  }
}

console.log(JSON.stringify({
  overview: {
    totalFiles: stats.files,
    modules: stats.modules,
    controllers: stats.controllers,
    services: stats.services,
    interfaces: stats.interfaces,
    events: stats.events,
    dtos: stats.dtos,
    repositories: stats.repositories,
    validators: stats.validators
  },
  duplicatesCount: stats.duplicates.length,
  largeFilesCount: stats.largeFiles.length,
  emptyFilesCount: stats.emptyFiles.length,
  duplicatesSample: stats.duplicates.slice(0, 5),
  largeFilesSample: stats.largeFiles.slice(0, 5).map(f => path.basename(f.file) + ' (' + f.lines + ' lines)')
}, null, 2));
