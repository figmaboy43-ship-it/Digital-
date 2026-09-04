const fs = require('fs');
const path = 'src/layouts/WholesaleLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("Messages") && !content.includes("সরাসরি চ্যাট")) {
  content = content.replace("LifeBuoy", "LifeBuoy,\n  MessageSquare");
  
  const navItemStr = "{ name: 'সাপোর্ট সেন্টার', href: '/wholesale/support', icon: LifeBuoy },";
  content = content.replace(
    navItemStr,
    navItemStr + "\n    { name: 'সরাসরি চ্যাট', href: '/wholesale/messages', icon: MessageSquare },"
  );

  fs.writeFileSync(path, content);
  console.log("Patched WholesaleLayout.tsx");
}
