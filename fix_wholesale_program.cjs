const fs = require('fs');
let content = fs.readFileSync('src/pages/WholesaleProgram.tsx', 'utf8');

content = content.replace(
  "if (data && data.value) {\n        if (data.value.benefits) setBenefits(data.value.benefits);\n        if (data.value.conditions) setConditions(data.value.conditions);\n      }",
  `if (data && data.value) {
        let val = data.value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) {}
        }
        if (val.benefits && Array.isArray(val.benefits)) setBenefits(val.benefits);
        if (val.conditions) setConditions(val.conditions);
      }`
);

fs.writeFileSync('src/pages/WholesaleProgram.tsx', content);
