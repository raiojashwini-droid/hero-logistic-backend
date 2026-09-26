const fs = require('fs');
const path = require('path');
const dir = './src/routes';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.js')) return;
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;
  if (c.includes('// router.use(auth.verifyToken);')) {
    c = c.replace(/\/\/ router\.use\(auth\.verifyToken\);/g, 'router.use(auth.verifyToken);');
    changed = true;
  }
  if (c.includes('// const auth = require(\'../middlewares/auth\');')) {
    c = c.replace(/\/\/ const auth = require\('\.\.\/middlewares\/auth'\);/g, 'const auth = require(\'../middlewares/auth\');');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
  }
});
