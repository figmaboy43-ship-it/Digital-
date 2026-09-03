const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase.from('orders').select(`
          *,
          user:profiles!user_id (full_name, email, phone, role, account_status),
          service:services!service_id (name, processing_time)
        `).limit(1);
  console.log('Orders query error:', error ? error.message : 'Success');
  if (data) console.log('Data:', data.length);
}
run();
