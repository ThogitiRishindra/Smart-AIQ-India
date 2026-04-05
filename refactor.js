const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const frontendDir = path.join(srcDir, 'frontend');
const backendDir = path.join(srcDir, 'backend');

// 1. Create directories
if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir);
if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir);

// 2. Move folders safely
function moveSafe(src, dest) {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
}

moveSafe(path.join(srcDir, 'components'), path.join(frontendDir, 'components'));
moveSafe(path.join(srcDir, 'pages'), path.join(frontendDir, 'pages'));

// Move services to backend
const servicesDir = path.join(srcDir, 'services');
if (fs.existsSync(servicesDir)) {
  const files = fs.readdirSync(servicesDir);
  files.forEach(f => {
    fs.renameSync(path.join(servicesDir, f), path.join(backendDir, f));
  });
  fs.rmdirSync(servicesDir);
}

// 3. Update paths
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      results.push(full);
    }
  });
  return results;
}

const allFiles = walk(srcDir);

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Normalize paths for matching in case of Windows
  const relPath = path.relative(srcDir, file).replace(/\\/g, '/');

  if (relPath === 'App.tsx') {
    newContent = newContent.replace(/\.\/components\//g, './frontend/components/');
    newContent = newContent.replace(/\.\/pages\//g, './frontend/pages/');
  } else if (relPath.startsWith('frontend/')) {
    newContent = newContent.replace(/\.\.\/services\//g, '../../backend/');
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});

console.log("Refactoring complete.");
