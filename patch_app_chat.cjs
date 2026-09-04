const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { Chat }")) {
  content = content.replace(
    "import { SupportTickets } from './pages/support/SupportTickets';",
    "import { SupportTickets } from './pages/support/SupportTickets';\nimport { Chat } from './pages/Dashboard/Chat';"
  );
  
  content = content.replace(
    '<Route path="/dashboard/support" element={<DashboardLayout><SupportTickets /></DashboardLayout>} />',
    '<Route path="/dashboard/support" element={<DashboardLayout><SupportTickets /></DashboardLayout>} />\n          <Route path="/dashboard/messages" element={<DashboardLayout><Chat /></DashboardLayout>} />'
  );
  
  fs.writeFileSync(path, content);
  console.log('Patched App.tsx for User Chat');
} else {
  console.log('Already patched');
}
