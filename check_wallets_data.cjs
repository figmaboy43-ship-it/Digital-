require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('wallets').select('*, user:user_id (full_name, email, role)').limit(1);
  console.log('wallets data:', error ? error.message : data);
}
run();
