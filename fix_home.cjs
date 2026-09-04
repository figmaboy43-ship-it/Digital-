const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Replace duplicate Service Analysis block
const duplicateRegex = /\{\/\* Service Analysis \/ Stats \*\/\}[\s\S]*?\{\/\* Service Analysis \/ Stats \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">/;
const singleBlock = `{/* Service Analysis / Stats */}
          <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroStats.map(stat => (
              <div key={stat.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-sm border border-gray-100 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">`;

content = content.replace(duplicateRegex, singleBlock);

fs.writeFileSync('src/pages/Home.tsx', content);
