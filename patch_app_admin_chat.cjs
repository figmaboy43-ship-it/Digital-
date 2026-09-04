const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import AdminChat")) {
  content = content.replace(
    "import AdminSupportTickets",
    "import AdminSupportTickets from './pages/support/AdminSupportTickets';\nimport AdminChat from './pages/admin/AdminChat';\nimport AdminSupportTickets2"
  );
  
  content = content.replace(
    '<Route path="support" element={<AdminSupportTickets />} />',
    '<Route path="support" element={<AdminSupportTickets />} />\n              <Route path="messages" element={<AdminChat />} />'
  );
  
  fs.writeFileSync(path, content);
  console.log('Patched App.tsx for Admin Chat');
} else {
  console.log('Already patched');
}
