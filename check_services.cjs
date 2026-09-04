require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('services').select('*, service_categories(name, slug)').limit(1);
  console.log('services rel:', error ? error.message : 'exists');
}
run();
