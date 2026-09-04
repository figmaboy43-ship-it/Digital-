const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminWholesale.tsx', 'utf8');

const replacement = `return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wholesale Management</h1>
        <p className="text-slate-500 mt-1">Review access requests and configure wholesale program content</p>
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("applications")}
          className={\`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors \${
            activeTab === "applications" ? "bg-white text-emerald-600 border border-b-0 border-slate-200" : "text-slate-500 hover:text-slate-700"
          }\`}
        >
          Applications
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={\`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors \${
            activeTab === "settings" ? "bg-white text-emerald-600 border border-b-0 border-slate-200" : "text-slate-500 hover:text-slate-700"
          }\`}
        >
          Settings
        </button>
      </div>

      {activeTab === "settings" ? (
        <AdminWholesaleSettings />
      ) : (`;

content = content.replace('return (', replacement);
content = content.replace(/  \);\n}$/, '      )}\n    </div>\n  );\n}\n');

fs.writeFileSync('src/pages/admin/AdminWholesale.tsx', content);
