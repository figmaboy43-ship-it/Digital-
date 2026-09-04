const fs = require('fs');
let content = fs.readFileSync('src/layouts/DashboardLayout.tsx', 'utf8');

if (!content.includes("useChatStore")) {
  content = content.replace(
    "import { useAuthStore } from '../store/authStore';",
    "import { useAuthStore } from '../store/authStore';\nimport { useChatStore } from '../store/chatStore';"
  );
  
  content = content.replace(
    "export function DashboardLayout({ children }: { children: ReactNode }) {",
    "export function DashboardLayout({ children }: { children: ReactNode }) {\n  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();"
  );
  
  content = content.replace(
    "const handleLogout = async () => {",
    "useEffect(() => {\n    if (user && profile) {\n      fetchUnreadCount(user.id, profile.role);\n      subscribeToMessages(user.id, profile.role);\n    }\n  }, [user, profile]);\n\n  const handleLogout = async () => {"
  );
  
  content = content.replace(
    "<span className=\"flex-1\">{item.name}</span>",
    `<span className="flex-1">{item.name}</span>
                  {item.name === 'সাপোর্ট চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                      {unreadCount}
                    </span>
                  )}`
  );

  fs.writeFileSync('src/layouts/DashboardLayout.tsx', content);
  console.log("Patched DashboardLayout with badge");
}
