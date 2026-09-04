const fs = require('fs');

const fixFile = (path) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/\.from\('wallets'\)\.select\((.*?)\)\.eq\((.*?)\)\.single\(\)/g, ".from('wallets').select($1).eq($2).maybeSingle()");
    // For multiline queries:
    content = content.replace(/\.single\(\)/g, '.maybeSingle()');
    fs.writeFileSync(path, content);
    console.log('Fixed', path);
  }
};

fixFile('src/pages/Dashboard/Wallet.tsx');
fixFile('src/pages/Wholesale/Wallet.tsx');
fixFile('src/pages/Wholesale/Deposit.tsx');
