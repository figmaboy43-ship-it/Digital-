require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('Site settings:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
})();
