const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminWholesaleSettings.tsx', 'utf8');

content = content.replace(
  "const { data: existingData } = await supabase\n        .from('site_settings')\n        .select('id')\n        .eq('key', 'wholesale_content')\n        .single();",
  `const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'wholesale_content')
        .maybeSingle();`
);

fs.writeFileSync('src/pages/admin/AdminWholesaleSettings.tsx', content);
