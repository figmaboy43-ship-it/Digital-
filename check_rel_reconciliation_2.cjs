require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const res1 = await supabase.from('payment_events').select('*, payments (amount, transaction_reference, status)').limit(1);
  console.log('Using payments:', res1.error ? res1.error.message : 'exists');
  const res2 = await supabase.from('payment_events').select('*, payment:payments (amount, transaction_reference, status)').limit(1);
  console.log('Using payment:payments:', res2.error ? res2.error.message : 'exists');
}
run();
