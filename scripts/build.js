const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

const filesToCopy = ['index.html', 'manifest.json', 'README.md'];
const dirsToCopy = ['icons'];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

filesToCopy.forEach((file) => {
  const src = path.join(rootDir, file);
  const dest = path.join(distDir, file);
  fs.copyFileSync(src, dest);
});

dirsToCopy.forEach((dir) => {
  const src = path.join(rootDir, dir);
  const dest = path.join(distDir, dir);
  fs.cpSync(src, dest, { recursive: true });
});

console.log('Build complete. Output in dist/.');
