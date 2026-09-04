const fs = require('fs');
const path = 'src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("Messages") && !content.includes("মেসেজ")) {
  const importLucide = "import {";
  content = content.replace(importLucide, "import { MessageSquare,");
  
  const navItemStr = "{ name: 'লেনদেনের হিসেব', href: '/dashboard/transactions', icon: History, roles: ['retail', 'wholesale'] },";
  content = content.replace(
    navItemStr,
    navItemStr + "\n  { name: 'সাপোর্ট চ্যাট', href: '/dashboard/messages', icon: MessageSquare, roles: ['retail', 'wholesale'] },"
  );

  fs.writeFileSync(path, content);
  console.log("Patched DashboardLayout.tsx");
} else {
  console.log("Already patched");
}
