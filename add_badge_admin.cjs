const fs = require('fs');
let content = fs.readFileSync('src/layouts/AdminLayout.tsx', 'utf8');

if (!content.includes("useChatStore")) {
  content = content.replace(
    "import { useAuthStore } from '../store/authStore';",
    "import { useAuthStore } from '../store/authStore';\nimport { useChatStore } from '../store/chatStore';"
  );
  
  content = content.replace(
    "export default function AdminLayout() {",
    "export default function AdminLayout() {\n  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();\n  const { user } = useAuthStore();\n"
  );
  
  content = content.replace(
    "const handleLogout = async () => {",
    "React.useEffect(() => {\n    if (user && profile) {\n      fetchUnreadCount(user.id, profile.role);\n      subscribeToMessages(user.id, profile.role);\n    }\n  }, [user, profile]);\n\n  const handleLogout = async () => {"
  );
  
  content = content.replace(
    "<span className=\"flex-1\">{item.name}</span>",
    `<span className="flex-1">{item.name}</span>
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                      {unreadCount}
                    </span>
                  )}`
  );

  fs.writeFileSync('src/layouts/AdminLayout.tsx', content);
  console.log("Patched AdminLayout with badge");
}
