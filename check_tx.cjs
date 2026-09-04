require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'missing',
  process.env.VITE_SUPABASE_ANON_KEY || 'missing'
);

async function run() {
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  console.log('transactions table:', error ? error.message : 'exists');
  const { data: d2, error: e2 } = await supabase.from('wallet_transactions').select('*').limit(1);
  console.log('wallet_transactions table:', e2 ? e2.message : 'exists');
}

run();
