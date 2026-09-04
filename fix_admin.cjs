const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminWholesale.tsx', 'utf8');
content = content.replace(/  \}\);\n\}$|  \}\);\n\}|  \);\}$|  \);\n\}/, ''); // Try to remove the closing tags
content = content.replace(/<\/div>      <\/div>    <\/div>  \);\}$/, '</div></div></div>)}</div>);}')
fs.writeFileSync('src/pages/admin/AdminWholesale.tsx', content);
