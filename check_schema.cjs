require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'missing',
  process.env.VITE_SUPABASE_ANON_KEY || 'missing'
);

async function run() {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
  console.log('RPC result:', data, error);
}

run();
