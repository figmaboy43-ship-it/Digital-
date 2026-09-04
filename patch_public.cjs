const fs = require('fs');
let content = fs.readFileSync('src/layouts/PublicLayout.tsx', 'utf8');

// Replace standard imports
if (!content.includes('useEffect')) {
    content = content.replace("import { ReactNode, useState } from 'react';", "import { ReactNode, useState, useEffect } from 'react';");
}

if (!content.includes('supabase')) {
    content = content.replace("import { useAuthStore } from '../store/authStore';", "import { useAuthStore } from '../store/authStore';\nimport { supabase } from '../lib/supabase';");
}

// Add state and fetch logic
const hookInsert = `  const { user, profile } = useAuthStore();`;
const stateInsert = `  const { user, profile } = useAuthStore();
  const [footerSettings, setFooterSettings] = useState({
    siteName: 'ডিজিটাল সেবা পোর্টাল',
    description: 'এটি একটি ডেমো ডিজিটাল সেবা প্রদানকারী পোর্টাল। এখানে আপনি বিভিন্ন অনলাইন সেবা সহজে এবং নিরাপদে গ্রহণ করতে পারবেন।',
    phone: '+880 1234 567890',
    email: 'support@digitalseba.com',
    workingHours: 'রবি-বৃহস্পতি, সকাল ৯টা - বিকাল ৫টা',
    copyright: 'ডিজিটাল সেবা পোর্টাল। সর্বস্বত্ব সংরক্ষিত।'
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_content')
        .single();
        
      if (!error && data && data.value) {
        setFooterSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Failed to load footer settings:', error);
    }
  };`;

content = content.replace(hookInsert, stateInsert);

// Replace site name in header
content = content.replace(/<span className="text-2xl font-bold text-primary leading-tight">ডিজিটাল সেবা পোর্টাল<\/span>/, '<span className="text-2xl font-bold text-primary leading-tight">{footerSettings.siteName}</span>');

// Replace footer static content
content = content.replace(/<h3 className="text-xl font-bold text-primary mb-4">ডিজিটাল সেবা পোর্টাল<\/h3>/, '<h3 className="text-xl font-bold text-primary mb-4">{footerSettings.siteName}</h3>');
content = content.replace(/এটি একটি ডেমো ডিজিটাল সেবা প্রদানকারী পোর্টাল। এখানে আপনি বিভিন্ন অনলাইন সেবা সহজে এবং নিরাপদে গ্রহণ করতে পারবেন।/, '{footerSettings.description}');
content = content.replace(/ফোন: \+880 1234 567890/, 'ফোন: {footerSettings.phone}');
content = content.replace(/ইমেইল: support@digitalseba\.com/, 'ইমেইল: {footerSettings.email}');
content = content.replace(/সময়: রবি-বৃহস্পতি, সকাল ৯টা - বিকাল ৫টা/, 'সময়: {footerSettings.workingHours}');
content = content.replace(/&copy; \{new Date\(\)\.getFullYear\(\)\} ডিজিটাল সেবা পোর্টাল। সর্বস্বত্ব সংরক্ষিত।/, '&copy; {new Date().getFullYear()} {footerSettings.copyright}');

fs.writeFileSync('src/layouts/PublicLayout.tsx', content);
