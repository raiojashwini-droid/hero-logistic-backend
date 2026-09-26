const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

console.log('--- CHECKING FOR DUPLICATE EXPORTS IN CONTROLLERS ---');

files.forEach(file => {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const exportCounts = {};

  lines.forEach((line, index) => {
    const match = line.match(/^exports\.([a-zA-Z0-9_]+)\s*=/);
    if (match) {
      const fnName = match[1];
      if (!exportCounts[fnName]) exportCounts[fnName] = [];
      exportCounts[fnName].push(index + 1);
    }
  });

  const duplicates = Object.keys(exportCounts).filter(fn => exportCounts[fn].length > 1);
  if (duplicates.length > 0) {
    console.log(`\nFile: ${file}`);
    duplicates.forEach(fn => {
      console.log(`  DUPLICATE: exports.${fn} on lines ${exportCounts[fn].join(', ')}`);
    });
  }
});
