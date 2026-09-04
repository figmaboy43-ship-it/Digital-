require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_service_analytics', { p_start_date: '2023-01-01', p_end_date: '2023-12-31' });
  console.log('get_service_analytics RPC:', error ? error.message : 'exists');
}
run();
