const fs = require('fs');

const path = 'src/layouts/AdminLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("AdminChat") && !content.includes("সরাসরি চ্যাট")) {
  const importLucide = "import {";
  content = content.replace(importLucide, "import { MessageSquare,");
  
  const navItemStr = "{ name: 'সাপোর্ট ম্যানেজমেন্ট', path: '/admin/support', icon: HeadphonesIcon },";
  content = content.replace(
    navItemStr,
    navItemStr + "\n  { name: 'সরাসরি চ্যাট', path: '/admin/messages', icon: MessageSquare },"
  );

  fs.writeFileSync(path, content);
  console.log("Patched AdminLayout.tsx");
} else {
  console.log("Already patched");
}
