const fs = require('fs');
let content = fs.readFileSync('src/pages/WholesaleProgram.tsx', 'utf8');

// Replace standard imports
if (!content.includes('useEffect')) {
    content = content.replace('import React, { useState } from', 'import React, { useState, useEffect } from');
}

// Add state and fetch logic
const hookInsert = `  const [formData, setFormData] = useState({`;
const stateInsert = `  const [benefits, setBenefits] = useState<string[]>([
    'সেবার মূল্যে বিশেষ ছাড় (Up to 40%)',
    'অগ্রাধিকার ভিত্তিতে দ্রুত সার্ভিস প্রসেসিং',
    'হোলসেল পার্টনারদের জন্য ডেডিকেটেড হেল্পডেস্ক',
    'সহজ ওয়ালেট সিস্টেম ও লেনদেনের পূর্ণাঙ্গ হিসাব'
  ]);
  const [conditions, setConditions] = useState<string>('সঠিক তথ্য প্রদান করে আবেদন করুন। কর্তৃপক্ষ যাচাই শেষে অনুমোদন প্রদান করবেন। ভুয়া তথ্যের প্রমাণ পেলে আবেদন বাতিল করা হবে।');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'wholesale_content')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        if (data.value.benefits) setBenefits(data.value.benefits);
        if (data.value.conditions) setConditions(data.value.conditions);
      }
    } catch (error) {
      console.error('Failed to load wholesale settings:', error);
    }
  };

  const [formData, setFormData] = useState({`;

content = content.replace(hookInsert, stateInsert);

// Replace hardcoded list
const hardcodedBenefitsRegex = /<ul className="space-y-4">.*?<\/ul>/s;
const newBenefitsJSX = `<ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>`;
content = content.replace(hardcodedBenefitsRegex, newBenefitsJSX);

// Replace condition block
const hardcodedConditionRegex = /<div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-600 flex items-start">\s*<ShieldAlert className="w-5 h-5 text-gov-red mr-2 flex-shrink-0" \/>\s*<p>.*?<\/p>\s*<\/div>/s;
const newConditionJSX = `<div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-600 flex items-start">
              <ShieldAlert className="w-5 h-5 text-gov-red mr-2 flex-shrink-0" />
              <p className="whitespace-pre-wrap">{conditions}</p>
            </div>`;
content = content.replace(hardcodedConditionRegex, newConditionJSX);

fs.writeFileSync('src/pages/WholesaleProgram.tsx', content);
