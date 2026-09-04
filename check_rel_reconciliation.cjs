require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('payment_events').select('*, payment:payment_id (amount, transaction_reference, status)').limit(1);
  console.log('payment_events relation:', error ? error.message : 'exists');
}
run();
