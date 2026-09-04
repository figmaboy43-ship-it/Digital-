const fs = require('fs');
let content = fs.readFileSync('src/layouts/AdminLayout.tsx', 'utf8');

content = content.replace(
  "const { user } = useAuthStore();\n  const location = useLocation();\n  const navigate = useNavigate();\n  const { profile } = useAuthStore();",
  "const { user, profile } = useAuthStore();\n  const location = useLocation();\n  const navigate = useNavigate();"
);

fs.writeFileSync('src/layouts/AdminLayout.tsx', content);
