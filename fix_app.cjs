const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace("import AdminSupportTickets2 from './pages/support/AdminSupportTickets';", "");
fs.writeFileSync('src/App.tsx', content);
