sed -i '/<label className="block text-sm font-medium text-slate-700 mb-1">প্রসেসিং সময়<\/label>/i \
                <div>\
                  <label className="block text-sm font-medium text-slate-700 mb-1">আইকন (Icon Name)</label>\
                  <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ex: FileText" value={srvForm.icon || '\'''\''} onChange={e => setSrvForm({...srvForm, icon: e.target.value})} />\
                </div>\
' src/pages/admin/AdminServices.tsx
