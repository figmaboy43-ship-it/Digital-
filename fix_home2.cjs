const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Fix duplicate state declaration
content = content.replace(/  const \[heroStats, setHeroStats\] = useState\(\[\s*\{ id: 1, label: 'মোট সেবা প্রদান', value: '৫০,০০০\+' \},\s*\{ id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১০,০০০\+' \},\s*\{ id: 3, label: 'হোলসেল পার্টনার', value: '৫০০\+' \},\s*\{ id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০০\+' \}\s*\]\);\s*const \[heroStats, setHeroStats\] = useState\(\[\s*\{ id: 1, label: 'মোট সেবা প্রদান', value: '৫০,০০০\+' \},\s*\{ id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১০,০০০\+' \},\s*\{ id: 3, label: 'হোলসেল পার্টনার', value: '৫০০\+' \},\s*\{ id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০০\+' \}\s*\]\);/, `  const [heroStats, setHeroStats] = useState([
    { id: 1, label: 'মোট সেবা প্রদান', value: '৫০,০০০+' },
    { id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১০,০০০+' },
    { id: 3, label: 'হোলসেল পার্টনার', value: '৫০০+' },
    { id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০০+' }
  ]);`);

// Fix duplicate fetch
content = content.replace(/        const \{ data: statsData \} = await supabase\s*\.from\('site_settings'\)\s*\.select\('value'\)\s*\.eq\('key', 'hero_stats'\)\s*\.single\(\);\s*if \(statsData && statsData\.value\) \{\s*setHeroStats\(statsData\.value\);\s*\}\s*const \{ data: statsData \} = await supabase\s*\.from\('site_settings'\)\s*\.select\('value'\)\s*\.eq\('key', 'hero_stats'\)\s*\.single\(\);\s*if \(statsData && statsData\.value\) \{\s*setHeroStats\(statsData\.value\);\s*\}/g, `        const { data: statsData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_stats')
          .single();
          
        if (statsData && statsData.value) {
          setHeroStats(statsData.value);
        }`);

fs.writeFileSync('src/pages/Home.tsx', content);
