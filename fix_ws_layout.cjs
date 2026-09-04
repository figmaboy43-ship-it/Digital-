const fs = require('fs');
let content = fs.readFileSync('src/layouts/WholesaleLayout.tsx', 'utf8');

// Fix duplicate useAuthStore calls which might be causing issues
content = content.replace(
  "const { user } = useAuthStore();\n  const { profile, signOut } = useAuthStore();",
  "const { user, profile, signOut } = useAuthStore();"
);

fs.writeFileSync('src/layouts/WholesaleLayout.tsx', content);
