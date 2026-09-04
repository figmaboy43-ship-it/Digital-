const fs = require('fs');

let content = fs.readFileSync('src/pages/WholesaleProgram.tsx', 'utf8');
content = content.replace("import { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
fs.writeFileSync('src/pages/WholesaleProgram.tsx', content);

let adminContent = fs.readFileSync('src/pages/admin/AdminWholesale.tsx', 'utf8');
// Fix AdminWholesale syntax error
// The regex replace might have missed the actual end of the file. Let's re-read it.
