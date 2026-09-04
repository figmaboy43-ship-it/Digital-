const fs = require('fs');
let content = fs.readFileSync('src/layouts/DashboardLayout.tsx', 'utf8');

// Revert the wrong import
content = content.replace("import { MessageSquare, ReactNode", "import { ReactNode");

// Add MessageSquare to the Lucide import
content = content.replace("LayoutDashboard,", "MessageSquare, LayoutDashboard,");

fs.writeFileSync('src/layouts/DashboardLayout.tsx', content);
