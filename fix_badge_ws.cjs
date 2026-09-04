const fs = require('fs');
let content = fs.readFileSync('src/layouts/WholesaleLayout.tsx', 'utf8');

content = content.replace(
  "{item.name}",
  `{item.name}
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}`
);

fs.writeFileSync('src/layouts/WholesaleLayout.tsx', content);
