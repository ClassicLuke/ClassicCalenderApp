const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const contents = fs.readFileSync(indexPath, 'utf8');
const lines = contents.split('\n');

const violations = [];

lines.forEach((line, index) => {
  if (!line.includes('innerHTML')) return;
  const trimmed = line.trim();
  if (trimmed.includes("innerHTML = ''") || trimmed.includes('innerHTML = ""')) {
    return;
  }
  if (trimmed.match(/innerHTML\s*=\s*'<[^$]*>'/)) {
    return;
  }
  violations.push({ line: index + 1, text: trimmed });
});

if (violations.length) {
  console.error('Unsafe innerHTML usage detected:');
  violations.forEach((violation) => {
    console.error(`Line ${violation.line}: ${violation.text}`);
  });
  process.exit(1);
}

console.log('Lint passed.');
