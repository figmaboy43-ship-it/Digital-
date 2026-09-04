const fs = require('fs');

const fixFile = (path) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/\.single\(\)/g, '.maybeSingle()');
    fs.writeFileSync(path, content);
    console.log('Fixed', path);
  }
};

fixFile('src/pages/Dashboard/RetailDashboard.tsx');
fixFile('src/pages/Wholesale/index.tsx');
