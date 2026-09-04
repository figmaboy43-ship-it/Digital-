const fs = require('fs');

// Fix App.tsx
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "import AdminAnnouncements from './pages/admin/AdminAnnouncements';",
  "import AdminAnnouncements from './pages/admin/AdminAnnouncements';\nimport { Chat } from './pages/Dashboard/Chat';"
);
fs.writeFileSync('src/App.tsx', content);

// Fix Services.tsx
try {
  let content2 = fs.readFileSync('src/pages/Wholesale/Services.tsx', 'utf8');
  content2 = content2.replace("DynamicIcon", "PackageSearch");
  fs.writeFileSync('src/pages/Wholesale/Services.tsx', content2);
} catch (e) {}

// Fix Reconciliation
try {
  let content3 = fs.readFileSync('src/pages/admin/AdminReconciliation.tsx', 'utf8');
  content3 = content3.replace("p.payment.status", "p.processed ? 'completed' : 'pending'");
  fs.writeFileSync('src/pages/admin/AdminReconciliation.tsx', content3);
} catch (e) {}

