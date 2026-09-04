const fs = require('fs');
let content = fs.readFileSync('src/layouts/WholesaleLayout.tsx', 'utf8');

if (!content.includes("useChatStore")) {
  content = content.replace(
    "import { useAuthStore } from '../store/authStore';",
    "import { useAuthStore } from '../store/authStore';\nimport { useChatStore } from '../store/chatStore';"
  );
  
  content = content.replace(
    "export function WholesaleLayout() {",
    "export function WholesaleLayout() {\n  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();\n  const { user } = useAuthStore();\n"
  );
  
  content = content.replace(
    "const handleSignOut = async () => {",
    "React.useEffect(() => {\n    if (user && profile) {\n      fetchUnreadCount(user.id, profile.role);\n      subscribeToMessages(user.id, profile.role);\n    }\n  }, [user, profile]);\n\n  const handleSignOut = async () => {"
  );
  
  content = content.replace(
    "<span className=\"ml-3\">{item.name}</span>",
    `<span className="ml-3">{item.name}</span>
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}`
  );

  fs.writeFileSync('src/layouts/WholesaleLayout.tsx', content);
  console.log("Patched WholesaleLayout with badge");
}
