const fs = require('fs');

const fixFile = (path) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/\.from\('transactions'\)/g, ".from('wallet_transactions')");
    fs.writeFileSync(path, content);
    console.log('Fixed transactions to wallet_transactions in', path);
  }
};

fixFile('src/pages/Dashboard/Wallet.tsx');
fixFile('src/pages/Wholesale/Wallet.tsx');
