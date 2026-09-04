const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('<Route path="messages" element={<Chat />} />')) {
  content = content.replace(
    '<Route path="support" element={<SupportTickets />} />',
    '<Route path="support" element={<SupportTickets />} />\n              <Route path="messages" element={<Chat />} />'
  );
  
  fs.writeFileSync(path, content);
  console.log('Patched App.tsx for Wholesale Chat');
} else {
  console.log('Already patched');
}
