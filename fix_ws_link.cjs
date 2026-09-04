const fs = require('fs');
let content = fs.readFileSync('src/layouts/WholesaleLayout.tsx', 'utf8');

// Undo the incorrect key replacement
content = content.replace(
`                  key={item.name}
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}`,
`                  key={item.name}`
);

// Do the correct replacement inside the Link content
content = content.replace(
`                  <item.icon className={\`w-5 h-5 mr-3 shrink-0 \${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}\`} />
                  {item.name}
                </Link>`,
`                  <item.icon className={\`w-5 h-5 mr-3 shrink-0 \${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}\`} />
                  {item.name}
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}
                </Link>`
);

fs.writeFileSync('src/layouts/WholesaleLayout.tsx', content);
