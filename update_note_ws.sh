sed -i '/<div className="pt-6">/i \
                <div className="pt-2">\
                  <label className="block text-sm font-medium text-slate-700 mb-2">\
                    অতিরিক্ত তথ্য / নোট (অপশনাল)\
                  </label>\
                  <textarea\
                    rows={3}\
                    value={customerNote}\
                    onChange={(e) => setCustomerNote(e.target.value)}\
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"\
                    placeholder="অতিরিক্ত কোনো তথ্য, লিংক বা নির্দেশনা থাকলে এখানে লিখুন..."\
                  ></textarea>\
                </div>\
' src/pages/Wholesale/ServiceDetails.tsx
