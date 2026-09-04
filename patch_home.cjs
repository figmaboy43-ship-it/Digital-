const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add stats state
const hookInsert = `  const [searchQuery, setSearchQuery] = useState('');`;
const stateInsert = `  const [searchQuery, setSearchQuery] = useState('');
  const [heroStats, setHeroStats] = useState([
    { id: 1, label: 'মোট সেবা প্রদান', value: '৫০,০০০+' },
    { id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১০,০০০+' },
    { id: 3, label: 'হোলসেল পার্টনার', value: '৫০০+' },
    { id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০০+' }
  ]);`;
content = content.replace(hookInsert, stateInsert);

// Add stats fetch logic
const fetchInsert = `        if (catData) setCategories(catData);`;
const newFetchInsert = `        if (catData) setCategories(catData);
        
        const { data: statsData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_stats')
          .single();
          
        if (statsData && statsData.value) {
          setHeroStats(statsData.value);
        }`;
content = content.replace(fetchInsert, newFetchInsert);

// Add stats UI below search box
const uiInsert = `          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">`;
const newUiInsert = `          </div>
          
          {/* Service Analysis / Stats */}
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
content = content.replace(uiInsert, newUiInsert);

fs.writeFileSync('src/pages/Home.tsx', content);
